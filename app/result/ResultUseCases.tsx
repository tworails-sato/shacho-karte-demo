const useCases = [
  {
    title: "経営課題の棚卸し",
    body: "今後優先して整理すべき経営課題やアクションを明確にする"
  },
  {
    title: "外部支援者との対話",
    body: "外部パートナーやコーチに相談するテーマや論点を明確にする"
  },
  {
    title: "幹部・メンバーとの対話",
    body: "経営者の頭の中にあるテーマを言語化し、共通認識をつくる"
  },
  {
    title: "合宿・経営会議での活用",
    body: "今後の経営方針や、社内へのメッセージングするテーマを2〜3個に絞る"
  },
  {
    title: "経営支援での活用",
    body: "クライアントの課題設定や整理の糸口として活用する"
  }
];

export default function ResultUseCases() {
  return (
    <section className="rounded-lg border border-amber-100 bg-amber-50 p-5">
      <div className="max-w-3xl">
        <h2 className="text-xl font-black text-amber-950">社長カルテの活用シーン</h2>
        <p className="mt-3 text-sm font-bold leading-7 text-amber-900">
          診断結果は、評価や採点ではなく、次に何を話すか・どのテーマから整理するかを見つけるためのたたき台として活用できます。
        </p>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {useCases.map((item) => (
          <article key={item.title} className="rounded-md border border-amber-100 bg-white/80 p-4">
            <h3 className="font-black leading-6 text-amber-950">{item.title}</h3>
            <p className="mt-2 text-sm leading-6 text-stone-700">{item.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
