import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import type { ThemeScore } from "@/lib/diagnosis";
import type { UsageSettings } from "@/lib/usage-settings";
import { usageSettingsFromRow } from "@/lib/usage-settings";
import ResultTokenView from "./ResultTokenView";

type PageProps = {
  params: Promise<{ token: string }>;
};

type ResponseRow = {
  id: string;
  respondent_id: string;
  total_score: number;
  achievement_rate: number;
  category_scores_json: ThemeScore[] | null;
  priority_categories_json: ThemeScore[] | null;
  result_token_expires_at: string | null;
  result_view_count: number | null;
  created_at: string;
  is_demo: boolean | null;
  watermark_enabled: boolean | null;
  watermark_text: string | null;
  copyright_enabled: boolean | null;
  copyright_text: string | null;
  commercial_use_allowed: boolean | null;
  resubmission_allowed: boolean | null;
  usage_purpose: string | null;
};

type RespondentRow = {
  company_name: string | null;
  name: string | null;
  industry: string | null;
  employee_size: string | null;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const defaultTimerexUrl = "https://timerex.net/s/sato.motoki_765a/c6616a1a/";

export default async function SharedResultPage({ params }: PageProps) {
  const { token } = await params;

  if (!supabaseUrl || !supabaseAnonKey) {
    return (
      <Message
        title="設定エラー"
        body="Supabaseの環境変数が設定されていないため、結果を表示できません。"
      />
    );
  }

  const supabase = createClient<any>(supabaseUrl, supabaseAnonKey);
  const { data: response, error } = await supabase
    .from("diagnosis_responses")
    .select(
      `
      id,
      respondent_id,
      total_score,
      achievement_rate,
      category_scores_json,
      priority_categories_json,
      result_token_expires_at,
      result_view_count,
      created_at,
      is_demo,
      watermark_enabled,
      watermark_text,
      copyright_enabled,
      copyright_text,
      commercial_use_allowed,
      resubmission_allowed,
      usage_purpose
    `
    )
    .eq("result_token", token)
    .maybeSingle();

  if (error) {
    console.error("Shared result fetch failed", error);
    return (
      <Message
        title="結果を表示できません"
        body="診断結果の取得に失敗しました。時間をおいて再度お試しください。"
      />
    );
  }

  if (!response) {
    return (
      <Message
        title="結果が見つかりません"
        body="診断結果URLが正しいかご確認ください。"
      />
    );
  }

  const result = response as ResponseRow;
  if (!result.result_token_expires_at || new Date(result.result_token_expires_at).getTime() < Date.now()) {
    return (
      <Message
        title="閲覧期限終了"
        body="診断結果の閲覧期限が終了しました。再確認をご希望の場合は運営までお問い合わせください。"
      />
    );
  }

  const { data: respondent, error: respondentError } = await supabase
    .from("respondents")
    .select("company_name,name,industry,employee_size")
    .eq("id", result.respondent_id)
    .maybeSingle();

  if (respondentError) console.error("Shared result respondent fetch failed", respondentError);

  const { error: updateError } = await supabase
    .from("diagnosis_responses")
    .update({
      result_view_count: (result.result_view_count ?? 0) + 1,
      result_last_viewed_at: new Date().toISOString()
    })
    .eq("id", result.id);

  if (updateError) console.error("Shared result view log failed", updateError);

  return (
    <ResultTokenView
      achievementRate={result.achievement_rate}
      createdAt={result.created_at}
      expiresAt={result.result_token_expires_at}
      priorityThemes={result.priority_categories_json ?? []}
      respondent={(respondent as RespondentRow | null) ?? null}
      themeScores={result.category_scores_json ?? []}
      timerexUrl={process.env.TIMEREX_URL || defaultTimerexUrl}
      totalScore={result.total_score}
      usageSettings={usageSettingsFromRow(result as Partial<UsageSettings>)}
    />
  );
}

function Message({ title, body }: { title: string; body: string }) {
  return (
    <main className="page-shell flex min-h-screen items-center justify-center">
      <section className="panel max-w-xl p-6 text-center">
        <h1 className="text-2xl font-black text-ink">{title}</h1>
        <p className="mt-3 leading-7 text-stone-700">{body}</p>
        <Link className="secondary-button mt-5" href="/">
          トップへ戻る
        </Link>
      </section>
    </main>
  );
}
