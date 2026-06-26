import { createClient } from "@supabase/supabase-js";
import type { StoredEvent, StoredSubmission } from "./storage";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

let supabaseClient: ReturnType<typeof createClient<any>> | null = null;

type SupabaseOperationResult<T> = {
  data: T;
  errorMessage?: string;
  skipped?: boolean;
};

export function getSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  supabaseClient ??= createClient<any>(supabaseUrl, supabaseAnonKey);
  return supabaseClient;
}

export function getSupabaseConfigStatus() {
  return {
    configured: isSupabaseConfigured,
    hasUrl: Boolean(supabaseUrl),
    hasAnonKey: Boolean(supabaseAnonKey)
  };
}

export async function saveSubmissionToSupabase(
  submission: StoredSubmission
): Promise<SupabaseOperationResult<StoredSubmission>> {
  if (typeof window !== "undefined") {
    try {
      const response = await fetch("/api/diagnosis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submission)
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || "Diagnosis API save failed");
      }

      const payload = (await response.json()) as { submission: StoredSubmission };
      return { data: payload.submission };
    } catch (error) {
      console.error("Supabase diagnosis save failed", error);
      return {
        data: submission,
        errorMessage: formatSupabaseError(error)
      };
    }
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return {
      data: submission,
      skipped: true,
      errorMessage:
        "Supabase環境変数が読み込まれていません。NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY を確認してください。"
    };
  }

  const respondentId = submission.respondentId ?? submission.id;
  let responseId = submission.responseId;

  try {
    if (!submission.respondentId) {
      const { error } = await supabase.from("respondents").upsert(
        {
          id: respondentId,
          company_name: submission.basicInfo.companyName,
          name: submission.basicInfo.representativeName,
          email: submission.basicInfo.email,
          industry: submission.basicInfo.industry,
          employee_size: submission.basicInfo.employeeSize || null,
          user_type: submission.basicInfo.category
        },
        { onConflict: "id" }
      );

      if (error) throw error;
    }

    if (!responseId) {
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
          email: submission.basicInfo.emailNormalized || submission.basicInfo.email,
          email_normalized: submission.basicInfo.emailNormalized || submission.basicInfo.email,
          traffic_source: submission.basicInfo.trafficSource,
          referrer_name: submission.basicInfo.referrerName || null,
          referrer_company: submission.basicInfo.referrerCompany || null,
          referrer_email: submission.basicInfo.referrerEmail || null,
          consent_agreed: submission.basicInfo.consentAgreed,
          consent_agreed_at: submission.basicInfo.consentAgreedAt || null,
          ip_hash: null,
          user_agent: null
        })
        .select("id")
        .single();

      if (error) throw error;
      responseId = data.id;
    }

    return {
      data: {
        ...submission,
        respondentId,
        responseId,
        supabaseSyncedAt: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error("Supabase diagnosis save failed", error);
    return {
      data: submission,
      errorMessage: formatSupabaseError(error)
    };
  }
}

export async function saveDiagnosisEventToSupabase(
  respondentId: string | undefined,
  eventType: StoredEvent["eventType"]
): Promise<SupabaseOperationResult<null>> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return {
      data: null,
      skipped: true,
      errorMessage:
        "Supabase環境変数が読み込まれていません。NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY を確認してください。"
    };
  }

  if (!respondentId) {
    return {
      data: null,
      errorMessage: "respondent_id が未設定のため、CTAイベントを保存できませんでした。"
    };
  }

  try {
    const { error } = await supabase.from("diagnosis_events").insert({
      respondent_id: respondentId,
      event_type: eventType
    });

    if (error) throw error;
    return { data: null };
  } catch (error) {
    console.error("Supabase event save failed", error);
    return {
      data: null,
      errorMessage: formatSupabaseError(error)
    };
  }
}

function formatSupabaseError(error: unknown) {
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
