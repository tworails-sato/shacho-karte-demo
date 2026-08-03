"use client";

import { useState } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip
} from "recharts";
import { ResultCopyright, ResultWatermark } from "@/components/ResultUsageNotice";
import type { ThemeScore } from "@/lib/diagnosis";
import type { UsageSettings } from "@/lib/usage-settings";

type ResultInfo = {
  companyName: string;
  representativeName: string;
  employeeSize?: string | null;
  foundingYears?: string | null;
  annualRevenueRange?: string | null;
  diagnosisDate: string;
};

type ExpectationResultViewProps = {
  info: ResultInfo;
  themeScores: ThemeScore[];
  topThemes: ThemeScore[];
  lowThemes: ThemeScore[];
  priorityThemes?: ThemeScore[];
  usageSettings: UsageSettings;
  supabaseConfigured?: boolean;
  supabaseError?: string | null;
  sharedExpiresAt?: string | null;
  onFeedbackRequest?: () => Promise<void> | void;
};

const growthReasonByThemeId: Record<string, string> = {
  profitability: "売上が伸びるほど、利益構造の確認が次の成長を左右しやすいテーマです。",
  "market-growth": "次の成長余地を見極めるうえで、市場や顧客の変化を確認したいテーマです。",
  scalability: "事業が広がるタイミングで、再現性や仕組み化の差が出やすいテーマです。",
  advantage: "選ばれる理由を明確にすることで、営業や採用の会話にもつながりやすいテーマです。",
  "business-risk": "成長の途中で見落としやすい依存や変化への備えを確認したいテーマです。",
  investment: "次の成長に向けて、人や仕組みへどこまで投資するかを考えるテーマです。",
  functionality: "人数や案件が増えるほど、役割分担や連携の状態が表れやすいテーマです。",
  continuity: "特定の人や取引先に依存しすぎていないかを確認したいテーマです。",
  "social-impact": "自社が届けている価値を言語化することで、共感や採用にもつながるテーマです。",
  branding: "顧客や採用候補者からどう認識されているかを確認したいテーマです。",
  "internal-engagement": "組織が広がるほど、方針への納得感や一体感が重要になりやすいテーマです。",
  "customer-engagement": "継続的に選ばれる状態をつくるうえで、顧客接点を確認したいテーマです。",
  "organization-building": "採用・育成・配置が、次の成長スピードに影響しやすいテーマです。",
  "management-structure": "社長以外でも判断できる体制づくりに関わるテーマです。",
  "decision-making": "組織が成長するタイミングで、次のボトルネックになりやすいテーマです。",
  "business-creation": "既存事業の先を考えるうえで、新しい打ち手の余地を確認したいテーマです。"
};

