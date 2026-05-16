import Link from "next/link";

const featureItems = [
  "48問・約7分で経営状態を可視化",
  "16テーマごとに12点満点で採点",
  "強み・弱み・目標との差分を即時表示"
];

export default function HomePage() {
  return (
    <main className="page-shell flex items-center">
      <section className="grid w-full gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="space-y-7">
          <div className="inline-flex rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-sm font-bold text-brand">
            社長カルテ デモ診断
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-black leading-tight tracking-normal text-ink sm:text-5xl">
              社長の現在地を、16テーマで見える化する。
            </h1>
            <p className="max-w-2xl text-base leading-8 text-stone-700 sm:text-lg">
              理念、戦略、財務、営業、組織、人材、DX、社長自身の状態まで。
              デモ診断では回答直後にスコアと重点テーマを確認できます。
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link className="primary-button" href="/start">
              無料デモ診断を開始
            </Link>
          </div>
        </div>

        <div className="panel overflow-hidden">
          <div className="bg-brand px-5 py-4 text-white">
            <p className="text-sm font-bold opacity-90">診断アウトプット</p>
            <p className="mt-1 text-2xl font-black">総合スコア / 192点</p>
          </div>
          <div className="space-y-4 p-5">
            {featureItems.map((item, index) => (
              <div key={item} className="flex gap-3 rounded-md bg-stone-50 p-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-black text-accent">
                  {index + 1}
                </span>
                <p className="font-bold text-stone-800">{item}</p>
              </div>
            ))}
            <div className="grid grid-cols-3 gap-3 pt-2 text-center">
              <div className="rounded-md bg-teal-50 p-3">
                <p className="text-2xl font-black text-brand">48</p>
                <p className="text-xs font-bold text-stone-600">質問</p>
              </div>
              <div className="rounded-md bg-amber-50 p-3">
                <p className="text-2xl font-black text-accent">16</p>
                <p className="text-xs font-bold text-stone-600">テーマ</p>
              </div>
              <div className="rounded-md bg-stone-100 p-3">
                <p className="text-2xl font-black text-ink">4</p>
                <p className="text-xs font-bold text-stone-600">段階回答</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
