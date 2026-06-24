"use client";

import Link from "next/link";
import { BarChart3, ClipboardCheck, Lightbulb, UserRoundCheck } from "lucide-react";
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
  { title: "基本情報を入力", icon: UserRoundCheck },
  { title: "設問48問に回答", icon: ClipboardCheck },
  { title: "結果画面で強み・課題を確認", icon: BarChart3 },
  { title: "個別解説を申し込み", icon: Lightbulb }
] as const;

const features = [
  {
    number: "01",
    title: "16テーマで経営の現在地を整理",
    body: "収益性・市場・組織・意思決定・経営体制まで、経営の論点を多面的に見える化します。"
  },
  {
    number: "02",
    title: "目標値との違いを確認",
    body: "感覚的な自己評価だけでなく、成長企業の目安と照らして次の論点を捉えられます。"
  },
  {
    number: "03",
    title: "過去受検者との比較",
    body: "近しい経営者との違いから、優先順位を上げて確認したいテーマを見つけます。"
  },
  {
    number: "04",
    title: "対話と支援の入口になる",
    body: "結果を共通言語にして、経営者・幹部・支援者との対話を具体的な次の一手につなげます。"
  }
];

const supportSteps = [
  {
    title: "支援先へ案内",
    body: "面談前や初回接点で、経営者にアセスメントを案内します。"
  },
  {
    title: "結果を一緒に読み解く",
    body: "強み・差分・優先確認テーマを見ながら、論点をそろえます。"
  },
  {
    title: "提案へ接続",
    body: "整理したテーマを、支援メニューや具体的なアクションにつなげます。"
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
  body,
  align = "center",
  dark = false
}: {
  eyebrow: string;
  title: string;
  body?: string;
  align?: "left" | "center";
  dark?: boolean;
}) {
  const alignment = align === "left" ? "max-w-2xl text-left" : "mx-auto max-w-3xl text-center";

  return (
    <div className={`mb-10 ${alignment} sm:mb-14`}>
      <p className={`text-xs font-black tracking-[0.16em] ${dark ? "text-teal-300" : "text-teal-700"}`}>{eyebrow}</p>
      <h2 className={`mt-3 text-3xl font-black leading-tight sm:text-4xl ${dark ? "text-white" : "text-slate-950"}`}>{title}</h2>
      {body ? <p className={`mt-5 text-base leading-8 sm:text-lg ${dark ? "text-slate-300" : "text-slate-600"}`}>{body}</p> : null}
    </div>
  );
}

function MiniRadar() {
  return (
    <ResponsiveContainer height="100%" width="100%">
      <RadarChart data={sampleChartData} margin={{ top: 10, right: 18, bottom: 10, left: 18 }}>
        <PolarGrid stroke="#cbd5e1" />
        <PolarAngleAxis dataKey="theme" tick={{ fontSize: 10, fill: "#475569" }} />
        <PolarRadiusAxis angle={90} domain={[0, 12]} tickCount={4} tick={{ fontSize: 9, fill: "#64748b" }} />
        <Radar dataKey="target" fill="#2563eb" fillOpacity={0.08} name="目標値" stroke="#2563eb" strokeWidth={2} />
        <Radar dataKey="score" fill="#0f766e" fillOpacity={0.28} name="実スコア" stroke="#0f766e" strokeWidth={2} />
        <Tooltip />
      </RadarChart>
    </ResponsiveContainer>
  );
}

function PrimaryCta({ className = "" }: { className?: string }) {
  return (
    <Link
      className={`inline-flex min-h-14 items-center justify-center gap-3 rounded-md bg-slate-950 px-7 py-4 text-sm font-black text-white shadow-[0_16px_30px_rgba(15,23,42,0.2)] transition hover:-translate-y-0.5 hover:bg-teal-800 ${className}`}
      href="/basic-info"
    >
      社長カルテ Lightを始める
      <span aria-hidden="true" className="text-lg leading-none">→</span>
    </Link>
  );
}

