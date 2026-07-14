import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { BasicInfo } from "@/lib/diagnosis";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

type DraftPayload = {
  respondentId?: string;
  responseId?: string;
  basicInfo: BasicInfo;
  answers?: Record<string, number>;
  progressRate?: number;
  lastAnsweredQuestionId?: string;
  lastAnsweredQuestionOrder?: number;
};

export async function POST(request: Request) {
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: "Supabase environment variables are not configured." }, { status: 500 });
  }

  try {
    const payload = (await request.json()) as DraftPayload;
    const supabase = createClient<any>(supabaseUrl, supabaseAnonKey);
    const respondentId = payload.respondentId || crypto.randomUUID();
    const basicInfo = normalizeBasicInfo(payload.basicInfo);
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
        answers_json: payload.answers ?? {},
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
        progress_rate: payload.progressRate ?? 0,
        last_answered_question_id: payload.lastAnsweredQuestionId || null,
        last_answered_question_order: payload.lastAnsweredQuestionOrder ?? 0,
        expires_at: expiresAt,
        updated_at: now,
        is_demo: true,
        watermark_enabled: true,
        watermark_text: "DEMO｜社長カルテ",
        copyright_enabled: true,
        copyright_text: "© Two rails",
        commercial_use_allowed: false,
        resubmission_allowed: false
      })
      .select("id,created_at,updated_at,expires_at")
      .single();

    if (error) throw error;

    return NextResponse.json({
      draft: {
        id: data.id,
        respondentId,
        responseId: data.id,
        basicInfo,
        answers: payload.answers ?? {},
        status: "draft",
        progressRate: payload.progressRate ?? 0,
        lastAnsweredQuestionId: payload.lastAnsweredQuestionId || "",
        lastAnsweredQuestionOrder: payload.lastAnsweredQuestionOrder ?? 0,
        expiresAt: data.expires_at ?? expiresAt,
        createdAt: data.created_at ?? now,
        updatedAt: data.updated_at ?? now
      }
    });
  } catch (error) {
    console.error("Assessment draft create failed", error);
    return NextResponse.json({ error: formatError(error) }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: "Supabase environment variables are not configured." }, { status: 500 });
  }

  try {
    const payload = (await request.json()) as DraftPayload;
    if (!payload.responseId) {
      return NextResponse.json({ error: "responseId is required." }, { status: 400 });
    }

    const supabase = createClient<any>(supabaseUrl, supabaseAnonKey);
    const now = new Date().toISOString();
    const updatePayload: Record<string, unknown> = {
      answers_json: payload.answers ?? {},
      progress_rate: payload.progressRate ?? 0,
      last_answered_question_id: payload.lastAnsweredQuestionId || null,
      last_answered_question_order: payload.lastAnsweredQuestionOrder ?? 0,
      updated_at: now
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
      .select("id,created_at,updated_at,expires_at")
      .single();

    if (error) throw error;

    return NextResponse.json({
      draft: {
        id: data.id,
        respondentId: payload.respondentId,
        responseId: data.id,
        basicInfo: payload.basicInfo,
        answers: payload.answers ?? {},
        status: "draft",
        progressRate: payload.progressRate ?? 0,
        lastAnsweredQuestionId: payload.lastAnsweredQuestionId || "",
        lastAnsweredQuestionOrder: payload.lastAnsweredQuestionOrder ?? 0,
        expiresAt: data.expires_at,
        createdAt: data.created_at,
        updatedAt: data.updated_at ?? now
      }
    });
  } catch (error) {
    console.error("Assessment draft update failed", error);
    return NextResponse.json({ error: formatError(error) }, { status: 500 });
  }
}

function normalizeBasicInfo(info: BasicInfo): BasicInfo {
  const emailNormalized = (info.emailNormalized || info.email || "").trim().toLowerCase();
  return {
    ...info,
    email: emailNormalized,
    emailNormalized
  };
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
