import { NextResponse } from "next/server";
import {
  formatError,
  getServerSupabaseClient,
  sendResumeReminderMail
} from "@/lib/resume-reminder-mail";

export const dynamic = "force-dynamic";

type DraftReminderRow = {
  id: string;
  respondent_id: string;
  email: string | null;
  email_normalized: string | null;
  answered_count: number | null;
  updated_at: string | null;
  expires_at: string | null;
  resume_token: string | null;
  reminder_1_sent_at: string | null;
  reminder_2_sent_at: string | null;
  reminder_3_sent_at: string | null;
};

type ReminderStage = {
  column: "reminder_1_sent_at" | "reminder_2_sent_at" | "reminder_3_sent_at";
  kind: "auto_1" | "auto_2" | "auto_3";
};

export async function GET(request: Request) {
  const authError = validateCronRequest(request);
  if (authError) return authError;

  const supabase = getServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase environment variables are not configured." }, { status: 500 });
  }

  try {
    const now = new Date();
    const { data: drafts, error } = await supabase
      .from("diagnosis_responses")
      .select(`
        id,
        respondent_id,
        email,
        email_normalized,
        answered_count,
        updated_at,
        expires_at,
        resume_token,
        reminder_1_sent_at,
        reminder_2_sent_at,
        reminder_3_sent_at
      `)
      .eq("status", "draft")
      .gt("expires_at", now.toISOString())
      .limit(500);

    if (error) throw error;

    const targetRows = ((drafts ?? []) as DraftReminderRow[]).filter((row) => {
      return Boolean(row.resume_token && row.expires_at && (row.email_normalized || row.email));
    });

    const respondentIds = [...new Set(targetRows.map((row) => row.respondent_id).filter(Boolean))];
    const respondentNames = new Map<string, string>();
    if (respondentIds.length > 0) {
      const { data: respondents, error: respondentsError } = await supabase
        .from("respondents")
        .select("id,name")
        .in("id", respondentIds);

      if (respondentsError) throw respondentsError;
      (respondents ?? []).forEach((respondent: { id: string; name: string | null }) => {
        respondentNames.set(respondent.id, respondent.name ?? "");
      });
    }

    const results = {
      checked: targetRows.length,
      sent: 0,
      skipped: 0,
      failed: 0
    };

    for (const draft of targetRows) {
      const stage = pickReminderStage(draft, now);
      if (!stage) {
        results.skipped += 1;
        continue;
      }

      const mailResult = await sendResumeReminderMail({
        answeredCount: draft.answered_count ?? 0,
        expiresAt: draft.expires_at ?? "",
        recipientEmail: (draft.email_normalized || draft.email || "").trim().toLowerCase(),
        representativeName: respondentNames.get(draft.respondent_id) ?? "",
        request,
        resumeToken: draft.resume_token ?? "",
        reminderKind: stage.kind
      });

      if (!mailResult.sent) {
        results.failed += 1;
        console.error("Assessment reminder mail failed", {
          responseId: draft.id,
          stage: stage.kind,
          error: mailResult.errorMessage
        });
        continue;
      }

      const { error: updateError } = await supabase
        .from("diagnosis_responses")
        .update({ [stage.column]: new Date().toISOString() })
        .eq("id", draft.id)
        .is(stage.column, null);

      if (updateError) {
        results.failed += 1;
        console.error("Assessment reminder status update failed", {
          responseId: draft.id,
          stage: stage.kind,
          error: updateError
        });
        continue;
      }

      results.sent += 1;
    }

    return NextResponse.json({ ok: true, ...results });
  } catch (error) {
    console.error("Assessment reminder cron failed", error);
    return NextResponse.json({ error: formatError(error) }, { status: 500 });
  }
}

function validateCronRequest(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return null;

  const authorization = request.headers.get("authorization");
  if (authorization !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}

function pickReminderStage(row: DraftReminderRow, now: Date): ReminderStage | null {
  if (!row.updated_at || !row.expires_at) return null;

  const updatedAt = new Date(row.updated_at);
  const expiresAt = new Date(row.expires_at);
  const daysSinceUpdated = (now.getTime() - updatedAt.getTime()) / (24 * 60 * 60 * 1000);
  const daysUntilExpires = (expiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000);

  if (!row.reminder_3_sent_at && daysUntilExpires <= 3) {
    return { column: "reminder_3_sent_at", kind: "auto_3" };
  }

  if (!row.reminder_2_sent_at && !row.reminder_3_sent_at && daysUntilExpires <= 7) {
    return { column: "reminder_2_sent_at", kind: "auto_2" };
  }

  if (
    !row.reminder_1_sent_at &&
    !row.reminder_2_sent_at &&
    !row.reminder_3_sent_at &&
    daysSinceUpdated >= 7
  ) {
    return { column: "reminder_1_sent_at", kind: "auto_1" };
  }

  return null;
}
