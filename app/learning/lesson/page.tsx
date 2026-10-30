"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, Volume2, X, LockKeyhole } from "lucide-react";
import { getSupabase } from "@/lib/supabase";
import { emptyProgress, loadLearnerProgress, saveLearnerProgress, type LearnerProgress } from "@/lib/progress";
import type { CheckedAnswer, LessonQuestion, LessonSummary, LessonWithQuestions } from "@/lib/lesson-types";

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function LessonRunner() {
  const router = useRouter();
  const search = useSearchParams();
  const lessonId = search.get("lesson") || "greetings";

  const [lesson, setLesson] = useState<LessonWithQuestions | null>(null);
  const [questions, setQuestions] = useState<LessonQuestion[]>([]);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveError, setSaveError] = useState("");
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [checking, setChecking] = useState(false);
  const [checkedResult, setCheckedResult] = useState<CheckedAnswer | null>(null);
  const [countdown, setCountdown] = useState(15);
  const [movingNext, setMovingNext] = useState(false);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [finished, setFinished] = useState(false);
  const [earned, setEarned] = useState(0);
  const [passed, setPassed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadLesson() {
      setLoading(true);
      setReady(false);
      setSaveError("");
      try {
        const supabase = getSupabase();
        if (!supabase) throw new Error("ยังไม่ได้ตั้งค่า Supabase");

        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError || !authData.user) {
          router.replace("/auth?next=/learning");
          return;
        }

        const [lessonResponse, lessonsResponse, learner] = await Promise.all([
          fetch(`/api/learning/lessons/${encodeURIComponent(lessonId)}`, { cache: "no-store" }),
          fetch("/api/learning/lessons", { cache: "no-store" }),
          loadLearnerProgress(),
        ]);
        const lessonPayload = await lessonResponse.json();
        const lessonsPayload = await lessonsResponse.json();
        if (!lessonResponse.ok) throw new Error(lessonPayload.error ?? "โหลดบทเรียนไม่สำเร็จ");
        if (!lessonsResponse.ok) throw new Error(lessonsPayload.error ?? "โหลดเส้นทางการเรียนไม่สำเร็จ");

        const loadedLesson = lessonPayload.data as LessonWithQuestions;
        const allLessons = lessonsPayload.data as LessonSummary[];
        if (!loadedLesson.questions?.length) throw new Error("บทเรียนนี้ยังไม่มีคำถามใน Supabase");

        if (learner.progress.completed.includes(loadedLesson.id)) {
          router.replace("/learning");
          return;
        }
        const lessonIndex = allLessons.findIndex((item) => item.id === loadedLesson.id);
        if (lessonIndex < 0) throw new Error("บทเรียนนี้ไม่อยู่ในเส้นทางการเรียน");
        if (
          lessonIndex > 0 &&
          (!learner.progress.completed.includes(allLessons[lessonIndex - 1].id) ||
            learner.progress.xp < loadedLesson.requiredXp)
        ) {
          router.replace("/learning");
          return;
        }

        if (cancelled) return;
        setLesson(loadedLesson);
        setQuestions(
          shuffle(loadedLesson.questions).map((question) => ({
            ...question,
            options: shuffle(question.options),
          })),
        );
        setAnswers([]);
        setIndex(0);
        setSelected(null);
        setChecked(false);
        setCheckedResult(null);
        setFinished(false);
        setReady(true);
      } catch (error) {
        if (!cancelled) {
          setSaveError(error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการโหลดบทเรียน");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadLesson();
    return () => {
      cancelled = true;
    };
  }, [lessonId, router]);

  const question = questions[index];
  const score = answers.filter(Boolean).length;

  const finish = useCallback(async (finalAnswers: boolean[]) => {
    if (!lesson) return;
    setSaveError("");
    const correct = finalAnswers.filter(Boolean).length;
    const didPass = correct >= Math.min(4, questions.length);
    setPassed(didPass);

    const { progress: current } = await loadLearnerProgress();
    const progress: LearnerProgress = { ...emptyProgress, ...current };
    let xp = 0;

    if (didPass && !progress.completed.includes(lesson.id)) {
      xp = lesson.xp;
      progress.xp += xp;
      progress.completed = [...progress.completed, lesson.id];
      const today = new Date().toLocaleDateString("en-CA");
      if (progress.lastDay !== today) {
        const yesterday = new Date(Date.now() - 86400000).toLocaleDateString("en-CA");
        progress.streak = progress.lastDay === yesterday ? progress.streak + 1 : 1;
        progress.lastDay = today;
      }
      const result = await saveLearnerProgress(progress);
      if (result.error) {
        setSaveError("บันทึกความก้าวหน้าไม่สำเร็จ: " + result.error);
        return;
      }
    }

    setEarned(xp);
    setFinished(true);
  }, [lesson, questions.length]);

  const goToNextQuestion = useCallback(async () => {
    if (!checked || movingNext) return;
    setMovingNext(true);
    const finalAnswers = answers;
    if (index === questions.length - 1) {
      await finish(finalAnswers);
    } else {
      setIndex((currentIndex) => currentIndex + 1);
      setSelected(null);
      setChecked(false);
      setCheckedResult(null);
      setCountdown(15);
      setSaveError("");
    }
    setMovingNext(false);
  }, [checked, movingNext, answers, index, questions.length, finish]);

  useEffect(() => {
    if (!checked || !checkedResult || movingNext) return;
    if (countdown <= 0) {
      void goToNextQuestion();
      return;
    }
    const timer = window.setTimeout(() => setCountdown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [checked, checkedResult, countdown, movingNext, goToNextQuestion]);

  const checkAnswer = async () => {
    if (!lesson || !question || selected === null || checked) return;

    setChecking(true);
    setSaveError("");
    try {
      const supabase = getSupabase();
      if (!supabase) throw new Error("ยังไม่ได้ตั้งค่า Supabase");
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) throw new Error("เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่");

      const response = await fetch("/api/learning/check-answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify({
          questionId: question.id,
          optionPosition: question.options[selected].position,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "ตรวจคำตอบไม่สำเร็จ");

      const result: CheckedAnswer = {
        correct: Boolean(payload.correct),
        correctOptionPosition: Number(payload.correctOptionPosition),
      };
      setCheckedResult(result);
      setChecked(true);
      setCountdown(15);
      setAnswers((current) => [...current, result.correct]);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "ตรวจคำตอบไม่สำเร็จ");
    } finally {
      setChecking(false);
    }
  };

  if (loading || (!ready && !saveError)) {
    return (
      <main className="shell flex min-h-screen items-center justify-center py-10">
        <div className="panel p-8 text-center">
          <p className="font-bold">กำลังโหลดบทเรียนจาก Supabase…</p>
        </div>
      </main>
    );
  }

  if (saveError && !ready) {
    return (
      <main className="shell flex min-h-screen items-center justify-center py-10">
        <section className="panel w-full max-w-xl p-8 text-center">
          <p className="font-extrabold">เปิดบทเรียนไม่สำเร็จ</p>
          <p role="alert" className="mt-3 text-sm leading-6 text-rose-600">{saveError}</p>
          <Link href="/learning" className="primary-btn mt-6">กลับเส้นทางการเรียน</Link>
        </section>
      </main>
    );
  }

  if (!lesson || !question || questions.length === 0) {
    return (
      <main className="shell p-10">
        <p>ไม่พบข้อมูลบทเรียนหรือแบบทดสอบใน Supabase</p>
        <Link href="/learning" className="primary-btn mt-5">กลับเส้นทางการเรียน</Link>
      </main>
    );
  }

  if (finished) {
    return (
      <main className="shell flex min-h-screen items-center justify-center py-10">
        <section className="panel w-full max-w-xl p-8 text-center md:p-10">
          <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-[26px] ${passed ? "bg-[#dff7eb] text-[#209a73]" : "bg-amber-50 text-amber-600"}`}>
            {passed ? <CheckCircle2 size={42} /> : <LockKeyhole size={42} />}
          </div>
          <p className="eyebrow mt-6">LESSON RESULT</p>
          <h1 className="mt-2 text-3xl font-extrabold">{passed ? "เก่งมาก! ผ่านบทเรียนแล้ว" : "ยังไม่ผ่าน ลองอีกครั้งนะ"}</h1>
          <p className="mt-3 text-slate-500">
            {passed ? "ปลดล็อกบทถัดไปได้ตามเกณฑ์ XP" : `ต้องตอบถูกอย่างน้อย ${Math.min(4, questions.length)} จาก ${questions.length} ข้อจึงจะผ่าน และยังไม่ได้รับ XP`}
          </p>
          <div className="my-7 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-[#f2faf5] p-5">
              <p className="text-sm text-slate-500">ตอบถูก</p>
              <p className="mt-1 text-3xl font-extrabold text-[#209a73]">{score}/{questions.length}</p>
            </div>
            <div className="rounded-2xl bg-[#fff5df] p-5">
              <p className="text-sm text-slate-500">XP ที่ได้รับ</p>
              <p className="mt-1 text-3xl font-extrabold text-amber-600">+{earned} XP</p>
            </div>
          </div>
          {saveError && <p className="mb-4 text-sm text-rose-600">{saveError}</p>}
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/learning" className="primary-btn">กลับเส้นทางการเรียน <ArrowRight size={17} /></Link>
            {!passed && <Link href={`/learning/lesson?lesson=${encodeURIComponent(lesson.id)}`} className="soft-btn">ลองอีกครั้ง</Link>}
            <Link href="/" className="soft-btn">หน้าหลัก</Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-6 md:px-8">
      <header className="flex items-center gap-4">
        <Link href="/learning" aria-label="ออกจากบทเรียน" className="rounded-xl p-2 text-slate-500 hover:bg-slate-100">
          <X size={21} />
        </Link>
        <div className="progress-track flex-1">
          <div className="progress-fill" style={{ width: `${((index + (checked ? 1 : 0)) / questions.length) * 100}%` }} />
        </div>
        <span className="text-sm font-bold text-slate-500">{index + 1}/{questions.length}</span>
      </header>

      <section className="panel mt-8 p-6 md:mt-12 md:p-10">
        <span className="rounded-full bg-[#e3f6ed] px-3 py-1.5 text-xs font-extrabold text-[#168565]">
          {lesson.level.toUpperCase()} · {lesson.title}
        </span>
        {saveError && <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{saveError}</p>}
        <h1 className="mt-5 text-2xl font-extrabold md:text-3xl">{question.prompt}</h1>

        {question.english && (
          <div className="my-7 flex min-h-36 flex-col items-center justify-center rounded-2xl bg-[#f4faf6] p-6 text-center">
            <div className="flex items-center gap-3">
              <p className="text-3xl font-extrabold tracking-tight md:text-4xl">{question.english}</p>
              <button
                aria-label="ฟังเสียง"
                onClick={() => {
                  if ("speechSynthesis" in window) {
                    const utterance = new SpeechSynthesisUtterance(question.english);
                    utterance.lang = "en-US";
                    speechSynthesis.speak(utterance);
                  }
                }}
                className="rounded-full bg-white p-3 text-[#209a73] shadow-sm"
              >
                <Volume2 size={20} />
              </button>
            </div>
            <p className="mt-3 text-sm text-slate-500">เลือกคำตอบที่เหมาะสมที่สุด</p>
          </div>
        )}

        <div className="space-y-3">
          {question.options.map((option, optionIndex) => {
            const isCorrect = checked && option.position === checkedResult?.correctOptionPosition;
            const isWrongSelection = checked && selected === optionIndex && checkedResult?.correct === false;
            return (
              <button
                key={option.id}
                disabled={checked || checking}
                onClick={() => setSelected(optionIndex)}
                className={`flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition ${
                  isCorrect
                    ? "border-emerald-400 bg-emerald-50"
                    : isWrongSelection
                      ? "border-rose-300 bg-rose-50"
                      : selected === optionIndex
                        ? "border-[#24a982] bg-[#effaf4]"
                        : "border-slate-100 bg-white hover:border-emerald-200"
                }`}
              >
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold ${
                  selected === optionIndex ? "bg-[#24a982] text-white" : "bg-slate-100 text-slate-500"
                }`}>
                  {String.fromCharCode(65 + optionIndex)}
                </span>
                <span className="font-semibold">{option.text}</span>
                {isCorrect && <CheckCircle2 className="ml-auto text-emerald-600" />}
              </button>
            );
          })}
        </div>

        {checked && checkedResult && (
          <div className={`mt-5 rounded-2xl p-4 text-sm ${checkedResult.correct ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"}`}>
            <p className="font-extrabold">{checkedResult.correct ? "ถูกต้องเลย!" : "ยังไม่ถูก ลองจำคำตอบนี้ไว้นะ"}</p>
            <p className="mt-1 leading-6">{question.explain}</p>
          </div>
        )}

        <div className="mt-7 flex justify-end">
          {!checked ? (
            <button
              disabled={selected === null || checking}
              onClick={() => void checkAnswer()}
              className="primary-btn disabled:cursor-not-allowed disabled:opacity-40"
            >
              {checking ? "กำลังตรวจคำตอบ…" : "ตรวจคำตอบ"} <ArrowRight size={17} />
            </button>
          ) : (
            <div className="flex flex-col items-end gap-2">
              <button
                onClick={() => void goToNextQuestion()}
                disabled={movingNext}
                className="primary-btn disabled:cursor-wait disabled:opacity-70"
              >
                {movingNext ? "กำลังไปต่อ…" : index === questions.length - 1 ? "ดูผลคะแนน" : "ไปข้อถัดไป"} <ArrowRight size={17} />
              </button>
              <p className="text-xs text-slate-500">
                ไปต่ออัตโนมัติใน {countdown} วินาที
              </p>
            </div>
          )}
        </div>
      </section>
      <p className="mt-5 text-center text-xs text-slate-400">ทำไปทีละข้อ ไม่ต้องรีบ · คุณกำลังพัฒนาอยู่</p>
    </main>
  );
}

export default function LessonPage() {
  return (
    <Suspense fallback={<main className="shell p-10">กำลังโหลดบทเรียน…</main>}>
      <LessonRunner />
    </Suspense>
  );
}
