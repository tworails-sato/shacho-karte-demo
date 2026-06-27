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
import {
  generateFeedbackDraft,
  mergeDraftIntoEmptyFields,
  type FeedbackDraftForm
} from "@/lib/feedback-draft";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import { defaultUsageSettings, usageSettingsFromRow, type UsageSettings } from "@/lib/usage-settings";

type DiagnosisResponseRow = {
  id: string;
  respondent_id: string;
  total_score: number;
  achievement_rate: number;
  category_scores_json: ThemeScore[];
  top_categories_json: ThemeScore[];
  priority_categories_json: ThemeScore[];
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
  company_name: string;
  name: string;
  email: string;
  industry: string;
  employee_size: string | null;
  user_type: string;
};

type FeedbackReportRow = FeedbackReportForm & {
  id: string;
  response_id: string;
  created_at: string;
  updated_at: string;
};

type FeedbackReportForm = FeedbackDraftForm;

const emptyReport: FeedbackReportForm = {
  one_line_summary: "",
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
  { key: "executive_type", label: "経営者タイプ" },
  { key: "psychological_tendency", label: "経営者の心理的傾向" },
  { key: "strength", label: "強み" },
  { key: "gap", label: "最も強く表れているGAP" },
  { key: "short_term_action", label: "アクションプラン：短期" },
  { key: "mid_long_term_action", label: "アクションプラン：中長期" },
  { key: "advisor_use_case", label: "支援者としての活用仮説" }
];

const themeGroups = [
  {
    name: "市場性",
    description: "適切な市場を選択できているか（戦略的評価）",
    themeIds: ["profitability", "market-growth", "scalability", "advantage"],
    badgeClass: "border-blue-200 bg-blue-50 text-blue-800"
  },
  {
    name: "事業体制",
    description: "事業を届ける体制を創れているか（機能的評価）",
    themeIds: ["business-risk", "investment", "functionality", "continuity"],
    badgeClass: "border-teal-200 bg-teal-50 text-teal-800"
  },
  {
    name: "事業社会性",
    description: "内外からの支持を得ているか（組織・情緒的評価）",
    themeIds: ["social-impact", "branding", "internal-engagement", "customer-engagement"],
    badgeClass: "border-amber-200 bg-amber-50 text-amber-800"
  },
  {
    name: "経営基盤",
    description: "盤石な経営ができているか（経営体制の評価）",
    themeIds: ["organization-building", "management-structure", "decision-making", "business-creation"],
    badgeClass: "border-rose-200 bg-rose-50 text-rose-800"
  }
];

const chartLabels: Record<string, string> = {
  profitability: "収益性",
  "market-growth": "成長性",
  scalability: "拡張性",
  advantage: "優位性",
  "business-risk": "事業リスク把握",
  investment: "内部投資",
  functionality: "組織機能",
  continuity: "事業継続性",
  "social-impact": "社会貢献性",
  branding: "ブランディング",
  "internal-engagement": "社内エンゲージメント",
  "customer-engagement": "顧客エンゲージメント",
  "organization-building": "組織構築力",
  "management-structure": "経営体制構築",
  "decision-making": "意思決定力",
  "business-creation": "新規事業性"
};

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

function getThemeGroup(theme: ThemeScore | { id: string }) {
  return themeGroups.find((group) => group.themeIds.includes(theme.id)) ?? themeGroups[0];
}

function displayThemeName(theme: ThemeScore | { id: string; name: string }) {
  return chartLabels[theme.id] ?? theme.name;
}

function GroupBadge({ theme }: { theme: ThemeScore }) {
  const group = getThemeGroup(theme);
  return (
    <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-black ${group.badgeClass}`}>
      {group.name}
    </span>
  );
}

function ThemeTag({ theme }: { theme: ThemeScore }) {
  const group = getThemeGroup(theme);
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-sm font-black ${group.badgeClass}`}>
      {displayThemeName(theme)}
    </span>
  );
}

function averageQuestionScore(theme: ThemeScore) {
  return theme.score / 3;
}

function targetAverageScore(theme: ThemeScore) {
  return theme.target / 3;
}

function pastAverageScore(theme: ThemeScore) {
  return theme.average / 3;
}

function targetGap(theme: ThemeScore) {
  return averageQuestionScore(theme) - targetAverageScore(theme);
}

