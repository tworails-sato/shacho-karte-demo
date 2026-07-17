import Link from "next/link";

export default function PartnersThanksPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f8fa] px-5 py-12 text-[#0d1b2a]">
      <section className="w-full max-w-xl rounded-[22px] border border-[#e7edf2] bg-white p-8 text-center shadow-[0_20px_60px_rgba(20,40,60,0.08)] sm:p-10">
        <p className="text-xs font-black tracking-[0.2em] text-[#2bb488]">THANK YOU</p>
        <h1 className="mt-3 font-serif text-3xl font-black leading-relaxed">
          お問い合わせありがとうございました
        </h1>
        <p className="mt-4 text-base font-semibold leading-8 text-[#5b6b7a]">
          内容を確認のうえ、担当者よりご連絡いたします。
        </p>
        <Link
          className="mt-8 inline-flex rounded-xl bg-[#0d1b2a] px-7 py-4 text-base font-black text-white transition hover:bg-[#12283d]"
          href="/partners.html"
        >
          Partnersページへ戻る
        </Link>
      </section>
    </main>
  );
}
