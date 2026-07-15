"use client";

import type { ThemeScore } from "@/lib/diagnosis";
import { saveDiagnosisEventToSupabase } from "@/lib/supabase";
import type { UsageSettings } from "@/lib/usage-settings";
import ExpectationResultView from "../ExpectationResultView";

type Respondent = {
  company_name: string | null;
  name: string | null;
  industry: string | null;
  employee_size: string | null;
};

type ResultTokenViewProps = {
  respondentId: string;
  respondent: Respondent | null;
  createdAt: string;
  expiresAt: string;
  themeScores: ThemeScore[];
  priorityThemes: ThemeScore[];
  usageSettings: UsageSettings;
};

export default function ResultTokenView({
  respondentId,
  respondent,
  createdAt,
  expiresAt,
  themeScores,
  priorityThemes,
  usageSettings
}: ResultTokenViewProps) {
  const topThemes = [...themeScores].sort((a, b) => b.score - a.score).slice(0, 3);
  const lowThemes = [...themeScores].sort((a, b) => a.score - b.score).slice(0, 3);

  async function handleFeedbackRequest() {
    const eventResult = await saveDiagnosisEventToSupabase(respondentId, "cta_clicked");
    if (eventResult.errorMessage) throw new Error(eventResult.errorMessage);
  }

  return (
    <ExpectationResultView
      info={{
        companyName: respondent?.company_name || "-",
        representativeName: respondent?.name || "-",
        industry: respondent?.industry || "-",
        employeeSize: respondent?.employee_size || "-",
        diagnosisDate: new Date(createdAt).toLocaleDateString("ja-JP")
      }}
      lowThemes={lowThemes}
      onFeedbackRequest={handleFeedbackRequest}
      priorityThemes={priorityThemes}
      sharedExpiresAt={expiresAt}
      themeScores={themeScores}
      topThemes={topThemes}
      usageSettings={usageSettings}
    />
  );
}
