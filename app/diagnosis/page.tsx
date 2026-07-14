"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  answerLabels,
  calculateResult,
  createEmptyAnswers,
  questions,
  themes,
  type BasicInfo
} from "@/lib/diagnosis";
import {
  clearLocalDraft,
  getLocalDraft,
  saveLocalDraft,
  saveLocalSubmission,
  type StoredDraft,
  type StoredSubmission
} from "@/lib/storage";

export default function DiagnosisPage() {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, number>>(createEmptyAnswers);
  const [draft, setDraft] = useState<StoredDraft | null>(null);
  const [resumeDraft, setResumeDraft] = useState<StoredDraft | null>(null);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [unansweredIds, setUnansweredIds] = useState<string[]>([]);
  const [manualSaveMessage, setManualSaveMessage] = useState("");
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const answeredCount = Object.values(answers).filter(Boolean).length;
  const progress = Math.round((answeredCount / questions.length) * 100);

  const groupedQuestions = useMemo(
    () =>
      themes.map((theme) => ({
        ...theme,
        questions: questions.filter((question) => question.themeId === theme.id)
      })),
    []
  );

  useEffect(() => {
    const localDraft = getLocalDraft();
    if (!localDraft || localDraft.status !== "draft") return;

    const isExpired = new Date(localDraft.expiresAt).getTime() < Date.now();
    if (isExpired) {
      clearLocalDraft();
      return;
    }

    setDraft(localDraft);
    const savedAnswerCount = Object.values(localDraft.answers).filter(Boolean).length;
    if (savedAnswerCount > 0) {
      setResumeDraft(localDraft);
      setShowResumePrompt(true);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, []);

  function handleAnswer(questionId: string, value: number) {
    setAnswers((current) => {
      const nextAnswers = { ...current, [questionId]: value };
      persistDraft(nextAnswers);
      return nextAnswers;
    });
    setUnansweredIds((current) => current.filter((id) => id !== questionId));
    setManualSaveMessage("");
  }

  function handleResumeDraft() {
    if (!resumeDraft) return;
    setAnswers({ ...createEmptyAnswers(), ...resumeDraft.answers });
    setDraft(resumeDraft);
    setShowResumePrompt(false);
    setTimeout(() => scrollToResumeQuestion(resumeDraft), 100);
  }

  function handleRestartDraft() {
    const nextAnswers = createEmptyAnswers();
    setAnswers(nextAnswers);
    setShowResumePrompt(false);
    persistDraft(nextAnswers);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function scrollToResumeQuestion(targetDraft: StoredDraft) {
    const nextQuestion = questions.find((question, index) => index + 1 > targetDraft.lastAnsweredQuestionOrder);
    const targetQuestionId = nextQuestion?.id ?? questions[questions.length - 1]?.id;
    if (!targetQuestionId) return;
    document
      .getElementById(`question-${targetQuestionId}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function buildDraft(nextAnswers: Record<string, number>): StoredDraft | null {
    const rawBasicInfo = window.localStorage.getItem("shacho-karte-basic-info");
    if (!rawBasicInfo) return null;

    const basicInfo = JSON.parse(rawBasicInfo) as BasicInfo;
    const answeredQuestionIndexes = questions
      .map((question, index) => ({ question, index }))
      .filter(({ question }) => Boolean(nextAnswers[question.id]));
    const last = answeredQuestionIndexes.at(-1);
    const now = new Date().toISOString();
    const currentDraft = draft ?? getLocalDraft();

    return {
      id: currentDraft?.id ?? crypto.randomUUID(),
      respondentId: currentDraft?.respondentId,
      responseId: currentDraft?.responseId,
      basicInfo,
      answers: nextAnswers,
      status: "draft",
      progressRate: Math.round((answeredQuestionIndexes.length / questions.length) * 100),
      lastAnsweredQuestionId: last?.question.id ?? "",
      lastAnsweredQuestionOrder: last ? last.index + 1 : 0,
      expiresAt:
        currentDraft?.expiresAt ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: currentDraft?.createdAt ?? now,
      updatedAt: now
    };
  }

  function persistDraft(nextAnswers: Record<string, number>) {
    const nextDraft = buildDraft(nextAnswers);
    if (!nextDraft) return;

    setDraft(nextDraft);
    saveLocalDraft(nextDraft);

    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      if (!nextDraft.responseId) return;
      fetch("/api/assessment-draft", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextDraft)
      }).catch((error) => {
        console.error("Assessment draft autosave failed", error);
      });
    }, 500);
  }

  function handleManualSave() {
    persistDraft(answers);
    setManualSaveMessage("途中保存しました。");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextUnansweredIds = questions
      .filter((question) => !answers[question.id])
      .map((question) => question.id);

    if (nextUnansweredIds.length > 0) {
      setUnansweredIds(nextUnansweredIds);
      document
        .getElementById(`question-${nextUnansweredIds[0]}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const rawBasicInfo = window.localStorage.getItem("shacho-karte-basic-info");
    if (!rawBasicInfo) {
      router.push("/basic-info");
      return;
    }

    const basicInfo = JSON.parse(rawBasicInfo) as BasicInfo;
    const result = calculateResult(answers);
    const currentDraft = draft ?? getLocalDraft();
    const submission: StoredSubmission = {
      id: currentDraft?.id ?? crypto.randomUUID(),
      respondentId: currentDraft?.respondentId,
      responseId: currentDraft?.responseId,
      basicInfo,
      answers,
      result,
      ctaClicked: false,
      createdAt: new Date().toISOString()
    };

    saveLocalSubmission(submission);
    clearLocalDraft();
    router.push("/result");
  }

  return (
    <main className="page-shell">
      {showResumePrompt ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4">
          <section className="panel max-w-md p-6 text-center shadow-2xl">
            <h2 className="text-2xl font-black text-ink">前回の回答が保存されています。</h2>
            <p className="mt-3 leading-7 text-stone-700">続きを回答しますか？</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button className="primary-button" type="button" onClick={handleResumeDraft}>
                続きから回答
              </button>
              <button className="secondary-button" type="button" onClick={handleRestartDraft}>
                最初からやり直す
              </button>
            </div>
          </section>
        </div>
      ) : null}
      <form className="mx-auto max-w-4xl space-y-6" onSubmit={handleSubmit} noValidate>
        <div className="sticky top-0 z-10 -mx-4 border-b border-stone-200 bg-paper/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <p className="text-sm font-bold text-brand">STEP 2</p>
            <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-3xl font-black text-ink">社長カルテ Light（48問）</h1>
                <p className="mt-2 text-sm text-stone-600">
                  1：あてはまらない 〜 4：あてはまる で、現在の実態に近いものを選んでください。
                </p>
              </div>
              <p className="text-sm font-bold text-stone-700">
                {answeredCount}/{questions.length}問 回答済み
              </p>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-stone-200">
              <div className="h-full bg-brand transition-all" style={{ width: `${progress}%` }} />
            </div>
            {unansweredIds.length > 0 ? (
              <p className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">
                未回答の設問があります
              </p>
            ) : null}
          </div>
        </div>

        {groupedQuestions.map((theme, themeIndex) => (
          <section key={theme.id} className="panel overflow-hidden">
            <div className="border-b border-stone-200 bg-stone-50 px-4 py-4 sm:px-5">
              <p className="text-xs font-black text-accent">THEME {themeIndex + 1}</p>
              <h2 className="mt-1 text-xl font-black text-ink">{theme.name}</h2>
              <p className="mt-1 text-sm text-stone-600">{theme.description}</p>
            </div>
            <div className="divide-y divide-stone-200">
              {theme.questions.map((question, index) => (
                <div
                  id={`question-${question.id}`}
                  key={question.id}
                  className={`space-y-3 p-4 sm:p-5 ${
                    unansweredIds.includes(question.id)
                      ? "bg-rose-50/70 ring-2 ring-inset ring-rose-200"
                      : ""
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2 text-xs font-black">
                    <span className="rounded-full bg-teal-50 px-2 py-1 text-brand">
                      {theme.name}
                    </span>
                  </div>
                  <p className="font-bold leading-7 text-stone-800">
                    {themeIndex * 3 + index + 1}. {question.text}
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {answerLabels.map((answer) => {
                      const selected = answers[question.id] === answer.value;
                      return (
                        <label
                          key={answer.value}
                          className={`min-h-16 cursor-pointer rounded-md border px-3 py-3 text-center transition ${
                            selected
                              ? "border-brand bg-teal-50 text-brand"
                              : "border-stone-200 bg-white text-stone-700 hover:border-teal-200"
                          }`}
                        >
                          <input
                            className="sr-only"
                            name={question.id}
                            type="radio"
                            value={answer.value}
                            checked={selected}
                            onChange={() => handleAnswer(question.id, answer.value)}
                          />
                          <span className="block text-lg font-black">{answer.value}</span>
                          <span className="block text-xs font-bold">{answer.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

        <div className="sticky bottom-0 -mx-4 border-t border-stone-200 bg-paper/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-stone-700">全問回答すると結果を表示できます。</p>
              <p className="mt-1 text-xs font-bold text-stone-500">保存期間は最後の回答日から1か月です。</p>
              {manualSaveMessage ? (
                <p className="mt-1 text-xs font-black text-brand">{manualSaveMessage}</p>
              ) : null}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button className="secondary-button" type="button" onClick={handleManualSave}>
                回答を途中保存する
              </button>
              <button className="primary-button" type="submit">
                結果を見る
              </button>
            </div>
          </div>
        </div>
      </form>
    </main>
  );
}
