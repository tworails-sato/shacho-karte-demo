import type { ThemeScore } from "./diagnosis";
import { getEmployeePhaseGuide } from "./employee-phase";

export type FeedbackDraftForm = {
  one_line_summary: string;
  summary: string;
  executive_type: string;
  psychological_tendency: string;
  strength: string;
  gap: string;
  short_term_action: string;
  mid_long_term_action: string;
  advisor_use_case: string;
};

type FeedbackDraftInput = {
  totalScore: number;
  achievementRate: number;
  themeScores: ThemeScore[];
  topThemes: ThemeScore[];
  priorityThemes: ThemeScore[];
  employeeSize?: string | null;
};

const themeSupportMap: Record<string, string> = {
  profitability: "収益構造の整理",
  "market-growth": "市場・顧客戦略の再設計",
  scalability: "業務標準化・再現性づくり",
  advantage: "差別化・提供価値の言語化",
  "business-risk": "リスク管理・事業ポートフォリオ整理",
  investment: "投資優先順位とKPI設計",
  functionality: "業務改善・権限整理",
  continuity: "事業継続体制の整備",
  "social-impact": "理念・社会的価値の整理",
  branding: "ブランディング・第一想起づくり",
  "internal-engagement": "組織開発・エンゲージメント向上",
  "customer-engagement": "顧客接点・継続率改善",
  "organization-building": "採用・育成・配置設計",
  "management-structure": "権限移譲・No.2育成",
  "decision-making": "会議体・意思決定基準の整備",
  "business-creation": "新規事業・事業計画策定"
};

export function generateFeedbackDraft(input: FeedbackDraftInput): FeedbackDraftForm {
  const topThemes = pickTopThemes(input);
  const priorityThemes = pickPriorityThemes(input);
  const lowThemes = [...input.themeScores].sort((a, b) => a.score - b.score).slice(0, 3);
  const largestGapTheme = pickLargestGapTheme(input.themeScores);
  const phase = getEmployeePhaseGuide(input.employeeSize);
  const executiveType = classifyExecutiveType(input.themeScores, priorityThemes);
  const phasePhrase = phase
    ? `${phase.phase}の段階では、${phase.organization}や${phase.management}、${phase.business}の整理が論点になりやすいです。`
    : "現在の事業規模に応じた組織・売上・財務・経営管理のバランス確認が論点になります。";
  const topNames = themeNames(topThemes);
  const priorityNames = themeNames(priorityThemes.length > 0 ? priorityThemes : lowThemes);
  const supportThemes = (priorityThemes.length > 0 ? priorityThemes : lowThemes)
    .map((theme) => themeSupportMap[theme.id] ?? `${theme.name}の整理`)
    .slice(0, 3)
    .join("、");

  return {
    one_line_summary: `総合スコアは${input.totalScore}点、達成率は${input.achievementRate}%です。${topNames}に強みが見られ、${priorityNames}は次に確認したいテーマとして表れています。${phasePhrase}`,
    summary: "",
    executive_type: `${executiveType}。上位テーマと優先確認テーマの出方から、現在は強みを活かしながら経営の論点を絞り込む段階にあると考えられます。断定ではなく、面談で実際の意思決定や組織状況と照らして確認したい仮分類です。`,
    psychological_tendency: `${topNames}への反応が比較的強く、経営判断では既に手応えのある領域を起点に前へ進める傾向がある可能性があります。一方で、${priorityNames}は後回しになりやすい、または言語化しきれていない論点として確認したい領域です。`,
    strength: `${topNames}は現在の経営上の強みとして扱いやすいテーマです。既に成果や手応えが出ている背景を整理することで、再現性のある勝ち筋や、社内外に伝えるべき提供価値を明確にできる可能性があります。`,
    gap: `${largestGapTheme.name}は、目標値との差分が${formatGap(largestGapTheme.gap)}、受検者平均との差分が${formatGap(largestGapTheme.averageGap)}と、今回もっとも確認したいギャップが表れています。${phasePhrase}スコアだけで判断せず、実態とのズレを面談で確認したいテーマです。`,
    short_term_action: `直近1〜3か月では、${priorityNames}について現状の取り組み、責任者、判断基準を棚卸しすることが有効です。まずは会議や1on1で扱う論点を絞り、すぐに着手できる改善アクションを2〜3個に整理します。`,
    mid_long_term_action: `6か月〜1年では、${phase ? `${phase.management}や${phase.organization}` : "経営管理や組織運営"}を継続的に回す仕組みづくりが重要です。属人的な判断に寄せすぎず、数値・役割・会議体・評価の接続を整えることで、次の成長に耐えられる体制を作ります。`,
    advisor_use_case: `支援者としては、${supportThemes}に接続できる可能性があります。診断結果を入口に、経営者が感じている優先順位と実際のスコア差分を照らし合わせ、提案テーマを押し付けずに合意形成する流れが作れそうです。`
  };
}

export function mergeDraftIntoEmptyFields(current: FeedbackDraftForm, draft: FeedbackDraftForm) {
  return (Object.keys(current) as Array<keyof FeedbackDraftForm>).reduce<FeedbackDraftForm>(
    (next, key) => ({
      ...next,
      [key]: current[key].trim() ? current[key] : draft[key]
    }),
    current
  );
}

function pickTopThemes(input: FeedbackDraftInput) {
  return input.topThemes.length > 0
    ? input.topThemes.slice(0, 3)
    : [...input.themeScores].sort((a, b) => b.score - a.score).slice(0, 3);
}

function pickPriorityThemes(input: FeedbackDraftInput) {
  return input.priorityThemes.length > 0
    ? input.priorityThemes.slice(0, 3)
    : [...input.themeScores].sort((a, b) => a.gap - b.gap || a.averageGap - b.averageGap).slice(0, 3);
}

function pickLargestGapTheme(themeScores: ThemeScore[]) {
  return [...themeScores].sort(
    (a, b) => Math.min(a.gap, a.averageGap) - Math.min(b.gap, b.averageGap)
  )[0];
}

function classifyExecutiveType(themeScores: ThemeScore[], priorityThemes: ThemeScore[]) {
  const highThemes = themeScores.filter((theme) => theme.score >= 9).map((theme) => theme.id);
  const priorityIds = priorityThemes.map((theme) => theme.id);

  if (highThemes.some((id) => ["market-growth", "business-creation", "scalability"].includes(id))) {
    return "成長牽引型";
  }
  if (highThemes.some((id) => ["functionality", "continuity", "business-risk"].includes(id))) {
    return "現場主導型";
  }
  if (priorityIds.some((id) => ["management-structure", "organization-building", "decision-making"].includes(id))) {
    return "仕組み化課題型";
  }
  if (priorityIds.some((id) => ["profitability", "branding", "customer-engagement"].includes(id))) {
    return "改善推進型";
  }
  if (highThemes.some((id) => ["investment", "decision-making", "business-creation"].includes(id))) {
    return "挑戦型";
  }
  return "管理最適化型";
}

function themeNames(themes: ThemeScore[]) {
  return themes.map((theme) => theme.name).join("・") || "主要テーマ";
}

function formatGap(value: number) {
  return `${value >= 0 ? "+" : ""}${value}`;
}
