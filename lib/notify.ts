import type { StoredSubmission } from "./storage";

export async function notifyDiagnosisCompleted(submission: StoredSubmission) {
  try {
    const response = await fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyName: submission.basicInfo.companyName,
        representativeName: submission.basicInfo.representativeName,
        email: submission.basicInfo.email
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Diagnosis notification failed", errorText);
    }
  } catch (error) {
    console.error("Diagnosis notification failed", error);
  }
}
