"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip
} from "recharts";
import type { ThemeScore } from "@/lib/diagnosis";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";

type DiagnosisResponseRow = {
  id: string;
  respondent_id: string;
  total_score: number;
  achievement_rate: number;
  category_scores_json: ThemeScore[];
  top_categories_json: ThemeScore[];
  priority_categories_json: ThemeScore[];
  created_at: string;
};

type RespondentRow = {
  company_name: string;
  name: string;
  email: string;
  industry: string;
  user_type: string;
};

type FeedbackReportRow = FeedbackReportForm & {
  id: string;
  response_id: string;
  created_at: string;
  updated_at: string;
};

type FeedbackReportForm = {
  summary: string;
  executive_type: string;
  psychological_tendency: string;
  strength: string;
  gap: string;
  short_term_action: string;
  mid_long_term_action: string;
  advisor_use_case: string;
};

const emptyReport: FeedbackReportForm = {
  summary: "",
  executive_type: "",
  psychological_tendency: "",
  strength: "",
  gap: "",
  short_term_action: "",
  mid_long_term_action: "",
  advisor_use_case: ""
};

const fields: Array<{ key: keyof FeedbackReportForm; label: string }> = [
  { key: "summary", label: "サマリー" },
  { key: "executive_type", label: "経営者タイプ" },
  { key: "psychological_tendency", label: "経営者の心理的傾向" },
  { key: "strength", label: "強み" },
  { key: "gap", label: "最も強く表れているGAP" },
  { key: "short_term_action", label: "アクションプラン：短期" },
  { key: "mid_long_term_action", label: "アクションプラン：中長期" },
  { key: "advisor_use_case", label: "支援者としての活用仮説" }
];

function formatDate(value: string) {
  return new Date(value).toLocaleString("ja-JP");
}

function textOrPlaceholder(value: string) {
  return value.trim() || "未入力";
}

function multilineText(value: string) {
  return textOrPlaceholder(value)
    .split("\n")
    .map((line, index) => (
      <span key={`${line}-${index}`}>
        {line}
        <br />
      </span>
    ));
}

function themeNames(themes: ThemeScore[]) {
  return themes.map((theme) => theme.name).join("、") || "-";
}

function averageQuestionScore(theme: ThemeScore) {
  return theme.score / 3;
}

function getReportPriority(theme: ThemeScore) {
  const score = averageQuestionScore(theme);
  if (score < 2) return "高";
  if (score < 2.5) return "中";
  return "低";
}

function PriorityBadge({ priority }: { priority: string }) {
  const style =
    priority === "高"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : priority === "中"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-blue-200 bg-blue-50 text-blue-700";
  const icon = priority === "高" ? "🔴" : priority === "中" ? "🟡" : "🔵";

  return (
    <span className={`priority-badge inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-black ${style}`}>
      <span aria-hidden="true">{icon}</span>
      <span>{priority}</span>
    </span>
  );
}

function PriorityThemeList({ themes }: { themes: ThemeScore[] }) {
  if (themes.length === 0) return <p className="mt-2 leading-7 text-amber-900">-</p>;

  return (
    <div className="mt-3 space-y-2">
      {themes.map((theme) => (
        <div key={theme.id} className="flex flex-wrap items-center gap-2">
          <PriorityBadge priority={getReportPriority(theme)} />
          <span className="font-bold text-amber-950">{theme.name}</span>
        </div>
      ))}
    </div>
  );
}

