"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { BasicInfo } from "@/lib/diagnosis";

const initialInfo: BasicInfo = {
  companyName: "",
  representativeName: "",
  email: "",
  industry: "",
  category: ""
};

const fields = [
  { key: "companyName", label: "会社名", type: "text", required: true },
  { key: "representativeName", label: "氏名", type: "text", required: true },
  { key: "email", label: "メールアドレス", type: "email", required: false },
  { key: "industry", label: "業種", type: "text", required: false }
] as const;

const categories = ["経営者", "経営支援者", "その他"];

export default function BasicInfoPage() {
  const router = useRouter();
  const [info, setInfo] = useState<BasicInfo>(initialInfo);

  function updateField(key: keyof BasicInfo, value: string) {
    setInfo((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    window.localStorage.setItem("shacho-karte-basic-info", JSON.stringify(info));
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

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button className="primary-button" type="submit">
              48問診断へ進む
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
