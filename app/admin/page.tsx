"use client";

import { useEffect, useState } from "react";
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
  email: string | null;
  email_normalized: string | null;
  traffic_source: string | null;
  referrer_name: string | null;
  referrer_company: string | null;
  referrer_email: string | null;
  consent_agreed: boolean | null;
  consent_agreed_at: string | null;
  ip_hash: string | null;
  user_agent: string | null;
  result_token: string | null;
  result_token_expires_at: string | null;
  result_view_count: number | null;
  result_last_viewed_at: string | null;
  participant_email_sent_at: string | null;
  participant_email_error: string | null;
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
  emailNormalized: string;
  industry: string;
  category: string;
  trafficSource: string;
  referrerName: string;
  referrerCompany: string;
  referrerEmail: string;
  consentAgreed: boolean;
  consentAgreedAt: string;
  ipHash: string;
  userAgent: string;
  resultToken: string;
  resultTokenExpiresAt: string;
  resultViewCount: number;
  resultLastViewedAt: string;
  participantEmailSentAt: string;
  participantEmailError: string;
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

function ThemeTags({ themes }: { themes: ThemeScore[] }) {
  if (themes.length === 0) return <span className="text-stone-500">-</span>;

  return (
    <div className="flex max-w-md flex-wrap gap-1.5">
      {themes.map((theme) => (
        <span key={theme.id} className="rounded-full bg-stone-100 px-2 py-1 text-xs font-bold text-stone-700">
          {theme.name}
        </span>
      ))}
    </div>
  );
}

function emailDomain(email: string) {
  return email.includes("@") ? email.split("@")[1]?.toLowerCase() ?? "" : "";
}

