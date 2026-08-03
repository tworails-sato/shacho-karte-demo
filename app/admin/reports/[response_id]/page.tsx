"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  BadgeCheck,
  Building2,
  CircleDollarSign,
  Compass,
  Expand,
  Handshake,
  HeartHandshake,
  Lightbulb,
  ListChecks,
  Network,
  PiggyBank,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Telescope,
  TrendingUp,
  Users,
  UsersRound,
  Workflow,
  Zap,
  type LucideIcon
} from "lucide-react";
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
import {
  getGrowthAbilityThemes,
  getManagementPhase,
  getManagementStyle,
  type ManagementStyleScore
} from "@/lib/management-style";
import { generateDiscussionPointsDraft } from "@/lib/feedback-discussion-templates";
import {
  displayThemeLabel,
  meterPercentFromFive,
  normalizeStyleScoreForMeter,
  splitLines,
  styleVisuals,
  themeVisuals,
  type IconKey
} from "@/lib/report-visuals";
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
  main_management_style_key: string | null;
  sub_management_style_key: string | null;
  management_style_scores: ManagementStyleScore[] | null;
  style_logic_version: string | null;
  management_phase_key: string | null;
  management_phase_label: string | null;
  management_phase_logic_version: string | null;
  management_phase_adjustment_comment: string | null;
  v2_calculated_at: string | null;
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
  annual_revenue_range: string | null;
  founding_years: string | null;
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
  advisor_use_case: "",
  roadmap_3_months: "",
  roadmap_12_months: "",
  feedback_discussion_points: "",
  management_phase_comment: "",
  main_style_comment: "",
  sub_style_comment: "",
  main_style_short_copy: "",
  style_strengths_text: "",
  style_watchouts_text: "",
  style_works_well_text: "",
  phase_people_priorities: "",
  phase_business_priorities: "",
  phase_finance_priorities: "",
  growth_ability_comment: "",
  show_theme_detail_table: false
};

const fields: Array<{ key: keyof FeedbackReportForm; label: string }> = [
  { key: "executive_type", label: "経営者タイプ" },
  { key: "psychological_tendency", label: "経営者の心理的傾向" },
  { key: "strength", label: "強み" },
  { key: "gap", label: "最も強く表れているGAP" },
  { key: "short_term_action", label: "アクションプラン：短期" },
  { key: "mid_long_term_action", label: "アクションプラン：中長期" }
];

const v2ReportFields: Array<{ key: keyof FeedbackReportForm; label: string }> = [
  { key: "main_style_short_copy", label: "メインタイプの一言説明" },
  { key: "main_style_comment", label: "メイン経営スタイルの個別コメント" },
  { key: "sub_style_comment", label: "サブ経営スタイルの補足" },
  { key: "style_strengths_text", label: "強みタグ（1行1項目）" },
  { key: "style_watchouts_text", label: "確認したい観点タグ（1行1項目）" },
  { key: "style_works_well_text", label: "活きる場面タグ（1行1項目）" },
  { key: "management_phase_comment", label: "経営フェーズの個別コメント" },
  { key: "phase_people_priorities", label: "組織・人の優先事項（1行1項目）" },
  { key: "phase_business_priorities", label: "事業・商品の優先事項（1行1項目）" },
  { key: "phase_finance_priorities", label: "お金・投資の優先事項（1行1項目）" },
  { key: "growth_ability_comment", label: "次に伸ばしたい経営能力コメント" }
];

const visibleFields: Array<{ key: keyof FeedbackReportForm; label: string }> = [];
const benchmarkCompanyCountText = "800社超";

const actionPlanFields: Array<{
  key: keyof Pick<FeedbackReportForm, "feedback_discussion_points" | "roadmap_3_months" | "roadmap_12_months">;
  label: string;
  placeholder: string;
}> = [
  {
    key: "feedback_discussion_points",
    label: "論点(何を優先とするか)",
    placeholder: "例：まず◯◯の整理から着手し、次に△△を検討する方向が考えられます"
  },
  {
    key: "roadmap_3_months",
    label: "アクションプラン(3ヶ月)",
    placeholder: "例：3ヶ月以内に〜"
  },
  {
    key: "roadmap_12_months",
    label: "アクションプラン(1年)",
    placeholder: "例：1年後の到達点として〜"
  }
];

const iconMap: Record<IconKey, LucideIcon> = {
  BadgeCheck,
  Building2,
  CircleDollarSign,
  Compass,
  Expand,
  Handshake,
  HeartHandshake,
  Lightbulb,
  ListChecks,
  Network,
  PiggyBank,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Telescope,
  TrendingUp,
  Users,
  UsersRound,
  Workflow,
  Zap
};

function ReportIcon({ iconKey, className = "h-5 w-5" }: { iconKey: IconKey; className?: string }) {
  const Icon = iconMap[iconKey] ?? BadgeCheck;
  return <Icon aria-hidden="true" className={className} strokeWidth={2.2} />;
}

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
  return displayThemeLabel(theme) ?? chartLabels[theme.id] ?? theme.name;
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

function gapLabel(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}`;
}

function GapBadge({ value }: { value: number }) {
  const style =
    value >= 0
      ? "border-teal-200 bg-teal-50 text-teal-800"
      : value <= -0.75
        ? "border-rose-200 bg-rose-50 text-rose-700"
        : "border-amber-200 bg-amber-50 text-amber-700";

  return (
    <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-black ${style}`}>
      {gapLabel(value)}
    </span>
  );
}

function priorityTone(theme: ThemeScore) {
  const score = averageQuestionScore(theme);
  const targetDiff = targetGap(theme);
  const averageDiff = pastAverageGap(theme);

  if (score < 2 || targetDiff <= -1 || averageDiff <= -0.75) return "high";
  if (score < 2.5 || targetDiff <= -0.5 || averageDiff <= -0.4) return "medium";
  return "low";
}