function ThemeTagList({ themes, tone, showReason = false }: { themes: ThemeScore[]; tone: "strength" | "growth"; showReason?: boolean }) {
  const toneClass =
    tone === "strength"
      ? "border-emerald-200 bg-emerald-50 text-emerald-950"
      : "border-amber-200 bg-amber-50 text-amber-950";

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {themes.map((theme, index) => (
        <div key={theme.id} className={`rounded-2xl border p-5 ${toneClass}`}>
          <p className="text-sm font-black tracking-[0.18em] text-stone-700">TOP {index + 1}</p>
          <p className="mt-2 text-xl font-black leading-snug">{theme.name}</p>
          {showReason ? (
            <p className="mt-3 text-sm font-bold leading-7 text-stone-800">
              {growthReasonByThemeId[theme.id] ?? "今後の成長に向けて、優先順位を確認したいテーマです。"}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function uniqueThemes(themes: ThemeScore[]) {
  const seen = new Set<string>();
  return themes.filter((theme) => {
    if (seen.has(theme.id)) return false;
    seen.add(theme.id);
    return true;
  });
}

export default function ExpectationResultView({
  info,
  themeScores,
  topThemes,
  lowThemes,
  priorityThemes = [],
  usageSettings,
  supabaseConfigured = true,
  supabaseError,
  sharedExpiresAt,
  onFeedbackRequest
}: ExpectationResultViewProps) {
  const [feedbackRequested, setFeedbackRequested] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const strengths =
    topThemes.length > 0
      ? topThemes.slice(0, 3)
      : [...themeScores].sort((a, b) => b.score - a.score).slice(0, 3);
  const growthThemes = uniqueThemes([
    ...priorityThemes,
    ...lowThemes,
    ...[...themeScores].sort((a, b) => a.score - b.score)
  ]).slice(0, 3);
  const chartData = themeScores.map((theme) => ({
    theme: theme.name,
    score: theme.score
  }));

  const strengthNames = strengths.map((theme) => theme.name).join("・");
  const growthNames = growthThemes.map((theme) => theme.name).join("・");
  const currentPositionSummary =
    strengths[0] && growthThemes[0]
      ? `今回の診断では、${strengths[0].name}を中心に強みの形が見えています。一方で、${growthThemes[0].name}は今後の成長を考えるうえで、優先的に確認したいテーマとして表れています。`
      : "今回の診断では、自社の経営テーマの形が見えています。強みとして表れている領域と、次に確認したい領域を分けて見ることが大切です。";
  const unexpectedFinding =
    strengths[0] && growthThemes[0]
      ? `今回の結果では、「${strengths[0].name}」に強みの形が見られる一方で、「${growthThemes[0].name}」は次に確認したいテーマとして表れています。この組み合わせは、現在の経営フェーズや社長の関心によって意味合いが変わります。背景や優先順位については、フィードバック面談で詳しく整理します。`
      : "今回の結果には、強みとして表れているテーマと、次に整理すると前に進みやすいテーマの両方が表れています。";

  async function handleFeedbackRequest() {
    if (feedbackRequested || isSubmittingFeedback) return;
    setFeedbackError(null);
    setIsSubmittingFeedback(true);

    try {
      await onFeedbackRequest?.();
      setFeedbackRequested(true);
    } catch (error) {
      console.error("Feedback request save failed", error);
      setFeedbackError("面談希望の記録に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setIsSubmittingFeedback(false);
    }
  }

  return (
    <main className="page-shell result-with-watermark space-y-6 text-stone-900">
      <ResultWatermark settings={usageSettings} />

      <section className="panel relative z-10 overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 p-6 text-white sm:p-8">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-300 via-emerald-300 to-amber-200" />
        <p className="text-sm font-black tracking-[0.24em] text-teal-100">RESULT PREVIEW</p>
        <h1 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
          診断結果の一部をお届けします
        </h1>
        <p className="mt-4 max-w-3xl text-base font-semibold leading-8 text-slate-100 sm:text-lg">
          この画面では、強みとして表れているテーマと、伸びしろとなるテーマを表示しています。
          詳しい分析、他社長との相対比較、アクションプランは、詳細面談でさせていただきます。
        </p>
        {sharedExpiresAt ? (
          <p className="mt-4 text-sm font-bold text-slate-200">
            閲覧期限：{new Date(sharedExpiresAt).toLocaleString("ja-JP")}
          </p>
        ) : null}
      </section>

      {supabaseError ? (
        <section className="relative z-10 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-bold leading-7 text-rose-900">
          Supabaseへの保存でエラーが発生しました。画面表示とローカル保存は継続しています。
          <br />
          {supabaseError}
        </section>
      ) : null}

      {!supabaseConfigured ? (
        <section className="relative z-10 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-7 text-amber-950">
          Supabase環境変数が未設定です。NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_ANON_KEY を確認してください。
        </section>
      ) : null}

      <section className="panel relative z-10 p-5 sm:p-7">
        <p className="text-sm font-black tracking-[0.18em] text-brand">RADAR PREVIEW</p>
        <h2 className="mt-2 text-3xl font-black text-ink">16テーマ レーダーチャート</h2>
        <p className="mt-2 text-base font-semibold leading-7 text-stone-800">
          48問の回答から、現在の経営テーマの形を表示しています。
        </p>
        <div className="mt-5 h-[32rem] w-full sm:h-[42rem]">
          <ResponsiveContainer height="100%" width="100%">
            <RadarChart cx="50%" cy="50%" data={chartData} margin={{ bottom: 44, left: 52, right: 52, top: 44 }} outerRadius="76%">
              <PolarGrid />
              <PolarAngleAxis dataKey="theme" tick={{ fontSize: 13, fontWeight: 800, fill: "#1c1917" }} />
              <PolarRadiusAxis angle={90} axisLine={false} domain={[0, 12]} tick={false} />
              <Radar dataKey="score" fill="#0f766e" fillOpacity={0.38} name="今回の回答" stroke="#0f766e" strokeWidth={3} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-3 rounded-xl bg-stone-50 p-4 text-sm font-black leading-7 text-stone-700">
          ※過去受検者データとの比較は、フィードバック面談で詳しくご案内します。
        </p>
      </section>

      <section className="panel relative z-10 border-l-4 border-l-teal-500 bg-teal-50 p-5">
        <p className="text-sm font-black tracking-[0.18em] text-teal-700">CURRENT POSITION</p>
        <h2 className="mt-2 text-2xl font-black text-teal-950">あなたの現在地</h2>
        <p className="mt-3 rounded-xl bg-white/90 p-4 text-base font-black leading-8 text-teal-950">
          {currentPositionSummary}
        </p>
      </section>

      <section className="panel relative z-10 p-5">
        <p className="text-sm font-black tracking-[0.18em] text-brand">STRENGTH</p>
        <h2 className="mt-2 text-2xl font-black text-ink">あなたの強み TOP3</h2>
        <p className="mt-2 text-base font-semibold leading-7 text-stone-800">
          回答傾向から、比較的強みとして表れているテーマです。
        </p>
        <div className="mt-5">
          <ThemeTagList themes={strengths} tone="strength" />
        </div>
      </section>

      <section className="panel relative z-10 p-5">
        <p className="text-sm font-black tracking-[0.18em] text-accent">NEXT THEME</p>
        <h2 className="mt-2 text-2xl font-black text-ink">伸びしろ TOP3</h2>
        <p className="mt-2 max-w-3xl text-base font-semibold leading-7 text-stone-800">
          打ち手として優先順位の高いテーマです。良し悪しの評価ではなくご参考としてご覧ください。
        </p>
        <div className="mt-5">
          <ThemeTagList showReason themes={growthThemes} tone="growth" />
        </div>
      </section>

      <section className="panel relative z-10 border-l-4 border-l-teal-500 bg-teal-50 p-5">
        <h2 className="text-2xl font-black text-teal-950">今回の結果から見えた特徴</h2>
        <p className="mt-3 rounded-xl bg-white/90 p-4 text-base font-black leading-8 text-teal-950">
          {unexpectedFinding}
        </p>
        <p className="mt-3 text-base font-semibold leading-8 text-teal-950">
          今回の結果では、{strengthNames || "複数のテーマ"}に強みの芽が見られます。
          一方で、{growthNames || "いくつかのテーマ"}は、次に整理すると前に進みやすいテーマとして表れています。
        </p>
        <p className="mt-3 rounded-xl bg-white/80 p-4 text-base font-black leading-7 text-teal-950">
          ※背景や優先順位は、フィードバック面談にて詳しく整理します。
        </p>
      </section>

      <section className="panel relative z-10 bg-ink p-6 text-white sm:p-7">
        <p className="text-sm font-black tracking-[0.18em] text-teal-100">FEEDBACK</p>
        <h2 className="mt-2 text-2xl font-black">フィードバック面談で分かること</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {[
            "過去受検者データとの比較から、自社の現在地が分かります。",
            "現在の経営フェーズを踏まえ、今優先すべきテーマが分かります。",
            "あなたの経営スタイルと、その強みをどう活かすべきかが分かります。",
            "どこから着手すべきか、具体的な優先順位が分かります。"
          ].map((item, index) => (
            <div key={item} className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <p className="text-sm font-black text-teal-100">0{index + 1}</p>
              <p className="mt-2 text-base font-black leading-8 text-white">{item}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/10 p-5 text-base font-semibold leading-8 text-stone-100">
          <p>今回の診断で分かるのは、</p>
          <p className="my-2 text-xl font-black text-white">「経営課題の入口」</p>
          <p>までです。</p>
          <p className="mt-4">本当に重要なのは、</p>
          <p className="my-2 text-xl font-black text-white">「何を改善するか」ではなく、「何から優先して改善すべきか」</p>
          <p>です。</p>
          <p className="mt-4">
            フィードバック面談では、診断結果をもとに、
            <br />
            あなたの会社に合わせた優先順位を一緒に整理します。
          </p>
        </div>
        <p className="mt-5 text-base font-semibold leading-8 text-stone-100">
          詳細フィードバック面談をご希望の方は、以下よりお申込みください。
          <br />
          後日担当より日程などについて、ご案内させていただきます。（15～30分程度）
        </p>
        <button
          className="mt-6 inline-flex min-h-14 items-center justify-center rounded-full bg-white px-8 py-4 text-base font-black text-ink shadow-lg transition hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={feedbackRequested || isSubmittingFeedback}
          onClick={handleFeedbackRequest}
          type="button"
        >
          {feedbackRequested ? "面談希望を受け付けました" : isSubmittingFeedback ? "送信中..." : "詳細フィードバック面談を申し込む"}
        </button>
        {feedbackError ? (
          <p className="mt-3 rounded-lg bg-rose-50 p-3 text-sm font-bold text-rose-800">{feedbackError}</p>
        ) : null}
        {feedbackRequested ? (
          <p className="mt-3 rounded-lg bg-teal-50 p-3 text-sm font-bold text-teal-950">
            面談希望ありとして記録しました。担当よりご案内いたします。
          </p>
        ) : null}
      </section>

      <ResultCopyright settings={usageSettings} />
    </main>
  );
}
