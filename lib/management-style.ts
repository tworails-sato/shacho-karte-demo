import type { ThemeScore } from "./diagnosis";

export const STYLE_LOGIC_VERSION = "v2_beta_1";
export const MANAGEMENT_PHASE_LOGIC_VERSION = "v2_beta_2";

export type ManagementStyleKey =
  | "strategy"
  | "market-development"
  | "organization-building"
  | "execution"
  | "profitability"
  | "branding"
  | "transformation";

export type ManagementStyleDefinition = {
  key: ManagementStyleKey;
  name: string;
  icon: string;
  shortCopy: string;
  description: string;
  characterCopy: string;
  strengths: string[];
  watchouts: string[];
  worksWellWhen: string[];
  themeIds: string[];
  displayOrder: number;
};

export type ManagementStyleScore = {
  key: ManagementStyleKey;
  name: string;
  icon: string;
  score: number;
  themeIds: string[];
  displayOrder: number;
};

export type ManagementPhaseKey =
  | "foundation"
  | "growth-acceleration"
  | "organization-formation"
  | "self-running"
  | "unknown";

export type ManagementPhasePriorityGroup = {
  people: string[];
  business: string[];
  finance: string[];
};

export type ManagementPhase = {
  key: ManagementPhaseKey;
  label: string;
  status: string;
  priorities: string[];
  priorityGroups: ManagementPhasePriorityGroup;
  adjustmentComment?: string;
};

export type V2BetaResult = {
  mainManagementStyleKey: ManagementStyleKey | null;
  subManagementStyleKey: ManagementStyleKey | null;
  managementStyleScores: ManagementStyleScore[];
  styleLogicVersion: string;
  managementPhaseKey: ManagementPhaseKey;
  managementPhaseLabel: string;
  managementPhaseLogicVersion: string;
  managementPhaseAdjustmentComment: string | null;
  calculatedAt: string;
};