function pastAverageGap(theme: ThemeScore) {
  return averageQuestionScore(theme) - pastAverageScore(theme);
}

function getReportPriority(theme: ThemeScore) {
  const score = averageQuestionScore(theme);
  const targetDiff = targetGap(theme);
  const averageDiff = pastAverageGap(theme);

  if (score < 2 || targetDiff <= -1 || averageDiff <= -0.75) return "高";
  if (score < 2.5 || targetDiff <= -0.5 || averageDiff <= -0.4) return "中";
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

function ThemeTagList({ themes }: { themes: ThemeScore[] }) {
  if (themes.length === 0) return <span className="text-stone-500">-</span>;

  return (
    <div className="flex flex-wrap gap-2">
      {themes.map((theme) => (
        <ThemeTag key={theme.id} theme={theme} />
      ))}
    </div>
  );
}

function scoreLabel(value: number) {
  return value.toFixed(2);
}

export default function FeedbackReportPage() {
  const params = useParams<{ response_id: string }>();
  const responseId = params.response_id;
  const [response, setResponse] = useState<DiagnosisResponseRow | null>(null);
  const [respondent, setRespondent] = useState<RespondentRow | null>(null);
  const [report, setReport] = useState<FeedbackReportForm>(emptyReport);
  const [usageSettings, setUsageSettings] = useState<UsageSettings>(defaultUsageSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingUsageSettings, setSavingUsageSettings] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const themeGuideUrl = `${process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || ""}/theme-guide`;

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
            created_at,
            is_demo,
            watermark_enabled,
            watermark_text,
            copyright_enabled,
            copyright_text,
            commercial_use_allowed,
            resubmission_allowed,
            usage_purpose
          `)
          .eq("id", responseId)
          .maybeSingle();

        if (responseError) throw responseError;
        if (!responseData) throw new Error("該当する回答データが見つかりません。");

        const typedResponse = responseData as DiagnosisResponseRow;
        setResponse(typedResponse);
        setUsageSettings(usageSettingsFromRow(typedResponse));

        const { data: respondentData, error: respondentError } = await supabase
          .from("respondents")
          .select("company_name,name,email,industry,employee_size,user_type")
          .eq("id", typedResponse.respondent_id)
          .maybeSingle();

        if (respondentError) throw respondentError;
        const typedRespondent = (respondentData as RespondentRow | null) ?? null;
        setRespondent(typedRespondent);

        const { data: reportData, error: reportError } = await supabase
          .from("feedback_reports")
          .select(`
            id,
            response_id,
            one_line_summary,
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
        const draft = generateFeedbackDraft({
          totalScore: typedResponse.total_score,
          achievementRate: typedResponse.achievement_rate,
          themeScores: typedResponse.category_scores_json ?? [],
          topThemes: typedResponse.top_categories_json ?? [],
          priorityThemes: typedResponse.priority_categories_json ?? [],
          employeeSize: typedRespondent?.employee_size
        });

        if (reportData) {
          const savedReport = reportData as FeedbackReportRow;
          setReport(mergeDraftIntoEmptyFields({
            one_line_summary: savedReport.one_line_summary ?? "",
            summary: savedReport.summary ?? "",
            executive_type: savedReport.executive_type ?? "",
            psychological_tendency: savedReport.psychological_tendency ?? "",
            strength: savedReport.strength ?? "",
            gap: savedReport.gap ?? "",
            short_term_action: savedReport.short_term_action ?? "",
            mid_long_term_action: savedReport.mid_long_term_action ?? "",
            advisor_use_case: savedReport.advisor_use_case ?? ""
          }, draft));
        } else {
          setReport(draft);
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
        label: displayThemeName(theme),
        theme: theme.name,
        score: averageQuestionScore(theme),
        target: targetAverageScore(theme),
        average: pastAverageScore(theme)
      })) ?? [],
    [response]
  );

  const sortedTopThemes = useMemo(
    () => [...(response?.category_scores_json ?? [])].sort((a, b) => averageQuestionScore(b) - averageQuestionScore(a)).slice(0, 3),
    [response]
  );

  const sortedPriorityThemes = useMemo(
    () =>
      [...(response?.category_scores_json ?? [])]
        .filter((theme) => getReportPriority(theme) !== "低")
        .sort((a, b) => {
          const rank = { 高: 0, 中: 1, 低: 2 };
          return rank[getReportPriority(a)] - rank[getReportPriority(b)] || targetGap(a) - targetGap(b);
        })
        .slice(0, 5),
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

  async function handleSaveUsageSettings() {
    const supabase = getSupabaseClient();
    if (!supabase || !response) return;

    if (
      response.is_demo &&
      !usageSettings.is_demo &&
      !window.confirm(
        "この診断結果を正式利用へ変更します。\nウォーターマークや利用条件の表示が変更される可能性があります。\nよろしいですか？"
      )
    ) {
      return;
    }

    setSavingUsageSettings(true);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      const nextSettings = {
        is_demo: usageSettings.is_demo,
        watermark_enabled: usageSettings.watermark_enabled,
        watermark_text: usageSettings.watermark_text,
        copyright_enabled: usageSettings.copyright_enabled,
        copyright_text: usageSettings.copyright_text,
        commercial_use_allowed: usageSettings.commercial_use_allowed,
        resubmission_allowed: usageSettings.resubmission_allowed,
        usage_purpose: null,
        updated_at: new Date().toISOString()
      };
      const { data, error } = await supabase
        .from("diagnosis_responses")
        .update(nextSettings)
        .eq("id", response.id)
        .select(
          `
          id,
          respondent_id,
          total_score,
          achievement_rate,
          category_scores_json,
          top_categories_json,
          priority_categories_json,
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
        .maybeSingle();

      if (error) throw error;
      if (data) {
        const typedResponse = data as DiagnosisResponseRow;
        setResponse(typedResponse);
        setUsageSettings(usageSettingsFromRow(typedResponse));
      }
      setStatusMessage("利用設定を保存しました。");
    } catch (error) {
      console.error("Usage settings save failed", error);
      setErrorMessage(formatError(error));
    } finally {
      setSavingUsageSettings(false);
    }
  }

  function updateReport(key: keyof FeedbackReportForm, value: string) {
    setReport((current) => ({ ...current, [key]: value }));
  }

  function updateUsageSetting<K extends keyof UsageSettings>(key: K, value: UsageSettings[K]) {
    setUsageSettings((current) => ({ ...current, [key]: value }));
  }

  function handleRegenerateDraft() {
    if (!response) return;
    if (
      !window.confirm(
        "現在の入力内容を、診断スコアに基づく自動下書きで上書きします。\nよろしいですか？"
      )
    ) {
      return;
    }

    setReport(generateFeedbackDraft({
      totalScore: response.total_score,
      achievementRate: response.achievement_rate,
      themeScores: response.category_scores_json ?? [],
      topThemes: response.top_categories_json ?? [],
      priorityThemes: response.priority_categories_json ?? [],
      employeeSize: respondent?.employee_size
    }));
    setStatusMessage("下書きを再生成しました。保存するとDBに反映されます。");
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
              FB本文は自動下書きを叩き台として、管理者が編集してください。入力内容は右側のプレビューに反映されます。
            </p>
          </div>

          <div className="flex flex-col gap-3 rounded-md border border-blue-100 bg-blue-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-bold leading-7 text-blue-900">
              空欄には診断スコアに基づく自動下書きが入ります。内容を確認・編集してから保存してください。
            </p>
            <button
              className="secondary-button shrink-0"
              onClick={handleRegenerateDraft}
              type="button"
            >
              下書きを再生成
            </button>
          </div>

          <section className="rounded-lg border border-stone-200 bg-stone-50 p-4">
            <div>
              <h3 className="text-lg font-black text-ink">利用設定</h3>
              <p className="mt-1 text-sm font-bold leading-6 text-stone-600">
                デモ表示、ウォーターマーク、著作権表示、営業利用、再受検許可を管理します。
              </p>
            </div>

            <div className="mt-4 grid gap-3 text-sm">
              <label className="block space-y-2">
                <span className="label">利用区分</span>
                <select
                  className="field"
                  value={usageSettings.is_demo ? "demo" : "official"}
                  onChange={(event) => updateUsageSetting("is_demo", event.target.value === "demo")}
                >
                  <option value="demo">デモ利用</option>
                  <option value="official">正式利用</option>
                </select>
              </label>

              <label className="block space-y-2">
                <span className="label">ウォーターマーク</span>
                <select
                  className="field"
                  value={usageSettings.watermark_enabled ? "enabled" : "disabled"}
                  onChange={(event) => updateUsageSetting("watermark_enabled", event.target.value === "enabled")}
                >
                  <option value="enabled">表示する</option>
                  <option value="disabled">表示しない</option>
                </select>
              </label>

              <label className="block space-y-2">
                <span className="label">ウォーターマーク文言</span>
                <input
                  className="field"
                  value={usageSettings.watermark_text}
                  onChange={(event) => updateUsageSetting("watermark_text", event.target.value)}
                />
              </label>

              <label className="block space-y-2">
                <span className="label">著作権表示</span>
                <select
                  className="field"
                  value={usageSettings.copyright_enabled ? "enabled" : "disabled"}
                  onChange={(event) => updateUsageSetting("copyright_enabled", event.target.value === "enabled")}
                >
                  <option value="enabled">表示する</option>
                  <option value="disabled">表示しない</option>
                </select>
              </label>

              <label className="block space-y-2">
                <span className="label">著作権文言</span>
                <input
                  className="field"
                  value={usageSettings.copyright_text}
                  onChange={(event) => updateUsageSetting("copyright_text", event.target.value)}
                />
              </label>

              <label className="block space-y-2">
                <span className="label">営業利用</span>
                <select
                  className="field"
                  value={usageSettings.commercial_use_allowed ? "allowed" : "denied"}
                  onChange={(event) => updateUsageSetting("commercial_use_allowed", event.target.value === "allowed")}
                >
                  <option value="denied">許可しない</option>
                  <option value="allowed">許可する</option>
                </select>
              </label>

              <label className="block space-y-2">
                <span className="label">再受検</span>
                <select
                  className="field"
                  value={usageSettings.resubmission_allowed ? "allowed" : "denied"}
                  onChange={(event) => updateUsageSetting("resubmission_allowed", event.target.value === "allowed")}
                >
                  <option value="denied">許可しない</option>
                  <option value="allowed">1回許可する</option>
                </select>
              </label>

            </div>

            <button
              className="secondary-button mt-4 w-full"
              disabled={savingUsageSettings}
              onClick={handleSaveUsageSettings}
              type="button"
            >
              {savingUsageSettings ? "保存中..." : "利用設定を保存"}
            </button>
          </section>

          <label className="block space-y-2">
            <span className="label">レポートサマリ</span>
            <textarea
              className="field min-h-28 resize-y"
              placeholder="このレポートで最初に伝えたい全体傾向を入力してください。"
              value={report.one_line_summary}
              onChange={(event) => updateReport("one_line_summary", event.target.value)}
            />
          </label>

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
                ["従業員規模", respondent?.employee_size || "-"],
                ["回答日時", formatDate(response.created_at)]
              ].map(([label, value]) => (
                <div key={label} className="rounded-md bg-stone-50 p-3">
                  <dt className="font-bold text-stone-500">{label}</dt>
                  <dd className="mt-1 font-black text-ink">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="mt-6 break-inside-avoid rounded-lg border border-brand/20 bg-teal-50 p-5">
            <h3 className="text-xl font-black text-teal-950">レポートサマリ</h3>
            <p className="mt-3 whitespace-pre-wrap text-base font-bold leading-8 text-teal-900">
              {multilineText(report.one_line_summary)}
            </p>
          </section>

          <section className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="break-inside-avoid rounded-lg bg-teal-50 p-4">
              <h3 className="font-black text-teal-950">高スコアテーマ</h3>
              <p className="mt-2 text-sm font-bold leading-6 text-teal-900">
                回答結果の中で相対的に強みとして表れているテーマです。
              </p>
              <div className="mt-3">
                <ThemeTagList themes={sortedTopThemes} />
              </div>
            </div>
            <div className="break-inside-avoid rounded-lg bg-amber-50 p-4">
              <h3 className="font-black text-amber-950">優先確認テーマ</h3>
              <p className="mt-2 text-sm font-bold leading-6 text-amber-900">
                次に整理すると打ち手につながりやすいテーマです。
              </p>
              <div className="mt-3">
                <ThemeTagList themes={sortedPriorityThemes.length > 0 ? sortedPriorityThemes : response.priority_categories_json} />
              </div>
            </div>
          </section>

          <section className="report-chart-section mt-6 break-inside-avoid rounded-lg border border-stone-200 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h3 className="text-xl font-black text-ink">16テーマ別レーダーチャート</h3>
                <p className="mt-1 text-sm leading-6 text-stone-600">
                  レーダーチャートでは、16テーマの実スコア・目標値・過去平均値を比較できます。
                </p>
              </div>
              <div className="rounded-lg border border-stone-200 p-4">
                <p className="text-sm font-bold text-stone-600">総合スコア</p>
                <p className="mt-1 text-3xl font-black text-ink">
                  {response.total_score}
                  <span className="text-base text-stone-500"> / 192点</span>
                </p>
                <p className="mt-1 text-sm font-bold text-brand">達成率：{response.achievement_rate}%</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3 text-sm font-bold">
              <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-teal-700" />実スコア：今回の回答結果</span>
              <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-blue-700" />目標値：成長企業の目安スコア</span>
              <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-amber-600" />平均値：過去受検者の平均スコア</span>
            </div>

            <div className="report-chart mt-3 h-80">
              <ResponsiveContainer height="100%" width="100%">
                <RadarChart data={chartData} margin={{ top: 24, right: 42, bottom: 24, left: 42 }}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="label" tick={{ fontSize: 10, fill: "#17212b" }} />
                  <PolarRadiusAxis angle={90} domain={[0, 4]} tickCount={5} tick={{ fontSize: 10 }} />
                  <Radar dataKey="target" fill="#2563eb" fillOpacity={0.08} name="目標値" stroke="#2563eb" />
                  <Radar dataKey="average" fill="#d97706" fillOpacity={0.08} name="平均値" stroke="#d97706" />
                  <Radar dataKey="score" fill="#0f766e" fillOpacity={0.3} name="実スコア" stroke="#0f766e" />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>

          </section>

          <section className="mt-6 break-inside-avoid">
            <h3 className="text-xl font-black text-ink">4つの観点</h3>
            <p className="mt-2 text-sm font-bold leading-6 text-stone-600">
              社長カルテでは、16テーマを以下の4つの観点で整理しています。
            </p>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {themeGroups.map((group) => (
                <div key={group.name} className={`rounded-md border p-3 ${group.badgeClass}`}>
                  <p className="text-sm font-black">{group.name}</p>
                  <p className="mt-1 text-xs font-bold leading-5">{group.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-6">
            <h3 className="text-xl font-black text-ink">16テーマ別スコア表</h3>
            <p className="mt-2 rounded-md bg-stone-50 p-3 text-sm font-bold leading-7 text-stone-700">
              優先度は、実スコアだけでなく、目標値や過去受検者平均との差分を参考に、今後確認すると打ち手につながりやすいテーマを示しています。
            </p>
            <div className="mt-3 overflow-x-auto">
              <table className="report-score-table w-full text-left text-sm">
                <thead className="bg-stone-50 text-stone-600">
                  <tr>
                    <th className="px-3 py-2">テーマ名</th>
                    <th className="px-3 py-2">グループ</th>
                    <th className="px-3 py-2">実スコア</th>
                    <th className="px-3 py-2">目標値</th>
                    <th className="px-3 py-2">過去平均値</th>
                    <th className="px-3 py-2">優先度</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {response.category_scores_json.map((theme) => (
                    <tr key={theme.id}>
                      <td className="px-3 py-2 font-black text-ink">
                        <a className="text-brand underline-offset-2 hover:underline" href={`/theme-guide#theme-guide-${theme.id}`}>
                          {displayThemeName(theme)}
                        </a>
                      </td>
                      <td className="px-3 py-2"><GroupBadge theme={theme} /></td>
                      <td className="px-3 py-2 font-bold">{scoreLabel(averageQuestionScore(theme))}</td>
                      <td className="px-3 py-2">{scoreLabel(targetAverageScore(theme))}</td>
                      <td className="px-3 py-2">{scoreLabel(pastAverageScore(theme))}</td>
                      <td className="px-3 py-2"><PriorityBadge priority={getReportPriority(theme)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 rounded-md border border-stone-200 bg-stone-50 p-3 text-sm font-bold leading-6 text-stone-700">
              <p>各テーマの詳しい見方は、以下をご参照ください。</p>
              <p className="mt-1">
                16テーマの見方：
                <a className="text-brand underline-offset-2 hover:underline" href={themeGuideUrl}>
                  {themeGuideUrl}
                </a>
              </p>
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
