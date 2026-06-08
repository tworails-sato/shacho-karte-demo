const themeGuides = [
  {
    id: "profitability",
    group: "市場性",
    name: "収益性",
    description: "利益を生み出す構造や、継続的に利益を確保できる状態を見ています。"
  },
  {
    id: "market-growth",
    group: "市場性",
    name: "成長性",
    description: "売上・顧客・市場規模が伸びていくかどうかを見ています。"
  },
  {
    id: "scalability",
    group: "市場性",
    name: "拡張性",
    description: "特定の人や時間に依存しすぎず、再現性や仕組みを創れているかを見ています。"
  },
  {
    id: "advantage",
    group: "市場性",
    name: "優位性・強み",
    description: "他社と比べた強みや、選ばれる理由が明確になっているかを見ています。"
  },
  {
    id: "business-risk",
    group: "事業体制",
    name: "事業リスク把握",
    description: "事業上のリスクや変化に対して、どこまで備えられているかを見ています。"
  },
  {
    id: "investment",
    group: "事業体制",
    name: "内部投資",
    description: "人・仕組み・システム投資など、将来の成長に向けた投資状況を見ています。"
  },
  {
    id: "functionality",
    group: "事業体制",
    name: "組織の機能性",
    description: "役割分担や連携が機能し、組織として動けているかを見ています。"
  },
  {
    id: "continuity",
    group: "事業体制",
    name: "事業継続性",
    description: "特定の人や取引先に依存しすぎず、安定して事業を続けられるかを見ています。"
  },
  {
    id: "social-impact",
    group: "事業社会性",
    name: "社会貢献性",
    description: "事業が顧客・地域・社会にどのような価値を届けているかを見ています。"
  },
  {
    id: "branding",
    group: "事業社会性",
    name: "ブランディング",
    description: "自社の価値やらしさが、社内外に伝わっているかを見ています。"
  },
  {
    id: "internal-engagement",
    group: "事業社会性",
    name: "社内エンゲージメント",
    description: "社員が会社の方針や仕事に前向きに関われているかを見ています。"
  },
  {
    id: "customer-engagement",
    group: "事業社会性",
    name: "顧客エンゲージメント",
    description: "顧客との関係性や、継続的に選ばれる状態を見ています。"
  },
  {
    id: "organization-building",
    group: "経営基盤",
    name: "組織構築力",
    description: "採用・育成・配置など、組織を作り続ける力を見ています。"
  },
  {
    id: "management-structure",
    group: "経営基盤",
    name: "経営体制構築",
    description: "意思決定の精度を上げるための管理体制が整っているかを見ています。"
  },
  {
    id: "decision-making",
    group: "経営基盤",
    name: "意思決定力",
    description: "必要な情報をもとに適切な判断・実行できているかを見ています。"
  },
  {
    id: "business-creation",
    group: "経営基盤",
    name: "新規事業性",
    description: "新しい価値や事業機会を生み出す動きを実践しているかを見ています。"
  }
];

const groupStyles: Record<string, string> = {
  市場性: "border-blue-200 bg-blue-50 text-blue-800",
  事業体制: "border-teal-200 bg-teal-50 text-teal-800",
  事業社会性: "border-amber-200 bg-amber-50 text-amber-800",
  経営基盤: "border-rose-200 bg-rose-50 text-rose-800"
};

export default function ThemeGuidePage() {
  return (
    <main className="page-shell">
      <section className="panel p-6">
        <p className="text-sm font-bold text-brand">SHACHO KARTE LIGHT</p>
        <h1 className="mt-2 text-3xl font-black text-ink">16テーマの見方</h1>
        <p className="mt-3 max-w-3xl leading-7 text-stone-700">
          各テーマは、スコアの高低だけで判断するものではなく、どのテーマを経営課題として優先するかを見るための参考情報です。
        </p>
      </section>

      <section className="mt-5 grid gap-4 md:grid-cols-2">
        {themeGuides.map((theme, index) => (
          <article
            className="panel scroll-mt-6 p-5"
            id={`theme-guide-${theme.id}`}
            key={theme.id}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black text-brand">T{index + 1}</span>
              <span className={`rounded-full border px-2 py-1 text-xs font-black ${groupStyles[theme.group]}`}>
                {theme.group}
              </span>
            </div>
            <h2 className="mt-3 text-xl font-black text-ink">{theme.name}</h2>
            <p className="mt-2 leading-7 text-stone-700">{theme.description}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