export const managementStyles: ManagementStyleDefinition[] = [
  {
    key: "strategy",
    name: "戦略重視タイプ",
    icon: "Compass",
    shortCopy: "進む方向を定め、判断の軸をつくる",
    description: "理念やビジョン、経営方針を明確にし、中長期の視点から意思決定する経営スタイルです。",
    characterCopy: "構想と意思決定で、会社の進む方向を示す",
    strengths: ["中長期の方向性を描く", "経営判断の軸を持つ", "複数の論点を整理する"],
    watchouts: ["方針が現場へ伝わりにくい", "実行管理が後回しになりやすい", "社長の頭の中に方針が集中しやすい"],
    worksWellWhen: ["経営方針の見直し", "事業の転換期", "複数事業の優先順位整理"],
    themeIds: ["advantage", "business-risk", "decision-making", "management-structure"],
    displayOrder: 1
  },
  {
    key: "market-development",
    name: "市場開拓重視タイプ",
    icon: "Telescope",
    shortCopy: "新しい顧客と市場を切り拓く",
    description: "新しい顧客や市場機会を探し、売上機会を広げることを重視する経営スタイルです。",
    characterCopy: "新しい顧客と市場を先に開き、成長機会をつくる",
    strengths: ["新しい顧客機会を見つける", "営業や集客を前へ進める", "市場変化へ素早く対応する"],
    watchouts: ["既存顧客への対応が薄くなりやすい", "社内体制が成長に追いつきにくい", "施策が増えすぎる"],
    worksWellWhen: ["創業・事業立ち上げ", "売上拡大期", "新市場への進出"],
    themeIds: ["market-growth", "customer-engagement", "business-creation"],
    displayOrder: 2
  },
  {
    key: "organization-building",
    name: "組織づくり重視タイプ",
    icon: "Users",
    shortCopy: "人と役割で成果を生み出す",
    description: "人材、採用・育成、役割分担を通じて、組織で成果を出すことを重視する経営スタイルです。",
    characterCopy: "人と役割を整え、組織で成果を生み出す",
    strengths: ["人材育成", "役割分担", "チームによる成果創出"],
    watchouts: ["人への配慮で判断が遅れやすい", "組織整備が目的化しやすい", "収益性や市場対応が後回しになりやすい"],
    worksWellWhen: ["社員数の増加", "管理職やNo.2の育成", "権限移譲の開始"],
    themeIds: ["functionality", "internal-engagement", "organization-building", "management-structure"],
    displayOrder: 3
  },
  {
    key: "execution",
    name: "実行重視タイプ",
    icon: "ListChecks",
    shortCopy: "決めたことを現場で形にする",
    description: "決めたことを現場へ落とし込み、業務改善と実行を積み重ねることを重視する経営スタイルです。",
    characterCopy: "決めたことを現場へ落とし込み、着実に進める",
    strengths: ["業務改善", "進捗管理", "実行スピード"],
    watchouts: ["目の前の業務へ集中しすぎる", "長期戦略が後回しになりやすい", "社長自身が実行を抱え込みやすい"],
    worksWellWhen: ["業務改善", "生産性向上", "戦略の現場定着"],
    themeIds: ["investment", "functionality", "decision-making"],
    displayOrder: 4
  },
  {
    key: "profitability",
    name: "収益重視タイプ",
    icon: "CircleDollarSign",
    shortCopy: "利益が残る構造を整える",
    description: "売上だけではなく、利益構造・収益性・数値を基準に経営判断するスタイルです。",
    characterCopy: "数字と利益を基準に、持続可能な経営をつくる",
    strengths: ["利益構造の把握", "数値による判断", "投資対効果の管理"],
    watchouts: ["短期的な数字へ寄りやすい", "人材やブランドへの投資が遅れやすい", "数字に表れない論点を見落としやすい"],
    worksWellWhen: ["利益率改善", "価格や商品構成の見直し", "投資判断"],
    themeIds: ["profitability", "investment", "scalability"],
    displayOrder: 5
  },
  {
    key: "branding",
    name: "ブランディング重視タイプ",
    icon: "Sparkles",
    shortCopy: "選ばれる理由を磨き込む",
    description: "顧客から選ばれる理由や商品価値、ポジショニングを明確にすることを重視する経営スタイルです。",
    characterCopy: "選ばれる理由を磨き、事業の価値を高める",
    strengths: ["顧客価値の設計", "商品やサービスの差別化", "市場への伝え方"],
    watchouts: ["見せ方が先行しやすい", "営業実行や数値管理が弱くなりやすい", "社内へのブランド浸透が遅れやすい"],
    worksWellWhen: ["商品再設計", "競合との差別化", "価格やポジショニングの見直し"],
    themeIds: ["advantage", "social-impact", "branding", "customer-engagement"],
    displayOrder: 6
  },
  {
    key: "transformation",
    name: "変革重視タイプ",
    icon: "Zap",
    shortCopy: "新しい打ち手で変化を起こす",
    description: "既存のやり方に固執せず、新規事業・外部資源・仕組みを取り入れて変化を進める経営スタイルです。",
    characterCopy: "新しい打ち手と外部資源を取り入れ、会社を変える",
    strengths: ["新しい事業への挑戦", "外部知見の活用", "変化を恐れない意思決定"],
    watchouts: ["複数施策を同時に進めすぎる", "既存事業や現場が追いつきにくい", "撤退基準や効果検証が曖昧になりやすい"],
    worksWellWhen: ["第二創業", "新規事業開発", "事業モデルの転換"],
    themeIds: ["market-growth", "scalability", "business-creation", "decision-making"],
    displayOrder: 7
  }
];

