"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, LockKeyhole, Play, Star, Trophy } from "lucide-react";
import AppSidebar from "@/components/AppSidebar";
import { emptyProgress, loadLearnerProgress, type LearnerProgress } from "@/lib/progress";
import type { LessonSummary } from "@/lib/lesson-types";

export default function LearningPage() {
  const [lessons, setLessons] = useState<LessonSummary[]>([]);
  const [progress, setProgress] = useState<LearnerProgress>(emptyProgress);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadPage() {
      try {
        const [lessonResponse, learner] = await Promise.all([
          fetch("/api/learning/lessons", { cache: "no-store" }),
          loadLearnerProgress(),
        ]);
        const lessonPayload = await lessonResponse.json();
        if (!lessonResponse.ok) {
          throw new Error(lessonPayload.error ?? "ไม่สามารถโหลดบทเรียนได้");
        }
        if (cancelled) return;
        setLessons(Array.isArray(lessonPayload.data) ? lessonPayload.data : []);
        setProgress(learner.progress);
        setEmail(learner.email);
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการโหลดข้อมูล");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadPage();
    return () => {
      cancelled = true;
    };
  }, []);

  const nextIndex = lessons.findIndex((lesson) => !progress.completed.includes(lesson.id));
  const activeIndex = nextIndex === -1 ? lessons.length : nextIndex;
  const totalXp = lessons.reduce((total, lesson) => total + lesson.xp, 0);

  return (
    <main className="shell py-7 md:py-9">
      <div className="app-layout flex gap-9">
        <AppSidebar />
        <section className="min-w-0 flex-1">
          <Link href="/" className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-slate-500">
            <ArrowLeft size={16} /> กลับหน้าหลัก
          </Link>

          <div className="relative overflow-hidden rounded-[28px] bg-[#e5f7ed] p-7 md:p-9">
            <div className="absolute -right-8 -top-8 h-48 w-48 rounded-full bg-white/50" />
            <div className="relative z-10 max-w-xl">
              <span className="rounded-full bg-white px-3 py-1.5 text-xs font-extrabold text-[#209a73]">
                {lessons.length} LESSONS · LEARN AT YOUR PACE
              </span>
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight md:text-4xl">
                เส้นทางการเรียนภาษาอังกฤษ
              </h1>
              <p className="mt-3 max-w-lg text-sm leading-6 text-slate-600">
                บทเรียนและแบบทดสอบโหลดจาก Supabase โดยตรง แต่ละบทมีโจทย์ ตัวเลือก และเกณฑ์ XP ของตัวเอง
              </p>
              <div className="mt-5 flex flex-wrap gap-4 text-sm font-bold text-slate-600">
                <span className="flex items-center gap-2"><BookOpen size={17} /> {lessons.length} บทเรียน</span>
                <span className="flex items-center gap-2"><Star size={17} className="text-amber-500" /> สูงสุด {totalXp} XP</span>
                <span className="flex items-center gap-2"><Trophy size={17} /> XP ปลดล็อกตามลำดับ</span>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <p className="eyebrow">YOUR LEARNING PATH</p>
            <h2 className="mt-1 text-2xl font-extrabold">เริ่มต้นบทสนทนา แล้วก้าวต่อไป</h2>
            <p className="mt-1 text-sm text-slate-500">
              ต้องผ่านบทก่อนหน้าและมี XP ตามเกณฑ์จึงจะเปิดบทถัดไป
            </p>
          </div>

          {loadError && (
            <div role="alert" className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              โหลดข้อมูลไม่สำเร็จ: {loadError}
            </div>
          )}

          {!loadError && !loading && lessons.length === 0 && (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              ยังไม่มีบทเรียนที่เผยแพร่ในหลักสูตร Everyday English Path บน Supabase
            </div>
          )}

          <div className="mt-5 space-y-3">
            {lessons.map((lesson, index) => {
              const done = progress.completed.includes(lesson.id);
              const unlocked = index === 0 || (
                progress.completed.includes(lessons[index - 1]?.id ?? "") &&
                progress.xp >= lesson.requiredXp
              );
              const current = !done && index === activeIndex;

              return (
                <article key={lesson.id} className="lesson-node bg-white">
                  <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${
                    done ? "bg-[#dff7eb] text-[#209a73]" : unlocked ? "bg-[#f0edff] text-violet-500" : "bg-slate-100 text-slate-400"
                  }`}>
                    {done ? <CheckCircle2 size={24} /> : unlocked ? <Play size={22} fill="currentColor" /> : <LockKeyhole size={22} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-extrabold">{lesson.title}</h3>
                      {current && <span className="rounded-full bg-[#e3f6ed] px-2 py-0.5 text-[10px] font-extrabold text-[#168565]">บทถัดไป</span>}
                      {done && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700">สำเร็จแล้ว</span>}
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{lesson.sub}</p>
                    <p className="mt-2 text-xs font-semibold text-slate-400">
                      {lesson.level} · {lesson.mins} นาที · {lesson.xp} XP · ต้องมี {lesson.requiredXp} XP
                    </p>
                  </div>
                  <Link
                    href={unlocked && !done ? `/learning/lesson?lesson=${encodeURIComponent(lesson.id)}` : "#"}
                    aria-disabled={!unlocked || done}
                    onClick={(event) => { if (!unlocked || done) event.preventDefault(); }}
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      unlocked && !done ? "bg-[#24a982] text-white" : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {done ? <CheckCircle2 size={18} /> : unlocked ? <ArrowRight size={19} /> : <LockKeyhole size={17} />}
                  </Link>
                </article>
              );
            })}
          </div>

          {!email && (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              เข้าสู่ระบบเพื่อบันทึก XP และสถานะปลดล็อกข้ามอุปกรณ์{" "}
              <Link className="font-extrabold underline" href="/auth?next=/learning">เข้าสู่ระบบ</Link>
            </div>
          )}
          {loading && <p className="mt-4 text-sm text-slate-400">กำลังโหลดบทเรียนจาก Supabase…</p>}

          <div className="mt-6 flex gap-3 rounded-2xl border border-[#dceee5] bg-[#f4fbf7] p-4 text-sm text-slate-600">
            <CheckCircle2 className="shrink-0 text-[#24a982]" size={20} />
            <p><strong className="text-slate-800">ระบบ XP:</strong> ต้องตอบถูกอย่างน้อย 4 ใน 5 ข้อเพื่อผ่านบท คะแนนและสถานะความก้าวหน้าจะถูกบันทึกตามระบบเดิม</p>
          </div>
        </section>
      </div>
    </main>
  );
}
