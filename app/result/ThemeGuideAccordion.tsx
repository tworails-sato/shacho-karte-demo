"use client";

const themeGuides = [
  {
    name: "収益性",
    description: "利益を生み出す構造や、継続的に利益を確保できる状態を見ています。"
  },
  {
    name: "成長性",
    description: "売上・顧客・市場規模が伸びていくかどうかを見ています。"
  },
  {
    name: "拡張性",
    description: "特定の人や時間に依存しすぎず、再現性や仕組みを創れているかを見ています。"
  },
  {
    name: "優位性・強み",
    description: "他社と比べた強みや、選ばれる理由が明確になっているかを見ています。"
  },
  {
    name: "事業リスク把握",
    description: "事業上のリスクや変化に対して、どこまで備えられているかを見ています。"
  },
  {
    name: "内部投資",
    description: "人・仕組み・システム投資など、将来の成長に向けた投資状況を見ています。"
  },
  {
    name: "組織の機能性",
    description: "役割分担や連携が機能し、組織として動けているかを見ています。"
  },
  {
    name: "事業継続性",
    description: "特定の人や取引先に依存しすぎず、安定して事業を続けられるかを見ています。"
  },
  {
    name: "社会貢献性",
    description: "事業が顧客・地域・社会にどのような価値を届けているかを見ています。"
  },
  {
    name: "ブランディング",
    description: "自社の価値やらしさが、社内外に伝わっているかを見ています。"
  },
  {
    name: "社内エンゲージメント",
    description: "社員が会社の方針や仕事に前向きに関われているかを見ています。"
  },
  {
    name: "顧客エンゲージメント",
    description: "顧客との関係性や、継続的に選ばれる状態を見ています。"
  },
  {
    name: "組織構築能力",
    description: "採用・育成・配置など、組織を作り続ける力を見ています。"
  },
  {
    name: "経営体制",
    description: "意思決定の精度を上げるための管理体制が整っているかを見ています。"
  },
  {
    name: "意思決定力",
    description: "必要な情報をもとに適切な判断・実行できているかを見ています。"
  },
  {
    name: "事業創出力",
    description: "新しい価値や事業機会を生み出す動きを実践しているかを見ています。"
  }
];

export default function ThemeGuideAccordion() {
  return (
    <section className="panel overflow-hidden">
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 transition hover:bg-stone-50">
          <div>
            <p className="text-sm font-bold text-brand">THEME GUIDE</p>
            <h2 className="mt-1 text-xl font-black text-ink">16テーマの見方を確認する</h2>
          </div>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-stone-100 text-lg font-black text-ink transition group-open:rotate-45">
            +
          </span>
        </summary>

        <div className="border-t border-stone-200 p-5 pt-4">
          <p className="rounded-md bg-stone-50 p-4 text-sm font-bold leading-7 text-stone-700">
            各テーマは、スコアの高低だけで判断するものではなく、どのテーマを経営課題として優先するかを見るための参考情報です。
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {themeGuides.map((theme) => (
              <div key={theme.name} className="rounded-md border border-stone-200 bg-white p-4">
                <p className="font-black text-ink">{theme.name}</p>
                <p className="mt-2 text-sm leading-6 text-stone-700">{theme.description}</p>
              </div>
            ))}
          </div>

          <p className="mt-4 rounded-md border border-amber-100 bg-amber-50 p-4 text-sm font-bold leading-7 text-amber-900">
            結果に表示されたテーマについては、数字だけでは読み解けない背景があります。必要に応じて、アクションプランを一緒に整理できます。
          </p>
        </div>
      </details>
    </section>
  );
}
