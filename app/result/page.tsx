"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { CTA_URL, type ThemeScore } from "@/lib/diagnosis";
import {
  getLocalSubmission,
  markLocalCtaClicked,
  recordLocalEvent,
  saveLocalSubmission,
  type StoredSubmission
} from "@/lib/storage";
import {
  getSupabaseConfigStatus,
  saveDiagnosisEventToSupabase,
  saveSubmissionToSupabase
} from "@/lib/supabase";
import { notifyDiagnosisCompleted } from "@/lib/notify";
import ResultHowToReadCard from "./ResultHowToReadCard";
import { ResultCopyright, ResultWatermark } from "@/components/ResultUsageNotice";
import ResultUseCases from "./ResultUseCases";
import ThemeGuideAccordion from "./ThemeGuideAccordion";
import { usageSettingsFromRow } from "@/lib/usage-settings";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip
} from "recharts";

function DifferenceBadge({ value }: { value: number }) {
  const tone =
    value >= 0
      ? "bg-teal-50 text-brand border-teal-100"
      : value >= -2
        ? "bg-amber-50 text-accent border-amber-100"
        : "bg-rose-50 text-rose-700 border-rose-100";

  return (
    <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-black ${tone}`}>
      {value >= 0 ? "+" : ""}
      {value}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: ThemeScore["priority"] }) {
  const tone =
    priority === "高"
      ? "bg-rose-50 text-rose-700"
      : priority === "中"
        ? "bg-amber-50 text-accent"
        : "bg-teal-50 text-brand";

  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-black ${tone}`}>
      {priority}
    </span>
  );
}