export default function FeedbackReportPage() {
  const params = useParams<{ response_id: string }>();
  const responseId = params.response_id;
  const [response, setResponse] = useState<DiagnosisResponseRow | null>(null);
  const [respondent, setRespondent] = useState<RespondentRow | null>(null);
  const [report, setReport] = useState<FeedbackReportForm>(emptyReport);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadReport() {
      if (!isSupabaseConfigured) {
        setLoading(false);
        setErrorMessage("Supabase環境変数が未設定です。");
        return;
      }

      const supabase = getSupabaseClient();
      if (!supabase) return;

      try {
        const { data: responseData, error: responseError } = await supabase
          .from("diagnosis_responses")
          .select(`
            id,
            respondent_id,
            total_score,
            achievement_rate,
            category_scores_json,
            top_categories_json,
            priority_categories_json,
            created_at
          `)
          .eq("id", responseId)
          .maybeSingle();

        if (responseError) throw responseError;
        if (!responseData) throw new Error("該当する回答データが見つかりません。");

        const typedResponse = responseData as DiagnosisResponseRow;
        setResponse(typedResponse);

        const { data: respondentData, error: respondentError } = await supabase
          .from("respondents")
          .select("company_name,name,email,industry,user_type")
          .eq("id", typedResponse.respondent_id)
          .maybeSingle();

        if (respondentError) throw respondentError;
        setRespondent((respondentData as RespondentRow | null) ?? null);

        const { data: reportData, error: reportError } = await supabase
          .from("feedback_reports")
          .select(`
            id,
            response_id,
            summary,
            executive_type,
            psychological_tendency,
            strength,
            gap,
            short_term_action,
            mid_long_term_action,
            advisor_use_case,
            created_at,
            updated_at
          `)
          .eq("response_id", responseId)
          .maybeSingle();

        if (reportError) throw reportError;
        if (reportData) {
          const savedReport = reportData as FeedbackReportRow;
          setReport({
            summary: savedReport.summary ?? "",
            executive_type: savedReport.executive_type ?? "",
            psychological_tendency: savedReport.psychological_tendency ?? "",
            strength: savedReport.strength ?? "",
            gap: savedReport.gap ?? "",
            short_term_action: savedReport.short_term_action ?? "",
            mid_long_term_action: savedReport.mid_long_term_action ?? "",
            advisor_use_case: savedReport.advisor_use_case ?? ""
          });
        }

        setErrorMessage(null);
      } catch (error) {
        console.error("Feedback report fetch failed", error);
        setErrorMessage(formatError(error));
      } finally {
        setLoading(false);
      }
    }

    loadReport();
  }, [responseId]);

  const chartData = useMemo(
    () =>
      response?.category_scores_json.map((theme) => ({
        theme: theme.name,
        score: theme.score,
        target: theme.target
      })) ?? [],
    [response]
  );

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = getSupabaseClient();
    if (!supabase || !response) return;

    setSaving(true);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      const now = new Date().toISOString();
      const { error } = await supabase.from("feedback_reports").upsert(
        {
          response_id: response.id,
          ...report,
          updated_at: now
        },
        { onConflict: "response_id" }
      );

      if (error) throw error;
      setStatusMessage("FBレポートを保存しました。");
    } catch (error) {
      console.error("Feedback report save failed", error);
      setErrorMessage(formatError(error));
    } finally {
      setSaving(false);
    }
  }

  function updateReport(key: keyof FeedbackReportForm, value: string) {
    setReport((current) => ({ ...current, [key]: value }));
  }

  if (loading) {
    return (
      <main className="page-shell">
        <section className="panel p-6">FBレポート作成画面を読み込んでいます。</section>
      </main>
    );
  }

  if (!response) {
    return (
      <main className="page-shell space-y-4">
        <Link className="secondary-button report-screen-only" href="/admin">
          管理画面へ戻る
        </Link>
        <section className="rounded-lg border border-rose-200 bg-rose-50 p-5 font-bold leading-7 text-rose-800">
          {errorMessage || "回答データを表示できませんでした。"}
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell space-y-5">
      <div className="report-screen-only flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold text-brand">FEEDBACK REPORT</p>
          <h1 className="mt-2 text-3xl font-black text-ink">FBレポート作成</h1>
          <p className="mt-2 leading-7 text-stone-700">
            回答データをもとに、管理者がフィードバック本文を作成・編集できます。
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button className="secondary-button" onClick={() => window.print()} type="button">
            印刷する
          </button>
          <Link className="secondary-button" href="/admin">
            管理画面へ戻る
          </Link>
        </div>
      </div>

      {statusMessage ? (
        <section className="report-screen-only rounded-lg border border-teal-200 bg-teal-50 p-4 text-sm font-bold text-teal-900">
          {statusMessage}
        </section>
      ) : null}

      {errorMessage ? (
        <section className="report-screen-only rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-bold leading-7 text-rose-800">
          {errorMessage}
        </section>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <form className="report-screen-only panel space-y-4 p-5" onSubmit={handleSave}>
          <div>
            <h2 className="text-xl font-black text-ink">編集フォーム</h2>
            <p className="mt-1 text-sm leading-6 text-stone-600">
              FB本文は管理者が入力してください。入力内容は右側のプレビューに反映されます。
            </p>
          </div>

          {fields.map((field) => (
            <label key={field.key} className="block space-y-2">
              <span className="label">{field.label}</span>
              <textarea
                className="field min-h-28 resize-y"
                value={report[field.key]}
                onChange={(event) => updateReport(field.key, event.target.value)}
              />
            </label>
          ))}

          <button className="primary-button w-full" disabled={saving} type="submit">
            {saving ? "保存中..." : "FBレポートを保存"}
          </button>
        </form>

        <section className="report-preview rounded-lg bg-white p-6 shadow-soft">
          <div className="border-b border-stone-200 pb-5">
            <p className="text-sm font-bold text-brand">SHACHO KARTE LIGHT</p>
            <h2 className="mt-2 text-3xl font-black leading-tight text-ink">
              社長カルテLight フィードバックレポート
            </h2>
          </div>

          <section className="mt-6">
            <h3 className="text-xl font-black text-ink">受検者情報</h3>
            <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
              {[
                ["氏名", respondent?.name || "-"],
                ["会社名", respondent?.company_name || "-"],
                ["役職", "未取得"],
                ["業種", respondent?.industry || "-"],
                ["従業員規模", "未取得"],
                ["回答日時", formatDate(response.created_at)]
              ].map(([label, value]) => (
                <div key={label} className="rounded-md bg-stone-50 p-3">
                  <dt className="font-bold text-stone-500">{label}</dt>
                  <dd className="mt-1 font-black text-ink">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="mt-6 grid gap-4 md:grid-cols-[0.45fr_0.55fr]">
            <div className="rounded-lg border border-stone-200 p-4">
              <p className="text-sm font-bold text-stone-600">総合スコア</p>
              <p className="mt-2 text-4xl font-black text-ink">
                {response.total_score}
                <span className="text-lg text-stone-500"> / 192点</span>
              </p>
              <p className="mt-2 text-sm font-bold text-brand">達成率：{response.achievement_rate}%</p>
            </div>
            <div className="rounded-lg border border-stone-200 p-4">
              <h3 className="font-black text-ink">16テーマ別レーダーチャート</h3>
              <div className="mt-3 h-72">
                <ResponsiveContainer height="100%" width="100%">
                  <RadarChart data={chartData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="theme" tick={{ fontSize: 9 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 12]} tickCount={5} />
                    <Radar dataKey="target" fill="#2563eb" fillOpacity={0.12} name="目標値" stroke="#2563eb" />
                    <Radar dataKey="score" fill="#0f766e" fillOpacity={0.35} name="実スコア" stroke="#0f766e" />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          <section className="mt-6">
            <h3 className="text-xl font-black text-ink">16テーマ別スコア表</h3>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="bg-stone-50 text-stone-600">
                  <tr>
                    <th className="px-3 py-2">テーマ名</th>
                    <th className="px-3 py-2">スコア</th>
                    <th className="px-3 py-2">優先度</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {response.category_scores_json.map((theme) => (
                    <tr key={theme.id}>
                      <td className="px-3 py-2 font-black text-ink">{theme.name}</td>
                      <td className="px-3 py-2 font-bold">{averageQuestionScore(theme).toFixed(2)}</td>
                      <td className="px-3 py-2"><PriorityBadge priority={getReportPriority(theme)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg bg-teal-50 p-4">
              <h3 className="font-black text-teal-950">高スコアテーマ</h3>
              <p className="mt-2 leading-7 text-teal-900">{themeNames(response.top_categories_json)}</p>
            </div>
            <div className="rounded-lg bg-amber-50 p-4">
              <h3 className="font-black text-amber-950">優先確認テーマ</h3>
              <PriorityThemeList themes={response.priority_categories_json} />
            </div>
          </section>

          <section className="mt-6 space-y-4">
            <h3 className="text-xl font-black text-ink">フィードバック本文</h3>
            {fields.map((field) => (
              <article key={field.key} className="break-inside-avoid rounded-lg border border-stone-200 p-4">
                <h4 className="font-black text-ink">{field.label}</h4>
                <p className="mt-2 whitespace-pre-wrap leading-7 text-stone-700">
                  {multilineText(report[field.key])}
                </p>
              </article>
            ))}
          </section>
        </section>
      </div>
    </main>
  );
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
