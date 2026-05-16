"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ThemeScore } from "@/lib/diagnosis";
import { getLocalEvents, getLocalSubmissions, type StoredSubmission } from "@/lib/storage";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";

type RespondentRow = {
  id: string;
  company_name: string;
  name: string;
  email: string;
  industry: string;
  user_type: string;
  created_at: string;
};

type DiagnosisResponseRow = {
  id: string;
  respondent_id: string;
  total_score: number;
  achievement_rate: number;
  category_scores_json: ThemeScore[];
  top_categories_json: ThemeScore[];
  low_categories_json: ThemeScore[];
  priority_categories_json: ThemeScore[];
  created_at: string;
};

type DiagnosisEventRow = {
  respondent_id: string;
  event_type: string;
  created_at: string;
};

type AdminRow = {
  id: string;
  respondentId: string;
  responseId?: string;
  companyName: string;
  representativeName: string;
  email: string;
  industry: string;
  category: string;
  totalScore: number;
  achievementRate: number;
  ctaClicked: boolean;
  createdAt: string;
  themeScores: ThemeScore[];
  topThemes: ThemeScore[];
  lowThemes: ThemeScore[];
  priorityThemes: ThemeScore[];
};

function csvEscape(value: string | number | boolean) {
  const stringValue = String(value);
  return `"${stringValue.replaceAll('"', '""')}"`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("ja-JP");
}

function themeNames(themes: ThemeScore[]) {
  return themes.map((theme) => theme.name).join("、");
}

function themeScores(themes: ThemeScore[]) {
  return themes.map((theme) => `${theme.name}:${theme.score}`).join(" / ");
}

function localRowsFromStorage(): AdminRow[] {
  return getLocalSubmissions().map((item) => ({
    id: item.id,
    respondentId: item.respondentId ?? item.id,
    responseId: item.responseId,
    companyName: item.basicInfo.companyName,
    representativeName: item.basicInfo.representativeName,
    email: item.basicInfo.email,
    industry: item.basicInfo.industry,
    category: item.basicInfo.category,
    totalScore: item.result.totalScore,
    achievementRate: item.result.achievementRate,
    ctaClicked: item.ctaClicked,
    createdAt: item.createdAt,
    themeScores: item.result.themeScores,
    topThemes: item.result.topThemes,
    lowThemes: item.result.lowThemes,
    priorityThemes: item.result.priorityThemes
  }));
}