export const baseManagementPhases: ManagementPhase[] = [
  {
    key: "foundation",
    label: "基盤構築期",
    status: "社長自身の判断と実行を中心に、事業の土台を固める段階です。",
    priorities: ["即戦力確保", "主力商品の明確化", "資金繰りと粗利確認"],
    priorityGroups: {
      people: ["即戦力確保", "兼務整理", "社長の時間確保"],
      business: ["主力商品の明確化", "顧客層の整理", "売上再現性"],
      finance: ["資金繰り", "粗利確認", "固定費管理"]
    }
  },
  {
    key: "growth-acceleration",
    label: "成長加速期",
    status: "売上や顧客が増え始め、役割分担と仕組み化が必要になる段階です。",
    priorities: ["採用・定着", "商流の安定", "数値管理"],
    priorityGroups: {
      people: ["採用・定着", "役割分担", "責任範囲の整理"],
      business: ["顧客層拡大", "商流安定", "提案パターン化"],
      finance: ["運転資金", "採用投資", "数値管理"]
    }
  },
  {
    key: "organization-formation",
    label: "組織形成期",
    status: "管理職や責任者を育て、社長以外でも判断・実行できる組織をつくる段階です。",
    priorities: ["No.2や管理職の育成", "権限移譲", "投資対効果の確認"],
    priorityGroups: {
      people: ["No.2や管理職の育成", "権限移譲", "役割分担"],
      business: ["注力事業の整理", "責任者設定", "事業別目標管理"],
      finance: ["人材投資", "固定費管理", "投資対効果"]
    }
  },
  {
    key: "self-running",
    label: "自走経営期",
    status: "複数の責任者や部門を通じて、継続的に成果を出す体制を整える段階です。",
    priorities: ["幹部育成", "部門横断連携", "予算管理"],
    priorityGroups: {
      people: ["幹部育成", "部門横断連携", "評価制度"],
      business: ["事業責任者制", "多角化", "ポートフォリオ管理"],
      finance: ["予算管理", "資本政策", "財務戦略"]
    }
  },
  {
    key: "unknown",
    label: "未判定",
    status: "従業員規模が未入力のため、経営フェーズは未判定です。",
    priorities: ["面談時に現在の組織規模を確認します"],
    priorityGroups: {
      people: ["組織規模の確認"],
      business: ["事業状況の確認"],
      finance: ["投資余力の確認"]
    }
  }
];

export const managementPhases = baseManagementPhases;

export function calculateV2BetaResult(
  themeScores: ThemeScore[],
  employeeSize?: string | null,
  annualRevenueRange?: string | null,
  foundingYears?: string | null
): V2BetaResult {
  const styleScores = managementStyles
    .map((style) => {
      const matchedThemes = style.themeIds
        .map((themeId) => themeScores.find((theme) => theme.id === themeId))
        .filter((theme): theme is ThemeScore => Boolean(theme));
      const score = matchedThemes.length
        ? roundToTwo(matchedThemes.reduce((sum, theme) => sum + theme.score / 3, 0) / matchedThemes.length)
        : 0;

      return {
        key: style.key,
        name: style.name,
        icon: style.icon,
        score,
        themeIds: style.themeIds,
        displayOrder: style.displayOrder
      };
    })
    .sort((a, b) => b.score - a.score || a.displayOrder - b.displayOrder);
  const phase = getManagementPhase(employeeSize, annualRevenueRange, foundingYears);

  return {
    mainManagementStyleKey: styleScores[0]?.key ?? null,
    subManagementStyleKey: styleScores[1]?.key ?? null,
    managementStyleScores: styleScores,
    styleLogicVersion: STYLE_LOGIC_VERSION,
    managementPhaseKey: phase.key,
    managementPhaseLabel: phase.label,
    managementPhaseLogicVersion: MANAGEMENT_PHASE_LOGIC_VERSION,
    managementPhaseAdjustmentComment: phase.adjustmentComment ?? null,
    calculatedAt: new Date().toISOString()
  };
}

export function getManagementStyle(key?: string | null) {
  return managementStyles.find((style) => style.key === key) ?? null;
}

export function getManagementPhase(
  employeeSize?: string | null,
  annualRevenueRange?: string | null,
  foundingYears?: string | null
): ManagementPhase {
  const base = baseManagementPhases.find((phase) => phase.key === getBasePhaseKey(employeeSize))
    ?? baseManagementPhases.find((phase) => phase.key === "unknown")!;
  const adjustmentComment = buildRevenueAdjustmentComment(base.key, employeeSize, annualRevenueRange, foundingYears);

  return adjustmentComment ? { ...base, adjustmentComment } : base;
}

