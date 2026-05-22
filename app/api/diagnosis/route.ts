import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { StoredSubmission } from "@/lib/storage";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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
    let responseId = submission.responseId;

    if (!submission.respondentId) {
      const { error } = await supabase.from("respondents").upsert(
        {
          id: respondentId,
          company_name: submission.basicInfo.companyName,
          name: submission.basicInfo.representativeName,
          email: submission.basicInfo.emailNormalized || submission.basicInfo.email,
          industry: submission.basicInfo.industry,
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
          ip_hash: hashIp(getClientIp(request)),
          user_agent: request.headers.get("user-agent") || null
        })
        .select("id")
        .single();

      if (error) throw error;
      responseId = data.id;
    }

    return NextResponse.json({
      submission: {
        ...submission,
        respondentId,
        responseId,
        supabaseSyncedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("Diagnosis API save failed", error);
    return NextResponse.json(
      { error: formatError(error) },
      { status: 500 }
    );
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
