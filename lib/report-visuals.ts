import type { ThemeScore } from "./diagnosis";
import type { ManagementStyleKey } from "./management-style";

export type IconKey =
  | "BadgeCheck"
  | "Building2"
  | "CircleDollarSign"
  | "Compass"
  | "Expand"
  | "Handshake"
  | "HeartHandshake"
  | "Lightbulb"
  | "ListChecks"
  | "Network"
  | "PiggyBank"
  | "Scale"
  | "ShieldAlert"
  | "ShieldCheck"
  | "Sparkles"
  | "Telescope"
  | "TrendingUp"
  | "Users"
  | "UsersRound"
  | "Workflow"
  | "Zap";

export type StyleVisual = {
  iconKey: IconKey;
  accentClass: string;
  meterClass: string;
};

export const styleVisuals: Record<ManagementStyleKey, StyleVisual> = {
  strategy: {
    iconKey: "Compass",
    accentClass: "border-blue-200 bg-blue-50 text-blue-900",
    meterClass: "bg-blue-700"
  },
  "market-development": {
    iconKey: "Telescope",
    accentClass: "border-cyan-200 bg-cyan-50 text-cyan-900",
    meterClass: "bg-cyan-700"
  },
  "organization-building": {
    iconKey: "Users",
    accentClass: "border-emerald-200 bg-emerald-50 text-emerald-900",
    meterClass: "bg-emerald-700"
  },
  execution: {
    iconKey: "ListChecks",
    accentClass: "border-indigo-200 bg-indigo-50 text-indigo-900",
    meterClass: "bg-indigo-700"
  },
  profitability: {
    iconKey: "CircleDollarSign",
    accentClass: "border-amber-200 bg-amber-50 text-amber-900",
    meterClass: "bg-amber-700"
  },
  branding: {
    iconKey: "Sparkles",
    accentClass: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-900",
    meterClass: "bg-fuchsia-700"
  },
  transformation: {
    iconKey: "Zap",
    accentClass: "border-rose-200 bg-rose-50 text-rose-900",
    meterClass: "bg-rose-700"
  }
};

export const themeVisuals: Record<string, { label: string; iconKey: IconKey }> = {
  profitability: { label: "収益性", iconKey: "CircleDollarSign" },
  "market-growth": { label: "成長性", iconKey: "TrendingUp" },
  scalability: { label: "拡張性", iconKey: "Expand" },
  advantage: { label: "優位性", iconKey: "BadgeCheck" },
  "business-risk": { label: "事業リスク把握", iconKey: "ShieldAlert" },
  investment: { label: "内部投資", iconKey: "PiggyBank" },
  functionality: { label: "組織機能", iconKey: "Workflow" },
  continuity: { label: "事業継続性", iconKey: "ShieldCheck" },
  "social-impact": { label: "社会貢献性", iconKey: "HeartHandshake" },
  branding: { label: "ブランディング", iconKey: "Sparkles" },
  "internal-engagement": { label: "社内エンゲージメント", iconKey: "UsersRound" },
  "customer-engagement": { label: "顧客エンゲージメント", iconKey: "Handshake" },
  "organization-building": { label: "組織構築力", iconKey: "Network" },
  "management-structure": { label: "経営体制構築", iconKey: "Building2" },
  "decision-making": { label: "意思決定力", iconKey: "Scale" },
  "business-creation": { label: "新規事業性", iconKey: "Lightbulb" }
};

export function displayThemeLabel(theme: ThemeScore | { id: string; name?: string }) {
  return themeVisuals[theme.id]?.label ?? theme.name ?? theme.id;
}

export function normalizeStyleScoreForMeter(score: number) {
  const normalized = 1 + ((score - 1) / 3) * 4;
  return Math.max(1, Math.min(5, Math.round(normalized * 10) / 10));
}

export function meterPercentFromFive(score: number) {
  return `${Math.max(0, Math.min(100, ((score - 1) / 4) * 100))}%`;
}

export function splitLines(value?: string | null) {
  return (value ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}