export default function HomePage() {
  return (
    <main className="landing-page min-h-screen bg-white text-slate-950">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link className="flex items-center gap-3" href="/">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-950 text-xs font-black text-white">SK</span>
            <span className="text-sm font-black tracking-wide text-slate-950 sm:text-base">社長カルテ Light</span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-bold text-slate-600 lg:flex">
            <a className="transition hover:text-teal-700" href="#features">特徴</a>
            <a className="transition hover:text-teal-700" href="#findings">わかること</a>
            <a className="transition hover:text-teal-700" href="#result-image">結果イメージ</a>
            <a className="transition hover:text-teal-700" href="#advisors">支援者の活用</a>
          </nav>
          <Link className="inline-flex min-h-11 items-center justify-center rounded-md bg-teal-400 px-5 py-2 text-sm font-black text-slate-950 transition hover:bg-teal-300" href="/basic-info">
            診断を始める
          </Link>
        </div>
      </header>

      <section className="landing-hero relative overflow-hidden border-b border-slate-200">
        <div className="landing-grid-overlay absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16 lg:px-8 lg:py-28">
          <div className="relative z-10">
            <p className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white/85 px-3 py-1.5 text-xs font-black tracking-wide text-teal-800 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-600" />
              経営者専用アセスメント
            </p>
            <h1 className="mt-6 max-w-3xl text-4xl font-black leading-[1.18] text-white sm:text-5xl lg:text-6xl">
              「社長の現在地」を
              <br />
              16のテーマで見える化
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              経営者の課題感・優先順位・意思決定の傾向を、目標値との差分と過去受検者平均との差分から整理するアセスメントです。
            </p>
            <div className="mt-8 flex flex-col gap-5 sm:items-start">
              <PrimaryCta className="min-h-16 bg-teal-400 px-9 py-5 text-base text-slate-950 shadow-[0_18px_38px_rgba(45,212,191,0.22)] hover:bg-teal-300" />
            </div>
          </div>

          <div className="relative z-10">
            <div className="absolute -inset-5 rounded-[28px] bg-gradient-to-br from-blue-200/50 via-teal-100/30 to-white/0 blur-2xl" aria-hidden="true" />
            <div className="relative overflow-hidden rounded-xl border border-white/80 bg-white p-5 shadow-[0_26px_70px_rgba(15,23,42,0.16)] sm:p-6">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-5">
                <div>
                  <p className="text-xs font-black tracking-[0.14em] text-teal-700">ASSESSMENT REPORT</p>
                  <h2 className="mt-2 text-xl font-black text-slate-950">アセスメント結果イメージ</h2>
                </div>
                <div className="shrink-0 border-l border-slate-200 pl-4 text-right">
                  <p className="text-xs font-bold text-slate-500">総合スコア例</p>
                  <p className="mt-1 text-2xl font-black text-slate-950">119<span className="text-sm text-slate-500"> / 192</span></p>
                </div>
              </div>
              <div className="h-72 py-4 sm:h-80">
                <MiniRadar />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="border-l-2 border-teal-600 bg-teal-50/80 px-4 py-3">
                  <p className="text-xs font-bold text-slate-500">強みとして表れているテーマ</p>
                  <p className="mt-1 font-black text-slate-950">収益性・優位性</p>
                </div>
                <div className="border-l-2 border-amber-500 bg-amber-50/80 px-4 py-3">
                  <p className="text-xs font-bold text-slate-500">優先確認テーマ</p>
                  <p className="mt-1 font-black text-slate-950">経営体制構築力</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <SectionHeading eyebrow="FLOW" title="アセスメントの流れ" body="スマートフォンからでも、経営の現在地を短時間で整理できます。" />
        <div className="grid gap-4 md:grid-cols-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
            <article key={step.title} className="group rounded-lg border border-slate-200 bg-white p-6 shadow-[0_12px_34px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:border-teal-300 hover:shadow-[0_18px_42px_rgba(15,23,42,0.1)]">
              <span className="flex h-12 w-12 items-center justify-center rounded-md bg-slate-950 text-teal-300 transition group-hover:bg-teal-700 group-hover:text-white">
                <Icon aria-hidden="true" size={23} strokeWidth={1.8} />
              </span>
              <p className="text-xs font-black tracking-[0.14em] text-teal-700">STEP 0{index + 1}</p>
              <p className="mt-3 text-lg font-black leading-7 text-slate-950">{step.title}</p>
            </article>
          );
          })}
        </div>
      </section>

      <section id="features" className="border-y border-slate-200 bg-slate-50/75">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <SectionHeading eyebrow="FEATURE" title="経営の論点を、次の対話へつなげる" body="スコアを並べるだけではなく、経営者が次に整理すべきテーマを見つけるためのアセスメントです。" />
          <div className="grid gap-5 lg:grid-cols-4">
            {features.map((feature) => (
              <article key={feature.title} className="group min-h-64 rounded-lg border border-slate-200 bg-white p-6 shadow-[0_12px_34px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:border-teal-200 hover:shadow-[0_18px_42px_rgba(15,23,42,0.1)]">
                <p className="text-sm font-black tracking-[0.12em] text-teal-700">{feature.number}</p>
                <h3 className="mt-8 text-xl font-black leading-8 text-slate-950">{feature.title}</h3>
                <p className="mt-4 text-sm leading-7 text-slate-600">{feature.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="result-image" className="relative overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(15,118,110,0.24),transparent_45%,rgba(37,99,235,0.2))]" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <SectionHeading
            eyebrow="RESULT SAMPLE"
            title="結果は、次の意思決定のための資料になる"
            body="レーダーチャートとスコア表で、強み・差分・優先度を一画面で確認できます。"
            dark
          />
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <article className="rounded-xl border border-white/20 bg-white p-5 shadow-[0_26px_60px_rgba(0,0,0,0.2)] sm:p-6">
              <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <p className="text-xs font-black tracking-[0.14em] text-teal-700">REPORT OVERVIEW</p>
                  <h3 className="mt-2 text-xl font-black text-slate-950">16テーマ レーダーチャート</h3>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">結果サンプル</span>
              </div>
              <div className="mt-4 h-96">
                <MiniRadar />
              </div>
              <div className="flex flex-wrap gap-4 border-t border-slate-200 pt-4 text-xs font-bold text-slate-600">
                <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-teal-700" />実スコア</span>
                <span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-blue-600" />目標値</span>
              </div>
            </article>

            <div className="space-y-3">
              {sampleScores.map((row) => (
                <article key={row.theme} className="rounded-lg border border-white/15 bg-white/95 p-5 shadow-[0_12px_32px_rgba(0,0,0,0.12)]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-black text-slate-950">{row.theme}</p>
                      <p className="mt-1 text-sm text-slate-500">目標 {row.target} / 平均 {row.average}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${row.priority === "高" ? "bg-rose-50 text-rose-700" : row.priority === "中" ? "bg-amber-50 text-amber-700" : "bg-teal-50 text-teal-700"}`}>
                      優先度 {row.priority}
                    </span>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-teal-700" style={{ width: `${(row.score / 12) * 100}%` }} />
                  </div>
                  <p className="mt-2 text-sm font-bold text-slate-600">実スコア {row.score} / 12</p>
                </article>
              ))}
              <p className="border-l-2 border-teal-300 bg-teal-50/10 px-4 py-3 text-sm font-bold leading-7 text-slate-100">
                社長カルテ スタンダードでは、業種別・規模別・近しい社長タイプとの比較も可能です。
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="advisors" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <SectionHeading eyebrow="FOR ADVISORS" title="経営支援の対話を、より具体的に" body="経営者との最初の接点から提案まで、結果を共通言語として活用できます。" />
        <div className="grid gap-5 lg:grid-cols-3">
          {supportSteps.map((step, index) => (
            <article key={step.title} className="relative border-t border-slate-300 pt-6">
              <p className="text-xs font-black tracking-[0.14em] text-teal-700">STEP 0{index + 1}</p>
              <h3 className="mt-4 text-2xl font-black text-slate-950">{step.title}</h3>
              <p className="mt-4 max-w-sm leading-8 text-slate-600">{step.body}</p>
              {index < supportSteps.length - 1 ? <span className="absolute right-0 top-6 hidden text-slate-300 lg:block">→</span> : null}
            </article>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(13,148,136,0.3),transparent_48%,rgba(37,99,235,0.18))]" aria-hidden="true" />
        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 sm:py-28 lg:px-8">
          <p className="relative text-xs font-black tracking-[0.16em] text-teal-300">START ASSESSMENT</p>
          <h2 className="relative mt-4 text-3xl font-black leading-tight text-white sm:text-4xl">まずアセスメントで、経営の現在地を整理しましょう</h2>
          <p className="relative mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
            支援先に案内する前の確認用としても、スマートフォンからそのまま受検できます。
          </p>
          <PrimaryCta className="relative mt-8 min-h-16 bg-teal-400 px-9 py-5 text-base text-slate-950 shadow-[0_18px_38px_rgba(45,212,191,0.22)] hover:bg-teal-300" />
        </div>
      </section>
    </main>
  );
}
