export type BasicInfo = {
  companyName: string;
  representativeName: string;
  email: string;
  industry: string;
  category: string;
};

export type Theme = {
  id: string;
  name: string;
  target: number;
  average: number;
  description: string;
};

export type Question = {
  id: string;
  themeId: string;
  text: string;
};

export type Priority = "高" | "中" | "低";

export type ThemeScore = Theme & {
  score: number;
  gap: number;
  averageGap: number;
  rate: number;
  judgement: string;
  priority: Priority;
};

export type DiagnosisResult = {
  totalScore: number;
  achievementRate: number;
  themeScores: ThemeScore[];
  judgement: string;
  summary: string;
  topThemes: ThemeScore[];
  lowThemes: ThemeScore[];
  priorityThemes: ThemeScore[];
};

export const CTA_URL =
  "https://timerex.net/s/sato.motoki_765a/c6616a1a";

export const themes: Theme[] = [
  { id: "profitability", name: "収益性", target: 9, average: 7.2, description: "継続的な成長と利益を生み出しているか" },
  { id: "market-growth", name: "市場成長性", target: 8, average: 6.8, description: "市場は成長しており、シェア拡大が見込めるか" },
  { id: "scalability", name: "拡張性", target: 8, average: 6.5, description: "スケールが可能な事業か" },
  { id: "advantage", name: "優位性・強み", target: 8, average: 7.0, description: "競合と差別化できる強みがあり、維持できるか" },
  { id: "business-risk", name: "事業リスク把握", target: 8, average: 6.4, description: "事業リスクを把握し、分散・対策できているか" },
  { id: "investment", name: "組織力強化への投資", target: 8, average: 6.3, description: "成長に必要な投資判断ができているか" },
  { id: "functionality", name: "組織の機能性", target: 9, average: 7.1, description: "経営資源を活用した運営プロセスがあるか" },
  { id: "continuity", name: "事業継続性", target: 8, average: 6.6, description: "市場変動やリスクに対応できるか" },
  { id: "social-impact", name: "社会貢献性", target: 7, average: 5.9, description: "社会課題に根差した事業になっているか" },
  { id: "branding", name: "ブランディング", target: 7, average: 6.1, description: "自社の認識されたい姿を定義し、発信できているか" },
  { id: "internal-engagement", name: "社内エンゲージメント", target: 8, average: 6.7, description: "MVVが浸透し、従業員のエンゲージメントが高いか" },
  { id: "customer-engagement", name: "顧客エンゲージメント", target: 8, average: 6.9, description: "顧客との長期的な関係性を築けているか" },
  { id: "organization-building", name: "組織構築力", target: 8, average: 6.2, description: "戦略を実行するチームや仕組みを作る力があるか" },
  { id: "management-structure", name: "経営体制構築力", target: 9, average: 6.4, description: "CXOや責任者を発掘・育成できているか" },
  { id: "decision-making", name: "意思決定力", target: 9, average: 7.3, description: "決断のスピードと質を担保できるか" },
  { id: "business-creation", name: "事業創出力", target: 8, average: 5.8, description: "新規事業・イノベーション開発に投資できているか" }
];

