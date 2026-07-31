import { createClient } from "@supabase/supabase-js";

const DEFAULT_FROM_EMAIL = "社長カルテ <noreply@ceo-sherpa.com>";

type ReminderKind = "auto_1" | "auto_2" | "auto_3" | "manual";

export type ResumeReminderInput = {
  answeredCount: number;
  expiresAt: string;
  recipientEmail: string;
  representativeName?: string;
  request?: Request;
  resumeToken: string;
  reminderKind: ReminderKind;
};

export type ResumeReminderResult =
  | { sent: true }
  | { sent: false; errorMessage: string };

export function buildResumeUrl(token: string, request?: Request) {
  const appUrl = (
    process.env.NEXT_PUBLIC_APP_URL ||
    (request ? new URL(request.url).origin : "")
  ).replace(/\/$/, "");

  return appUrl ? `${appUrl}/assessment/resume/${token}` : `/assessment/resume/${token}`;
}

export async function sendResumeReminderMail(input: ResumeReminderInput): Promise<ResumeReminderResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || DEFAULT_FROM_EMAIL;
  const replyTo = process.env.RESEND_REPLY_TO;

  try {
    if (!input.recipientEmail) throw new Error("recipient email is not set");
    if (!input.resumeToken) throw new Error("resume token is not set");
    if (!apiKey) throw new Error("RESEND_API_KEY is not set");
    if (!fromEmail) throw new Error("RESEND_FROM_EMAIL is not set");

    const resumeUrl = buildResumeUrl(input.resumeToken, input.request);
    const displayName = input.representativeName || "受検者";
    const expiresText = input.expiresAt ? new Date(input.expiresAt).toLocaleString("ja-JP") : "-";
    const subject = input.reminderKind === "manual"
      ? "【社長カルテ】回答再開URLのご案内"
      : "【社長カルテ】途中保存した回答の再開について";

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: fromEmail,
        to: input.recipientEmail,
        ...(replyTo ? { reply_to: replyTo } : {}),
        subject,
        html: buildReminderHtml({
          answeredCount: input.answeredCount,
          displayName,
          expiresText,
          resumeUrl
        }),
        text: [
          `${displayName} 様`,
          "",
          "社長カルテの回答が途中保存されています。",
          "",
          `現在、全48問中${input.answeredCount}問まで回答済みです。`,
          "以下のURLから、保存した続きより再開できます。",
          "",
          resumeUrl,
          "",
          `保存期限：${expiresText}`,
          "",
          "※このURLは受検者ご本人専用です。第三者への共有はお控えください。",
          "※このメールは自動送信です。"
        ].join("\n")
      })
    });

    if (!response.ok) throw new Error(await response.text());
    return { sent: true };
  } catch (error) {
    return { sent: false, errorMessage: formatError(error) };
  }
}

export function getServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient<any>(supabaseUrl, supabaseAnonKey);
}

function buildReminderHtml({
  answeredCount,
  displayName,
  expiresText,
  resumeUrl
}: {
  answeredCount: number;
  displayName: string;
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
        <p style="${paragraphStyle}">社長カルテの回答が途中保存されています。</p>
        <p style="${paragraphStyle}">現在、全48問中${answeredCount}問まで回答済みです。<br />以下のボタンから、保存した続きより再開できます。</p>
        <p style="margin:0 0 14px;"><a href="${escapeHtml(resumeUrl)}" style="${buttonStyle}">続きから回答する</a></p>
        <p style="${paragraphStyle}">保存期限：${escapeHtml(expiresText)}</p>
        <p style="margin:0;line-height:1.8;color:#6b7280;font-size:13px;">※このURLは受検者ご本人専用です。第三者への共有はお控えください。<br />※このメールは自動送信です。</p>
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

export function formatError(error: unknown) {
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