function priorityRowClass(theme: ThemeScore) {
  const tone = priorityTone(theme);
  if (tone === "high") return "bg-rose-50/90";
  if (tone === "medium") return "bg-amber-50/80";
  return "bg-stone-50/40 text-stone-500";
}

function getStyleVisual(styleKey?: string | null) {
  return styleKey && styleKey in styleVisuals
    ? styleVisuals[styleKey as keyof typeof styleVisuals]
    : styleVisuals.strategy;
}

function getOverride(value?: string | null, fallback?: string | null) {
  return value?.trim() || fallback?.trim() || "";
}

function getOverrideList(value?: string | null, fallback?: string[]) {
  const own = splitLines(value);
  return own.length > 0 ? own : fallback ?? [];
}

function CompactText({ value, fallback }: { value?: string | null; fallback?: string | null }) {
  const text = getOverride(value, fallback);
  if (!text) return null;
  return <p className="mt-2 whitespace-pre-wrap text-sm font-bold leading-7 text-stone-700">{text}</p>;
}

function InfoGrid({ respondent, response }: { respondent: RespondentRow | null; response: DiagnosisResponseRow }) {
  const items = [
    ["氏名", respondent?.name],
    ["会社名", respondent?.company_name],
    ["従業員数", respondent?.employee_size],
    ["創業年数", respondent?.founding_years],
    ["会社の年商", respondent?.annual_revenue_range],
    ["診断日", formatDate(response.created_at)]
  ].filter(([, value]) => Boolean(value && String(value).trim()));

  return (
    <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-md bg-stone-50 px-3 py-2">
          <dt className="text-xs font-bold text-stone-500">{label}</dt>
          <dd className="mt-1 font-black text-ink">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function TagList({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {items.slice(0, 3).map((item) => (
        <span key={item} className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-black text-stone-700">
          {item}
        </span>
      ))}
    </div>
  );
}

function PriorityGroupCards({
  people,
  business,
  finance
}: {
  people: string[];
  business: string[];
  finance: string[];
}) {
  const groups = [
    { label: "組織・人", items: people },
    { label: "事業・商品", items: business },
    { label: "お金・投資", items: finance }
  ];

  return (
    <div className="mt-4 grid gap-3 md:grid-cols-3">
      {groups.map((group) => (
        <article key={group.label} className="rounded-lg border border-amber-100 bg-white p-3">
          <h4 className="font-black text-amber-950">{group.label}</h4>
          <ul className="mt-2 space-y-1 text-sm font-bold leading-6 text-stone-700">
            {group.items.slice(0, 3).map((item) => (
              <li key={item}>・{item}</li>
            ))}
          </ul>
        </article>
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
  const [reportSnapshot, setReportSnapshot] = useState<FeedbackReportForm>(emptyReport);
  const [usageSettings, setUsageSettings] = useState<UsageSettings>(defaultUsageSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingUsageSettings, setSavingUsageSettings] = useState(false);
  const [showReportScreen, setShowReportScreen] = useState(false);
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
            main_management_style_key,
            sub_management_style_key,
            management_style_scores,
            style_logic_version,
            management_phase_key,
            management_phase_label,
            management_phase_logic_version,
            management_phase_adjustment_comment,
            v2_calculated_at,
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
          .select("company_name,name,email,industry,employee_size,annual_revenue_range,founding_years,user_type")
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
            management_phase_comment,
            main_style_comment,
            sub_style_comment,
            main_style_short_copy,
            style_strengths_text,
            style_watchouts_text,
            style_works_well_text,
            phase_people_priorities,
            phase_business_priorities,
            phase_finance_priorities,
            growth_ability_comment,
            show_theme_detail_table,
            roadmap_3_months,
            roadmap_12_months,
            feedback_discussion_points,
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
          employeeSize: typedRespondent?.employee_size,
          foundingYears: typedRespondent?.founding_years,
          annualRevenueRange: typedRespondent?.annual_revenue_range
        });

        if (reportData) {
          const savedReport = reportData as FeedbackReportRow;
          const nextReport = mergeDraftIntoEmptyFields({
            one_line_summary: savedReport.one_line_summary ?? "",
            summary: savedReport.summary ?? "",
            executive_type: savedReport.executive_type ?? "",
            psychological_tendency: savedReport.psychological_tendency ?? "",
            strength: savedReport.strength ?? "",
            gap: savedReport.gap ?? "",
            short_term_action: savedReport.short_term_action ?? "",
            mid_long_term_action: savedReport.mid_long_term_action ?? "",
            advisor_use_case: savedReport.advisor_use_case ?? "",
            management_phase_comment: savedReport.management_phase_comment ?? "",
            main_style_comment: savedReport.main_style_comment ?? "",
            sub_style_comment: savedReport.sub_style_comment ?? "",
            main_style_short_copy: savedReport.main_style_short_copy ?? "",
            style_strengths_text: savedReport.style_strengths_text ?? "",
            style_watchouts_text: savedReport.style_watchouts_text ?? "",
            style_works_well_text: savedReport.style_works_well_text ?? "",
            phase_people_priorities: savedReport.phase_people_priorities ?? "",
            phase_business_priorities: savedReport.phase_business_priorities ?? "",
            phase_finance_priorities: savedReport.phase_finance_priorities ?? "",
            growth_ability_comment: savedReport.growth_ability_comment ?? "",
            show_theme_detail_table: savedReport.show_theme_detail_table ?? false,
            roadmap_3_months: savedReport.roadmap_3_months ?? "",
            roadmap_12_months: savedReport.roadmap_12_months ?? "",
            feedback_discussion_points: savedReport.feedback_discussion_points ?? ""
          }, draft);
          setReport(nextReport);
          setReportSnapshot(nextReport);
        } else {
          setReport(draft);
          setReportSnapshot(draft);
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

  const sortedLowThemes = useMemo(
    () => [...(response?.category_scores_json ?? [])].sort((a, b) => averageQuestionScore(a) - averageQuestionScore(b)).slice(0, 3),
    [response]
  );

  const mainManagementStyle = getManagementStyle(response?.main_management_style_key);
  const subManagementStyle = getManagementStyle(response?.sub_management_style_key);
  const phaseInfo = response?.management_phase_key
    ? getManagementPhase(respondent?.employee_size, respondent?.annual_revenue_range, respondent?.founding_years)
    : null;
  const growthAbilityThemes = getGrowthAbilityThemes(response?.category_scores_json ?? []);
  const hasV2Beta = Boolean(response?.style_logic_version);
  const styleScores = useMemo(
    () => [...(response?.management_style_scores ?? [])].sort((a, b) => b.score - a.score || a.displayOrder - b.displayOrder),
    [response]
  );
  const mainStyleBasisThemes = useMemo(() => {
    if (!mainManagementStyle || !response) return [];
    return mainManagementStyle.themeIds
      .map((themeId) => response.category_scores_json.find((theme) => theme.id === themeId))
      .filter((theme): theme is ThemeScore => Boolean(theme))
      .sort((a, b) => averageQuestionScore(b) - averageQuestionScore(a))
      .slice(0, 3);
  }, [mainManagementStyle, response]);
  const mainStyleVisual = getStyleVisual(mainManagementStyle?.key);
  const subStyleVisual = getStyleVisual(subManagementStyle?.key);
  const phasePeoplePriorities = getOverrideList(report.phase_people_priorities, phaseInfo?.priorityGroups.people);
  const phaseBusinessPriorities = getOverrideList(report.phase_business_priorities, phaseInfo?.priorityGroups.business);
  const phaseFinancePriorities = getOverrideList(report.phase_finance_priorities, phaseInfo?.priorityGroups.finance);

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
      setReportSnapshot(report);
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

  function updateReport<K extends keyof FeedbackReportForm>(key: K, value: FeedbackReportForm[K]) {
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
      employeeSize: respondent?.employee_size,
      foundingYears: respondent?.founding_years,
      annualRevenueRange: respondent?.annual_revenue_range
    }));
    setStatusMessage("下書きを再生成しました。保存するとDBに反映されます。");
  }

  function handleResetReport() {
    if (!window.confirm("入力中の内容を、最後に読み込んだ状態へ戻します。よろしいですか？")) {
      return;
    }

    setReport(reportSnapshot);
    setStatusMessage("入力内容を元に戻しました。");
    setErrorMessage(null);
  }

  function handleApplyDiscussionDraft() {
    if (!response) return;
    const draft = generateDiscussionPointsDraft({
      growthThemes: growthAbilityThemes,
      mainStyle: mainManagementStyle,
      phase: phaseInfo
    });

    if (
      (report.feedback_discussion_points ?? "").trim() &&
      !window.confirm("現在の論点メモを、自動生成案で上書きしますか？")
    ) {
      return;
    }

    updateReport("feedback_discussion_points", draft);
    setStatusMessage("FB面談で確認したい論点の自動生成案を反映しました。保存するとDBへ反映されます。");
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
          {showReportScreen ? (
            <>
              <button className="secondary-button" onClick={() => setShowReportScreen(false)} type="button">
                編集に戻る
              </button>
              <button className="secondary-button" onClick={() => window.print()} type="button">
                印刷する
              </button>
            </>
          ) : (
            <button className="secondary-button" onClick={() => setShowReportScreen(true)} type="button">
              レポート画面で確認
            </button>
          )}
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

      <div className={showReportScreen ? "grid gap-5" : "grid gap-5 xl:grid-cols-[0.9fr_1.1fr]"}>
        {!showReportScreen ? (
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

          {visibleFields.map((field) => (
            <label key={field.key} className="block space-y-2">
              <span className="label">{field.label}</span>
              <textarea
                className="field min-h-28 resize-y"
                value={(report[field.key] as string | undefined) ?? ""}
                onChange={(event) => updateReport(field.key, event.target.value as FeedbackReportForm[typeof field.key])}
              />
            </label>
          ))}

          <section className="rounded-lg border border-teal-100 bg-teal-50 p-4">
            <p className="text-sm font-black text-teal-800">V2β 追加項目</p>
            <div className="mt-3 flex flex-col gap-2 rounded-md border border-teal-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-bold leading-6 text-teal-900">
                FB面談で確認したい論点は、スコア傾向から下書きを作成できます。反映後に編集して保存してください。
              </p>
              <button className="secondary-button shrink-0" onClick={handleApplyDiscussionDraft} type="button">
                自動生成案を反映
              </button>
            </div>
            <div className="mt-4 space-y-4">
              {v2ReportFields.map((field) => (
                <label key={field.key} className="block space-y-2">
                  <span className="label">{field.label}</span>
                  <textarea
                    className="field min-h-28 resize-y bg-white"
                    value={(report[field.key] as string | undefined) ?? ""}
                    onChange={(event) => updateReport(field.key, event.target.value as FeedbackReportForm[typeof field.key])}
                  />
                </label>
              ))}
              <section className="rounded-lg border border-stone-200 bg-white p-4">
                <div>
                  <p className="text-sm font-black text-stone-900">論点・アクションプラン</p>
                  <p className="mt-1 text-xs font-bold leading-5 text-stone-500">
                    レポート末尾に表示される、面談中に一緒に整理するための記入欄です。
                  </p>
                </div>
                <div className="mt-4 space-y-4">
                  {actionPlanFields.map((field) => (
                    <label key={field.key} className="block space-y-2">
                      <span className="label">{field.label}</span>
                      <textarea
                        className="field min-h-24 resize-y bg-white placeholder:text-stone-400"
                        placeholder={field.placeholder}
                        value={(report[field.key] as string | undefined) ?? ""}
                        onChange={(event) => updateReport(field.key, event.target.value as FeedbackReportForm[typeof field.key])}
                      />
                    </label>
                  ))}
                </div>
              </section>
              <label className="flex items-start gap-3 rounded-md border border-teal-200 bg-white p-3 text-sm font-bold text-teal-950">
                <input
                  checked={Boolean(report.show_theme_detail_table)}
                  className="mt-1 h-4 w-4"
                  onChange={(event) => updateReport("show_theme_detail_table", event.target.checked)}
                  type="checkbox"
                />
                <span>
                  16テーマ詳細を表示する
                  <span className="mt-1 block text-xs leading-5 text-stone-600">
                    通常のFBレポート/PDFでは非表示です。詳細版として必要な場合のみ表示します。
                  </span>
                </span>
              </label>
            </div>
          </section>

          <button className="primary-button w-full" disabled={saving} type="submit">
            {saving ? "保存中..." : "FBレポートを保存"}
          </button>
          <button
            className="secondary-button w-full"
            disabled={saving}
            onClick={handleResetReport}
            type="button"
          >
            元に戻す（仮）
          </button>
        </form>
        ) : null}

        <section className={`report-preview rounded-lg bg-white p-6 shadow-soft ${showReportScreen ? "mx-auto w-full max-w-5xl" : ""}`}>
          <div className="border-b border-stone-200 pb-5">
            <p className="text-sm font-bold text-brand">SHACHO KARTE LIGHT</p>
            <h2 className="mt-2 text-3xl font-black leading-tight text-ink">
              社長カルテLight フィードバックレポート
            </h2>
            <p className="mt-2 text-sm font-bold leading-6 text-stone-600">
              社長カルテLightは、経営者との対話を始めるために作られた診断です。全国{benchmarkCompanyCountText}の成長企業データを基準に、貴社の現在地を可視化します。このレポートは、面談で確認したい論点と次のアクションを整理するための資料です。
            </p>
          </div>

          <section className="mt-5">
            <h3 className="text-lg font-black text-ink">基本情報</h3>
            <InfoGrid respondent={respondent} response={response} />
          </section>

          <section className="mt-5 break-inside-avoid rounded-xl border border-brand/20 bg-teal-50 p-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-700">Summary</p>
            <h3 className="mt-1 text-xl font-black text-teal-950">現在地・サマリ</h3>
            <p className="mt-3 whitespace-pre-wrap text-base font-bold leading-8 text-teal-950">
              {multilineText(report.one_line_summary || report.summary)}
            </p>
          </section>

          <section className="mt-5 break-inside-avoid rounded-xl border border-indigo-100 bg-indigo-50 p-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-700">Management Style</p>
            <h3 className="mt-1 text-xl font-black text-indigo-950">現在の経営スタイル</h3>
            {hasV2Beta ? (
              <div className="mt-4 grid gap-4 md:grid-cols-[1.35fr_0.65fr]">
                <article className={`rounded-2xl border p-5 ${mainStyleVisual.accentClass}`}>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <div className="inline-flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/85 shadow-sm">
                      <ReportIcon iconKey={mainStyleVisual.iconKey} className="h-11 w-11" />
                    </div>
                    <div>
                      <p className="text-xs font-black">メインスタイル</p>
                      <p className="mt-1 text-3xl font-black leading-tight">{mainManagementStyle?.name ?? "未判定"}</p>
                      <p className="mt-3 text-lg font-black leading-7">
                        {getOverride(report.main_style_short_copy, mainManagementStyle?.shortCopy)}
                      </p>
                      <CompactText value={report.main_style_comment} fallback={mainManagementStyle?.description} />
                    </div>
                  </div>
                </article>

                <article className={`rounded-xl border p-4 ${subStyleVisual.accentClass}`}>
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-white/80 p-3">
                      <ReportIcon iconKey={subStyleVisual.iconKey} className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-black">次に強く表れているスタイル</p>
                      <p className="mt-1 text-lg font-black leading-snug">{subManagementStyle?.name ?? "未判定"}</p>
                    </div>
                  </div>
                  <CompactText value={report.sub_style_comment} fallback={subManagementStyle?.description} />
                </article>
              </div>
            ) : (
              <p className="mt-3 rounded-lg bg-white p-4 text-sm font-bold leading-7 text-stone-700">
                この受検結果は旧バージョンのため、経営スタイルは未判定です。
              </p>
            )}

            {mainManagementStyle ? (
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <article className="rounded-lg bg-white p-3">
                  <p className="text-xs font-black text-stone-500">強みとして出やすい観点</p>
                  <TagList items={getOverrideList(report.style_strengths_text, mainManagementStyle.strengths)} />
                </article>
                <article className="rounded-lg bg-white p-3">
                  <p className="text-xs font-black text-stone-500">確認したい観点</p>
                  <TagList items={getOverrideList(report.style_watchouts_text, mainManagementStyle.watchouts)} />
                </article>
                <article className="rounded-lg bg-white p-3">
                  <p className="text-xs font-black text-stone-500">活きる場面</p>
                  <TagList items={getOverrideList(report.style_works_well_text, mainManagementStyle.worksWellWhen)} />
                </article>
              </div>
            ) : null}
          </section>

          <section className="mt-5 break-inside-avoid rounded-xl border border-stone-200 p-5">
            <h3 className="text-xl font-black text-ink">7タイプスコア</h3>
            <p className="mt-1 text-sm font-bold leading-6 text-stone-600">
              7つの経営スタイルを、16テーマの回答傾向からメーター形式で表示しています。
            </p>
            <div className="mt-4 space-y-3">
              {styleScores.map((styleScore, index) => {
                const visual = getStyleVisual(styleScore.key);
                const styleDefinition = getManagementStyle(styleScore.key);
                const displayScore = normalizeStyleScoreForMeter(styleScore.score);
                return (
                  <div key={styleScore.key} className="rounded-lg border border-stone-200 bg-white p-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className={`rounded-full border p-2 ${visual.accentClass}`}>
                          <ReportIcon iconKey={visual.iconKey} className="h-5 w-5" />
                        </span>
                        <div>
                          <p className="font-black text-ink">{styleScore.name}</p>
                          <p className="mt-1 text-xs font-bold leading-5 text-stone-500">
                            {styleDefinition?.shortCopy ?? styleDefinition?.description ?? ""}
                          </p>
                          <div className="mt-1 flex gap-1">
                            {index === 0 ? <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-black text-indigo-800">メイン</span> : null}
                            {index === 1 ? <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-black text-stone-700">サブ</span> : null}
                          </div>
                        </div>
                      </div>
                      <p className="text-lg font-black text-ink">{displayScore.toFixed(1)}</p>
                    </div>
                    <div className="mt-3 h-2.5 rounded-full bg-stone-100">
                      <div className={`h-2.5 rounded-full ${visual.meterClass}`} style={{ width: meterPercentFromFive(displayScore) }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="mt-5 break-inside-avoid rounded-xl border border-blue-100 bg-blue-50 p-5">
            <h3 className="text-xl font-black text-blue-950">判定根拠</h3>
            <p className="mt-2 text-sm font-bold leading-7 text-blue-950">
              以下のテーマが相対的に強く表れているため、この経営スタイルと判定されています。
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {mainStyleBasisThemes.map((theme) => {
                const visual = themeVisuals[theme.id];
                const score = averageQuestionScore(theme);
                return (
                  <article key={theme.id} className="rounded-lg bg-white p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {visual ? <ReportIcon iconKey={visual.iconKey} className="h-5 w-5 text-blue-800" /> : null}
                        <p className="font-black text-ink">{displayThemeName(theme)}</p>
                      </div>
                      <p className="font-black text-blue-900">{scoreLabel(score)}</p>
                    </div>
                    <p className="mt-1 text-xs font-bold text-stone-500">
                      過去平均との差分 {gapLabel(pastAverageGap(theme))}
                    </p>
                    <div className="mt-2 h-2 rounded-full bg-blue-100">
                      <div className="h-2 rounded-full bg-blue-700" style={{ width: `${Math.min(100, (score / 4) * 100)}%` }} />
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="mt-5 break-inside-avoid rounded-xl border border-amber-100 bg-amber-50 p-5">
            <h3 className="text-xl font-black text-amber-950">経営フェーズ</h3>
            <p className="mt-2 text-lg font-black text-ink">
              {hasV2Beta ? response.management_phase_label || phaseInfo?.label || "未判定" : "未判定"}
            </p>
            <p className="mt-4 text-sm font-black text-amber-950">現在の状態</p>
            <CompactText value={report.management_phase_comment} fallback={phaseInfo?.status} />
            {(phaseInfo?.adjustmentComment || response.management_phase_adjustment_comment) ? (
              <p className="mt-3 rounded-lg border border-amber-200 bg-white/80 p-3 text-sm font-bold leading-7 text-amber-950">
                {response.management_phase_adjustment_comment || phaseInfo?.adjustmentComment}
              </p>
            ) : null}
            <div className="mt-5">
              <h4 className="text-base font-black text-amber-950">このフェーズで優先したいこと</h4>
              <PriorityGroupCards
                business={phaseBusinessPriorities}
                finance={phaseFinancePriorities}
                people={phasePeoplePriorities}
              />
            </div>
          </section>

          <section className="mt-5 break-inside-avoid rounded-xl border border-purple-100 bg-purple-50 p-5">
            <h3 className="text-xl font-black text-purple-950">次に伸ばしたい経営能力</h3>
            <CompactText
              value={report.growth_ability_comment}
              fallback="今後確認しておきたいテーマを3つに絞って表示しています。スコアの良し悪しではなく、面談で打ち手を整理する入口としてご覧ください。"
            />
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              {growthAbilityThemes.map((theme) => {
                const visual = themeVisuals[theme.id];
                return (
                  <article key={theme.id} className="rounded-lg bg-white p-3">
                    <div className="flex items-center gap-2">
                      {visual ? <ReportIcon iconKey={visual.iconKey} className="h-5 w-5 text-purple-800" /> : null}
                      <p className="font-black text-ink">{displayThemeName(theme)}</p>
                    </div>
                    <p className="mt-2 text-sm font-bold text-purple-900">
                      自社 {scoreLabel(averageQuestionScore(theme))} / 平均差分 {gapLabel(pastAverageGap(theme))}
                    </p>
                    <span className="mt-2 inline-flex rounded-full bg-purple-100 px-2 py-1 text-xs font-black text-purple-800">
                      FBで確認
                    </span>
                  </article>
                );
              })}
            </div>
          </section>

          {false && report.feedback_discussion_points?.trim() ? (
            <section className="mt-5 break-inside-avoid rounded-xl border border-rose-100 bg-rose-50 p-5">
              <h3 className="text-xl font-black text-rose-950">FB面談で確認したい論点</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm font-bold leading-7 text-rose-950">
                {report.feedback_discussion_points}
              </p>
            </section>
          ) : null}

          <section className="hidden mt-5 break-inside-avoid rounded-lg border border-brand/20 bg-teal-50 p-5">
            <h3 className="text-xl font-black text-teal-950">サマリ</h3>
            <p className="mt-3 whitespace-pre-wrap text-base font-bold leading-8 text-teal-900">
              {multilineText(report.one_line_summary || report.summary)}
            </p>
          </section>

          <section className="hidden mt-5 break-inside-avoid rounded-lg border border-indigo-100 bg-indigo-50 p-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-700">V2 Beta</p>
            <h3 className="mt-1 text-xl font-black text-indigo-950">現在の経営スタイル</h3>
            {hasV2Beta ? (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <article className="rounded-lg bg-white p-4 shadow-sm">
                  <p className="text-xs font-black text-indigo-600">最も強く表れている経営スタイル</p>
                  <p className="mt-2 text-lg font-black text-ink">
                    {mainManagementStyle ? `${mainManagementStyle.icon} ${mainManagementStyle.name}` : "未判定"}
                  </p>
                  <p className="mt-2 text-sm font-bold leading-7 text-stone-700">
                    {mainManagementStyle?.description ?? "保存済みのスタイル情報がありません。"}
                  </p>
                </article>
                <article className="rounded-lg bg-white p-4 shadow-sm">
                  <p className="text-xs font-black text-indigo-600">次に強く表れている経営スタイル</p>
                  <p className="mt-2 text-lg font-black text-ink">
                    {subManagementStyle ? `${subManagementStyle.icon} ${subManagementStyle.name}` : "未判定"}
                  </p>
                  <p className="mt-2 text-sm font-bold leading-7 text-stone-700">
                    {subManagementStyle?.description ?? "保存済みのスタイル情報がありません。"}
                  </p>
                </article>
              </div>
            ) : (
              <p className="mt-3 rounded-lg bg-white p-4 text-sm font-bold leading-7 text-stone-700">
                この受検結果は旧バージョンのため、経営スタイルは未判定です。
              </p>
            )}
          </section>

          <section className="hidden mt-5 break-inside-avoid rounded-lg border border-amber-100 bg-amber-50 p-5">
            <h3 className="text-xl font-black text-amber-950">経営フェーズ</h3>
            <p className="mt-2 text-lg font-black text-ink">
              {hasV2Beta ? response.management_phase_label || phaseInfo?.label || "未判定" : "未判定"}
            </p>
            <p className="mt-2 text-sm font-bold leading-7 text-amber-950">
              {hasV2Beta ? phaseInfo?.status ?? "従業員数が未入力のため、経営フェーズは未判定です。" : "この受検結果は旧バージョンのため、経営フェーズは未判定です。"}
            </p>
          </section>

          <section className="hidden mt-5 break-inside-avoid rounded-lg border border-purple-100 bg-purple-50 p-5">
            <h3 className="text-xl font-black text-purple-950">次に伸ばしたい経営能力</h3>
            <p className="mt-2 text-sm font-bold leading-7 text-purple-950">
              現在の診断結果で、相対的に伸びしろが見られるテーマです。最優先課題として断定せず、面談で確認するための材料として扱います。
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {growthAbilityThemes.map((theme) => (
                <span key={theme.id} className="rounded-full border border-purple-200 bg-white px-3 py-1 text-sm font-black text-purple-900">
                  {displayThemeName(theme)} / 平均差分 {pastAverageGap(theme).toFixed(2)}
                </span>
              ))}
            </div>
          </section>

          <section className="hidden mt-5 break-inside-avoid rounded-lg border border-stone-200 p-5">
            <h3 className="text-xl font-black text-ink">3か月・12か月ロードマップ</h3>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <article className="rounded-lg bg-stone-50 p-4">
                <h4 className="font-black text-ink">3か月以内</h4>
                <p className="mt-2 whitespace-pre-wrap text-sm font-bold leading-7 text-stone-700">
                  {multilineText(report.roadmap_3_months || "")}
                </p>
              </article>
              <article className="rounded-lg bg-stone-50 p-4">
                <h4 className="font-black text-ink">12か月以内</h4>
                <p className="mt-2 whitespace-pre-wrap text-sm font-bold leading-7 text-stone-700">
                  {multilineText(report.roadmap_12_months || "")}
                </p>
              </article>
            </div>
          </section>

          <section className="hidden mt-5 break-inside-avoid rounded-lg border border-rose-100 bg-rose-50 p-5">
            <h3 className="text-xl font-black text-rose-950">FB面談で確認したい論点</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm font-bold leading-7 text-rose-950">
              {multilineText(report.feedback_discussion_points || "")}
            </p>
          </section>

          <div className="hidden">
          <section className="mt-5 break-inside-avoid rounded-lg border border-blue-100 bg-blue-50 p-5">
            <h3 className="text-xl font-black text-blue-950">経営者タイプ</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm font-bold leading-7 text-blue-950">
              {multilineText(report.executive_type)}
            </p>
          </section>

          <section className="mt-5 break-inside-avoid rounded-lg border border-stone-200 bg-stone-50 p-5">
            <h3 className="text-xl font-black text-ink">経営者心理</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm font-bold leading-7 text-stone-700">
              {multilineText(report.psychological_tendency)}
            </p>
          </section>

          <section className="mt-5 break-inside-avoid rounded-lg border border-teal-100 bg-teal-50 p-5">
            <h3 className="text-xl font-black text-teal-950">強み</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm font-bold leading-7 text-teal-900">
              {multilineText(report.strength)}
            </p>
          </section>

          <section className="mt-5 break-inside-avoid rounded-xl border-2 border-rose-100 bg-rose-50 p-5">
            <h3 className="text-xl font-black text-rose-950">GAP</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm font-bold leading-7 text-rose-950">
              {multilineText(report.gap)}
            </p>
          </section>

          <section className="mt-5 break-inside-avoid rounded-lg border border-stone-200 p-5">
            <h3 className="text-xl font-black text-ink">アクションプラン</h3>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <article className="rounded-lg bg-stone-50 p-4">
                <h4 className="font-black text-ink">短期</h4>
                <p className="mt-2 whitespace-pre-wrap text-sm font-bold leading-7 text-stone-700">
                  {multilineText(report.short_term_action)}
                </p>
              </article>
              <article className="rounded-lg bg-stone-50 p-4">
                <h4 className="font-black text-ink">中長期</h4>
                <p className="mt-2 whitespace-pre-wrap text-sm font-bold leading-7 text-stone-700">
                  {multilineText(report.mid_long_term_action)}
                </p>
              </article>
            </div>
          </section>

          </div>

          <section className="report-chart-section mt-6 break-inside-avoid rounded-lg border border-stone-200 p-4">
            <div>
              <h3 className="text-xl font-black text-ink">レーダーチャート</h3>
              <p className="mt-1 text-sm leading-6 text-stone-600">
                16テーマの実スコア・目標値・過去平均値を比較しています。
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-3 text-sm font-bold">
              <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-teal-700" />実スコア</span>
              <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-blue-700" />目標値</span>
              <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-amber-600" />過去平均値</span>
            </div>
            <div className="report-chart mt-3 h-96">
              <ResponsiveContainer height="100%" width="100%">
                <RadarChart data={chartData} margin={{ top: 28, right: 48, bottom: 28, left: 48 }}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="label" tick={{ fontSize: 10, fill: "#17212b" }} />
                  <PolarRadiusAxis angle={90} domain={[0, 4]} tickCount={5} tick={{ fontSize: 10 }} />
                  <Radar dataKey="target" fill="#2563eb" fillOpacity={0.08} name="目標値" stroke="#2563eb" />
                  <Radar dataKey="average" fill="#d97706" fillOpacity={0.08} name="過去平均値" stroke="#d97706" />
                  <Radar dataKey="score" fill="#0f766e" fillOpacity={0.3} name="実スコア" stroke="#0f766e" />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="break-inside-avoid rounded-lg bg-teal-50 p-4">
              <h3 className="font-black text-teal-950">高スコア</h3>
              <div className="mt-3">
                <ThemeTagList themes={sortedTopThemes} />
              </div>
            </div>
            <div className="break-inside-avoid rounded-lg bg-amber-50 p-4">
              <h3 className="font-black text-amber-950">確認したいテーマ</h3>
              <div className="mt-3">
                <ThemeTagList themes={(sortedPriorityThemes.length > 0 ? sortedPriorityThemes : sortedLowThemes).slice(0, 3)} />
              </div>
            </div>
          </section>

          {report.show_theme_detail_table ? (
          <section className="mt-6">
            <h3 className="text-xl font-black text-ink">16スコア表</h3>
            <div className="mt-3 overflow-x-auto">
              <table className="report-score-table w-full text-left text-sm">
                <thead className="bg-stone-100 text-stone-700">
                  <tr>
                    <th className="px-3 py-2">テーマ名</th>
                    <th className="px-3 py-2">グループ</th>
                    <th className="px-3 py-2">実スコア</th>
                    <th className="px-3 py-2">目標値</th>
                    <th className="px-3 py-2">過去平均値</th>
                    <th className="px-3 py-2">目標差分</th>
                    <th className="px-3 py-2">平均との差分</th>
                    <th className="px-3 py-2">優先度</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {response.category_scores_json.map((theme) => (
                    <tr key={theme.id} className={priorityRowClass(theme)}>
                      <td className="px-3 py-2 font-black text-ink">{displayThemeName(theme)}</td>
                      <td className="px-3 py-2"><GroupBadge theme={theme} /></td>
                      <td className="px-3 py-2 font-bold">{scoreLabel(averageQuestionScore(theme))}</td>
                      <td className="px-3 py-2">{scoreLabel(targetAverageScore(theme))}</td>
                      <td className="px-3 py-2">{scoreLabel(pastAverageScore(theme))}</td>
                      <td className="px-3 py-2"><GapBadge value={targetGap(theme)} /></td>
                      <td className="px-3 py-2"><GapBadge value={pastAverageGap(theme)} /></td>
                      <td className="px-3 py-2"><PriorityBadge priority={getReportPriority(theme)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          ) : null}

          <section className="mt-6 break-inside-avoid rounded-xl border border-stone-200 bg-stone-50 p-5">
            <h3 className="text-xl font-black text-ink">論点・アクションプラン</h3>
            <p className="mt-1 text-xs font-bold leading-5 text-stone-500">
              ※このセクションは面談を通じて一緒に整理します
            </p>
            <div className="mt-4 space-y-3">
              {actionPlanFields.map((field) => {
                const value = String(report[field.key] ?? "").trim();
                return (
                  <div key={field.key} className="rounded-lg border border-stone-200 bg-white p-4">
                    <p className="text-sm font-black text-stone-900">{field.label}</p>
                    <p className={`mt-2 min-h-12 whitespace-pre-wrap text-sm font-bold leading-7 ${value ? "text-stone-800" : "text-stone-400"}`}>
                      {multilineText(value || field.placeholder)}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          <div className="hidden">

          <section className="mt-5">
            <h3 className="text-lg font-black text-ink">受検者情報</h3>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
              {[
                ["氏名", respondent?.name || "-"],
                ["会社名", respondent?.company_name || "-"],
                ["役職", "未取得"],
                ["従業員数", respondent?.employee_size || "-"],
                ["創業年数", respondent?.founding_years || "-"],
                ["会社の年商", respondent?.annual_revenue_range || "-"],
                ["回答日時", formatDate(response.created_at)]
              ].map(([label, value]) => (
                <div key={label} className="rounded-md bg-stone-50 px-3 py-2">
                  <dt className="text-xs font-bold text-stone-500">{label}</dt>
                  <dd className="mt-1 font-black text-ink">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="mt-5 break-inside-avoid rounded-lg border border-brand/20 bg-teal-50 p-5">
            <h3 className="text-xl font-black text-teal-950">レポートサマリ</h3>
            <p className="mt-3 whitespace-pre-wrap text-base font-bold leading-8 text-teal-900">
              {multilineText(report.one_line_summary)}
            </p>
          </section>

          <section className="mt-5 break-inside-avoid rounded-xl border-2 border-rose-100 bg-rose-50 p-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-rose-700">Meeting Focus</p>
            <h3 className="mt-1 text-2xl font-black text-rose-950">最も強く表れているGAP</h3>
            <p className="mt-3 whitespace-pre-wrap text-base font-bold leading-8 text-rose-950">
              {multilineText(report.gap)}
            </p>
          </section>

          <section className="mt-5 grid gap-4 md:grid-cols-2">
            <article className="break-inside-avoid rounded-lg border border-teal-100 bg-teal-50 p-4">
              <h3 className="text-lg font-black text-teal-950">強み</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm font-bold leading-7 text-teal-900">
                {multilineText(report.strength)}
              </p>
            </article>
            <article className="break-inside-avoid rounded-lg border border-blue-100 bg-blue-50 p-4">
              <h3 className="text-lg font-black text-blue-950">経営者タイプ</h3>
              <p className="mt-1 text-xs font-bold leading-5 text-blue-700">
                断定ではなく、面談で確認したい仮分類です。
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm font-bold leading-7 text-blue-950">
                {multilineText(report.executive_type)}
              </p>
            </article>
          </section>

          <section className="mt-6 break-before-page space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <article className="break-inside-avoid rounded-lg border border-stone-200 p-4">
                <h3 className="text-lg font-black text-ink">アクションプラン：短期</h3>
                <p className="mt-2 whitespace-pre-wrap text-sm font-bold leading-7 text-stone-700">
                  {multilineText(report.short_term_action)}
                </p>
              </article>
              <article className="break-inside-avoid rounded-lg border border-stone-200 p-4">
                <h3 className="text-lg font-black text-ink">アクションプラン：中長期</h3>
                <p className="mt-2 whitespace-pre-wrap text-sm font-bold leading-7 text-stone-700">
                  {multilineText(report.mid_long_term_action)}
                </p>
              </article>
            </div>
            <article className="break-inside-avoid rounded-lg border border-stone-200 bg-stone-50 p-4">
              <h3 className="text-lg font-black text-ink">経営者の心理的傾向</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm font-bold leading-7 text-stone-700">
                {multilineText(report.psychological_tendency)}
              </p>
            </article>
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

          <section className="report-chart-section mt-6 break-before-page break-inside-avoid rounded-lg border border-stone-200 p-4">
            <div>
              <h3 className="text-xl font-black text-ink">16テーマ別レーダーチャート</h3>
              <p className="mt-1 text-sm leading-6 text-stone-600">
                16テーマの実スコア・目標値・過去平均値を比較しています。
              </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-3 text-sm font-bold">
              <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-teal-700" />実スコア：今回の回答結果</span>
              <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-blue-700" />目標値：成長企業の目安スコア</span>
              <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-amber-600" />平均値：過去受検者の平均スコア</span>
            </div>

            <div className="report-chart mt-3 h-96">
              <ResponsiveContainer height="100%" width="100%">
                <RadarChart data={chartData} margin={{ top: 28, right: 48, bottom: 28, left: 48 }}>
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

          <section className="mt-6">
            <h3 className="text-xl font-black text-ink">16テーマ別スコア表</h3>
            <p className="mt-2 rounded-md bg-stone-50 p-3 text-sm font-bold leading-7 text-stone-700">
              優先度は、実スコアだけでなく、目標値や過去受検者平均との差分を参考に、今後確認すると打ち手につながりやすいテーマを示しています。
            </p>
            <div className="mt-3 overflow-x-auto">
              <table className="report-score-table w-full text-left text-sm">
                <thead className="bg-stone-100 text-stone-700">
                  <tr>
                    <th className="px-3 py-2">テーマ名</th>
                    <th className="px-3 py-2">グループ</th>
                    <th className="px-3 py-2">実スコア</th>
                    <th className="px-3 py-2">目標値</th>
                    <th className="px-3 py-2">過去平均値</th>
                    <th className="px-3 py-2">目標差分</th>
                    <th className="px-3 py-2">平均との差分</th>
                    <th className="px-3 py-2">優先度</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {response.category_scores_json.map((theme) => (
                    <tr key={theme.id} className={priorityRowClass(theme)}>
                      <td className="px-3 py-2 font-black text-ink">
                        <a className="text-brand underline-offset-2 hover:underline" href={`/theme-guide#theme-guide-${theme.id}`}>
                          {displayThemeName(theme)}
                        </a>
                      </td>
                      <td className="px-3 py-2"><GroupBadge theme={theme} /></td>
                      <td className="px-3 py-2 font-bold">{scoreLabel(averageQuestionScore(theme))}</td>
                      <td className="px-3 py-2">{scoreLabel(targetAverageScore(theme))}</td>
                      <td className="px-3 py-2">{scoreLabel(pastAverageScore(theme))}</td>
                      <td className="px-3 py-2"><GapBadge value={targetGap(theme)} /></td>
                      <td className="px-3 py-2"><GapBadge value={pastAverageGap(theme)} /></td>
                      <td className="px-3 py-2"><PriorityBadge priority={getReportPriority(theme)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-6 break-inside-avoid rounded-md border border-stone-200 bg-stone-50 p-3 text-sm font-bold leading-6 text-stone-700">
            <p>各テーマの詳しい見方は、以下をご参照ください。</p>
            <p className="mt-1">
              16テーマの見方：
              <a className="text-brand underline-offset-2 hover:underline" href={themeGuideUrl}>
                {themeGuideUrl}
              </a>
            </p>
          </section>

          <section className="mt-6 break-before-page break-inside-avoid">
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
          </div>
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
