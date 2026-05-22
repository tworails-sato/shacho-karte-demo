"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { BasicInfo } from "@/lib/diagnosis";

const initialInfo: BasicInfo = {
  companyName: "",
  representativeName: "",
  email: "",
  emailNormalized: "",
  industry: "",
  category: "",
  trafficSource: "",
  referrerName: "",
  referrerCompany: "",
  referrerEmail: "",
  consentAgreed: false,
  consentAgreedAt: ""
};

const fields = [
  { key: "companyName", label: "会社名", type: "text", required: true },
  { key: "representativeName", label: "氏名", type: "text", required: true },
  { key: "email", label: "メールアドレス", type: "email", required: true },
  { key: "industry", label: "業種", type: "text", required: false }
] as const;

const categories = ["経営者", "経営支援者", "その他"];
const trafficSources = [
  "SNS",
  "note",
  "Web検索",
  "知人・取引先からの紹介",
  "経営支援者・コンサルタントからの紹介",
  "セミナー・イベント",
  "その他"
];
const referralSources = [
  "知人・取引先からの紹介",
  "経営支援者・コンサルタントからの紹介"
];

export default function BasicInfoPage() {
  const router = useRouter();
  const [info, setInfo] = useState<BasicInfo>(initialInfo);
  const shouldShowReferrerName = referralSources.includes(info.trafficSource);

  function updateField(key: keyof BasicInfo, value: string | boolean) {
    setInfo((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const emailNormalized = info.email.trim().toLowerCase();
    const submittedInfo: BasicInfo = {
      ...info,
      email: emailNormalized,
      emailNormalized,
      referrerName: shouldShowReferrerName ? info.referrerName.trim() : "",
      consentAgreed: true,
      consentAgreedAt: new Date().toISOString()
    };

    window.localStorage.setItem("shacho-karte-basic-info", JSON.stringify(submittedInfo));
    router.push("/diagnosis");
  }

  return (
    <main className="page-shell">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <p className="text-sm font-bold text-brand">STEP 1</p>
          <h1 className="mt-2 text-3xl font-black text-ink">基本情報</h1>
          <p className="mt-3 leading-7 text-stone-700">
            診断結果の表示に使用する基本情報です。デモではブラウザに保存します。
          </p>
        </div>

        <form className="panel space-y-5 p-5 sm:p-6" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((field) => (
              <label key={field.key} className="space-y-2">
                <span className="label">
                  {field.label}
                  {field.required ? " *" : ""}
                </span>
                <input
                  className="field"
                  required={field.required}
                  type={field.type}
                  value={info[field.key]}
                  onChange={(event) => updateField(field.key, event.target.value)}
                />
              </label>
            ))}
          </div>

          <label className="space-y-2">
            <span className="label">区分 *</span>
            <select
              className="field"
              required
              value={info.category}
              onChange={(event) => updateField("category", event.target.value)}
            >
              <option value="">選択してください</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="label">この診断をどちらでお知りになりましたか？ *</span>
            <select
              className="field"
              required
              value={info.trafficSource}
              onChange={(event) => updateField("trafficSource", event.target.value)}
            >
              <option value="">選択してください</option>
              {trafficSources.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>
          </label>

          {shouldShowReferrerName ? (
            <label className="space-y-2">
              <span className="label">ご紹介者様のお名前</span>
              <input
                className="field"
                type="text"
                value={info.referrerName}
                onChange={(event) => updateField("referrerName", event.target.value)}
              />
            </label>
          ) : null}

          <label className="flex items-start gap-3 rounded-md border border-stone-200 bg-stone-50 p-4">
            <input
              className="mt-1 h-4 w-4 shrink-0"
              required
              type="checkbox"
              checked={info.consentAgreed}
              onChange={(event) => updateField("consentAgreed", event.target.checked)}
            />
            <span className="text-sm font-bold leading-7 text-stone-700">
              本診断は回答者ご本人の経営課題の整理を目的としたデモです。第三者への提供、営業提案、顧客向け診断として利用する場合は、事前に運営の許諾が必要です。
            </span>
          </label>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button className="primary-button" type="submit">
              アセスメントに進む
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