export default function AdminPage() {
  const [rows, setRows] = useState<AdminRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [eventCount, setEventCount] = useState(0);
  const [dataSource, setDataSource] = useState<"supabase" | "local">("local");
  const [adminError, setAdminError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRows() {
      if (!isSupabaseConfigured) {
        const localRows = localRowsFromStorage();
        setRows(localRows);
        setSelectedId(localRows[0]?.id ?? null);
        setEventCount(getLocalEvents().length);
        setDataSource("local");
        setAdminError(
          "Supabase環境変数が未設定です。NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY を確認してください。"
        );
        return;
      }

      const supabase = getSupabaseClient();
      if (!supabase) return;

      try {
        const { data: responses, error: responsesError } = await supabase
          .from("diagnosis_responses")
          .select(`
            id,
            respondent_id,
            total_score,
            achievement_rate,
            category_scores_json,
            top_categories_json,
            low_categories_json,
            priority_categories_json,
            created_at
          `)
          .order("created_at", { ascending: false });

        if (responsesError) throw responsesError;

        const respondentIds = [
          ...new Set(((responses ?? []) as DiagnosisResponseRow[]).map((response) => response.respondent_id))
        ];

        let respondents: RespondentRow[] = [];
        if (respondentIds.length > 0) {
          const { data, error: respondentsError } = await supabase
            .from("respondents")
            .select("id,company_name,name,email,industry,user_type,created_at")
            .in("id", respondentIds);

          if (respondentsError) throw respondentsError;
          respondents = (data ?? []) as RespondentRow[];
        }

        const { data: events, error: eventsError } = await supabase
          .from("diagnosis_events")
          .select("respondent_id,event_type,created_at");

        if (eventsError) throw eventsError;

        const ctaClickedRespondentIds = new Set<string>(
          ((events ?? []) as DiagnosisEventRow[])
            .filter((event) => event.event_type === "cta_clicked")
            .map((event) => event.respondent_id)
        );
        const respondentsById = new Map(
          respondents.map((respondent) => [respondent.id, respondent])
        );

        const supabaseRows: AdminRow[] = ((responses ?? []) as DiagnosisResponseRow[])
          .map<AdminRow | null>((response) => {
            const respondent = respondentsById.get(response.respondent_id);
            if (!respondent) return null;

            return {
              id: response.id,
              responseId: response.id,
              respondentId: response.respondent_id,
              companyName: respondent.company_name,
              representativeName: respondent.name,
              email: respondent.email,
              industry: respondent.industry,
              category: respondent.user_type,
              totalScore: response.total_score,
              achievementRate: response.achievement_rate,
              ctaClicked: ctaClickedRespondentIds.has(response.respondent_id),
              createdAt: response.created_at,
              themeScores: response.category_scores_json ?? [],
              topThemes: response.top_categories_json ?? [],
              lowThemes: response.low_categories_json ?? [],
              priorityThemes: response.priority_categories_json ?? []
            };
          })
          .filter((row): row is AdminRow => row !== null);

        setRows(supabaseRows);
        setSelectedId(supabaseRows[0]?.id ?? null);
        setEventCount(events?.length ?? 0);
        setDataSource("supabase");
        setAdminError(null);
      } catch (error) {
        console.error("Supabase admin fetch failed", error);
        const localRows = localRowsFromStorage();
        setRows(localRows);
        setSelectedId(localRows[0]?.id ?? null);
        setEventCount(getLocalEvents().length);
        setDataSource("local");
        setAdminError(formatAdminError(error));
      }
    }

    loadRows();
  }, []);

  const selectedRow = rows.find((row) => row.id === selectedId) ?? null;

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
      "優先確認テーマ",
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
          themeScores(row.themeScores),
          themeNames(row.topThemes),
          themeNames(row.lowThemes),
          themeNames(row.priorityThemes),
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
            {dataSource === "supabase"
              ? "Supabaseの診断回答データを表示しています。"
              : "Supabase未設定または取得エラーのため、このブラウザのローカルデータを表示しています。"}
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

      {adminError ? (
        <section className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-bold leading-7 text-rose-800">
          Supabaseからデータを取得できませんでした。画面表示はローカルデータにフォールバックしています。
          <br />
          {adminError}
        </section>
      ) : null}

      <section className="panel overflow-hidden">
        <div className="border-b border-stone-200 p-5">
          <h2 className="text-xl font-black text-ink">回答一覧表示</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1500px] text-left text-sm">
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
                <th className="px-4 py-3">優先確認テーマ</th>
                <th className="px-4 py-3">個別解説CTAクリック有無</th>
                <th className="px-4 py-3">詳細</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3 text-stone-600">{formatDate(row.createdAt)}</td>
                  <td className="px-4 py-3 font-black text-ink">{row.companyName}</td>
                  <td className="px-4 py-3">{row.representativeName}</td>
                  <td className="px-4 py-3">{row.email}</td>
                  <td className="px-4 py-3">{row.industry}</td>
                  <td className="px-4 py-3">{row.category}</td>
                  <td className="px-4 py-3 font-bold">{row.totalScore}/192</td>
                  <td className="px-4 py-3">{row.achievementRate}%</td>
                  <td className="px-4 py-3 text-xs leading-5 text-stone-700">
                    {themeScores(row.themeScores)}
                  </td>
                  <td className="px-4 py-3">{themeNames(row.topThemes)}</td>
                  <td className="px-4 py-3">{themeNames(row.lowThemes)}</td>
                  <td className="px-4 py-3">{themeNames(row.priorityThemes)}</td>
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
                  <td className="px-4 py-8 text-center text-stone-600" colSpan={14}>
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
        </div>
        {selectedRow ? (
          <div className="space-y-5 p-5">
            <div className="grid gap-3 text-sm sm:grid-cols-3">
              {[
                ["回答日時", formatDate(selectedRow.createdAt)],
                ["会社名", selectedRow.companyName],
                ["氏名", selectedRow.representativeName],
                ["メールアドレス", selectedRow.email],
                ["業種", selectedRow.industry],
                ["区分", selectedRow.category],
                ["総合スコア", `${selectedRow.totalScore} / 192`],
                ["達成率", `${selectedRow.achievementRate}%`],
                ["個別解説CTA", selectedRow.ctaClicked ? "クリック済" : "未クリック"]
              ].map(([label, value]) => (
                <div key={label} className="rounded-md bg-stone-50 p-3">
                  <p className="font-bold text-stone-500">{label}</p>
                  <p className="mt-1 font-black text-ink">{value}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-md bg-teal-50 p-4">
                <h3 className="font-black text-teal-950">高スコア上位3テーマ</h3>
                <p className="mt-2 leading-7 text-teal-900">{themeNames(selectedRow.topThemes)}</p>
              </div>
              <div className="rounded-md bg-amber-50 p-4">
                <h3 className="font-black text-amber-950">低スコア下位3テーマ</h3>
                <p className="mt-2 leading-7 text-amber-900">{themeNames(selectedRow.lowThemes)}</p>
              </div>
              <div className="rounded-md bg-rose-50 p-4">
                <h3 className="font-black text-rose-950">優先確認テーマ</h3>
                <p className="mt-2 leading-7 text-rose-900">{themeNames(selectedRow.priorityThemes) || "-"}</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-stone-50 text-stone-600">
                  <tr>
                    <th className="px-4 py-3">テーマ</th>
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
                  {selectedRow.themeScores.map((theme) => (
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
          </div>
        ) : (
          <p className="p-5 text-stone-600">表示できる回答がありません。</p>
        )}
      </section>
    </main>
  );
}

function formatAdminError(error: unknown) {
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
