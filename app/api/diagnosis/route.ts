import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { StoredSubmission } from "@/lib/storage";
import { defaultUsageSettings, usageSettingsFromRow } from "@/lib/usage-settings";

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
    const isPublicDemo = true;
    const usageSettings = {
      ...defaultUsageSettings,
      is_demo: isPublicDemo,
      commercial_use_allowed: false,
      resubmission_allowed: false,
      usage_purpose: null
    };

    if (!submission.respondentId) {
      const { error } = await supabase.from("respondents").upsert(
        {
          id: respondentId,
          company_name: submission.basicInfo.companyName,
          name: submission.basicInfo.representativeName,
          email: normalizedEmail,
          industry: submission.basicInfo.industry,
          employee_size: submission.basicInfo.employeeSize || null,
          user_type: submission.basicInfo.category
        },
        { onConflict: "id" }
      );

      if (error) throw error;
    }

    if (!responseId) {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: recentResponses, error: recentError } = await supabase
        .from("diagnosis_responses")
        .select("id,resubmission_allowed")
        .eq("email_normalized", normalizedEmail)
        .eq("is_demo", true)
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(1);

      if (recentError) throw recentError;
      const recent = recentResponses?.[0];
      if (recent && !recent.resubmission_allowed) {
        return NextResponse.json(
          {
            error:
              "このメールアドレスでは、直近30日以内に受検済みです。\n\n再受検をご希望の場合は、以下までお問い合わせください。\n\n合同会社Two rails\ninfo@ceo-sherpa.com"
          },
          { status: 429 }
        );
      }

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
          result_view_count: 0,
          is_demo: usageSettings.is_demo,
          watermark_enabled: usageSettings.watermark_enabled,
          watermark_text: usageSettings.watermark_text,
          copyright_enabled: usageSettings.copyright_enabled,
          copyright_text: usageSettings.copyright_text,
          commercial_use_allowed: usageSettings.commercial_use_allowed,
          resubmission_allowed: usageSettings.resubmission_allowed,
          usage_purpose: usageSettings.usage_purpose
        })
        .select(
          `
          id,
          is_demo,
          watermark_enabled,
          watermark_text,
          copyright_enabled,
          copyright_text,
          commercial_use_allowed,
          resubmission_allowed,
          usage_purpose
        `
        )
        .single();

      if (error) throw error;
      const insertedResponseId = data?.id;
      if (!insertedResponseId) throw new Error("diagnosis_responses id was not returned.");
      responseId = insertedResponseId;

      if (recent?.id) {
        await supabase
          .from("diagnosis_responses")
          .update({ resubmission_allowed: false, updated_at: new Date().toISOString() })
          .eq("id", recent.id);
      }

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
        supabaseSyncedAt: new Date().toISOString(),
        usageSettings: usageSettingsFromRow(submission.usageSettings ?? usageSettings)
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
    const displayName = representativeName || companyName || "受検者";
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
        subject: "社長カルテ受検ありがとうございました",
        html: buildParticipantEmailHtml({
          displayName,
          resultUrl,
          timerexUrl
        }),
        text: [
          `${displayName} 様`,
          "",
          "社長カルテをご受検いただき、ありがとうございました。",
          "",
          "診断結果では、16テーマをもとに現在の課題感や優先確認テーマを整理しています。",
          "",
          "一方で、スコアの高低だけでは、実際にどのテーマから扱うべきか、",
          "どのように会話や支援につなげるべきかまでは読み切れない部分もあります。",
          "",
          "診断結果はメール内の「診断結果を確認する」ボタンよりご確認ください。",
          "※閲覧期限：診断日より7日間",
          "",
          "ご希望の方には、15〜30分ほどで結果の見方や活用イメージを簡単にお伝えしています。",
          "面談予約はメール内の「面談を予約する」ボタンよりお進みください。",
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

function buildParticipantEmailHtml({
  displayName,
  resultUrl,
  timerexUrl
}: {
  displayName: string;
  resultUrl: string;
  timerexUrl: string;
}) {
  const buttonStyle = [
    "background-color:#1f2937",
    "border-radius:6px",
    "color:#ffffff",
    "display:inline-block",
    "font-weight:700",
    "padding:12px 20px",
    "text-decoration:none"
  ].join(";");
  const paragraphStyle = "margin:0 0 14px;line-height:1.8;color:#374151;font-size:15px;";

  return `
<!doctype html>
<html lang="ja">
  <body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
    <div style="max-width:640px;margin:0 auto;padding:24px 16px;">
      <div style="background-color:#ffffff;border:1px solid #e5e7eb;border-radius:10px;padding:24px;">
        <p style="${paragraphStyle}">${escapeHtml(displayName)} 様</p>
        <p style="${paragraphStyle}">社長カルテをご受検いただき、ありがとうございました。</p>
        <p style="${paragraphStyle}">診断結果では、16テーマをもとに現在の課題感や優先確認テーマを整理しています。</p>
        <p style="${paragraphStyle}">一方で、スコアの高低だけでは、実際にどのテーマから扱うべきか、どのように会話や支援につなげるべきかまでは読み切れない部分もあります。</p>

        <p style="${paragraphStyle}">診断結果は以下よりご確認ください。<br />※閲覧期限：診断日より7日間</p>
        <p style="margin:0 0 24px;">
          <a href="${escapeHtml(resultUrl)}" style="${buttonStyle}">診断結果を確認する</a>
        </p>

        <p style="${paragraphStyle}">ご希望の方には、15〜30分ほどで結果の見方や活用イメージを簡単にお伝えしています。</p>
        <p style="margin:0 0 24px;">
          <a href="${escapeHtml(timerexUrl)}" style="${buttonStyle}">面談を予約する</a>
        </p>

        <p style="margin:0;line-height:1.8;color:#374151;font-size:15px;">引き続きよろしくお願いいたします。</p>
      </div>
    </div>
  </body>
</html>`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
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
