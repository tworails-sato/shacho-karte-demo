import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { StoredSubmission } from "@/lib/storage";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const DEFAULT_TIMEREX_URL = "https://timerex.net/s/sato.motoki_765a/c6616a1a/";

export async function POST(request: Request) {
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { error: "Supabase environment variables are not configured." },
      { status: 500 }
    );
  }

  try {
    const submission = (await request.json()) as StoredSubmission;
    const supabase = createClient<any>(supabaseUrl, supabaseAnonKey);
    const respondentId = submission.respondentId ?? submission.id;
    const normalizedEmail = (submission.basicInfo.emailNormalized || submission.basicInfo.email || "")
      .trim()
      .toLowerCase();
    let responseId = submission.responseId;
    let resultToken = submission.resultToken;
    let resultTokenExpiresAt = submission.resultTokenExpiresAt;

    if (!submission.respondentId) {
      const { error } = await supabase.from("respondents").upsert(
        {
          id: respondentId,
          company_name: submission.basicInfo.companyName,
          name: submission.basicInfo.representativeName,
          email: normalizedEmail,
          industry: submission.basicInfo.industry,
          user_type: submission.basicInfo.category
        },
        { onConflict: "id" }
      );

      if (error) throw error;
    }

    if (!responseId) {
      resultToken = createResultToken();
      resultTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from("diagnosis_responses")
        .insert({
          respondent_id: respondentId,
          answers_json: submission.answers,
          total_score: submission.result.totalScore,
          achievement_rate: submission.result.achievementRate,
          category_scores_json: submission.result.themeScores,
          top_categories_json: submission.result.topThemes,
          low_categories_json: submission.result.lowThemes,
          priority_categories_json: submission.result.priorityThemes,
          email: normalizedEmail,
          email_normalized: normalizedEmail,
          traffic_source: submission.basicInfo.trafficSource,
          referrer_name: submission.basicInfo.referrerName || null,
          referrer_company: submission.basicInfo.referrerCompany || null,
          referrer_email: submission.basicInfo.referrerEmail || null,
          consent_agreed: submission.basicInfo.consentAgreed,
          consent_agreed_at: submission.basicInfo.consentAgreedAt || null,
          ip_hash: hashIp(getClientIp(request)),
          user_agent: request.headers.get("user-agent") || null,
          result_token: resultToken,
          result_token_expires_at: resultTokenExpiresAt,
          result_view_count: 0
        })
        .select("id")
        .single();

      if (error) throw error;
      const insertedResponseId = data?.id;
      if (!insertedResponseId) throw new Error("diagnosis_responses id was not returned.");
      responseId = insertedResponseId;

      await sendParticipantEmail({
        supabase,
        responseId: insertedResponseId,
        recipientEmail: normalizedEmail,
        resultToken,
        companyName: submission.basicInfo.companyName,
        representativeName: submission.basicInfo.representativeName
      });
    }

    return NextResponse.json({
      submission: {
        ...submission,
        respondentId,
        responseId,
        resultToken,
        resultTokenExpiresAt,
        supabaseSyncedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("Diagnosis API save failed", error);
    return NextResponse.json({ error: formatError(error) }, { status: 500 });
  }
}

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() || null;

  return request.headers.get("x-real-ip") || null;
}

function hashIp(ip: string | null) {
  if (!ip) return null;
  return createHash("sha256").update(ip).digest("hex");
}

function createResultToken() {
  return randomBytes(32).toString("base64url");
}

async function sendParticipantEmail({
  supabase,
  responseId,
  recipientEmail,
  resultToken,
  companyName,
  representativeName
}: {
  supabase: ReturnType<typeof createClient<any>>;
  responseId: string;
  recipientEmail: string;
  resultToken: string;
  companyName: string;
  representativeName: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  const replyTo = process.env.RESEND_REPLY_TO;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const timerexUrl = process.env.TIMEREX_URL || DEFAULT_TIMEREX_URL;

  try {
    if (!recipientEmail) throw new Error("Participant email is not set");
    if (!apiKey) throw new Error("RESEND_API_KEY is not set");
    if (!fromEmail) throw new Error("RESEND_FROM_EMAIL is not set");
    if (!appUrl) throw new Error("NEXT_PUBLIC_APP_URL is not set");

    const resultUrl = `${appUrl.replace(/\/$/, "")}/result/${resultToken}`;
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: fromEmail,
        to: recipientEmail,
        ...(replyTo ? { reply_to: replyTo } : {}),
        subject: "社長カルテの受検ありがとうございました",
        text: [
          `${representativeName || companyName || "受検者"} 様`,
          "",
          "社長カルテをご受検いただき、ありがとうございました。",
          "",
          "診断結果では、16テーマをもとに現在の課題感や優先確認テーマを整理しています。",
          "",
          "一方で、スコアの高低だけでは、実際にどのテーマから扱うべきか、",
          "どのように会話や支援につなげるべきかまでは読み切れない部分もあります。",
          "",
          "以下のURLより、診断結果をご確認いただけます(期限：診断日より7日間）",
          "",
          resultUrl,
          "",
          "ご希望の方には、15〜30分ほどで結果の見方や活用イメージを簡単にお伝えしています。",
          "",
          "▼面談予約はこちら",
          timerexUrl,
          "",
          "引き続きよろしくお願いいたします。"
        ].join("\n")
      })
    });

    if (!resendResponse.ok) throw new Error(await resendResponse.text());

    const { error } = await supabase
      .from("diagnosis_responses")
      .update({
        participant_email_sent_at: new Date().toISOString(),
        participant_email_error: null
      })
      .eq("id", responseId);

    if (error) throw error;
  } catch (error) {
    const errorMessage = formatError(error);
    console.error("Participant email failed", error);
    const { error: updateError } = await supabase
      .from("diagnosis_responses")
      .update({ participant_email_error: errorMessage })
      .eq("id", responseId);

    if (updateError) console.error("Participant email error save failed", updateError);
  }
}

function formatError(error: unknown) {
  if (error && typeof error === "object") {
    const maybeError = error as { message?: string; details?: string; hint?: string; code?: string };
    return [
      maybeError.message,
      maybeError.details ? `details: ${maybeError.details}` : "",
      maybeError.hint ? `hint: ${maybeError.hint}` : "",
      maybeError.code ? `code: ${maybeError.code}` : ""
    ]
      .filter(Boolean)
      .join(" / ");
  }

  return String(error);
}
