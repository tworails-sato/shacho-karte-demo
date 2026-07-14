import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { normalizeEmail } from "@/lib/usage-settings";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const resubmissionLimitMessage =
  "このメールアドレスでは、直近30日以内に受検済みです。\n\n再受検をご希望の場合は、以下までお問い合わせください。\n\n合同会社Two rails\ninfo@ceo-sherpa.com";

export async function POST(request: Request) {
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ ok: true });
  }

  const { email } = await request.json();
  const normalized = normalizeEmail(String(email || ""));
  if (!normalized) {
    return NextResponse.json({ ok: false, error: "メールアドレスを入力してください。" }, { status: 400 });
  }

  const supabase = createClient<any>(supabaseUrl, supabaseAnonKey);
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("diagnosis_responses")
    .select("id,resubmission_allowed,created_at")
    .eq("email_normalized", normalized)
    .eq("is_demo", true)
    .eq("status", "completed")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) return NextResponse.json({ ok: true });

  const latest = data?.[0];
  if (latest && !latest.resubmission_allowed) {
    return NextResponse.json({ ok: false, error: resubmissionLimitMessage }, { status: 429 });
  }

  return NextResponse.json({ ok: true });
}