function countBy<T>(items: T[], getKey: (item: T) => string) {
  const counts = new Map<string, number>();
  items.forEach((item) => {
    const key = getKey(item);
    if (!key) return;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

function localRowsFromStorage(): AdminRow[] {
  return getLocalSubmissions().map((item) => ({
    id: item.id,
    respondentId: item.respondentId ?? item.id,
    responseId: item.responseId,
    companyName: item.basicInfo.companyName,
    representativeName: item.basicInfo.representativeName,
    email: item.basicInfo.email,
    emailNormalized: item.basicInfo.emailNormalized || item.basicInfo.email,
    industry: item.basicInfo.industry,
    category: item.basicInfo.category,
    trafficSource: item.basicInfo.trafficSource || "",
    referrerName: item.basicInfo.referrerName || "",
    referrerCompany: item.basicInfo.referrerCompany || "",
    referrerEmail: item.basicInfo.referrerEmail || "",
    consentAgreed: item.basicInfo.consentAgreed ?? false,
    consentAgreedAt: item.basicInfo.consentAgreedAt || "",
    ipHash: "",
    userAgent: "",
    resultToken: item.resultToken || "",
    resultTokenExpiresAt: item.resultTokenExpiresAt || "",
    resultViewCount: 0,
    resultLastViewedAt: "",
    participantEmailSentAt: "",
    participantEmailError: "",
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
  const [adminMessage, setAdminMessage] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
            email,
            email_normalized,
            traffic_source,
            referrer_name,
            referrer_company,
            referrer_email,
            consent_agreed,
            consent_agreed_at,
            ip_hash,
            user_agent,
            result_token,
            result_token_expires_at,
            result_view_count,
            result_last_viewed_at,
            participant_email_sent_at,
            participant_email_error,
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
              email: response.email ?? respondent.email,
              emailNormalized: response.email_normalized ?? response.email ?? respondent.email,
              industry: respondent.industry,
              category: respondent.user_type,
              trafficSource: response.traffic_source ?? "",
              referrerName: response.referrer_name ?? "",
              referrerCompany: response.referrer_company ?? "",
              referrerEmail: response.referrer_email ?? "",
              consentAgreed: Boolean(response.consent_agreed),
              consentAgreedAt: response.consent_agreed_at ?? "",
              ipHash: response.ip_hash ?? "",
              userAgent: response.user_agent ?? "",
              resultToken: response.result_token ?? "",
              resultTokenExpiresAt: response.result_token_expires_at ?? "",
              resultViewCount: response.result_view_count ?? 0,
              resultLastViewedAt: response.result_last_viewed_at ?? "",
              participantEmailSentAt: response.participant_email_sent_at ?? "",
              participantEmailError: response.participant_email_error ?? "",
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
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentRows = rows.filter((row) => new Date(row.createdAt).getTime() >= sevenDaysAgo);
  const trafficCounts = countBy(recentRows, (row) => row.trafficSource);
  const referrerCounts = countBy(rows, (row) => row.referrerCompany || row.referrerEmail);
  const domainCounts = countBy(rows, (row) => emailDomain(row.emailNormalized || row.email))
    .filter(([, count]) => count >= 2);
  const referralRowsWithoutName = rows.filter(
    (row) =>
      ["知人・取引先からの紹介", "経営支援者・コンサルタントからの紹介"].includes(row.trafficSource) &&
      !row.referrerName
  );

  function handleCsvExport() {
    const headers = [
      "回答日時",
      "会社名",
      "氏名",
      "メールアドレス",
      "流入経路",
      "紹介者名",
      "紹介元会社名",
      "紹介者メールアドレス",
      "同意済み",
      "同意日時",
      "IPハッシュ",
      "User-Agent",
      "結果URL期限",
      "結果閲覧回数",
      "結果最終閲覧日時",
      "受検者メール送信日時",
      "受検者メールエラー",
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
          row.trafficSource,
          row.referrerName,
          row.referrerCompany,
          row.referrerEmail,
          row.consentAgreed ? "同意済み" : "未同意",
          row.consentAgreedAt ? formatDate(row.consentAgreedAt) : "",
          row.ipHash,
          row.userAgent,
          row.resultTokenExpiresAt ? formatDate(row.resultTokenExpiresAt) : "",
          row.resultViewCount,
          row.resultLastViewedAt ? formatDate(row.resultLastViewedAt) : "",
          row.participantEmailSentAt ? formatDate(row.participantEmailSentAt) : "",
          row.participantEmailError,
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

  async function handleDeleteResponse() {
    if (!deleteTarget) return;

    if (dataSource !== "supabase") {
      setAdminError("ローカルデータ表示中は管理画面から削除できません。Supabase接続後に削除してください。");
      setDeleteTarget(null);
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      setAdminError("Supabase clientを初期化できませんでした。環境変数を確認してください。");
      setDeleteTarget(null);
      return;
    }

    setIsDeleting(true);
    setAdminError(null);
    setAdminMessage(null);

    try {
      const responseId = deleteTarget.responseId ?? deleteTarget.id;
      const { error: reportDeleteError } = await supabase
        .from("feedback_reports")
        .delete()
        .eq("response_id", responseId);

      if (reportDeleteError) throw reportDeleteError;

      const { error: responseDeleteError } = await supabase
        .from("diagnosis_responses")
        .delete()
        .eq("id", responseId);

      if (responseDeleteError) throw responseDeleteError;

      const remainingRows = rows.filter((row) => row.id !== deleteTarget.id);
      setRows(remainingRows);
      setSelectedId((currentSelectedId) => {
        if (currentSelectedId !== deleteTarget.id) return currentSelectedId;
        return remainingRows[0]?.id ?? null;
      });
      setAdminMessage("削除しました。");
      setDeleteTarget(null);
    } catch (error) {
      console.error("Supabase admin delete failed", error);
      setAdminError(formatAdminError(error));
    } finally {
      setIsDeleting(false);
    }
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

      <section className="grid gap-4 lg:grid-cols-4">
        <div className="panel p-5">
          <p className="text-sm font-bold text-stone-600">流入経路別件数（直近7日）</p>
          <div className="mt-3 space-y-2 text-sm">
            {trafficCounts.slice(0, 5).map(([source, count]) => (
              <p key={source} className="flex justify-between gap-3 font-bold">
                <span>{source}</span>
                <span>{count}件</span>
              </p>
            ))}
            {trafficCounts.length === 0 ? <p className="text-stone-500">該当なし</p> : null}
          </div>
        </div>
        <div className="panel p-5">
          <p className="text-sm font-bold text-stone-600">紹介元別件数</p>
          <div className="mt-3 space-y-2 text-sm">
            {referrerCounts.slice(0, 5).map(([source, count]) => (
              <p key={source} className="flex justify-between gap-3 font-bold">
                <span>{source}</span>
                <span>{count}件</span>
              </p>
            ))}
            {referrerCounts.length === 0 ? <p className="text-stone-500">該当なし</p> : null}
          </div>
        </div>
        <div className="panel p-5">
          <p className="text-sm font-bold text-stone-600">同一メールドメイン</p>
          <div className="mt-3 space-y-2 text-sm">
            {domainCounts.slice(0, 5).map(([domain, count]) => (
              <p key={domain} className="flex justify-between gap-3 font-bold">
                <span>{domain}</span>
                <span>{count}件</span>
              </p>
            ))}
            {domainCounts.length === 0 ? <p className="text-stone-500">該当なし</p> : null}
          </div>
        </div>
        <div className="panel p-5">
          <p className="text-sm font-bold text-stone-600">紹介者未記入</p>
          <p className="mt-2 text-4xl font-black text-accent">{referralRowsWithoutName.length}</p>
          <p className="mt-2 text-xs font-bold leading-5 text-stone-500">
            紹介系流入で紹介者名が未記入の回答数です。
          </p>
        </div>
      </section>

      {adminError ? (
        <section className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-bold leading-7 text-rose-800">
          {dataSource === "local"
            ? "Supabaseからデータを取得できませんでした。画面表示はローカルデータにフォールバックしています。"
            : "処理に失敗しました。"}
          <br />
          {adminError}
        </section>
      ) : null}

      {adminMessage ? (
        <section className="rounded-lg border border-teal-200 bg-teal-50 p-4 text-sm font-bold text-teal-900">
          {adminMessage}
        </section>
      ) : null}

      <section className="panel overflow-hidden">
        <div className="border-b border-stone-200 p-5">
          <h2 className="text-xl font-black text-ink">回答一覧表示</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-left text-sm">
            <thead className="bg-stone-50 text-stone-600">
              <tr>
                <th className="px-4 py-3">回答日時</th>
                <th className="px-4 py-3">氏名</th>
                <th className="px-4 py-3">会社名</th>
                <th className="px-4 py-3">メールアドレス</th>
                <th className="px-4 py-3">総合スコア</th>
                <th className="px-4 py-3">高スコア上位3テーマ</th>
                <th className="px-4 py-3">優先確認テーマ</th>
                <th className="px-4 py-3">詳細</th>
                <th className="px-4 py-3">FB</th>
                <th className="px-4 py-3">削除</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {rows.map((row) => (
                <tr key={row.id} className={selectedId === row.id ? "bg-teal-50/50" : undefined}>
                  <td className="whitespace-nowrap px-4 py-3 text-stone-600">{formatDate(row.createdAt)}</td>
                  <td className="px-4 py-3">{row.representativeName}</td>
                  <td className="px-4 py-3 font-black text-ink">{row.companyName}</td>
                  <td className="max-w-64 truncate px-4 py-3" title={row.email}>{row.email}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-bold">
                    {row.totalScore}/192
                    <span className="ml-1 text-xs text-stone-500">({row.achievementRate}%)</span>
                  </td>
                  <td className="px-4 py-3">
                    <ThemeTags themes={row.topThemes} />
                  </td>
                  <td className="px-4 py-3">
                    <ThemeTags themes={row.priorityThemes.length > 0 ? row.priorityThemes : row.lowThemes} />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      className="rounded-md border border-stone-300 px-3 py-2 text-xs font-black text-ink hover:border-brand hover:text-brand"
                      onClick={() => setSelectedId(row.id)}
                      type="button"
                    >
                      詳細
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      className="rounded-md bg-brand px-3 py-2 text-xs font-black text-white hover:bg-teal-800"
                      href={`/admin/reports/${row.responseId ?? row.id}`}
                    >
                      FB作成
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-black text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={dataSource !== "supabase"}
                      onClick={() => setDeleteTarget(row)}
                      type="button"
                    >
                      削除
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-stone-600" colSpan={10}>
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
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold text-stone-500">FEEDBACK REPORT</p>
                <p className="mt-1 text-sm leading-6 text-stone-700">
                  この回答データをもとに、管理者用のフィードバックレポートを作成・編集できます。
                </p>
              </div>
              <Link className="primary-button" href={`/admin/reports/${selectedRow.responseId ?? selectedRow.id}`}>
                FBレポート作成
              </Link>
            </div>

            <div className="grid gap-3 text-sm sm:grid-cols-3">
              {[
                ["回答日時", formatDate(selectedRow.createdAt)],
                ["会社名", selectedRow.companyName],
                ["氏名", selectedRow.representativeName],
                ["メールアドレス", selectedRow.email],
                ["流入経路", selectedRow.trafficSource || "-"],
                ["紹介者名", selectedRow.referrerName || "-"],
                ["紹介元会社名", selectedRow.referrerCompany || "-"],
                ["紹介者メールアドレス", selectedRow.referrerEmail || "-"],
                ["同意", selectedRow.consentAgreed ? "同意済み" : "未同意"],
                ["同意日時", selectedRow.consentAgreedAt ? formatDate(selectedRow.consentAgreedAt) : "-"],
                ["IPハッシュ", selectedRow.ipHash || "-"],
                ["User-Agent", selectedRow.userAgent || "-"],
                ["結果URL期限", selectedRow.resultTokenExpiresAt ? formatDate(selectedRow.resultTokenExpiresAt) : "-"],
                ["結果閲覧回数", String(selectedRow.resultViewCount)],
                ["結果最終閲覧日時", selectedRow.resultLastViewedAt ? formatDate(selectedRow.resultLastViewedAt) : "-"],
                ["受検者メール送信日時", selectedRow.participantEmailSentAt ? formatDate(selectedRow.participantEmailSentAt) : "-"],
                ["受検者メールエラー", selectedRow.participantEmailError || "-"],
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

            <div className="rounded-md border border-stone-200 bg-white p-5">
              <h3 className="text-lg font-black text-ink">16テーマ レーダーチャート</h3>
              <p className="mt-1 text-sm text-stone-600">
                詳細確認用に、実スコアと目標値を表示しています。
              </p>
              <div className="mt-4 h-80 w-full">
                <ResponsiveContainer height="100%" width="100%">
                  <RadarChart
                    data={selectedRow.themeScores.map((theme) => ({
                      theme: theme.name,
                      score: theme.score,
                      target: theme.target
                    }))}
                  >
                    <PolarGrid />
                    <PolarAngleAxis dataKey="theme" tick={{ fontSize: 10 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 12]} tickCount={5} />
                    <Radar dataKey="target" fill="#d97706" fillOpacity={0.12} name="目標値" stroke="#d97706" />
                    <Radar dataKey="score" fill="#0f766e" fillOpacity={0.35} name="実スコア" stroke="#0f766e" />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
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

      {deleteTarget ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 px-4"
          role="dialog"
        >
          <section className="w-full max-w-lg rounded-lg bg-white p-6 shadow-soft">
            <p className="text-sm font-bold text-rose-700">DELETE RESPONSE</p>
            <h2 className="mt-2 text-2xl font-black text-ink">この回答データを削除しますか？</h2>
            <p className="mt-3 leading-7 text-stone-700">
              削除すると、回答データと紐づくFBレポートも削除されます。この操作は元に戻せません。
            </p>

            <dl className="mt-4 grid gap-3 rounded-md bg-stone-50 p-4 text-sm">
              <div>
                <dt className="font-bold text-stone-500">回答者名</dt>
                <dd className="mt-1 font-black text-ink">{deleteTarget.representativeName || "-"}</dd>
              </div>
              <div>
                <dt className="font-bold text-stone-500">会社名</dt>
                <dd className="mt-1 font-black text-ink">{deleteTarget.companyName || "-"}</dd>
              </div>
              <div>
                <dt className="font-bold text-stone-500">メールアドレス</dt>
                <dd className="mt-1 break-all font-black text-ink">{deleteTarget.email || "-"}</dd>
              </div>
            </dl>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                className="secondary-button"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                type="button"
              >
                キャンセル
              </button>
              <button
                className="inline-flex min-h-12 items-center justify-center rounded-md bg-rose-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-rose-800 disabled:cursor-not-allowed disabled:bg-stone-300"
                disabled={isDeleting}
                onClick={handleDeleteResponse}
                type="button"
              >
                {isDeleting ? "削除中..." : "削除する"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
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