export const questions: Question[] = [
  { id: "profitability-1", themeId: "profitability", text: "過去3年間の売上高の平均成長率が120％以上である" },
  { id: "profitability-2", themeId: "profitability", text: "売上のうち、継続収益やリピート収益が60％以上ある" },
  { id: "profitability-3", themeId: "profitability", text: "既存顧客のLTVや継続率を定期的に可視化し、改善を重ねられている" },
  { id: "market-growth-1", themeId: "market-growth", text: "周辺事業を含めた市場規模の拡大が年次130%以上で、今後の成長予測の根拠を説明できる" },
  { id: "market-growth-2", themeId: "market-growth", text: "競合の動き（参入・撤退など）を定点観測し、自社の戦略修正に生かしている" },
  { id: "market-growth-3", themeId: "market-growth", text: "規制・技術革新など市場構造を変える要因を想定し、その対策を社内で講じている" },
  { id: "scalability-1", themeId: "scalability", text: "顧客のデータを蓄積する仕組みを運用し、顧客体験やサービス開発、マネタイズポイントの発見に活用できている" },
  { id: "scalability-2", themeId: "scalability", text: "既存顧客に対して新たな需要創出や提案ができる余地を分析し、準備を進めている" },
  { id: "scalability-3", themeId: "scalability", text: "急激に顧客数が増えても品質を担保できる仕組みを整備できている" },
  { id: "advantage-1", themeId: "advantage", text: "事業の強みを明確に定義・言語化し、社内の共通認識にしている" },
  { id: "advantage-2", themeId: "advantage", text: "競合が模倣困難な強みが明確にある" },
  { id: "advantage-3", themeId: "advantage", text: "営業・集客が社長の人脈のみなど、組織内の個人に依存していない" },
  { id: "business-risk-1", themeId: "business-risk", text: "新たなチャレンジのリスクと既存事業への影響を洗い出し意思決定している" },
  { id: "business-risk-2", themeId: "business-risk", text: "単一事業への依存度が高まらないように、多角化を進めている" },
  { id: "business-risk-3", themeId: "business-risk", text: "自社の弱みを認識し、顕在化させないために定期的な対策と改善をしている" },
  { id: "investment-1", themeId: "investment", text: "社内の成長課題に対して、投資優先度を明確に決められている" },
  { id: "investment-2", themeId: "investment", text: "投資判断の基準を定め、経営会議で合意形成できている" },
  { id: "investment-3", themeId: "investment", text: "投資対効果をKPIでモニタリングし、改善アクションを実行している" },
  { id: "functionality-1", themeId: "functionality", text: "現場からの改善意見を吸い上げる制度を運用し、事業運営の改善につなげている" },
  { id: "functionality-2", themeId: "functionality", text: "現場で決定・改善が可能な範囲と、報告・相談が必要な範囲の線引きをし、明確に運用されている" },
  { id: "functionality-3", themeId: "functionality", text: "事業方針や課題の優先度について、現場責任者との共通認識が持てている" },
  { id: "continuity-1", themeId: "continuity", text: "マクロ環境の変化を複数シナリオで想定し、具体的な継続策まで落とし込んでいる" },
  { id: "continuity-2", themeId: "continuity", text: "事故が発生した際の、初動フローや担当者が明確に存在している" },
  { id: "continuity-3", themeId: "continuity", text: "事業停止リスクへの代替策があり、実行可能な状態にしている" },
  { id: "social-impact-1", themeId: "social-impact", text: "自社事業が地域社会や社会課題にどのように貢献しているかを定義し、継続的に発信している" },
  { id: "social-impact-2", themeId: "social-impact", text: "利益創出のみならず、社会課題に対する活動への参加を奨励する文化を創れている" },
  { id: "social-impact-3", themeId: "social-impact", text: "社会貢献や活動の意義をブランドストーリーとして明確にし、外部に伝えている" },
  { id: "branding-1", themeId: "branding", text: "自社のブランドメッセージと顧客の声を比較し、ズレを修正している" },
  { id: "branding-2", themeId: "branding", text: "自社の優位性を定量的に示し、市場・顧客に対してPRができている" },
  { id: "branding-3", themeId: "branding", text: "SNS・顧客対応・採用など全ての接点で一貫したブランド体験を設計し、現場レベルで運用できている" },
  { id: "internal-engagement-1", themeId: "internal-engagement", text: "経営者やリーダーの意思決定に、会社の理念や方向性が一貫して反映されている" },
  { id: "internal-engagement-2", themeId: "internal-engagement", text: "社員が会社の理念や方針を自分の言葉で説明し、実際の行動に反映できているかを、経営層が客観的に測定している" },
  { id: "internal-engagement-3", themeId: "internal-engagement", text: "社内評価・表彰などで、理念や方針を体現している人をきちんと評価している" },
  { id: "customer-engagement-1", themeId: "customer-engagement", text: "サービスや商品を長期的に利用・購入してもらうための主要ドライバーを理解し、具体的な施策に講じている" },
  { id: "customer-engagement-2", themeId: "customer-engagement", text: "顧客の購買行動や満足度向上につながる指標を設定し、定期的にモニタリングしている" },
  { id: "customer-engagement-3", themeId: "customer-engagement", text: "顧客の声を半期に1回以上収集し、成約率やCVR改善の具体的な改善アクションにつなげている" },
  { id: "organization-building-1", themeId: "organization-building", text: "社員が自分のミッションや役割を明確に理解し、目標や行動を自律的にアップデートする仕組みを整えている" },
  { id: "organization-building-2", themeId: "organization-building", text: "市場変化に合わせて戦略・方針を刷新し、現場が即行動を変えられる仕組みを設けている" },
  { id: "organization-building-3", themeId: "organization-building", text: "部門内で意思決定できる範囲と、承認が必要な範囲を明確に定めている" },
  { id: "management-structure-1", themeId: "management-structure", text: "経営者一人に意思決定が集中しないよう、責任者が意思決定できるプロセスと場を設けている" },
  { id: "management-structure-2", themeId: "management-structure", text: "直属の責任者と定例1on1や戦略すり合わせの時間を週次で設け、すり合わせとアクションを提示させている" },
  { id: "management-structure-3", themeId: "management-structure", text: "意思決定の一定割合は、責任者に委譲するルールを実行できている" },
  { id: "decision-making-1", themeId: "decision-making", text: "意思決定の基準を言語化し、過去の判断を振り返り更新している" },
  { id: "decision-making-2", themeId: "decision-making", text: "主観に固執せず、外部の意見を取り入れる仕組みを創っている" },
  { id: "decision-making-3", themeId: "decision-making", text: "意思決定や仮説構築に時間をかけすぎない仕組みを設け、PDCAのスピードを上げている" },
  { id: "business-creation-1", themeId: "business-creation", text: "直近1年間で、新しい収益モデルやサービスを市場投入または試験導入まで実行している" },
  { id: "business-creation-2", themeId: "business-creation", text: "新規事業を任せられる責任者やチームを、社内で明確に育成・配置している" },
  { id: "business-creation-3", themeId: "business-creation", text: "社員が事業や改善のアイデアを提案し、実行や検証までを実施させる仕組みや制度を推進している" }
];