export function getGrowthAbilityThemes(themeScores: ThemeScore[], limit = 3) {
  return [...themeScores]
    .sort((a, b) => a.averageGap - b.averageGap || a.gap - b.gap)
    .slice(0, limit);
}

function getBasePhaseKey(employeeSize?: string | null): ManagementPhaseKey {
  if (!employeeSize) return "unknown";
  if (["1名", "2〜5名", "1〜5名", "6〜10名"].includes(employeeSize)) return "foundation";
  if (["11〜20名", "21〜30名", "11〜30名"].includes(employeeSize)) return "growth-acceleration";
  if (employeeSize === "31〜50名") return "organization-formation";
  if (["51〜100名", "101〜300名", "301名以上", "101名以上"].includes(employeeSize)) return "self-running";
  return "unknown";
}

function buildRevenueAdjustmentComment(
  phaseKey: ManagementPhaseKey,
  employeeSize?: string | null,
  annualRevenueRange?: string | null,
  foundingYears?: string | null
) {
  if (!employeeSize) return null;
  const foundingComment = buildFoundingYearsAdjustmentComment(employeeSize, foundingYears);
  if (!annualRevenueRange) return foundingComment;
  const revenueRank = getRevenueRank(annualRevenueRange);
  if (revenueRank === null) return foundingComment;

  const isSmallTeam = ["1名", "2〜5名", "1〜5名", "6〜10名"].includes(employeeSize);
  const isMidTeam = ["11〜20名", "21〜30名", "11〜30名", "31〜50名"].includes(employeeSize);

  if (isSmallTeam && revenueRank >= 3) {
    return withFoundingComment("少人数・高収益型の可能性があります。組織を大きくする前提だけでなく、事業責任者や外部パートナー活用の整備も確認したい状態です。", foundingComment);
  }
  if (isMidTeam && revenueRank <= 2) {
    return withFoundingComment("人数規模に対して、収益構造や主力商品の整理を確認したい状態です。商品別・顧客別の利益率を面談で見ていくと論点が明確になります。", foundingComment);
  }
  if (phaseKey === "self-running" && revenueRank >= 5) {
    return withFoundingComment("事業規模も大きくなっているため、幹部育成・予算管理・部門横断管理をより具体的に確認したい状態です。", foundingComment);
  }
  return foundingComment;
}

function getRevenueRank(value: string) {
  const normalized = value.replace(/\s/g, "").replaceAll("～", "〜");
  if (normalized.includes("3000万円未満")) return 1;
  if (normalized.includes("3000万円") && normalized.includes("1億")) return 2;
  if (normalized.includes("1億円") && normalized.includes("3億")) return 3;
  if (normalized.includes("3億円") && normalized.includes("10億")) return 4;
  if (normalized.includes("10億")) return 5;
  return null;
}

function buildFoundingYearsAdjustmentComment(employeeSize: string, foundingYears?: string | null) {
  if (!foundingYears) return null;
  const isSmallTeam = ["1名", "2〜5名", "1〜5名", "6〜10名"].includes(employeeSize);
  if (isSmallTeam && ["1年未満", "1〜3年"].includes(foundingYears)) {
    return "創業初期のため、売上の再現性づくりと社長の時間配分を優先して確認したい状態です。";
  }
  if (isSmallTeam && ["8〜15年", "16〜30年", "31年以上"].includes(foundingYears)) {
    return "少人数で長く運営しているため、属人性や次の成長に向けた外部活用・仕組み化を確認したい状態です。";
  }
  return null;
}

function withFoundingComment(base: string, foundingComment: string | null) {
  return foundingComment ? `${base} ${foundingComment}` : base;
}

function roundToTwo(value: number) {
  return Math.round(value * 100) / 100;
}
