import type { ThemeScore } from "./diagnosis";
import type { ManagementPhase, ManagementStyleDefinition } from "./management-style";
import { displayThemeLabel } from "./report-visuals";

const themeQuestionTemplates: Record<string, string[]> = {
  profitability: [
    "収益性について、利益が残る商品・顧客・商流をどのように見極めていますか。",
    "今後3か月で、粗利や継続収益を見直すとしたら、どの数字から確認しますか。"
  ],
  "market-growth": [
    "成長性について、今後広げたい市場や顧客層はどこにありますか。",
    "現在の商談や問い合わせは、どの市場変化から生まれていると感じますか。"
  ],
  scalability: [
    "拡張性について、社長や特定メンバーに依存している業務はどこにありますか。",
    "再現性を高めるために、まず標準化したい業務は何ですか。"
  ],
  advantage: [
    "優位性について、顧客が自社を選んでいる理由をどのように説明できますか。",
    "競合と比較したときに、今後さらに磨きたい強みは何ですか。"
  ],
  "business-risk": [
    "事業リスクについて、売上・人材・取引先の偏りで気になっている点はありますか。",
    "想定外の変化が起きた際、最初に確認すべきリスクは何ですか。"
  ],
  investment: [
    "内部投資について、今後の成長に向けて優先したい人・仕組み・システム投資は何ですか。",
    "投資判断の基準や効果測定は、どのように整理されていますか。"
  ],
  functionality: [
    "組織機能について、現場で判断できることと相談が必要なことは整理されていますか。",
    "役割分担や連携で、いま一番詰まりやすい箇所はどこですか。"
  ],
  continuity: [
    "事業継続性について、特定の人や取引先に依存している部分はありますか。",
    "継続的に事業を届けるために、今後備えておきたい仕組みは何ですか。"
  ],
  "social-impact": [
    "社会貢献性について、自社が顧客や地域に届けている価値をどのように言語化していますか。",
    "理念や社会的な意義を、採用・営業・広報にどう活かせそうですか。"
  ],
  branding: [
    "ブランディングについて、社外から見た自社の印象と伝えたい姿にズレはありますか。",
    "第一想起を取るために、どの接点から見直すと効果がありそうですか。"
  ],
  "internal-engagement": [
    "社内エンゲージメントについて、社員が方針を自分ごと化できている場面はどこにありますか。",
    "理念や方針を日々の行動に落とし込むために、どの接点を整えたいですか。"
  ],
  "customer-engagement": [
    "顧客エンゲージメントについて、継続利用や紹介につながっている理由は何ですか。",
    "顧客の声を、商品改善や提案にどう反映できていますか。"
  ],
  "organization-building": [
    "組織構築力について、採用・育成・配置で今後見直したいテーマは何ですか。",
    "次の成長に向けて、どの役割を先に整える必要がありますか。"
  ],
  "management-structure": [
    "経営体制構築について、社長以外が判断できる領域はどこまで広がっていますか。",
    "No.2や責任者に任せるために、次に整理したい基準は何ですか。"
  ],
  "decision-making": [
    "意思決定力について、判断が早い領域と時間がかかる領域にはどんな違いがありますか。",
    "今後、意思決定の質を上げるために整えたい情報や会議体は何ですか。"
  ],
  "business-creation": [
    "新規事業性について、新しい収益機会を検証する場や担当はありますか。",
    "既存事業を活かして、次に試せそうな新しい打ち手は何ですか。"
  ]
};

export function generateDiscussionPointsDraft(input: {
  growthThemes: ThemeScore[];
  mainStyle: ManagementStyleDefinition | null;
  phase: ManagementPhase | null;
}) {
  const questions = input.growthThemes
    .flatMap((theme) => themeQuestionTemplates[theme.id] ?? [`${displayThemeLabel(theme)}について、次に整理したい論点は何ですか。`])
    .slice(0, 3);

  const styleLine = input.mainStyle
    ? `現在の経営スタイルは「${input.mainStyle.name}」として表れています。この傾向を活かす場面と、補完したい領域を確認します。`
    : "現在の経営スタイルの傾向と、補完したい領域を確認します。";

  const phaseLine = input.phase
    ? `経営フェーズ「${input.phase.label}」を踏まえ、今後の優先順位を一緒に整理します。`
    : "現在の事業規模や組織状態を踏まえ、今後の優先順位を一緒に整理します。";

  return [styleLine, phaseLine, ...questions.map((question) => `・${question}`)].join("\n");
}
