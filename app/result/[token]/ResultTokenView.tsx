"use client";

import Link from "next/link";
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
import { ResultCopyright, ResultWatermark } from "@/components/ResultUsageNotice";
import type { UsageSettings } from "@/lib/usage-settings";
import ResultHowToReadCard from "../ResultHowToReadCard";
import ResultUseCases from "../ResultUseCases";
import ThemeGuideAccordion from "../ThemeGuideAccordion";
import EmployeePhaseGuideSection from "../EmployeePhaseGuide";
import { buildPhaseAwareSummary } from "@/lib/employee-phase";

type Respondent = {
  company_name: string | null;
  name: string | null;
  industry: string | null;
  employee_size: string | null;
};

type ResultTokenViewProps = {
  respondent: Respondent | null;
  totalScore: number;
  achievementRate: number;
  createdAt: string;
  expiresAt: string;
  themeScores: ThemeScore[];
  priorityThemes: ThemeScore[];
  timerexUrl: string;
  usageSettings: UsageSettings;
};

export default function ResultTokenView({
  respondent,
  totalScore,
  achievementRate,
  createdAt,
  expiresAt,
  themeScores,
  priorityThemes,
  timerexUrl,
  usageSettings
}: ResultTokenViewProps) {
  const chartData = themeScores.map((theme) => ({
    theme: theme.name,
    score: theme.score,
    target: theme.target
  }));
  const friendlySummary = buildPhaseAwareSummary(
    {
      totalScore,
      achievementRate,
      themeScores,
      judgement: priorityThemes[0]?.priority ?? "低",
      summary: "",
      topThemes: [...themeScores].sort((a, b) => b.score - a.score).slice(0, 3),
      lowThemes: [...themeScores].sort((a, b) => a.score - b.score).slice(0, 3),
      priorityThemes
    },
    respondent?.employee_size
  );

  return (
    <main className="page-shell result-with-watermark space-y-6">
      <ResultWatermark settings={usageSettings} />
      <div>
        <p className="text-sm font-bold text-brand">SHARED RESULT</p>
        <h1 className="mt-2 text-3xl font-black text-ink">社長カルテ アセスメント結果</h1>
        <p className="mt-3 leading-7 text-stone-700">
          この結果URLは診断日より7日間閲覧できます。閲覧期限：
          {new Date(expiresAt).toLocaleString("ja-JP")}
        </p>
      </div>

      <ResultHowToReadCard />

      <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="panel p-5">
          <h2 className="text-xl font-black text-ink">基本情報</h2>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            {[
              ["会社名", respondent?.company_name || "-"],
              ["氏名", respondent?.name || "-"],
              ["業種", respondent?.industry || "-"],
              ["従業員規模", respondent?.employee_size || "-"],
              ["診断日", new Date(createdAt).toLocaleDateString("ja-JP")]
            ].map(([label, value]) => (
              <div key={label} className="rounded-md bg-stone-50 p-3">
                <dt className="font-bold text-stone-500">{label}</dt>
                <dd className="mt-1 font-bold text-stone-800">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="panel p-5">
          <p className="text-sm font-bold text-stone-600">総合スコア</p>
          <p className="mt-2 text-4xl font-black text-ink">
            {totalScore}
            <span className="text-lg text-stone-500"> / 192点</span>
          </p>
          <p className="mt-2 text-sm font-bold text-brand">達成率：{achievementRate}%</p>
        </div>
      </section>

      <section className="panel p-5">
        <h2 className="text-xl font-black text-ink">16テーマのレーダーチャート</h2>
        <div className="mt-4 h-80 w-full sm:h-96">
          <ResponsiveContainer height="100%" width="100%">
            <RadarChart data={chartData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="theme" tick={{ fontSize: 10 }} />
              <PolarRadiusAxis angle={90} domain={[0, 12]} tickCount={5} />
              <Radar dataKey="target" fill="#2563eb" fillOpacity={0.12} name="目標値" stroke="#2563eb" />
              <Radar dataKey="score" fill="#0f766e" fillOpacity={0.35} name="実スコア" stroke="#0f766e" />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="panel overflow-hidden">
        <div className="border-b border-stone-200 p-5">
          <h2 className="text-xl font-black text-ink">16テーマ別スコア表</h2>
          <p className="mt-1 text-sm text-stone-600">
            ※各テーマの詳しい見方は、下部の『16テーマの見方』もあわせてご参照ください。
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-stone-50 text-stone-600">
              <tr>
                <th className="px-4 py-3">テーマ名</th>
                <th className="px-4 py-3">満点</th>
                <th className="px-4 py-3">目標値</th>
                <th className="px-4 py-3">過去受検者の簡易平均</th>
                <th className="px-4 py-3">実スコア</th>
                <th className="px-4 py-3">目標差分</th>
                <th className="px-4 py-3">平均差分</th>
                <th className="px-4 py-3">優先度</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {themeScores.map((theme) => (
                <tr key={theme.id}>
                  <td className="px-4 py-3 font-black text-ink">{theme.name}</td>
                  <td className="px-4 py-3">12</td>
                  <td className="px-4 py-3">{theme.target}</td>
                  <td className="px-4 py-3">{theme.average}</td>
                  <td className="px-4 py-3 font-bold">{theme.score}</td>
                  <td className="px-4 py-3">{theme.gap >= 0 ? "+" : ""}{theme.gap}</td>
                  <td className="px-4 py-3">{theme.averageGap >= 0 ? "+" : ""}{theme.averageGap}</td>
                  <td className="px-4 py-3">{theme.priority}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <ThemeGuideAccordion />

      <section className="panel p-5">
        <h2 className="text-xl font-black text-ink">優先確認テーマ</h2>
        <p className="mt-3 rounded-md bg-stone-50 p-4 text-sm font-bold leading-7 text-stone-700">
          優先確認テーマは、次に整理すると打ち手につながりやすいテーマです。
          スコアだけで良し悪しを判断するのではなく、今後の対話や具体的なアクションを考える入口としてご覧ください。
        </p>
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {priorityThemes.length > 0 ? (
            priorityThemes.map((theme) => (
              <div key={theme.id} className="rounded-md bg-amber-50 p-4">
                <p className="font-black text-amber-950">{theme.name}</p>
                <p className="mt-2 text-sm leading-6 text-amber-900">
                  目標差分 {theme.gap >= 0 ? "+" : ""}{theme.gap} / 平均差分{" "}
                  {theme.averageGap >= 0 ? "+" : ""}{theme.averageGap}
                </p>
              </div>
            ))
          ) : (
            <p className="rounded-md bg-teal-50 p-4 font-bold text-teal-900">
              大きな優先確認テーマはありません。
            </p>
          )}
        </div>
      </section>

      <section className="panel p-5">
        <h2 className="text-xl font-black text-ink">簡易コメント</h2>
        <p className="mt-3 leading-7 text-stone-700">{friendlySummary}</p>
      </section>

      <EmployeePhaseGuideSection employeeSize={respondent?.employee_size} />

      <ResultUseCases />

      <ResultCopyright settings={usageSettings} />

      <section className="panel flex flex-col gap-4 bg-ink p-5 text-white sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-black">結果の活用方法を一緒に整理する</h2>
          <p className="mt-2 leading-7 text-stone-200">
            診断結果は、見るだけでは活用しきれない場合があります。
            <br />
            ご希望の方には、結果の見方に加えて、具体的な活用方法やアクションの方向性をご一緒に整理します。
          </p>
        </div>
        <Link className="primary-button min-h-14 bg-white px-7 py-4 text-base text-ink hover:bg-stone-100" href={timerexUrl}>
          結果の活用方法を相談する
        </Link>
      </section>
    </main>
  );
}
