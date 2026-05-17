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

const steps = [
  "基本情報を入力",
  "設問（全48問）に1〜4点で回答",
  "結果画面で強み・課題を確認",
  "結果に基づいた個別解説（30分）予約"
];

const features = [
  {
    title: "経営課題を16テーマで可視化",
    body: "収益性・成長性・組織・意思決定・経営体制など、経営者の現在地を多面的に整理します。"
  },
  {
    title: "成長度の高い経営者との差分が分かる",
    body: "単なる自己評価ではなく、目標値に対してどこに伸びしろがあるかを確認できます。"
  },
  {
    title: "受検者平均との差分が分かる",
    body: "近しい経営者と比較し、優先して確認すべきテーマを把握できます。"
  }
];

const findings = [
  "強みが出ているテーマ",
  "目標値との差分",
  "過去受検者平均との差分",
  "優先確認テーマ"
];

const sampleChartData = [
  { theme: "収益性", score: 9, target: 9 },
  { theme: "市場成長性", score: 7, target: 8 },
  { theme: "拡張性", score: 6, target: 8 },
  { theme: "優位性", score: 9, target: 8 },
  { theme: "組織", score: 7, target: 9 },
  { theme: "意思決定", score: 8, target: 9 },
  { theme: "経営体制", score: 6, target: 9 },
  { theme: "事業創出", score: 7, target: 8 }
];

const sampleScores = [
  { theme: "収益性", target: 9, average: 7.2, score: 9, priority: "低" },
  { theme: "拡張性", target: 8, average: 6.5, score: 6, priority: "中" },
  { theme: "経営体制構築力", target: 9, average: 6.4, score: 5, priority: "高" },
  { theme: "意思決定力", target: 9, average: 7.3, score: 8, priority: "低" }
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="page-shell flex items-center">
        <div className="grid w-full gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div className="space-y-6">
            <p className="text-sm font-bold text-brand">社長カルテ デモアセスメント</p>
            <h1 className="text-3xl font-black leading-tight text-ink sm:text-5xl">
              社長の現在地を16テーマで見える化する
            </h1>
            <p className="max-w-2xl leading-8 text-stone-700">
              社長カルテは、持続的な成長を遂げる経営者の行動特性をベースに、
              自分の現在地や比較ができる、経営者向けのアセスメントです。
              16つの経営テーマのスコアから、目標値との差分や受検者平均との差分を可視化し、
              次に優先して取り組むべき経営テーマを見える化します。
            </p>
            <Link className="primary-button" href="/basic-info">
              社長カルテのデモアセスメントを始める
            </Link>
          </div>

          <div className="panel p-5 sm:p-6">
            <h2 className="text-xl font-black text-ink">アセスメントフロー</h2>
            <ol className="mt-5 space-y-3">
              {steps.map((step, index) => (
                <li key={step} className="flex gap-3 rounded-md bg-stone-50 p-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm font-black text-brand">
                    {index + 1}
                  </span>
                  <span className="pt-1 font-bold text-stone-800">{step}</span>
                </li>
              ))}
            </ol>
            <p className="mt-4 text-xs font-bold leading-6 text-stone-500">
              各設問は1〜4点満点です。
              「1：あてはまらない 〜 4：あてはまる」で回答してください。
              全問の回答後、総合スコアやアセスメント結果を自動で表示します。
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-6">
          <p className="text-sm font-bold text-brand">特徴</p>
          <h2 className="mt-2 text-3xl font-black text-ink">社長カルテの特徴</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.title} className="panel p-5">
              <h3 className="text-lg font-black text-ink">{feature.title}</h3>
              <p className="mt-3 leading-7 text-stone-700">{feature.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-stone-50">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-12 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <p className="text-sm font-bold text-brand">アセスメントでわかること</p>
            <h2 className="mt-2 text-3xl font-black text-ink">
              他経営者との比較を基に、数ある経営課題の優先度を可視化します。
            </h2>
            <p className="mt-4 leading-8 text-stone-700">
              経営者の自己認識を起点に、強みと確認したいテーマを同じ画面で把握できます。
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {findings.map((item) => (
              <div key={item} className="rounded-lg border border-stone-200 bg-white p-4 font-black text-stone-800 shadow-soft">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-6">
          <p className="text-sm font-bold text-brand">アセスメント結果イメージ</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="panel p-5">
            <h3 className="text-lg font-black text-ink">レーダーチャート</h3>
            <div className="mt-4 h-80">
              <ResponsiveContainer height="100%" width="100%">
                <RadarChart data={sampleChartData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="theme" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 12]} tickCount={5} />
                  <Radar dataKey="target" fill="#d97706" fillOpacity={0.12} name="目標値" stroke="#d97706" />
                  <Radar dataKey="score" fill="#0f766e" fillOpacity={0.35} name="実スコア" stroke="#0f766e" />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="panel overflow-hidden">
            <div className="border-b border-stone-200 p-5">
              <h3 className="text-lg font-black text-ink">スコア表サンプル</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="bg-stone-50 text-stone-600">
                  <tr>
                    <th className="px-4 py-3">テーマ</th>
                    <th className="px-4 py-3">目標</th>
                    <th className="px-4 py-3">平均</th>
                    <th className="px-4 py-3">実スコア</th>
                    <th className="px-4 py-3">優先度</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {sampleScores.map((row) => (
                    <tr key={row.theme}>
                      <td className="px-4 py-3 font-black text-ink">{row.theme}</td>
                      <td className="px-4 py-3">{row.target}</td>
                      <td className="px-4 py-3">{row.average}</td>
                      <td className="px-4 py-3 font-bold">{row.score}</td>
                      <td className="px-4 py-3">{row.priority}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-stone-200 bg-stone-50">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-bold text-brand">経営支援者向けの活用</p>
            <h2 className="mt-2 text-3xl font-black text-ink">経営者との対話の入口として使えます。</h2>
            <p className="mt-4 leading-8 text-stone-700">
              社長カルテは、経営者との最初の接点づくりや、話のきっかけとして活用できます。
              アセスメント結果をもとに、経営者が感じている課題や優先順位を整理し、
              支援者自身のサービスや提案につなげる入口として使えます。
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl font-black text-ink">まずはデモアセスメントで、結果の見え方を確認できます。</h2>
        <p className="mx-auto mt-4 max-w-2xl leading-8 text-stone-700">
          支援先に案内する前の確認用として、スマホからでもそのまま受検できます。
        </p>
        <Link className="primary-button mt-6" href="/basic-info">
          社長カルテのデモアセスメントを始める
        </Link>
      </section>
    </main>
  );
}
