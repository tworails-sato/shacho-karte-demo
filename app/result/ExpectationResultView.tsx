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
import ThemeGuideAccordion from "./ThemeGuideAccordion";

type ResultInfo = {
  companyName: string;
  representativeName: string;
  industry: string;
  employeeSize?: string | null;
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

function ThemeTagList({ themes, tone }: { themes: ThemeScore[]; tone: "strength" | "growth" }) {
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
    score: theme.score,
    average: theme.average
  }));

  const strengthNames = strengths.map((theme) => theme.name).join("・");
  const growthNames = growthThemes.map((theme) => theme.name).join("・");
  const unexpectedFinding =
    strengths[0] && growthThemes[0]
      ? `今回、特に興味深いのは「${strengths[0].name}」が強みとして表れている一方で、「${growthThemes[0].name}」には伸びしろがある、という組み合わせです。強みを活かしながら、このテーマを整理することで、次の打ち手が見えやすくなる可能性があります。`
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

      <section className="panel relative z-10 p-5">
        <h2 className="text-2xl font-black text-ink">基本情報</h2>
        <dl className="mt-4 grid gap-3 text-base sm:grid-cols-2 lg:grid-cols-5">
          {[
            ["会社名", info.companyName],
            ["氏名", info.representativeName],
            ["業種", info.industry || "-"],
            ["規模", info.employeeSize || "-"],
            ["受検日", info.diagnosisDate]
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-stone-50 p-4">
              <dt className="font-black text-stone-700">{label}</dt>
              <dd className="mt-1 font-black text-stone-950">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="panel relative z-10 p-5">
          <p className="text-sm font-black tracking-[0.18em] text-brand">STRENGTH</p>
          <h2 className="mt-2 text-2xl font-black text-ink">あなたの強み TOP3</h2>
          <p className="mt-2 text-base font-semibold leading-7 text-stone-800">
            回答傾向から、比較的強みとして表れているテーマです。
          </p>
          <div className="mt-5">
            <ThemeTagList themes={strengths} tone="strength" />
          </div>
        </div>

        <div className="panel relative z-10 p-5">
          <p className="text-sm font-black tracking-[0.18em] text-brand">RADAR PREVIEW</p>
          <h2 className="mt-2 text-2xl font-black text-ink">強みが表れているテーマ</h2>
          <p className="mt-2 text-base font-semibold leading-7 text-stone-800">
            レーダープレビューでは、強みTOP3と過去受検者の簡易平均を比較しています。
            <br />
            ※16テーマ全体の比較は、フィードバック面談にてご覧いただけます。
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm font-black text-stone-800">
            <span className="rounded-full bg-teal-50 px-3 py-1 text-teal-900">今回の回答傾向</span>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-900">過去受検者の簡易平均</span>
          </div>
          <div className="mt-4 h-[28rem] w-full sm:h-[34rem]">
            <ResponsiveContainer height="100%" width="100%">
              <RadarChart cx="50%" cy="50%" data={chartData} margin={{ bottom: 36, left: 44, right: 44, top: 36 }} outerRadius="70%">
                <PolarGrid />
                <PolarAngleAxis dataKey="theme" tick={{ fontSize: 13, fontWeight: 800, fill: "#1c1917" }} />
                <PolarRadiusAxis angle={90} axisLine={false} domain={[0, 12]} tick={false} />
                <Radar dataKey="average" fill="#d97706" fillOpacity={0.12} name="過去受検者の簡易平均" stroke="#d97706" strokeWidth={2} />
                <Radar dataKey="score" fill="#0f766e" fillOpacity={0.36} name="今回の回答傾向" stroke="#0f766e" strokeWidth={3} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="panel relative z-10 p-5">
        <p className="text-sm font-black tracking-[0.18em] text-accent">NEXT THEME</p>
        <h2 className="mt-2 text-2xl font-black text-ink">伸びしろ TOP3</h2>
        <p className="mt-2 max-w-3xl text-base font-semibold leading-7 text-stone-800">
          打ち手として優先順位の高いテーマです。良し悪しの評価ではなくご参考としてご覧ください。
        </p>
        <div className="mt-5">
          <ThemeTagList themes={growthThemes} tone="growth" />
        </div>
      </section>

      <section className="panel relative z-10 border-l-4 border-l-teal-500 bg-teal-50 p-5">
        <h2 className="text-2xl font-black text-teal-950">今回の結果から見えるヒント／アクション</h2>
        <p className="mt-3 rounded-xl bg-white/90 p-4 text-base font-black leading-8 text-teal-950">
          {unexpectedFinding}
        </p>
        <p className="mt-3 text-base font-semibold leading-8 text-teal-950">
          今回の結果では、{strengthNames || "複数のテーマ"}に強みの芽が見られます。
          一方で、{growthNames || "いくつかのテーマ"}は、次に整理すると前に進みやすいテーマとして表れています。
        </p>
        <p className="mt-3 rounded-xl bg-white/80 p-4 text-base font-black leading-7 text-teal-950">
          ※詳細はフィードバック面談にて解説させていただきます。
        </p>
      </section>

      <section className="panel relative z-10 bg-ink p-6 text-white sm:p-7">
        <p className="text-sm font-black tracking-[0.18em] text-teal-100">FEEDBACK</p>
        <h2 className="mt-2 text-2xl font-black">フィードバック面談のご案内</h2>
        <ul className="mt-4 space-y-3 text-base font-semibold leading-8 text-stone-100">
          <li>・他の社長との相対比較、詳しい分析結果をご覧いただけます。</li>
          <li>・16テーマの中から、特に優先度の高いテーマやアクションまでを整理します。</li>
          <li>・他の事例も含め「どこから着手すべきか」を、具体的なフィードバックをさせていただきます。</li>
        </ul>
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

      <div className="relative z-10 border-t border-stone-200 pt-6">
        <ThemeGuideAccordion />
      </div>

      <ResultCopyright settings={usageSettings} />
    </main>
  );
}
