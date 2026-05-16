"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getLocalEvents, getLocalSubmissions, type StoredSubmission } from "@/lib/storage";

function csvEscape(value: string | number | boolean) {
  const stringValue = String(value);
  return `"${stringValue.replaceAll('"', '""')}"`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("ja-JP");
}

export default function AdminPage() {
  const [localSubmissions, setLocalSubmissions] = useState<StoredSubmission[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [eventCount, setEventCount] = useState(0);

  useEffect(() => {
    const submissions = getLocalSubmissions();
    setLocalSubmissions(submissions);
    setSelectedId(submissions[0]?.id ?? null);
    setEventCount(getLocalEvents().length);
  }, []);

  const rows = localSubmissions.map((item) => ({
    id: item.id,
    companyName: item.basicInfo.companyName,
    representativeName: item.basicInfo.representativeName,
    email: item.basicInfo.email,
    industry: item.basicInfo.industry,
    category: item.basicInfo.category,
    totalScore: item.result.totalScore,
    achievementRate: item.result.achievementRate,
    ctaClicked: item.ctaClicked,
    createdAt: item.createdAt,
    themeScores: item.result.themeScores
      .map((theme) => `${theme.name}:${theme.score}`)
      .join(" / "),
    topThemes: item.result.topThemes.map((theme) => theme.name).join("、"),
    lowThemes: item.result.lowThemes.map((theme) => theme.name).join("、")
  }));
  const selectedSubmission = localSubmissions.find((item) => item.id === selectedId) ?? null;

  function handleCsvExport() {
    const headers = [
      "回答日時",
      "会社名",
      "氏名",
      "メールアドレス",
      "業種",
      "区分",
      "総合スコア",
      "達成率",
      "各テーマスコア",
      "高スコア上位3テーマ",
      "低スコア下位3テーマ",
      "個別解説CTAクリック有無"
    ];
    const lines = [
      headers.map(csvEscape).join(","),
      ...rows.map((row) =>
        [
          formatDate(row.createdAt),
          row.companyName,
          row.representativeName,
          row.email,
          row.industry,
          row.category,
          row.totalScore,
          `${row.achievementRate}%`,
          row.themeScores,
          row.topThemes,
          row.lowThemes,
          row.ctaClicked ? "あり" : "なし"
        ]
          .map(csvEscape)
          .join(",")
      )
    ];
    const blob = new Blob([`\uFEFF${lines.join("\n")}`], {
      type: "text/csv;charset=utf-8"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `shacho-karte-responses-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="page-shell space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold text-brand">ADMIN</p>
          <h1 className="mt-2 text-3xl font-black text-ink">管理画面</h1>
          <p className="mt-2 leading-7 text-stone-700">
            このブラウザに保存されたデモ診断データを表示しています。
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button className="primary-button" onClick={handleCsvExport} type="button">
            CSV出力
          </button>
          <Link className="secondary-button" href="/">
            LPへ戻る
          </Link>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-4">
        <div className="panel p-5">
          <p className="text-sm font-bold text-stone-600">診断件数</p>
          <p className="mt-2 text-4xl font-black text-ink">{rows.length}</p>
        </div>
        <div className="panel p-5">
          <p className="text-sm font-bold text-stone-600">平均達成率</p>
          <p className="mt-2 text-4xl font-black text-brand">
            {rows.length
              ? Math.round(rows.reduce((sum, row) => sum + row.achievementRate, 0) / rows.length)
              : 0}
            %
          </p>
        </div>
        <div className="panel p-5">
          <p className="text-sm font-bold text-stone-600">CTAクリック</p>
          <p className="mt-2 text-4xl font-black text-accent">
            {rows.filter((row) => row.ctaClicked).length}
          </p>
        </div>
        <div className="panel p-5">
          <p className="text-sm font-bold text-stone-600">イベント数</p>
          <p className="mt-2 text-4xl font-black text-ink">{eventCount}</p>
        </div>
      </section>

      <section className="panel overflow-hidden">
        <div className="border-b border-stone-200 p-5">
          <h2 className="text-xl font-black text-ink">診断データ一覧</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1400px] text-left text-sm">
            <thead className="bg-stone-50 text-stone-600">
              <tr>
                <th className="px-4 py-3">回答日時</th>
                <th className="px-4 py-3">会社名</th>
                <th className="px-4 py-3">氏名</th>
                <th className="px-4 py-3">メールアドレス</th>
                <th className="px-4 py-3">業種</th>
                <th className="px-4 py-3">区分</th>
                <th className="px-4 py-3">総合スコア</th>
                <th className="px-4 py-3">達成率</th>
                <th className="px-4 py-3">各テーマスコア</th>
                <th className="px-4 py-3">高スコア上位3テーマ</th>
                <th className="px-4 py-3">低スコア下位3テーマ</th>
                <th className="px-4 py-3">個別解説CTAクリック有無</th>
                <th className="px-4 py-3">詳細</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3 text-stone-600">
                    {formatDate(row.createdAt)}
                  </td>
                  <td className="px-4 py-3 font-black text-ink">{row.companyName}</td>
                  <td className="px-4 py-3">{row.representativeName}</td>
                  <td className="px-4 py-3">{row.email}</td>
                  <td className="px-4 py-3">{row.industry}</td>
                  <td className="px-4 py-3">{row.category}</td>
                  <td className="px-4 py-3 font-bold">{row.totalScore}/192</td>
                  <td className="px-4 py-3">{row.achievementRate}%</td>
                  <td className="px-4 py-3 text-xs leading-5 text-stone-700">{row.themeScores}</td>
                  <td className="px-4 py-3">{row.topThemes}</td>
                  <td className="px-4 py-3">{row.lowThemes}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-black ${
                      row.ctaClicked ? "bg-teal-50 text-brand" : "bg-stone-100 text-stone-600"
                    }`}>
                      {row.ctaClicked ? "クリック済" : "未クリック"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      className="rounded-md border border-stone-300 px-3 py-2 text-xs font-black text-ink hover:border-brand hover:text-brand"
                      onClick={() => setSelectedId(row.id)}
                      type="button"
                    >
                      表示
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-stone-600" colSpan={13}>
                    まだ診断データがありません。
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel overflow-hidden">
        <div className="border-b border-stone-200 p-5">
          <h2 className="text-xl font-black text-ink">回答詳細表示</h2>
          <p className="mt-1 text-sm text-stone-600">
            一覧の「表示」から回答者ごとのテーマスコアを確認できます。
          </p>
        </div>
        {selectedSubmission ? (
          <div className="space-y-5 p-5">
            <div className="grid gap-3 text-sm sm:grid-cols-3">
              {[
                ["回答日時", formatDate(selectedSubmission.createdAt)],
                ["会社名", selectedSubmission.basicInfo.companyName],
                ["氏名", selectedSubmission.basicInfo.representativeName],
                ["メールアドレス", selectedSubmission.basicInfo.email],
                ["業種", selectedSubmission.basicInfo.industry],
                ["区分", selectedSubmission.basicInfo.category],
                ["総合スコア", `${selectedSubmission.result.totalScore} / 192`],
                ["達成率", `${selectedSubmission.result.achievementRate}%`],
                [
                  "個別解説CTA",
                  selectedSubmission.ctaClicked ? "クリック済" : "未クリック"
                ]
              ].map(([label, value]) => (
                <div key={label} className="rounded-md bg-stone-50 p-3">
                  <p className="font-bold text-stone-500">{label}</p>
                  <p className="mt-1 font-black text-ink">{value}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-md bg-teal-50 p-4">
                <h3 className="font-black text-teal-950">高スコア上位3テーマ</h3>
                <p className="mt-2 leading-7 text-teal-900">
                  {selectedSubmission.result.topThemes.map((theme) => theme.name).join("、")}
                </p>
              </div>
              <div className="rounded-md bg-amber-50 p-4">
                <h3 className="font-black text-amber-950">低スコア下位3テーマ</h3>
                <p className="mt-2 leading-7 text-amber-900">
                  {selectedSubmission.result.lowThemes.map((theme) => theme.name).join("、")}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-stone-50 text-stone-600">
                  <tr>
                    <th className="px-4 py-3">テーマ</th>
                    <th className="px-4 py-3">満点</th>
                    <th className="px-4 py-3">目標値</th>
                    <th className="px-4 py-3">実スコア</th>
                    <th className="px-4 py-3">目標差分</th>
                    <th className="px-4 py-3">判定</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {selectedSubmission.result.themeScores.map((theme) => (
                    <tr key={theme.id}>
                      <td className="px-4 py-3 font-black text-ink">{theme.name}</td>
                      <td className="px-4 py-3">12</td>
                      <td className="px-4 py-3">{theme.target}</td>
                      <td className="px-4 py-3 font-bold">{theme.score}</td>
                      <td className="px-4 py-3">
                        {theme.gap >= 0 ? "+" : ""}
                        {theme.gap}
                      </td>
                      <td className="px-4 py-3">{theme.judgement}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p className="p-5 text-stone-600">表示できる回答がありません。</p>
        )}
      </section>
    </main>
  );
}
