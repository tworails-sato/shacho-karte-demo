import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-16 text-white">
      <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center text-center">
        <p className="text-sm font-black tracking-[0.18em] text-teal-300">404</p>
        <h1 className="mt-4 text-3xl font-black leading-tight sm:text-4xl">ページが見つかりません</h1>
        <p className="mt-5 leading-8 text-slate-300">
          URLが変更されたか、ページが存在しない可能性があります。
        </p>
        <Link
          className="mt-8 inline-flex min-h-12 items-center justify-center rounded-md bg-teal-400 px-6 py-3 text-sm font-black text-slate-950 transition hover:bg-teal-300"
          href="/"
        >
          トップページへ戻る
        </Link>
      </div>
    </main>
  );
}