export const answerLabels = [
  { value: 1, label: "あてはまらない" },
  { value: 2, label: "あまりあてはまらない" },
  { value: 3, label: "ややあてはまる" },
  { value: 4, label: "あてはまる" }
];

export function calculateResult(answers: Record<string, number>): DiagnosisResult {
  const themeScores = themes.map((theme) => {
    const score = questions
      .filter((question) => question.themeId === theme.id)
      .reduce((sum, question) => sum + (answers[question.id] ?? 0), 0);
    const gap = score - theme.target;
    const averageGap = roundToOneDecimal(score - theme.average);
    const priority = getPriority(gap, averageGap);

    return {
      ...theme,
      score,
      gap,
      averageGap,
      rate: Math.round((score / 12) * 100),
      judgement: getGapJudgement(gap),
      priority
    };
  });

  const totalScore = themeScores.reduce((sum, theme) => sum + theme.score, 0);
  const achievementRate = Math.round((totalScore / 192) * 100);
  const topThemes = [...themeScores].sort((a, b) => b.score - a.score).slice(0, 3);
  const lowThemes = [...themeScores].sort((a, b) => a.score - b.score).slice(0, 3);
  const priorityThemes = pickPriorityThemes(themeScores);
  const strongest = topThemes.map((theme) => theme.name).join("、");
  const priorityNames = priorityThemes.map((theme) => theme.name).join("、");
  const summary = `今回の結果では、${strongest} に比較的強みが見られます。優先確認テーマとしては、${priorityNames || "大きな懸念テーマはありません"} を確認すると、次の打ち手を整理しやすくなります。`;

  return {
    totalScore,
    achievementRate,
    themeScores,
    judgement: priorityThemes[0]?.priority ?? "低",
    summary,
    topThemes,
    lowThemes,
    priorityThemes
  };
}

export function getPriority(targetGap: number, averageGap: number): Priority {
  if (targetGap <= -3 && averageGap <= -2) return "高";
  if (targetGap <= -3 || averageGap <= -2) return "中";
  return "低";
}

export function getGapJudgement(gap: number) {
  if (gap >= 0) return "良好";
  if (gap >= -2) return "概ね良好";
  if (gap >= -4) return "伸びしろあり";
  return "優先確認";
}

export function createEmptyAnswers() {
  return Object.fromEntries(questions.map((question) => [question.id, 0])) as Record<string, number>;
}

export function getStoredSubmission() {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem("shacho-karte-current");
  return raw ? JSON.parse(raw) : null;
}

function pickPriorityThemes(themeScores: ThemeScore[]) {
  const high = themeScores.filter((theme) => theme.priority === "高");
  const middle = themeScores.filter((theme) => theme.priority === "中");
  const candidates = high.length > 0 ? high : middle;
  return candidates
    .sort((a, b) => a.gap - b.gap || a.averageGap - b.averageGap)
    .slice(0, 3);
}

function roundToOneDecimal(value: number) {
  return Math.round(value * 10) / 10;
}
