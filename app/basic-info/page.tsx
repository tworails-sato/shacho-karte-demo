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
  usagePurpose: "",
  demoTermsAgreed: false,
  demoTermsAgreedAt: "",
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
const usagePurposes = [
  "自分自身の振り返り",
  "サービス内容の確認",
  "クライアント支援での活用を検討",
  "営業活動での活用を検討",
  "その他"
];

export default function BasicInfoPage() {
  const router = useRouter();
  const [info, setInfo] = useState<BasicInfo>(initialInfo);
  const [eligibilityError, setEligibilityError] = useState("");
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const shouldShowReferrerName = referralSources.includes(info.trafficSource);
  const shouldRequireConsent = info.category === "経営支援者";

  function updateField(key: keyof BasicInfo, value: string | boolean) {
    setInfo((current) => {
      if (key === "category" && typeof value === "string" && value !== "経営支援者") {
        return { ...current, [key]: value, consentAgreed: false, consentAgreedAt: "" };
      }

      return { ...current, [key]: value };
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEligibilityError("");
    const emailNormalized = info.email.trim().toLowerCase();
    const submittedInfo: BasicInfo = {
      ...info,
      email: emailNormalized,
      emailNormalized,
      referrerName: shouldShowReferrerName ? info.referrerName.trim() : "",
      demoTermsAgreedAt: info.demoTermsAgreed ? new Date().toISOString() : "",
      consentAgreed: shouldRequireConsent ? info.consentAgreed : false,
      consentAgreedAt: shouldRequireConsent && info.consentAgreed ? new Date().toISOString() : ""
    };

    setCheckingEligibility(true);
    const eligibility = await fetch("/api/demo-eligibility", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailNormalized })
    });
    setCheckingEligibility(false);
    if (!eligibility.ok) {
      const payload = await eligibility.json().catch(() => ({}));
      setEligibilityError(payload.error || "このメールアドレスでは現在受検できません。");
      return;
    }

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
            診断結果の表示に使用する基本情報です。
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
            <span className="label">受検者区分 *</span>
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

          <label className="space-y-2">
            <span className="label">利用目的 *</span>
            <select
              className="field"
              required
              value={info.usagePurpose}
              onChange={(event) => updateField("usagePurpose", event.target.value)}
            >
              <option value="">選択してください</option>
              {usagePurposes.map((purpose) => (
                <option key={purpose} value={purpose}>{purpose}</option>
              ))}
            </select>
          </label>

          <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-7 text-amber-950">
            <p>本アセスメントは、ご本人による診断・体験を目的としたものです。</p>
            <p className="mt-2">
              当社の許諾なく、第三者への配布、営業活動等での利用、
              設問・診断結果・画面構成の転載、複製、改変、
              類似サービスへの転用を行うことはできません。
            </p>
            <label className="mt-3 flex items-start gap-3">
              <input
                className="mt-1 h-4 w-4 shrink-0"
                required
                type="checkbox"
                checked={info.demoTermsAgreed}
                onChange={(event) => updateField("demoTermsAgreed", event.target.checked)}
              />
              <span>上記の利用条件に同意して診断を開始します</span>
            </label>
          </div>

          {shouldRequireConsent ? (
            <label className="flex items-start gap-3 rounded-md border border-stone-200 bg-stone-50 p-4">
              <input
                className="mt-1 h-4 w-4 shrink-0"
                required
                type="checkbox"
                checked={info.consentAgreed}
                onChange={(event) => updateField("consentAgreed", event.target.checked)}
              />
              <span className="text-sm font-bold leading-7 text-stone-700">
                ●経営支援者の方へ
                <br />
                本診断をクライアント社内への展開、ご提案、顧客向け診断として利用する場合は、
                事前に運営の許諾が必要です。
              </span>
            </label>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            {eligibilityError ? (
              <p className="whitespace-pre-wrap rounded-md border border-rose-200 bg-rose-50 p-4 text-sm font-bold leading-7 text-rose-800">
                {eligibilityError}
              </p>
            ) : null}
            <button className="primary-button" disabled={checkingEligibility} type="submit">
              {checkingEligibility ? "確認中..." : "アセスメントに進む"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
