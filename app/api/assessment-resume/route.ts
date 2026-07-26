import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { BasicInfo } from "@/lib/diagnosis";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const QUESTION_COUNT = 48;

const RESUME_SELECT = `
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
  resume_token,
  resume_mail_sent_at,
  resume_mail_error
`;

export async function GET(request: Request) {
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: "Supabase environment variables are not configured." }, { status: 500 });
  }

  try {
    const token = new URL(request.url).searchParams.get("token");
    if (!token) return NextResponse.json({ error: "token is required." }, { status: 400 });

    const supabase = createClient<any>(supabaseUrl, supabaseAnonKey);
    const { data: response, error } = await supabase
      .from("diagnosis_responses")
      .select(RESUME_SELECT)
      .eq("resume_token", token)
      .maybeSingle();

    if (error) throw error;
    if (!response) {
      return NextResponse.json({ error: "無効な再開URLです。" }, { status: 404 });
    }
    if (response.status === "completed") {
      return NextResponse.json({ error: "この診断はすでに完了しています。", completed: true }, { status: 409 });
    }
    if (response.status !== "draft") {
      return NextResponse.json({ error: "この再開URLは利用できません。" }, { status: 409 });
    }
    if (response.expires_at && new Date(response.expires_at).getTime() < Date.now()) {
      return NextResponse.json(
        {
          error: "途中保存データの保存期限が終了しました。お手数ですが、最初から診断を受け直してください。",
          expired: true
        },
        { status: 410 }
      );
    }

    const basicInfo = await getBasicInfo(supabase, response);
    return NextResponse.json({ draft: rowToDraft(response, basicInfo, request) });
  } catch (error) {
    console.error("Assessment resume fetch failed", error);
    return NextResponse.json({ error: formatError(error) }, { status: 500 });
  }
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

function rowToDraft(row: any, basicInfo: BasicInfo, request: Request) {
  const answers = row.answers_json ?? {};
  const answeredCount = row.answered_count ?? Object.values(answers).filter(Boolean).length;
  const resumeToken = row.resume_token ?? "";

  return {
    id: row.id,
    respondentId: row.respondent_id,
    responseId: row.id,
    resumeToken,
    resumeUrl: resumeToken ? `${getAppUrl(request)}/assessment/resume/${resumeToken}` : "",
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

function getAppUrl(request: Request) {
  return (process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin).replace(/\/$/, "");
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