export default function ResultPage() {
  const [submission, setSubmission] = useState<StoredSubmission | null>(null);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);
  const [supabaseStatus] = useState(getSupabaseConfigStatus);
  const hasSyncedResultRef = useRef(false);
  const hasNotifiedRef = useRef(false);

  useEffect(() => {
    const storedSubmission = getLocalSubmission();
    setSubmission(storedSubmission);
    if (storedSubmission && !hasSyncedResultRef.current) {
      hasSyncedResultRef.current = true;
      recordLocalEvent(storedSubmission.id, "result_viewed");
      saveSubmissionToSupabase(storedSubmission).then((saveResult) => {
        saveLocalSubmission(saveResult.data);
        setSubmission(saveResult.data);
        setSupabaseError(saveResult.errorMessage ?? null);
        if (!saveResult.errorMessage && !hasNotifiedRef.current) {
          hasNotifiedRef.current = true;
          notifyDiagnosisCompleted(saveResult.data);
        }
      });
    }
  }, []);

  const chartData = useMemo(
    () =>
      submission?.result.themeScores.map((theme) => ({
        theme: theme.name,
        score: theme.score,
        target: theme.target
      })) ?? [],
    [submission]
  );

  async function handleCtaClick() {
    if (!submission) return;
    markLocalCtaClicked(submission.id);
    const saveResult = await saveSubmissionToSupabase({
      ...submission,
      ctaClicked: true
    });
    saveLocalSubmission(saveResult.data);
    setSubmission(saveResult.data);
    const eventResult = await saveDiagnosisEventToSupabase(
      saveResult.data.respondentId ?? saveResult.data.id,
      "cta_clicked"
    );
    const nextError = saveResult.errorMessage ?? eventResult.errorMessage ?? null;
    setSupabaseError(nextError);
    if (nextError) return;

    window.location.href = CTA_URL;
  }

  if (!submission) {
    return (
      <main className="page-shell flex items-center justify-center">
        <section className="panel max-w-xl p-6 text-center">
          <h1 className="text-2xl font-black text-ink">診断結果が見つかりません</h1>
          <p className="mt-3 leading-7 text-stone-700">
            基本情報の入力から診断を開始してください。
          </p>
          <Link className="primary-button mt-5" href="/basic-info">
            診断を開始する
          </Link>
        </section>
      </main>
    );
  }

  const { basicInfo, result } = submission;
  const usageSettings = usageSettingsFromRow(submission.usageSettings);
  const diagnosisDate = new Date(submission.createdAt).toLocaleDateString("ja-JP");
  const strongestThemeNames = result.topThemes.map((theme) => theme.name).join("・");
  const prioritySummaryNames =
    result.priorityThemes.length > 0
      ? result.priorityThemes.map((theme) => theme.name).join("・")
      : "現在表示されているテーマ";
  const friendlySummary =
    result.priorityThemes.length > 0
      ? `今回の結果では、${strongestThemeNames} に比較的強みが見られます。一方で、${prioritySummaryNames} は、次の打ち手を考えるうえで確認しておきたいテーマとして表れています。評価として受け取るのではなく、今後の優先順位を整理する入口としてご覧ください。`
      : `今回の結果では、${strongestThemeNames} に比較的強みが見られます。大きく急ぐテーマとして断定される項目はありませんが、今後の優先順位を整理する入口として、気になるテーマから確認してみてください。`;

  return (
    <main className="page-shell result-with-watermark space-y-6">
      <ResultWatermark settings={usageSettings} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold text-brand">RESULT</p>
          <h1 className="mt-2 text-3xl font-black text-ink">診断結果</h1>
          <p className="mt-3 max-w-3xl leading-7 text-stone-700">
            社長カルテ Lightでは、16テーマの主要項目と照らして、自社のスコア、
            目標値との差分、過去受検者平均との差分を簡易的に表示しています。
            <br />
            <br />
            社長カルテは、単にスコアを出すだけではなく、目標値との差分や、
            他の受検者との違いをもとに、今後優先して確認するとよさそうなテーマを
            整理することを目的としています。
          </p>
        </div>
      </div>

      {supabaseError ? (
        <section className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-bold leading-7 text-rose-800">
          Supabaseへの保存でエラーが発生しました。画面表示とローカル保存は継続しています。
          <br />
          {supabaseError}
        </section>
      ) : null}

      {!supabaseStatus.configured ? (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-7 text-amber-900">
          Supabase環境変数が未設定です。
          NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_ANON_KEY を確認し、開発サーバーを再起動してください。
        </section>
      ) : null}

      <ResultHowToReadCard />

      <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="panel p-5">
          <h2 className="text-xl font-black text-ink">基本情報</h2>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            {[
              ["会社名", basicInfo.companyName],
              ["氏名", basicInfo.representativeName],
              ["業種", basicInfo.industry],
              ["診断日", diagnosisDate]
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
            {result.totalScore}
            <span className="text-lg text-stone-500"> / 192点</span>
          </p>
          <p className="mt-2 text-sm font-bold text-brand">達成率：{result.achievementRate}%</p>
        </div>
      </section>

      <section className="panel p-5">
        <h2 className="text-xl font-black text-ink">16テーマ レーダーチャート</h2>
        <p className="mt-1 text-sm text-stone-600">
          目標値と実スコアとの差異を表示しています。
          <br />
          ※目標値は、社長カルテの算出モデルである経営者の回答から平均値を算出したものです
        </p>
        <div className="mt-4 h-80 w-full sm:h-96">
          <ResponsiveContainer height="100%" width="100%">
            <RadarChart data={chartData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="theme" tick={{ fontSize: 10 }} />
              <PolarRadiusAxis angle={90} domain={[0, 12]} tickCount={5} />
              <Radar dataKey="target" fill="#d97706" fillOpacity={0.12} name="目標値" stroke="#d97706" />
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
            目標差分 = 実スコア - 目標値、平均差分 = 実スコア - 過去受検者の簡易平均です。
            <br />
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
              {result.themeScores.map((theme) => (
                <tr key={theme.id}>
                  <td className="px-4 py-3 font-black text-ink">{theme.name}</td>
                  <td className="px-4 py-3">12</td>
                  <td className="px-4 py-3">{theme.target}</td>
                  <td className="px-4 py-3">{theme.average}</td>
                  <td className="px-4 py-3 font-bold">{theme.score}</td>
                  <td className="px-4 py-3"><DifferenceBadge value={theme.gap} /></td>
                  <td className="px-4 py-3"><DifferenceBadge value={theme.averageGap} /></td>
                  <td className="px-4 py-3"><PriorityBadge priority={theme.priority} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <ThemeGuideAccordion />

      <section className="panel p-5">
        <h2 className="text-xl font-black text-ink">優先確認テーマ</h2>
        <p className="mt-1 text-sm text-stone-600">
          優先度「高」を優先表示し、該当がない場合は「中」のテーマを最大3件表示します。
        </p>
        <p className="mt-3 rounded-md bg-stone-50 p-4 text-sm font-bold leading-7 text-stone-700">
          優先確認テーマは、次に整理すると打ち手につながりやすいテーマです。
          スコアだけで良し悪しを判断するのではなく、今後の対話や具体的なアクションを考える入口としてご覧ください。
        </p>
        {result.priorityThemes.length > 0 ? (
          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            {result.priorityThemes.map((theme) => (
              <div key={theme.id} className="rounded-md bg-amber-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-black text-amber-950">{theme.name}</p>
                  <PriorityBadge priority={theme.priority} />
                </div>
                <p className="mt-2 text-sm leading-6 text-amber-900">
                  目標差分 {theme.gap >= 0 ? "+" : ""}{theme.gap} / 平均差分 {theme.averageGap >= 0 ? "+" : ""}{theme.averageGap}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 rounded-md bg-teal-50 p-4 font-bold text-teal-900">
            現時点で優先度「高」「中」に該当するテーマはありません。
          </p>
        )}
      </section>

      <section className="panel p-5">
        <h2 className="text-xl font-black text-ink">簡易コメント</h2>
        <p className="mt-3 leading-7 text-stone-700">{friendlySummary}</p>
      </section>

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
        <button className="primary-button min-h-14 bg-white px-7 py-4 text-base text-ink hover:bg-stone-100" onClick={handleCtaClick} type="button">
          結果の活用方法を相談する
        </button>
      </section>
    </main>
  );
}
