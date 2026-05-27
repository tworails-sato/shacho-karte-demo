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
  "設問48問に回答",
  "結果画面で強み・課題を確認",
  "個別解説を申し込み"
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
  },
  {
    title: "経営支援者の会話のきっかけになる",
    body: "結果を起点に課題感や優先順位を整理し、支援者自身の提案へつなげやすくなります。"
  }
];

const findings = [
  "強みが出ているテーマ",
  "目標値との差分",
  "過去受検者平均との差分",
  "優先確認テーマ"
];

const supportSteps = [
  {
    title: "支援先へ案内",
    body: "面談前や初回接点で、経営者にアセスメントを案内できます。"
  },
  {
    title: "結果を一緒に解説",
    body: "強み・差分・優先確認テーマを見ながら、課題認識をそろえます。"
  },
  {
    title: "提案へ接続",
    body: "確認したテーマをもとに、自社サービスや支援メニューへ自然につなげます。"
  }
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

function SectionHeading({
  eyebrow,
  title,
  body
}: {
  eyebrow: string;
  title: string;
  body?: string;
}) {
  return (
    <div className="mx-auto mb-8 max-w-3xl text-center">
      <p className="text-sm font-black text-blue-700">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-black leading-tight text-slate-950 sm:text-3xl">
        {title}
      </h2>
      {body ? <p className="mt-4 leading-8 text-slate-600">{body}</p> : null}
    </div>
  );
}

function MiniRadar() {
  return (
    <ResponsiveContainer height="100%" width="100%">
      <RadarChart data={sampleChartData}>
        <PolarGrid stroke="#cbd5e1" />
        <PolarAngleAxis dataKey="theme" tick={{ fontSize: 10, fill: "#475569" }} />
        <PolarRadiusAxis angle={90} domain={[0, 12]} tickCount={4} tick={{ fontSize: 10 }} />
        <Radar dataKey="target" fill="#2563eb" fillOpacity={0.12} name="目標値" stroke="#2563eb" />
        <Radar dataKey="score" fill="#0f766e" fillOpacity={0.3} name="実スコア" stroke="#0f766e" />
        <Tooltip />
      </RadarChart>
    </ResponsiveContainer>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link className="text-sm font-black text-slate-950 sm:text-base" href="/">
            社長カルテ Light
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-bold text-slate-600 md:flex">
            <a className="hover:text-blue-700" href="#features">特徴</a>
            <a className="hover:text-blue-700" href="#findings">アセスメントでわかること</a>
            <a className="hover:text-blue-700" href="#result-image">結果イメージ</a>
          </nav>
          <Link className="rounded-md bg-blue-700 px-4 py-2 text-sm font-black text-white transition hover:bg-blue-800" href="/basic-info">
            診断を始める
          </Link>
        </div>
      </header>

      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:px-8">
          <div className="space-y-6">
            <p className="inline-flex rounded-full border border-blue-200 bg-white px-3 py-1 text-sm font-black text-blue-700">
              経営者専用アセスメント
            </p>
            <h1 className="text-4xl font-black leading-tight text-slate-950 sm:text-5xl">
              社長の現在地を16テーマで見える化する
            </h1>
            <p className="max-w-2xl text-base leading-8 text-slate-700 sm:text-lg">
              経営者の課題感・優先順位・意思決定の傾向を、目標値との差分と過去受検者平均との差分から整理するアセスメントです。
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link className="inline-flex min-h-12 items-center justify-center rounded-md bg-blue-700 px-6 py-3 text-sm font-black text-white shadow-soft transition hover:bg-blue-800" href="/basic-info">
                社長カルテ Lightを始める
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft sm:p-5">
            <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black text-blue-700">RESULT SAMPLE</p>
                <h2 className="mt-1 text-xl font-black text-slate-950">アセスメント結果イメージ</h2>
              </div>
              <div className="rounded-md bg-blue-50 px-4 py-3 text-right">
                <p className="text-xs font-bold text-slate-500">総合スコア例</p>
                <p className="text-2xl font-black text-blue-800">119 / 192点</p>
              </div>
            </div>
            <div className="h-72 py-4">
              <MiniRadar />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-md bg-slate-50 p-4">
                <p className="text-xs font-bold text-slate-500">優先確認テーマ例</p>
                <p className="mt-1 font-black text-slate-950">経営体制構築力</p>
              </div>
              <div className="rounded-md bg-slate-50 p-4">
                <p className="text-xs font-bold text-slate-500">確認ポイント</p>
                <p className="mt-1 font-black text-slate-950">目標差分 -4</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <SectionHeading
          eyebrow="FLOW"
          title="アセスメントフロー"
          body="スマホからでも回答しやすい、シンプルな4ステップです。"
        />
        <div className="grid gap-4 md:grid-cols-4">
          {steps.map((step, index) => (
            <div key={step} className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-700 text-sm font-black text-white">
                {index + 1}
              </span>
              <p className="mt-4 font-black leading-7 text-slate-900">{step}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <SectionHeading
            eyebrow="FEATURE"
            title="社長カルテの特徴"
            body="経営者の自己認識だけで終わらせず、目標値や過去受検者との差分から次の論点を見つけます。"
          />
          <div className="grid gap-4 lg:grid-cols-4">
            {features.map((feature) => (
              <article key={feature.title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
                <h3 className="text-lg font-black leading-7 text-slate-950">{feature.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{feature.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="findings" className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <SectionHeading
          eyebrow="INSIGHT"
          title="アセスメントでわかること"
          body="他経営者との比較を基に、数ある経営課題の優先度を可視化します。"
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {findings.map((item, index) => (
            <div key={item} className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-50 text-sm font-black text-blue-700">
                {index + 1}
              </span>
              <p className="mt-4 font-black text-slate-900">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="result-image" className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <SectionHeading
            eyebrow="SAMPLE"
            title="アセスメント結果イメージ"
            body="レーダーチャートとスコア表で、強み・差分・優先度を一画面で確認できます。"
          />
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
              <h3 className="text-lg font-black text-slate-950">レーダーチャートサンプル</h3>
              <div className="mt-4 h-96">
                <MiniRadar />
              </div>
            </div>

            <div className="space-y-4">
              {sampleScores.map((row) => (
                <div key={row.theme} className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-black text-slate-950">{row.theme}</p>
                      <p className="mt-1 text-sm text-slate-500">目標 {row.target} / 平均 {row.average}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${
                      row.priority === "高"
                        ? "bg-rose-50 text-rose-700"
                        : row.priority === "中"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-blue-50 text-blue-700"
                    }`}>
                      優先度 {row.priority}
                    </span>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-blue-700" style={{ width: `${(row.score / 12) * 100}%` }} />
                  </div>
                  <p className="mt-2 text-sm font-bold text-slate-600">実スコア {row.score} / 12</p>
                </div>
              ))}
              <p className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm font-bold leading-7 text-blue-900">
                社長カルテ スタンダードでは業種別・規模別・近しい社長タイプとの比較も可能です。
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <SectionHeading
          eyebrow="FOR ADVISORS"
          title="経営支援者向けの活用"
          body="社長カルテは、経営者との最初の接点づくりや、話のきっかけとして活用できます。"
        />
        <div className="grid gap-4 lg:grid-cols-3">
          {supportSteps.map((step, index) => (
            <div key={step.title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
              <p className="text-sm font-black text-blue-700">STEP {index + 1}</p>
              <h3 className="mt-2 text-lg font-black text-slate-950">{step.title}</h3>
              <p className="mt-3 leading-7 text-slate-600">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-12 text-center sm:px-6 sm:py-16 lg:px-8">
          <h2 className="text-3xl font-black leading-tight text-white">
            まずアセスメントで課題を確認しましょう
          </h2>
          <p className="mx-auto mt-4 max-w-2xl leading-8 text-slate-300">
            支援先に案内する前の確認用として、スマホからでもそのまま受検できます。
          </p>
          <Link className="mt-6 inline-flex min-h-12 items-center justify-center rounded-md bg-blue-600 px-6 py-3 text-sm font-black text-white transition hover:bg-blue-500" href="/basic-info">
            アセスメントを始める
          </Link>
        </div>
      </section>
    </main>
  );
}
