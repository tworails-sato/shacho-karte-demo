export type UsageSettings = {
  is_demo: boolean;
  watermark_enabled: boolean;
  watermark_text: string;
  copyright_enabled: boolean;
  copyright_text: string;
  commercial_use_allowed: boolean;
  resubmission_allowed: boolean;
  usage_purpose: string | null;
};

type NullableUsageSettings = {
  [K in keyof UsageSettings]?: UsageSettings[K] | null;
};

export const defaultUsageSettings: UsageSettings = {
  is_demo: true,
  watermark_enabled: true,
  watermark_text: "DEMO｜社長カルテ",
  copyright_enabled: true,
  copyright_text: "© Two rails",
  commercial_use_allowed: false,
  resubmission_allowed: false,
  usage_purpose: null
};

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function usageSettingsFromRow(row?: NullableUsageSettings | null): UsageSettings {
  return {
    is_demo: row?.is_demo ?? defaultUsageSettings.is_demo,
    watermark_enabled: row?.watermark_enabled ?? defaultUsageSettings.watermark_enabled,
    watermark_text: row?.watermark_text || defaultUsageSettings.watermark_text,
    copyright_enabled: row?.copyright_enabled ?? defaultUsageSettings.copyright_enabled,
    copyright_text: row?.copyright_text || defaultUsageSettings.copyright_text,
    commercial_use_allowed: row?.commercial_use_allowed ?? defaultUsageSettings.commercial_use_allowed,
    resubmission_allowed: row?.resubmission_allowed ?? defaultUsageSettings.resubmission_allowed,
    usage_purpose: row?.usage_purpose ?? null
  };
}
