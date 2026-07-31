import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { BasicInfo } from "@/lib/diagnosis";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const QUESTION_COUNT = 48;

type DraftPayload = {
  respondentId?: string;
  responseId?: string;
  resumeKey?: string;
  resumeToken?: string;
  basicInfo: BasicInfo;
  answers?: Record<string, number>;
  progressRate?: number;
  answeredCount?: number;
  completionRate?: number;
  sendResumeMail?: boolean;
  lastAnsweredQuestionId?: string;
  lastAnsweredQuestionOrder?: number;
};

const DRAFT_SELECT = `
  id,
  respondent_id,
  answers_json,
  email,
  email_normalized,
  traffic_source,
  referrer_name,
  referrer_company,
  referrer_email,
  consent_agreed,
  consent_agreed_at,
  status,
  progress_rate,
  answered_count,
  completion_rate,
  last_answered_question_id,
  last_answered_question_order,
  started_at,
  created_at,
  updated_at,
  expires_at,
  resume_key_hash,
  resume_token,
  resume_mail_sent_at,
  resume_mail_error
`;

export async function GET(request: Request) {
  const supabase = getServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase environment variables are not configured." }, { status: 500 });
  }

  try {
    const url = new URL(request.url);
    const responseId = url.searchParams.get("responseId");
    const respondentId = url.searchParams.get("respondentId");
    const resumeKey = url.searchParams.get("resumeKey");
    const resumeToken = url.searchParams.get("resumeToken");

    if (!responseId) {
      return NextResponse.json({ error: "responseId is required." }, { status: 400 });
    }

    const { data: response, error } = await supabase
      .from("diagnosis_responses")
      .select(DRAFT_SELECT)
      .eq("id", responseId)
      .eq("status", "draft")
      .single();

    if (error) throw error;
    if (!response) return NextResponse.json({ error: "Draft was not found." }, { status: 404 });
    if (isExpired(response.expires_at)) {
      return NextResponse.json({ error: "保存期限が終了しました。", expired: true }, { status: 410 });
    }
    if (!isDraftAccessAllowed(response, resumeKey, respondentId, resumeToken)) {
      return NextResponse.json({ error: "Draft access is not allowed." }, { status: 403 });
    }

    const basicInfo = await getBasicInfo(supabase, response);
    return NextResponse.json({ draft: rowToDraft(response, basicInfo, resumeKey || undefined) });
  } catch (error) {
    console.error("Assessment draft fetch failed", error);
    return NextResponse.json({ error: formatError(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = getServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase environment variables are not configured." }, { status: 500 });
  }

  try {
    const payload = (await request.json()) as DraftPayload;
    const respondentId = payload.respondentId || crypto.randomUUID();
    const basicInfo = normalizeBasicInfo(payload.basicInfo);
    const resumeKey = payload.resumeKey || createResumeKey();
    const resumeToken = createResumeToken();
    const answers = payload.answers ?? {};
    const answeredCount = payload.answeredCount ?? countAnswered(answers);
    const completionRate = payload.completionRate ?? Math.round((answeredCount / QUESTION_COUNT) * 100);
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const { error: respondentError } = await supabase.from("respondents").upsert(
      {
        id: respondentId,
        company_name: basicInfo.companyName,
        name: basicInfo.representativeName,
        email: basicInfo.emailNormalized || basicInfo.email,
        industry: basicInfo.industry,
        employee_size: basicInfo.employeeSize || null,
        user_type: basicInfo.category
      },
      { onConflict: "id" }
    );

    if (respondentError) throw respondentError;

    const { data, error } = await supabase
      .from("diagnosis_responses")
      .insert({
        respondent_id: respondentId,
        answers_json: answers,
        total_score: 0,
        achievement_rate: 0,
        category_scores_json: [],
        top_categories_json: [],
        low_categories_json: [],
        priority_categories_json: [],
        email: basicInfo.emailNormalized || basicInfo.email,
        email_normalized: basicInfo.emailNormalized || basicInfo.email,
        traffic_source: basicInfo.trafficSource,
        referrer_name: basicInfo.referrerName || null,
        referrer_company: basicInfo.referrerCompany || null,
        referrer_email: basicInfo.referrerEmail || null,
        consent_agreed: basicInfo.consentAgreed,
        consent_agreed_at: basicInfo.consentAgreedAt || null,
        status: "draft",
        started_at: now,
        progress_rate: payload.progressRate ?? completionRate,
        answered_count: answeredCount,
        completion_rate: completionRate,
        last_answered_question_id: payload.lastAnsweredQuestionId || null,
        last_answered_question_order: payload.lastAnsweredQuestionOrder ?? 0,
        expires_at: expiresAt,
        updated_at: now,
        resume_key_hash: hashResumeKey(resumeKey),
        resume_token: resumeToken,
        is_demo: true,
        watermark_enabled: true,
        watermark_text: "DEMO｜社長カルテ",
        copyright_enabled: true,
        copyright_text: "© Two rails",
        commercial_use_allowed: false,
        resubmission_allowed: false
      })
      .select("id,created_at,updated_at,expires_at,started_at")
      .single();

    if (error) throw error;
    let resumeMailStatus: "sent" | "failed" | "skipped" = "skipped";
    let resumeMailError = "";

    if (payload.sendResumeMail) {
      const mailResult = await sendResumeMail({
        request,
        supabase,
        responseId: data.id,
        recipientEmail: basicInfo.emailNormalized,
        representativeName: basicInfo.representativeName,
        answeredCount,
        expiresAt: data.expires_at ?? expiresAt,
        resumeToken
      });
      resumeMailStatus = mailResult.sent ? "sent" : "failed";
      resumeMailError = mailResult.errorMessage ?? "";
    }

    return NextResponse.json({
      draft: {
        id: data.id,
        respondentId,
        responseId: data.id,
        resumeKey,
        basicInfo,
        answers,
        status: "draft",
        progressRate: payload.progressRate ?? completionRate,
        answeredCount,
        completionRate,
        resumeToken,
        resumeUrl: buildResumeUrl(request, resumeToken),
        resumeMailSentAt: resumeMailStatus === "sent" ? new Date().toISOString() : "",
        resumeMailError,
        lastAnsweredQuestionId: payload.lastAnsweredQuestionId || "",
        lastAnsweredQuestionOrder: payload.lastAnsweredQuestionOrder ?? 0,
        startedAt: data.started_at ?? now,
        expiresAt: data.expires_at ?? expiresAt,
        createdAt: data.created_at ?? now,
        updatedAt: data.updated_at ?? now
      },
      resumeMailStatus,
      resumeUrl: buildResumeUrl(request, resumeToken)
    });
  } catch (error) {
    console.error("Assessment draft create failed", error);
    return NextResponse.json({ error: formatError(error) }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const supabase = getServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase environment variables are not configured." }, { status: 500 });
  }

  try {
    const payload = (await request.json()) as DraftPayload;
    if (!payload.responseId) {
      return NextResponse.json({ error: "responseId is required." }, { status: 400 });
    }

    const existing = await getExistingDraftForMutation(supabase, payload.responseId);
    if (isExpired(existing.expires_at)) {
      return NextResponse.json({ error: "保存期限が終了しました。", expired: true }, { status: 410 });
    }
    if (!isDraftAccessAllowed(existing, payload.resumeKey, payload.respondentId, payload.resumeToken)) {
      return NextResponse.json({ error: "Draft access is not allowed." }, { status: 403 });
    }

    const answers = payload.answers ?? {};
    const answeredCount = payload.answeredCount ?? countAnswered(answers);
    const completionRate = payload.completionRate ?? Math.round((answeredCount / QUESTION_COUNT) * 100);
    const resumeToken = existing.resume_token || createResumeToken();
    const now = new Date().toISOString();
    const updatePayload: Record<string, unknown> = {
      answers_json: answers,
      progress_rate: payload.progressRate ?? completionRate,
      answered_count: answeredCount,
      completion_rate: completionRate,
      last_answered_question_id: payload.lastAnsweredQuestionId || null,
      last_answered_question_order: payload.lastAnsweredQuestionOrder ?? 0,
      updated_at: now,
      resume_token: resumeToken
    };

    if (payload.basicInfo) {
      const basicInfo = normalizeBasicInfo(payload.basicInfo);
      updatePayload.email = basicInfo.emailNormalized || basicInfo.email;
      updatePayload.email_normalized = basicInfo.emailNormalized || basicInfo.email;
      updatePayload.traffic_source = basicInfo.trafficSource;
      updatePayload.referrer_name = basicInfo.referrerName || null;
      updatePayload.referrer_company = basicInfo.referrerCompany || null;
      updatePayload.referrer_email = basicInfo.referrerEmail || null;
      updatePayload.consent_agreed = basicInfo.consentAgreed;
      updatePayload.consent_agreed_at = basicInfo.consentAgreedAt || null;
    }

    const { data, error } = await supabase
      .from("diagnosis_responses")
      .update(updatePayload)
      .eq("id", payload.responseId)
      .eq("status", "draft")
      .select("id,created_at,updated_at,expires_at,started_at,resume_token,resume_mail_sent_at,resume_mail_error")
      .single();

    if (error) throw error;
    let resumeMailStatus: "sent" | "already_sent" | "failed" | "skipped" = "skipped";
    let resumeMailError = data.resume_mail_error ?? "";

    if (payload.sendResumeMail) {
      if (existing.resume_mail_sent_at) {
        resumeMailStatus = "already_sent";
      } else {
        const mailResult = await sendResumeMail({
          request,
          supabase,
          responseId: data.id,
          recipientEmail: normalizeBasicInfo(payload.basicInfo).emailNormalized,
          representativeName: payload.basicInfo.representativeName,
          answeredCount,
          expiresAt: data.expires_at,
          resumeToken
        });
        resumeMailStatus = mailResult.sent ? "sent" : "failed";
        resumeMailError = mailResult.errorMessage ?? "";
      }
    }

    return NextResponse.json({
      draft: {
        id: data.id,
        respondentId: payload.respondentId,
        responseId: data.id,
        resumeKey: payload.resumeKey,
        basicInfo: payload.basicInfo,
        answers,
        status: "draft",
        progressRate: payload.progressRate ?? completionRate,
        answeredCount,
        completionRate,
        resumeToken,
        resumeUrl: buildResumeUrl(request, resumeToken),
        resumeMailSentAt:
          resumeMailStatus === "sent" ? new Date().toISOString() : data.resume_mail_sent_at ?? "",
        resumeMailError,
        lastAnsweredQuestionId: payload.lastAnsweredQuestionId || "",
        lastAnsweredQuestionOrder: payload.lastAnsweredQuestionOrder ?? 0,
        startedAt: data.started_at ?? data.created_at,
        expiresAt: data.expires_at,
        createdAt: data.created_at,
        updatedAt: data.updated_at ?? now
      },
      resumeMailStatus,
      resumeUrl: buildResumeUrl(request, resumeToken)
    });
  } catch (error) {
    console.error("Assessment draft update failed", error);
    return NextResponse.json({ error: formatError(error) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const supabase = getServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase environment variables are not configured." }, { status: 500 });
  }

  try {
    const payload = (await request.json()) as Pick<DraftPayload, "responseId" | "respondentId" | "resumeKey" | "resumeToken">;
    if (!payload.responseId) {
      return NextResponse.json({ error: "responseId is required." }, { status: 400 });
    }

    const existing = await getExistingDraftForMutation(supabase, payload.responseId);
    if (!isDraftAccessAllowed(existing, payload.resumeKey, payload.respondentId, payload.resumeToken)) {
      return NextResponse.json({ error: "Draft access is not allowed." }, { status: 403 });
    }

    const { error } = await supabase
      .from("diagnosis_responses")
      .delete()
      .eq("id", payload.responseId)
      .eq("status", "draft");

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Assessment draft delete failed", error);
    return NextResponse.json({ error: formatError(error) }, { status: 500 });
  }
}

function getServerSupabaseClient() {
  const supabaseKey = supabaseServiceRoleKey || supabaseAnonKey;
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient<any>(supabaseUrl, supabaseKey);
}

function normalizeBasicInfo(info: BasicInfo): BasicInfo {
  const emailNormalized = (info.emailNormalized || info.email || "").trim().toLowerCase();
  return {
    ...info,
    email: emailNormalized,
    emailNormalized
  };
}

function createResumeKey() {
  return randomBytes(32).toString("base64url");
}

function createResumeToken() {
  return randomBytes(32).toString("base64url");
}

function hashResumeKey(resumeKey: string) {
  return createHash("sha256").update(resumeKey).digest("hex");
}

function getAppUrl(request?: Request) {
  return (process.env.NEXT_PUBLIC_APP_URL || (request ? new URL(request.url).origin : "")).replace(/\/$/, "");
}

function buildResumeUrl(request: Request, token: string) {
  return `${getAppUrl(request)}/assessment/resume/${token}`;
}

function buildResumeUrlFromAppUrl(token: string) {
  const appUrl = getAppUrl();
  return appUrl ? `${appUrl}/assessment/resume/${token}` : `/assessment/resume/${token}`;
}

function countAnswered(answers: Record<string, number>) {
  return Object.values(answers).filter(Boolean).length;
}

function isExpired(expiresAt: string | null | undefined) {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() < Date.now();
}

async function getExistingDraftForMutation(supabase: ReturnType<typeof createClient<any>>, responseId: string) {
  const { data, error } = await supabase
    .from("diagnosis_responses")
    .select("id,respondent_id,status,expires_at,resume_key_hash,resume_token,resume_mail_sent_at")
    .eq("id", responseId)
    .eq("status", "draft")
    .single();

  if (error) throw error;
  return data;
}

function isDraftAccessAllowed(
  row: { respondent_id?: string | null; resume_key_hash?: string | null },
  resumeKey?: string | null,
  respondentId?: string | null,
  resumeToken?: string | null
) {
  if ("resume_token" in row && typeof resumeToken === "string" && resumeToken.length > 0) {
    return resumeToken === (row as { resume_token?: string | null }).resume_token;
  }

  if (row.resume_key_hash) {
    return typeof resumeKey === "string" && resumeKey.length > 0 && hashResumeKey(resumeKey) === row.resume_key_hash;
  }

  return Boolean(respondentId) && respondentId === row.respondent_id;
}

async function getBasicInfo(supabase: ReturnType<typeof createClient<any>>, response: any): Promise<BasicInfo> {
  const { data: respondent, error } = await supabase
    .from("respondents")
    .select("company_name,name,email,industry,employee_size,user_type")
    .eq("id", response.respondent_id)
    .single();

  if (error) throw error;

  return {
    companyName: respondent.company_name ?? "",
    representativeName: respondent.name ?? "",
    email: response.email_normalized ?? response.email ?? respondent.email ?? "",
    emailNormalized: response.email_normalized ?? response.email ?? respondent.email ?? "",
    industry: respondent.industry ?? "",
    employeeSize: respondent.employee_size ?? "",
    category: respondent.user_type ?? "",
    trafficSource: response.traffic_source ?? "",
    referrerName: response.referrer_name ?? "",
    referrerCompany: response.referrer_company ?? "",
    referrerEmail: response.referrer_email ?? "",
    usagePurpose: "",
    demoTermsAgreed: true,
    demoTermsAgreedAt: "",
    consentAgreed: Boolean(response.consent_agreed),
    consentAgreedAt: response.consent_agreed_at ?? ""
  };
}

function rowToDraft(row: any, basicInfo: BasicInfo, resumeKey?: string) {
  const answers = normalizeAnswers(row.answers_json);
  const answeredCount = row.answered_count ?? countAnswered(answers);

  return {
    id: row.id,
    respondentId: row.respondent_id,
    responseId: row.id,
    resumeKey,
    resumeToken: row.resume_token ?? "",
    resumeUrl: row.resume_token ? buildResumeUrlFromAppUrl(row.resume_token) : "",
    resumeMailSentAt: row.resume_mail_sent_at ?? "",
    resumeMailError: row.resume_mail_error ?? "",
    basicInfo,
    answers,
    status: "draft",
    progressRate: row.progress_rate ?? row.completion_rate ?? Math.round((answeredCount / QUESTION_COUNT) * 100),
    answeredCount,
    completionRate: row.completion_rate ?? row.progress_rate ?? Math.round((answeredCount / QUESTION_COUNT) * 100),
    lastAnsweredQuestionId: row.last_answered_question_id ?? "",
    lastAnsweredQuestionOrder: row.last_answered_question_order ?? 0,
    startedAt: row.started_at ?? row.created_at,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at
  };
}

function normalizeAnswers(value: unknown): Record<string, number> {
  if (!value) return {};
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as Record<string, number>)
        : {};
    } catch {
      return {};
    }
  }
  return typeof value === "object" && !Array.isArray(value) ? (value as Record<string, number>) : {};
}

async function sendResumeMail({
  request,
  supabase,
  responseId,
  recipientEmail,
  representativeName,
  answeredCount,
  expiresAt,
  resumeToken
}: {
  request: Request;
  supabase: ReturnType<typeof createClient<any>>;
  responseId: string;
  recipientEmail: string;
  representativeName: string;
  answeredCount: number;
  expiresAt: string;
  resumeToken: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  const replyTo = process.env.RESEND_REPLY_TO;
  const resumeUrl = buildResumeUrl(request, resumeToken);

  try {
    if (!recipientEmail) throw new Error("recipient email is not set");
    if (!apiKey) throw new Error("RESEND_API_KEY is not set");
    if (!fromEmail) throw new Error("RESEND_FROM_EMAIL is not set");

    const displayName = representativeName || "受検者";
    const expiresText = expiresAt ? new Date(expiresAt).toLocaleString("ja-JP") : "-";
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: fromEmail,
        to: recipientEmail,
        ...(replyTo ? { reply_to: replyTo } : {}),
        subject: "【社長カルテ】回答を途中保存しました",
        html: buildResumeMailHtml({
          displayName,
          answeredCount,
          expiresText,
          resumeUrl
        }),
        text: [
          `${displayName} 様`,
          "",
          "社長カルテの回答を途中保存しました。",
          "",
          `現在、全48問中${answeredCount}問まで回答済みです。`,
          "以下のURLから、保存した続きより再開できます。",
          "",
          resumeUrl,
          "",
          `保存期限：${expiresText}`,
          "",
          "※このURLは受検者ご本人専用です。第三者への共有はお控えください。",
          "※今後再度途中保存した場合も、同じURLから最新の保存内容を再開できます。",
          "※このメールは自動送信です。"
        ].join("\n")
      })
    });

    if (!response.ok) throw new Error(await response.text());

    const { error } = await supabase
      .from("diagnosis_responses")
      .update({
        resume_mail_sent_at: new Date().toISOString(),
        resume_mail_error: null
      })
      .eq("id", responseId);

    if (error) throw error;
    return { sent: true };
  } catch (error) {
    const errorMessage = formatError(error);
    console.error("Resume mail failed", error);
    const { error: updateError } = await supabase
      .from("diagnosis_responses")
      .update({ resume_mail_error: errorMessage })
      .eq("id", responseId);

    if (updateError) console.error("Resume mail error save failed", updateError);
    return { sent: false, errorMessage };
  }
}

