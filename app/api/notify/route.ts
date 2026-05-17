import { NextResponse } from "next/server";

const ADMIN_EMAIL = "sato.motoki@t-rails.com";
const ADMIN_URL = "https://karte.ceo-sherpa.com/admin";

type NotifyRequest = {
  companyName?: string;
  representativeName?: string;
  email?: string;
};

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.error("Resend notification failed: RESEND_API_KEY is not set");
    return NextResponse.json(
      { error: "RESEND_API_KEY is not set" },
      { status: 500 }
    );
  }

  try {
    const payload = (await request.json()) as NotifyRequest;
    const companyName = payload.companyName || "未入力";
    const representativeName = payload.representativeName || "未入力";
    const email = payload.email || "未入力";

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "社長カルテ <onboarding@resend.dev>",
        to: ADMIN_EMAIL,
        subject: `【社長カルテ】デモ診断が完了しました: ${companyName}`,
        text: [
          "社長カルテ デモ診断が完了しました。",
          "",
          `会社名: ${companyName}`,
          `氏名: ${representativeName}`,
          `メールアドレス: ${email}`,
          "",
          `管理画面URL: ${ADMIN_URL}`
        ].join("\n")
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Resend notification failed", errorText);
      return NextResponse.json({ error: errorText }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Notification API failed", error);
    return NextResponse.json({ error: "Notification API failed" }, { status: 500 });
  }
}
