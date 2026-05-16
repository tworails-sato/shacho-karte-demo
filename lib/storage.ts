import type { BasicInfo, DiagnosisResult } from "./diagnosis";

export type StoredSubmission = {
  id: string;
  basicInfo: BasicInfo;
  answers: Record<string, number>;
  result: DiagnosisResult;
  ctaClicked: boolean;
  createdAt: string;
};

export type StoredEvent = {
  id: string;
  respondentId: string;
  eventType: "result_viewed" | "cta_clicked";
  createdAt: string;
};

const CURRENT_KEY = "shacho-karte-current";
const LIST_KEY = "shacho-karte-submissions";
const EVENTS_KEY = "shacho-karte-events";

export function saveLocalSubmission(submission: StoredSubmission) {
  window.localStorage.setItem(CURRENT_KEY, JSON.stringify(submission));
  const submissions = getLocalSubmissions();
  const next = [submission, ...submissions.filter((item) => item.id !== submission.id)].slice(0, 50);
  window.localStorage.setItem(LIST_KEY, JSON.stringify(next));
}

export function getLocalSubmission(): StoredSubmission | null {
  const raw = window.localStorage.getItem(CURRENT_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function getLocalSubmissions(): StoredSubmission[] {
  const raw = window.localStorage.getItem(LIST_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function markLocalCtaClicked(id: string) {
  const current = getLocalSubmission();
  if (current?.id === id) {
    saveLocalSubmission({ ...current, ctaClicked: true });
  } else {
    const submissions = getLocalSubmissions().map((item) =>
      item.id === id ? { ...item, ctaClicked: true } : item
    );
    window.localStorage.setItem(LIST_KEY, JSON.stringify(submissions));
  }

  recordLocalEvent(id, "cta_clicked");
}

export function recordLocalEvent(
  respondentId: string,
  eventType: StoredEvent["eventType"]
) {
  const events = getLocalEvents();
  const next: StoredEvent[] = [
    {
      id: crypto.randomUUID(),
      respondentId,
      eventType,
      createdAt: new Date().toISOString()
    },
    ...events
  ].slice(0, 200);

  window.localStorage.setItem(EVENTS_KEY, JSON.stringify(next));
}

export function getLocalEvents(): StoredEvent[] {
  const raw = window.localStorage.getItem(EVENTS_KEY);
  return raw ? JSON.parse(raw) : [];
}
