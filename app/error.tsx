"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-16 text-white">
      <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center text-center">
        <p className="text-sm font-black tracking-[0.18em] text-teal-300">ERROR</p>
        <h1 className="mt-4 text-3xl font-black leading-tight sm:text-4xl">ページの表示中にエラーが発生しました</h1>
        <p className="mt-5 leading-8 text-slate-300">
          一時的な問題の可能性があります。再読み込みしても解消しない場合は、時間をおいて再度お試しください。
        </p>
        <button
          className="mt-8 inline-flex min-h-12 items-center justify-center rounded-md bg-teal-400 px-6 py-3 text-sm font-black text-slate-950 transition hover:bg-teal-300"
          onClick={reset}
          type="button"
        >
          再読み込みする
        </button>
      </div>
    </main>
  );
}
