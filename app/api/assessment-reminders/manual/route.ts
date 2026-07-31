import { NextResponse } from "next/server";
import {
  formatError,
  getServerSupabaseClient,
  sendResumeReminderMail
} from "@/lib/resume-reminder-mail";

export const dynamic = "force-dynamic";

type ManualReminderPayload = {
  responseId?: string;
};

export async function POST(request: Request) {
  const supabase = getServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase environment variables are not configured." }, { status: 500 });
  }

  try {
    const payload = (await request.json()) as ManualReminderPayload;
    if (!payload.responseId) {
      return NextResponse.json({ error: "responseId is required." }, { status: 400 });
    }

    const { data: draft, error } = await supabase
      .from("diagnosis_responses")
      .select(`
        id,
        respondent_id,
        email,
        email_normalized,
        answered_count,
        expires_at,
        resume_token,
        manual_reminder_count
      `)
      .eq("id", payload.responseId)
      .eq("status", "draft")
      .single();

    if (error) throw error;
    if (!draft) return NextResponse.json({ error: "Draft was not found." }, { status: 404 });
    if (!draft.resume_token) {
      return NextResponse.json({ error: "再開URLが発行されていません。" }, { status: 400 });
    }
    if (!draft.expires_at || new Date(draft.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: "保存期限が終了しています。" }, { status: 410 });
    }

    const recipientEmail = (draft.email_normalized || draft.email || "").trim().toLowerCase();
    if (!recipientEmail) {
      return NextResponse.json({ error: "メールアドレスがありません。" }, { status: 400 });
    }

    const { data: respondent, error: respondentError } = await supabase
      .from("respondents")
      .select("name")
      .eq("id", draft.respondent_id)
      .maybeSingle();

    if (respondentError) throw respondentError;

    const mailResult = await sendResumeReminderMail({
      answeredCount: draft.answered_count ?? 0,
      expiresAt: draft.expires_at,
      recipientEmail,
      representativeName: respondent?.name ?? "",
      request,
      resumeToken: draft.resume_token,
      reminderKind: "manual"
    });

    if (!mailResult.sent) {
      console.error("Manual resume reminder failed", {
        responseId: draft.id,
        error: mailResult.errorMessage
      });
      return NextResponse.json({ error: mailResult.errorMessage }, { status: 502 });
    }

    const sentAt = new Date().toISOString();
    const nextCount = (draft.manual_reminder_count ?? 0) + 1;
    const { error: updateError } = await supabase
      .from("diagnosis_responses")
      .update({
        manual_reminder_sent_at: sentAt,
        manual_reminder_count: nextCount
      })
      .eq("id", draft.id);

    if (updateError) throw updateError;

    return NextResponse.json({
      ok: true,
      manualReminderSentAt: sentAt,
      manualReminderCount: nextCount
    });
  } catch (error) {
    console.error("Manual resume reminder route failed", error);
    return NextResponse.json({ error: formatError(error) }, { status: 500 });
  }
}
