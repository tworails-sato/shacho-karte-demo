"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { saveLocalDraft, type StoredDraft } from "@/lib/storage";

export default function AssessmentResumePage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const [message, setMessage] = useState("途中保存データを確認しています。");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    async function resume() {
      try {
        const token = params.token;
        if (!token) throw new Error("再開URLが正しくありません。");

        const response = await fetch(`/api/assessment-resume?token=${encodeURIComponent(token)}`);
        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload?.draft) {
          setIsError(true);
          setMessage(payload?.error || "再開できませんでした。");
          return;
        }

        const draft = payload.draft as StoredDraft;
        saveLocalDraft(draft);
        window.localStorage.setItem("shacho-karte-basic-info", JSON.stringify(draft.basicInfo));
        setMessage("保存した続きから再開します。");
        router.replace("/diagnosis");
      } catch (error) {
        console.error("Assessment resume failed", error);
        setIsError(true);
        setMessage("再開できませんでした。時間をおいて再度お試しください。");
      }
    }

    resume();
  }, [params.token, router]);

  return (
    <main className="page-shell flex min-h-screen items-center justify-center">
      <section className="panel max-w-xl p-6 text-center">
        <p className="text-sm font-bold text-brand">社長カルテ Light</p>
        <h1 className="mt-2 text-2xl font-black text-ink">
          {isError ? "回答を再開できません" : "回答を再開しています"}
        </h1>
        <p className="mt-3 whitespace-pre-wrap leading-7 text-stone-700">{message}</p>
        {isError ? (
          <Link className="primary-button mt-5" href="/basic-info">
            最初から診断を受ける
          </Link>
        ) : null}
      </section>
    </main>
  );
}
