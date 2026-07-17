"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";

const inquiryTypeOptions = [
  "プラン・料金について知りたい",
  "クライアントへの導入・提案について相談したい",
  "OEM・カスタマイズについて相談したい",
  "協業・提携について相談したい",
  "打ち合わせを希望したい",
  "その他"
];

type FormState = {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  inquiryType: string;
  message: string;
  privacyAgreed: boolean;
  website: string;
};

type FormErrors = Partial<Record<keyof FormState | "form", string>>;

const initialForm: FormState = {
  companyName: "",
  contactName: "",
  email: "",
  phone: "",
  inquiryType: "",
  message: "",
  privacyAgreed: false,
  website: ""
};

export default function PartnersContactPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined, form: undefined }));
  }

  function validate() {
    const nextErrors: FormErrors = {};
    if (!form.companyName.trim()) nextErrors.companyName = "会社名を入力してください。";
    if (!form.contactName.trim()) nextErrors.contactName = "担当者名を入力してください。";
    if (!form.email.trim()) {
      nextErrors.email = "メールアドレスを入力してください。";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = "メールアドレスの形式で入力してください。";
    }
    if (!form.inquiryType) nextErrors.inquiryType = "お問い合わせ種別を選択してください。";
    if (form.inquiryType === "その他" && !form.message.trim()) {
      nextErrors.message = "その他を選択した場合は、ご相談内容を入力してください。";
    }
    if (!form.privacyAgreed) nextErrors.privacyAgreed = "個人情報の取り扱いに同意してください。";
    return nextErrors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const response = await fetch("/api/partners/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setErrors(payload?.fieldErrors ?? { form: payload?.error || "送信に失敗しました。時間をおいて再度お試しください。" });
        return;
      }

      router.push("/partners/thanks");
    } catch (error) {
      console.error("Partners contact submit failed", error);
      setErrors({ form: "送信に失敗しました。時間をおいて再度お試しください。" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f8fa] text-[#0d1b2a]">
      <header className="border-b border-[#e7edf2] bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <Link className="font-serif text-lg font-black text-[#0d1b2a]" href="/partners.html">
            社長カルテ <span className="text-[#2bb488]">for Partners</span>
          </Link>
          <Link className="rounded-full border border-[#d6e2ea] px-4 py-2 text-sm font-bold text-[#0d1b2a]" href="/partners.html">
            Partnersページへ戻る
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-5 py-14 sm:py-20">
        <div className="text-center">
          <p className="text-xs font-black tracking-[0.2em] text-[#2bb488]">CONTACT</p>
          <h1 className="mt-3 font-serif text-3xl font-black leading-relaxed sm:text-4xl">
            社長カルテPartnersへのお問い合わせ
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm font-medium leading-8 text-[#5b6b7a] sm:text-base">
            導入相談、OEM、協業、エンタープライズプランなどについて、お気軽にお問い合わせください。
          </p>
        </div>

        <form className="mx-auto mt-10 max-w-3xl rounded-[22px] border border-[#e7edf2] bg-white p-6 shadow-[0_20px_60px_rgba(20,40,60,0.08)] sm:p-10" onSubmit={handleSubmit}>
          {errors.form ? (
            <div className="mb-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
              {errors.form}
            </div>
          ) : null}

          <div className="hidden">
            <label htmlFor="website">Website</label>
            <input
              autoComplete="off"
              id="website"
              name="website"
              onChange={(event) => updateField("website", event.target.value)}
              tabIndex={-1}
              value={form.website}
            />
          </div>

          <div className="grid gap-5">
            <Field label="会社名" required error={errors.companyName}>
              <input className="form-input" maxLength={120} onChange={(event) => updateField("companyName", event.target.value)} value={form.companyName} />
            </Field>

            <Field label="担当者名" required error={errors.contactName}>
              <input className="form-input" maxLength={80} onChange={(event) => updateField("contactName", event.target.value)} value={form.contactName} />
            </Field>

            <Field label="メールアドレス" required error={errors.email}>
              <input className="form-input" inputMode="email" maxLength={160} onChange={(event) => updateField("email", event.target.value)} type="email" value={form.email} />
            </Field>

            <Field label="電話番号" error={errors.phone}>
              <input className="form-input" inputMode="tel" maxLength={40} onChange={(event) => updateField("phone", event.target.value)} value={form.phone} />
            </Field>

            <Field label="お問い合わせ種別" required error={errors.inquiryType}>
              <select className="form-input" onChange={(event) => updateField("inquiryType", event.target.value)} value={form.inquiryType}>
                <option value="">選択してください</option>
                {inquiryTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="ご相談内容" required={form.inquiryType === "その他"} error={errors.message}>
              <textarea
                className="form-input min-h-40 resize-y"
                maxLength={2000}
                onChange={(event) => updateField("message", event.target.value)}
                placeholder={form.inquiryType === "その他" ? "ご相談内容を入力してください。" : "補足があればご記入ください。"}
                value={form.message}
              />
            </Field>

            {form.inquiryType === "その他" ? (
              <p className="rounded-xl bg-amber-50 p-3 text-sm font-bold leading-7 text-amber-900">
                「その他」を選択された場合は、ご相談内容の入力をお願いします。
              </p>
            ) : null}

            <div>
              <label className="flex gap-3 rounded-xl border border-[#e7edf2] bg-[#f5f8fa] p-4 text-sm font-bold leading-7 text-[#0d1b2a]">
                <input checked={form.privacyAgreed} className="mt-1 h-4 w-4 shrink-0" onChange={(event) => updateField("privacyAgreed", event.target.checked)} type="checkbox" />
                <span>個人情報の取り扱いに同意します <span className="text-red-600">必須</span></span>
              </label>
              {errors.privacyAgreed ? <p className="mt-2 text-sm font-bold text-red-600">{errors.privacyAgreed}</p> : null}
            </div>
          </div>

          <button className="mt-8 w-full rounded-xl bg-[#0d1b2a] px-6 py-4 text-base font-black text-white transition hover:bg-[#12283d] disabled:cursor-not-allowed disabled:opacity-60" disabled={isSubmitting} type="submit">
            {isSubmitting ? "送信中…" : "お問い合わせを送信する"}
          </button>
        </form>
      </section>

      <style jsx>{`
        .form-input {
          width: 100%;
          border-radius: 12px;
          border: 1px solid #d6e2ea;
          background: #ffffff;
          padding: 13px 14px;
          font-size: 16px;
          font-weight: 600;
          outline: none;
        }
        .form-input:focus {
          border-color: #2bb488;
          box-shadow: 0 0 0 3px rgba(62, 207, 158, 0.18);
        }
      `}</style>
    </main>
  );
}

function Field({
  children,
  error,
  label,
  required = false
}: {
  children: ReactNode;
  error?: string;
  label: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-[#0d1b2a]">
        {label} {required ? <span className="text-red-600">必須</span> : <span className="text-[#7b8b9a]">任意</span>}
      </span>
      {children}
      {error ? <span className="mt-2 block text-sm font-bold text-red-600">{error}</span> : null}
    </label>
  );
}
