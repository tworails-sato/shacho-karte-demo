import { NextResponse } from "next/server";

type ContactPayload = {
  companyName?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  message?: string;
  privacyAgreed?: boolean;
  website?: string;
};

type FieldErrors = Partial<Record<keyof ContactPayload, string>>;

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 3;
const rateLimitStore = new Map<string, number[]>();

const limits = {
  companyName: 120,
  contactName: 80,
  email: 160,
  phone: 40,
  message: 2000
};

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  const adminEmailRaw = process.env.PARTNERS_CONTACT_EMAIL;
  const fromEmail = process.env.PARTNERS_CONTACT_FROM_EMAIL || "noreply@ceo-sherpa.com";

  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: "送信できませんでした。" }, { status: 403 });
  }

  if (!apiKey || !adminEmailRaw) {
    console.error("Partners contact is not configured", {
      hasApiKey: Boolean(apiKey),
      hasAdminEmail: Boolean(adminEmailRaw)
    });
    return NextResponse.json({ error: "お問い合わせ送信の設定が未完了です。" }, { status: 500 });
  }

  const ip = getClientIp(request);
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "短時間に複数回送信されています。時間をおいて再度お試しください。" }, { status: 429 });
  }

  let payload: ContactPayload;
  try {
    payload = (await request.json()) as ContactPayload;
  } catch {
    return NextResponse.json({ error: "入力内容を確認してください。" }, { status: 400 });
  }

  if (payload.website?.trim()) {
    return NextResponse.json({ error: "送信できませんでした。" }, { status: 400 });
  }

  const { fieldErrors, values } = validatePayload(payload);
  if (Object.keys(fieldErrors).length > 0) {
    return NextResponse.json({ error: "入力内容を確認してください。", fieldErrors }, { status: 400 });
  }

  if (countUrls(values.message) >= 3) {
    return NextResponse.json(
      { error: "URLが多く含まれているため送信できません。", fieldErrors: { message: "URLを減らして送信してください。" } },
      { status: 400 }
    );
  }

  const adminEmails = adminEmailRaw
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);

  if (adminEmails.length === 0) {
    console.error("Partners contact admin email list is empty");
    return NextResponse.json({ error: "お問い合わせ送信の設定が未完了です。" }, { status: 500 });
  }

  const sentAt = new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
  const sourceUrl = request.headers.get("referer") || `${process.env.NEXT_PUBLIC_APP_URL || ""}/partners/contact`;
  const adminText = [
    "社長カルテPartnersにお問い合わせがありました。",
    "",
    `会社名: ${values.companyName}`,
    `担当者名: ${values.contactName}`,
    `メールアドレス: ${values.email}`,
    `電話番号: ${values.phone || "未入力"}`,
    "",
    "お問い合わせ内容:",
    values.message,
    "",
    `送信日時: ${sentAt}`,
    `送信元URL: ${sourceUrl}`
  ].join("\n");

  const userText = [
    `${values.contactName} 様`,
    "",
    "社長カルテPartnersへお問い合わせいただき、ありがとうございます。",
    "内容を確認のうえ、担当者よりご連絡いたします。",
    "",
    "お問い合わせ内容の控え:",
    values.message,
    "",
    "このメールは自動送信です。"
  ].join("\n");

  const adminResults = [];
  for (const adminEmail of adminEmails) {
    adminResults.push(
      await sendEmail({
        apiKey,
        fromEmail,
        html: toHtml(adminText),
        replyTo: values.email,
        subject: "【社長カルテPartners】お問い合わせがありました",
        text: adminText,
        to: adminEmail
      })
    );
  }

  const userResult = await sendEmail({
    apiKey,
    fromEmail,
    html: toHtml(userText),
    subject: "【社長カルテPartners】お問い合わせを受け付けました",
    text: userText,
    to: values.email
  });

  const adminSuccessCount = adminResults.filter((result) => result.ok).length;
  if (adminSuccessCount === 0 || !userResult.ok) {
    console.error("Partners contact mail failed", {
      adminSuccessCount,
      adminTotal: adminEmails.length,
      userMailOk: userResult.ok,
      companyNameLength: values.companyName.length,
      messageLength: values.message.length
    });
    return NextResponse.json({ error: "送信に失敗しました。時間をおいて再度お試しください。" }, { status: 502 });
  }

  if (adminSuccessCount < adminEmails.length) {
    console.error("Some partners contact admin mails failed", {
      adminSuccessCount,
      adminTotal: adminEmails.length
    });
  }

  return NextResponse.json({ ok: true });
}

export function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

function validatePayload(payload: ContactPayload) {
  const values = {
    companyName: normalize(payload.companyName),
    contactName: normalize(payload.contactName),
    email: normalize(payload.email).toLowerCase(),
    phone: normalize(payload.phone),
    message: normalize(payload.message)
  };
  const fieldErrors: FieldErrors = {};

  if (!values.companyName) fieldErrors.companyName = "会社名を入力してください。";
  if (!values.contactName) fieldErrors.contactName = "担当者名を入力してください。";
  if (!values.email) fieldErrors.email = "メールアドレスを入力してください。";
  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    fieldErrors.email = "メールアドレスの形式で入力してください。";
  }
  if (!values.message) fieldErrors.message = "お問い合わせ内容を入力してください。";
  if (!payload.privacyAgreed) fieldErrors.privacyAgreed = "個人情報の取り扱いに同意してください。";

  for (const [key, maxLength] of Object.entries(limits) as Array<[keyof typeof values, number]>) {
    if (values[key] && values[key].length > maxLength) {
      fieldErrors[key] = `${maxLength}文字以内で入力してください。`;
    }
  }

  return { fieldErrors, values };
}

function normalize(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/\r\n/g, "\n") : "";
}

function countUrls(value: string) {
  return (value.match(/https?:\/\/|www\./gi) ?? []).length;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function toHtml(text: string) {
  return `<div style="font-family:Arial,'Noto Sans JP',sans-serif;line-height:1.8;color:#0d1b2a;white-space:pre-wrap;">${escapeHtml(text)}</div>`;
}

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") || "unknown";
}

function isRateLimited(ip: string) {
  const now = Date.now();
  const recent = (rateLimitStore.get(ip) ?? []).filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX) {
    rateLimitStore.set(ip, recent);
    return true;
  }

  recent.push(now);
  rateLimitStore.set(ip, recent);
  return false;
}

function isAllowedOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  const allowedOrigins = new Set(["http://localhost:3000", "http://127.0.0.1:3000"]);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) allowedOrigins.add(appUrl.replace(/\/$/, ""));

  try {
    const parsed = new URL(origin);
    const normalized = `${parsed.protocol}//${parsed.host}`;
    return allowedOrigins.has(normalized);
  } catch {
    return false;
  }
}

async function sendEmail({
  apiKey,
  fromEmail,
  html,
  replyTo,
  subject,
  text,
  to
}: {
  apiKey: string;
  fromEmail: string;
  html: string;
  replyTo?: string;
  subject: string;
  text: string;
  to: string;
}) {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: fromEmail,
        to,
        ...(replyTo ? { reply_to: replyTo } : {}),
        subject,
        text,
        html
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Partners contact Resend failed", {
        status: response.status,
        toDomain: to.split("@")[1] || "unknown",
        errorLength: errorText.length
      });
      return { ok: false };
    }

    return { ok: true };
  } catch (error) {
    console.error("Partners contact Resend request failed", error instanceof Error ? error.message : "unknown error");
    return { ok: false };
  }
}
