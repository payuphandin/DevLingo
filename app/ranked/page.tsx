"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, LockKeyhole, ShieldCheck, Sparkles, Swords, Trophy, Users, Zap } from "lucide-react";
import AppSidebar from "@/components/AppSidebar";
import { emptyProgress, loadLearnerProgress, type LearnerProgress } from "@/lib/progress";

type RankedLesson = {
  id: string;
  databaseId: string;
  title: string;
  sub: string;
  level: string;
  mins: number;
  xp: number;
  requiredXp: number;
  position: number;
};

export default function RankedPage() {
  const [lessons, setLessons] = useState<RankedLesson[]>([]);
  const [progress, setProgress] = useState<LearnerProgress>(emptyProgress);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadPage() {
      try {
        const [lessonResponse, learner] = await Promise.all([
          fetch("/api/learning/lessons", { cache: "no-store" }),
          loadLearnerProgress(),
        ]);
        const payload = await lessonResponse.json();
        if (!lessonResponse.ok) {
          throw new Error(payload.error ?? "ไม่สามารถโหลดบทเรียนได้");
        }
        if (cancelled) return;
        setLessons(Array.isArray(payload.data) ? payload.data : []);
        setProgress(learner.progress);
        setEmail(learner.email);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "โหลดข้อมูล Rank ไม่สำเร็จ");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadPage();
    return () => { cancelled = true; };
  }, []);

  const rankedLessons = useMemo(() => lessons.map((lesson, index) => {
    const previous = lessons[index - 1];
    const previousCompleted = !previous || progress.completed.includes(previous.id) ||
      progress.completed.includes(previous.databaseId);
    const enoughXpToEnter = lesson.xp > 0 &&
      progress.xp >= lesson.xp &&
      progress.xp >= lesson.requiredXp;
    const canJoin = Boolean(email) && previousCompleted && enoughXpToEnter;

    let lockedReason = "";
    if (!email) lockedReason = "เข้าสู่ระบบเพื่อแข่งขัน";
    else if (!previousCompleted) lockedReason = "ต้องผ่านบทเรียนก่อนหน้า";
    else if (lesson.xp <= 0) lockedReason = "บทเรียนนี้ยังไม่เปิด Rank";
    else if (progress.xp < lesson.xp) lockedReason = "XP ไม่พอสำหรับค่าเข้าแข่งขัน";
    else if (progress.xp < lesson.requiredXp) lockedReason = "XP ยังไม่ถึงเกณฑ์ปลดล็อก";

    return { ...lesson, canJoin, lockedReason };
  }), [lessons, progress.completed, progress.xp, email]);

  return (
    <main className="shell py-7 md:py-9">
      <div className="app-layout flex gap-9">
        <AppSidebar />
        <section className="min-w-0 flex-1">
          <Link href="/" className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-slate-500">
            <ArrowLeft size={16} /> กลับหน้าหลัก
          </Link>

          <section className="group relative isolate overflow-hidden rounded-[32px] bg-gradient-to-br from-[#241443] via-[#3c246d] to-[#7149b4] p-6 text-white shadow-[0_22px_60px_rgba(73,47,123,.2)] md:p-9">
            <div className="pointer-events-none absolute inset-0 opacity-[0.12]" style={{backgroundImage:"radial-gradient(#ffffff 0.8px, transparent 0.8px)",backgroundSize:"18px 18px"}} />
            <div className="pointer-events-none absolute -right-14 -top-24 h-80 w-80 rounded-full border-[44px] border-white/[0.07]" />
            <div className="pointer-events-none absolute right-8 -top-5 h-56 w-56 rounded-full border border-violet-100/10" />
            <div className="pointer-events-none absolute right-32 top-10 h-32 w-32 rounded-full bg-fuchsia-300/20 blur-3xl" />
            <div className="pointer-events-none absolute bottom-[-90px] left-[38%] h-52 w-52 rounded-full bg-violet-300/15 blur-3xl" />
            <div className="relative z-10 grid gap-7 md:grid-cols-[1fr_auto] md:items-end">
              <div className="max-w-2xl">
                <span className="inline-flex items-center gap-2 rounded-full border border-violet-100/15 bg-white/10 px-3 py-1.5 text-xs font-extrabold tracking-wide text-violet-100 shadow-inner shadow-white/5">
                  <Sparkles size={14} className="text-fuchsia-200" /> YOUR NEXT LITTLE WIN <span className="text-violet-300">·</span> RANK MATCH
                </span>
                <h1 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight md:text-5xl">
                  พร้อมดวลความรู้<br />ภาษาอังกฤษแล้วหรือยัง?
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-violet-100/75 md:text-base">
                  เลือกบทเรียนที่ปลดล็อกแล้ว จับคู่กับผู้เรียนอีกคน และแข่งทำแบบทดสอบเพื่อชิง XP
                </p>
                <Link href="#rank-lessons" className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#e9d5ff] px-5 py-3.5 font-extrabold text-[#392167] shadow-[0_5px_0_#a78bfa] transition hover:-translate-y-0.5 hover:bg-white active:translate-y-1 active:shadow-[0_2px_0_#a78bfa]">
                  เลือกบทเรียนเพื่อแข่งขัน <ArrowRight size={17} />
                </Link>
              </div>
              <div className="relative flex items-end justify-between gap-4 md:flex-col md:items-center">
                <div className="absolute -right-2 top-[-34px] hidden h-24 w-24 rounded-full border border-fuchsia-100/20 md:block" />
                <div className="flex gap-2">
                  {["1", "V", "1"].map((letter, index) => (
                    <div key={index} className={"flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 font-extrabold shadow-lg shadow-black/10 " + (index === 1 ? "bg-[#e9d5ff] text-[#392167]" : "bg-white/10 text-violet-100")}>
                      {letter}
                    </div>
                  ))}
                </div>
                <div className="relative mr-2 flex h-24 w-24 rotate-6 items-center justify-center rounded-[30px] border border-white/50 bg-gradient-to-br from-[#f5d0fe] to-[#c4b5fd] text-[#4c1d95] shadow-[0_16px_35px_rgba(18,8,42,.25)] transition duration-300 group-hover:rotate-0 md:mr-0 md:h-28 md:w-28">
                  <div className="absolute inset-2 rounded-[23px] border border-white/50" />
                  <Swords size={48} strokeWidth={2.5} />
                  <Sparkles size={16} className="absolute -right-2 -top-2 text-fuchsia-100" />
                </div>
              </div>
            </div>
            <div className="relative mt-7 flex flex-wrap gap-2 text-xs font-bold text-violet-100">
              <span className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3 py-2 backdrop-blur-sm"><Users size={15} /> แข่งขัน 1 ต่อ 1</span>
              <span className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3 py-2 backdrop-blur-sm"><Trophy size={15} /> ผู้ชนะรับ 1.5× XP</span>
              <span className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3 py-2 backdrop-blur-sm"><ShieldCheck size={15} /> ตรวจผลโดยระบบ</span>
            </div>
          </section>

          <div id="rank-lessons" className="mt-8 scroll-mt-6">
            <p className="eyebrow">CHOOSE YOUR BATTLE</p>
            <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl font-extrabold">เลือกบทเรียนเพื่อแข่งขัน</h2>
                <p className="mt-1 text-sm text-slate-500">Rank Match สามารถเล่นซ้ำได้เมื่อบทเรียนผ่านเงื่อนไขแล้ว</p>
              </div>
              {email && <div className="flex items-center gap-2 rounded-xl bg-[#fff3d9] px-3 py-2 text-sm font-extrabold text-amber-700"><Zap size={16} /> {progress.xp} XP</div>}
            </div>
          </div>

          {!email && (
            <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-extrabold text-amber-900">เข้าสู่ระบบก่อนลงสนาม</p>
                <p className="mt-1 text-sm text-amber-800">ต้องมีบัญชีเพื่อบันทึกผลการแข่งขันและ XP</p>
              </div>
              <Link href="/auth?next=/ranked" className="primary-btn shrink-0">เข้าสู่ระบบ <ArrowRight size={16} /></Link>
            </div>
          )}

          {error && <div role="alert" className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}

          {loading ? (
            <div className="panel mt-5 p-8 text-center text-sm font-semibold text-slate-400">กำลังโหลดบทเรียนสำหรับ Rank Match…</div>
          ) : !error && rankedLessons.length === 0 ? (
            <div className="panel mt-5 p-8 text-center">
              <BookOpen className="mx-auto text-slate-300" size={30} />
              <p className="mt-3 font-bold">ยังไม่มีบทเรียนที่เปิดให้แข่งขัน</p>
            </div>
          ) : (
            <div className="mt-5 grid gap-3 xl:grid-cols-2">
              {rankedLessons.map((lesson, index) => (
                <article key={lesson.id} className="panel flex items-center gap-4 p-4 md:p-5">
                  <div className={"flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl " + (lesson.canJoin ? "bg-[#e3f6ed] text-[#168565]" : "bg-slate-100 text-slate-400")}>
                    {lesson.canJoin ? <Swords size={22} /> : <LockKeyhole size={21} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#209a73]">UNIT {String(index + 1).padStart(2, "0")}</span>
                      {lesson.canJoin && <span className="rounded-full bg-[#e3f6ed] px-2 py-0.5 text-[10px] font-extrabold text-[#168565]">พร้อมแข่งขัน</span>}
                    </div>
                    <h3 className="mt-1 truncate font-extrabold">{lesson.title}</h3>
                    <p className="mt-1 line-clamp-1 text-xs text-slate-500">{lesson.sub || lesson.level}</p>
                    <p className="mt-2 text-[11px] font-semibold text-slate-400">{lesson.xp} XP · ต้องมี {lesson.requiredXp} XP · {lesson.mins} นาที</p>
                    {!lesson.canJoin && <p className="mt-1 text-xs font-semibold text-amber-600">{lesson.lockedReason}</p>}
                  </div>
                  {lesson.canJoin ? (
                    <Link href={"/ranked/queue?lesson=" + encodeURIComponent(lesson.id)} className="primary-btn h-10 shrink-0 px-3 text-xs">
                      แข่งขัน <ArrowRight size={15} />
                    </Link>
                  ) : (
                    <span className="inline-flex h-10 shrink-0 items-center gap-1 rounded-xl bg-slate-100 px-3 text-xs font-bold text-slate-400">
                      <LockKeyhole size={14} /> Locked
                    </span>
                  )}
                </article>
              ))}
            </div>
          )}

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-[#effaf4] p-4">
              <p className="text-xs font-bold text-slate-500">เมื่อชนะ</p>
              <p className="mt-1 text-xl font-extrabold text-[#168565]">+1.5× XP</p>
              <p className="mt-1 text-xs text-slate-500">ได้รับ XP บทเรียน × 1.5</p>
            </div>
            <div className="rounded-2xl bg-rose-50 p-4">
              <p className="text-xs font-bold text-slate-500">เมื่อแพ้</p>
              <p className="mt-1 text-xl font-extrabold text-rose-600">−1× XP</p>
              <p className="mt-1 text-xs text-slate-500">หัก XP เท่ากับ XP ปกติของบทเรียน โดยไม่ต่ำกว่า 0</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
