import type { DiagnosisResult } from "./diagnosis";

export type EmployeePhaseGuide = {
  employeeSize: string;
  phase: string;
  business: string;
  organization: string;
  finance: string;
  management: string;
};

export const employeeSizeOptions = [
  "1〜5名",
  "6〜10名",
  "11〜30名",
  "31〜50名",
  "51〜100名",
  "101〜300名",
  "301名以上"
] as const;

export const employeePhaseGuides: EmployeePhaseGuide[] = [
  {
    employeeSize: "1〜5名",
    phase: "創業・個人依存",
    business: "売上の再現性",
    organization: "即戦力・兼務",
    finance: "資金繰り",
    management: "社長の時間管理"
  },
  {
    employeeSize: "6〜10名",
    phase: "初期チーム化",
    business: "商流の安定",
    organization: "役割分担",
    finance: "運転資金",
    management: "業務ルール化"
  },
  {
    employeeSize: "11〜30名",
    phase: "組織化の入口",
    business: "顧客層拡大",
    organization: "採用・定着",
    finance: "資金調達",
    management: "数値管理"
  },
  {
    employeeSize: "31〜50名",
    phase: "管理職・仕組み化",
    business: "商品/事業拡張",
    organization: "中堅育成",
    finance: "投資判断",
    management: "管理職設置"
  },
  {
    employeeSize: "51〜100名",
    phase: "部門化・権限移譲",
    business: "多角化",
    organization: "権限移譲",
    finance: "予算管理",
    management: "会議体/評価制度"
  },
  {
    employeeSize: "101〜300名",
    phase: "経営管理・多層組織",
    business: "事業責任者制",
    organization: "幹部育成",
    finance: "資本政策",
    management: "部門横断管理"
  },
  {
    employeeSize: "301名以上",
    phase: "組織統治・事業ポートフォリオ",
    business: "ポートフォリオ",
    organization: "組織統治",
    finance: "財務戦略",
    management: "ガバナンス"
  }
];

export function getEmployeePhaseGuide(employeeSize?: string | null) {
  return employeePhaseGuides.find((guide) => guide.employeeSize === employeeSize) ?? null;
}

export function buildPhaseAwareSummary(result: DiagnosisResult, employeeSize?: string | null) {
  const strongestThemeNames = result.topThemes.map((theme) => theme.name).join("・");
  const priorityThemeNames =
    result.priorityThemes.length > 0
      ? result.priorityThemes.map((theme) => theme.name).join("・")
      : "現在表示されているテーマ";
  const guide = getEmployeePhaseGuide(employeeSize);
  const phaseSentence = guide
    ? `${guide.employeeSize}の企業では、${guide.organization}、${guide.management}、${guide.business}が確認したい論点になりやすいフェーズです。`
    : "";

  if (result.priorityThemes.length > 0) {
    return `${phaseSentence}${phaseSentence ? " " : ""}今回の結果では、${strongestThemeNames} に比較的強みが見られます。一方で、${priorityThemeNames} は、次の打ち手を考えるうえで確認しておきたいテーマとして表れています。評価として受け取るのではなく、今後の優先順位を整理する入口としてご覧ください。`;
  }

  return `${phaseSentence}${phaseSentence ? " " : ""}今回の結果では、${strongestThemeNames} に比較的強みが見られます。大きく急ぐテーマとして断定される項目はありませんが、現在の経営フェーズと照らしながら、気になるテーマから確認してみてください。`;
}
