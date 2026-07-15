"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  getLocalSubmission,
  markLocalCtaClicked,
  recordLocalEvent,
  saveLocalSubmission,
  type StoredSubmission
} from "@/lib/storage";
import {
  getSupabaseConfigStatus,
  saveDiagnosisEventToSupabase,
  saveSubmissionToSupabase
} from "@/lib/supabase";
import { notifyDiagnosisCompleted } from "@/lib/notify";
import { usageSettingsFromRow } from "@/lib/usage-settings";
import ExpectationResultView from "./ExpectationResultView";

export default function ResultPage() {
  const [submission, setSubmission] = useState<StoredSubmission | null>(null);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);
  const [supabaseStatus] = useState(getSupabaseConfigStatus);
  const hasSyncedResultRef = useRef(false);
  const hasNotifiedRef = useRef(false);

  useEffect(() => {
    const storedSubmission = getLocalSubmission();
    setSubmission(storedSubmission);
    if (storedSubmission && !hasSyncedResultRef.current) {
      hasSyncedResultRef.current = true;
      recordLocalEvent(storedSubmission.id, "result_viewed");
      saveSubmissionToSupabase(storedSubmission).then((saveResult) => {
        saveLocalSubmission(saveResult.data);
        setSubmission(saveResult.data);
        setSupabaseError(saveResult.errorMessage ?? null);
        if (!saveResult.errorMessage && !hasNotifiedRef.current) {
          hasNotifiedRef.current = true;
          notifyDiagnosisCompleted(saveResult.data);
        }
      });
    }
  }, []);

  if (!submission) {
    return (
      <main className="page-shell flex items-center justify-center">
        <section className="panel max-w-xl p-6 text-center">
          <h1 className="text-2xl font-black text-ink">診断結果が見つかりません</h1>
          <p className="mt-3 leading-7 text-stone-700">
            基本情報の入力からアセスメントを開始してください。
          </p>
          <Link className="primary-button mt-5" href="/basic-info">
            アセスメントを始める
          </Link>
        </section>
      </main>
    );
  }

  const { basicInfo, result } = submission;
  const diagnosisDate = new Date(submission.createdAt).toLocaleDateString("ja-JP");
  const currentSubmission = submission;

  async function handleFeedbackRequest() {
    markLocalCtaClicked(currentSubmission.id);
    const saveResult = await saveSubmissionToSupabase({
      ...currentSubmission,
      ctaClicked: true
    });

    saveLocalSubmission(saveResult.data);
    setSubmission(saveResult.data);

    const eventResult = await saveDiagnosisEventToSupabase(
      saveResult.data.respondentId ?? saveResult.data.id,
      "cta_clicked"
    );
    const nextError = saveResult.errorMessage ?? eventResult.errorMessage ?? null;
    setSupabaseError(nextError);
    if (nextError) throw new Error(nextError);
  }

  return (
    <ExpectationResultView
      info={{
        companyName: basicInfo.companyName,
        representativeName: basicInfo.representativeName,
        industry: basicInfo.industry,
        employeeSize: basicInfo.employeeSize,
        diagnosisDate
      }}
      lowThemes={result.lowThemes}
      onFeedbackRequest={handleFeedbackRequest}
      priorityThemes={result.priorityThemes}
      supabaseConfigured={supabaseStatus.configured}
      supabaseError={supabaseError}
      themeScores={result.themeScores}
      topThemes={result.topThemes}
      usageSettings={usageSettingsFromRow(submission.usageSettings)}
    />
  );
}