function buildResumeMailHtml({
  displayName,
  answeredCount,
  expiresText,
  resumeUrl
}: {
  displayName: string;
  answeredCount: number;
  expiresText: string;
  resumeUrl: string;
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

  return `<!doctype html>
<html lang="ja">
  <body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
    <div style="max-width:640px;margin:0 auto;padding:24px 16px;">
      <div style="background-color:#ffffff;border:1px solid #e5e7eb;border-radius:10px;padding:24px;">
        <p style="${paragraphStyle}">${escapeHtml(displayName)} 様</p>
        <p style="${paragraphStyle}">社長カルテの回答を途中保存しました。</p>
        <p style="${paragraphStyle}">現在、全48問中${answeredCount}問まで回答済みです。<br />以下のボタンから、保存した続きより再開できます。</p>
        <p style="margin:0 0 14px;"><a href="${escapeHtml(resumeUrl)}" style="${buttonStyle}">続きから回答する</a></p>
        <p style="${paragraphStyle};word-break:break-all;">${escapeHtml(resumeUrl)}</p>
        <p style="${paragraphStyle}">保存期限：${escapeHtml(expiresText)}</p>
        <p style="margin:0;line-height:1.8;color:#6b7280;font-size:13px;">※このURLは受検者ご本人専用です。第三者への共有はお控えください。<br />※今後再度途中保存した場合も、同じURLから最新の保存内容を再開できます。<br />※このメールは自動送信です。</p>
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
