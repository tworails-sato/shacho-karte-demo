import Link from "next/link";

const steps = [
  "基本情報を入力",
  "設問（全48問）に1〜4点で回答",
  "結果画面で強み・課題を確認",
  "個別解説のお申し込み（任意）"
];

export default function StartPage() {
  return (
    <main className="page-shell flex items-center">
      <section className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div className="space-y-5">
          <p className="text-sm font-bold text-brand">診断開始</p>
          <h1 className="text-3xl font-black leading-tight text-ink sm:text-5xl">
            社長カルテのデモ診断を始めます。
          </h1>
          <p className="max-w-2xl leading-8 text-stone-700">
            各設問は1〜4点満点です。
            <br />
            「1：あてはまらない 〜 4：あてはまる」で回答してください。
            <br />
            全問の回答後、総合スコアや診断結果を自動で表示します。
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link className="primary-button" href="/basic-info">
              基本情報入力へ進む
            </Link>
            <Link className="secondary-button" href="/">
              LPへ戻る
            </Link>
          </div>
        </div>

        <div className="panel p-5 sm:p-6">
          <h2 className="text-xl font-black text-ink">診断フロー</h2>
          <ol className="mt-5 space-y-3">
            {steps.map((step, index) => (
              <li key={step} className="flex gap-3 rounded-md bg-stone-50 p-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm font-black text-brand">
                  {index + 1}
                </span>
                <span className="pt-1 font-bold text-stone-800">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </main>
  );
}
