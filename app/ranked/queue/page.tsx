"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { ArrowLeft, Swords, Users, Clock3, Trophy, XCircle, LoaderCircle, ShieldCheck } from "lucide-react";
import { getSupabase } from "@/lib/supabase";

type QueueState =
  | { status: "idle" }
  | { status: "waiting"; queueId: string; createdAt: string }
  | { status: "matched"; match: { id: string; lesson_id: string; status: string; lesson_xp: number; started_at: string } };

function RankedQueueContent() {
  const router = useRouter();
  const search = useSearchParams();
  const lessonKey = search.get("lesson") ?? "";
  const [queue, setQueue] = useState<QueueState>({ status: "idle" });
  const [lessonTitle, setLessonTitle] = useState("บทเรียน");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [seconds, setSeconds] = useState(0);

  const request = useCallback(async (method: "GET" | "POST", body?: { action: "join" | "cancel"; lessonKey?: string }) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("ยังไม่ได้ตั้งค่า Supabase");
    const { data, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !data.session) {
      router.replace("/auth?next=" + encodeURIComponent("/ranked/queue?lesson=" + lessonKey));
      throw new Error("กรุณาเข้าสู่ระบบก่อนเล่น Ranked");
    }
    const response = await fetch("/api/ranked/queue", {
      method, cache: "no-store",
      headers: { Authorization: `Bearer ${data.session.access_token}`, ...(body ? { "Content-Type": "application/json" } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error ?? "ไม่สามารถเชื่อมต่อ Ranked ได้");
    return payload.data as QueueState;
  }, [lessonKey, router]);

  const refreshQueue = useCallback(async () => setQueue(await request("GET")), [request]);

  useEffect(() => {
    let active = true;
    async function initialize() {
      if (!lessonKey) { setError("ไม่พบรหัสบทเรียน กรุณากลับไปเลือกบทเรียน"); setLoading(false); return; }
      try {
        const [lessonResponse, status] = await Promise.all([
          fetch("/api/learning/lessons", { cache: "no-store" }), request("GET"),
        ]);
        const payload = await lessonResponse.json();
        if (!lessonResponse.ok) throw new Error(payload.error ?? "โหลดบทเรียนไม่สำเร็จ");
        const lesson = (payload.data ?? []).find((item: { id: string; title: string }) => item.id === lessonKey);
        if (!lesson) throw new Error("ไม่พบบทเรียนนี้");
        if (active) { setLessonTitle(lesson.title); setQueue(status); }
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
      } finally { if (active) setLoading(false); }
    }
    void initialize();
    return () => { active = false; };
  }, [lessonKey, request]);

  useEffect(() => {
    if (queue.status !== "waiting") return;
    const timer = window.setInterval(() => {
      setSeconds((value) => value + 3);
      void refreshQueue().catch((e) => setError(e instanceof Error ? e.message : "ตรวจสอบคิวไม่สำเร็จ"));
    }, 3000);
    return () => window.clearInterval(timer);
  }, [queue.status, refreshQueue]);

  const join = async () => {
    setBusy(true); setError("");
    try { await request("POST", { action: "join", lessonKey }); await refreshQueue(); setSeconds(0); }
    catch (e) { setError(e instanceof Error ? e.message : "เข้าคิวไม่สำเร็จ"); }
    finally { setBusy(false); }
  };
  const cancel = async () => {
    setBusy(true); setError("");
    try { await request("POST", { action: "cancel" }); setQueue({ status: "idle" }); setSeconds(0); }
    catch (e) { setError(e instanceof Error ? e.message : "ยกเลิกคิวไม่สำเร็จ"); }
    finally { setBusy(false); }
  };

  if (loading) return <main className="shell flex min-h-screen items-center justify-center"><div className="panel p-8 text-center"><LoaderCircle className="mx-auto animate-spin text-[#24a982]" size={30}/><p className="mt-3 font-bold">กำลังเตรียม Ranked…</p></div></main>;

  return (
    <main className="shell min-h-screen py-8 md:py-12">
      <Link href="/ranked" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500"><ArrowLeft size={17}/> กลับหน้า Rank</Link>
      <section className="mx-auto mt-7 max-w-2xl overflow-hidden rounded-[30px] border border-[#e5ece7] bg-white shadow-[0_18px_55px_rgba(28,65,52,.07)]">
        <div className="relative overflow-hidden bg-[#172d35] px-7 py-9 text-white md:px-10">
          <div className="absolute -right-10 -top-20 h-64 w-64 rounded-full border-[35px] border-white/5"/>
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-extrabold tracking-widest text-emerald-200"><Swords size={14}/> RANKED 1V1</span>
            <h1 className="mt-5 text-3xl font-extrabold md:text-4xl">ดวลความรู้ภาษาอังกฤษ</h1>
            <p className="mt-3 max-w-lg text-sm leading-6 text-slate-300">จับคู่กับผู้เรียนอีกคนในบทเรียนเดียวกัน แข่งขันทำแบบทดสอบเพื่อชิง XP</p>
            <div className="mt-6 flex flex-wrap gap-3 text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2"><Users size={15}/> ผู้เล่น 2 คน</span>
              <span className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2"><ShieldCheck size={15}/> ตรวจผลจากเซิร์ฟเวอร์</span>
            </div>
          </div>
        </div>
        <div className="p-6 md:p-9">
          <p className="eyebrow">SELECTED LESSON</p>
          <h2 className="mt-2 text-2xl font-extrabold">{lessonTitle}</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-[#effaf4] p-4"><p className="text-xs font-bold text-slate-500">เมื่อชนะ</p><p className="mt-1 text-2xl font-extrabold text-[#168565]">+1.5× XP</p><p className="mt-1 text-xs text-slate-500">ได้รับ XP บทเรียน × 1.5</p></div>
            <div className="rounded-2xl bg-rose-50 p-4"><p className="text-xs font-bold text-slate-500">เมื่อแพ้</p><p className="mt-1 text-2xl font-extrabold text-rose-600">−1× XP</p><p className="mt-1 text-xs text-slate-500">หัก XP เท่ากับ XP ปกติของบทเรียน</p></div>
          </div>
          {error && <div role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
          {queue.status === "idle" && <div className="mt-7"><button onClick={() => void join()} disabled={busy || !lessonKey} className="primary-btn w-full justify-center py-4 text-base disabled:opacity-60">{busy ? <LoaderCircle className="animate-spin" size={19}/> : <Swords size={19}/>} ค้นหาคู่แข่ง</button><p className="mt-3 text-center text-xs leading-5 text-slate-400">จับคู่กับผู้เล่นที่เลือกบทเรียนเดียวกันและผ่านเงื่อนไข XP</p></div>}
          {queue.status === "waiting" && <div className="mt-7 rounded-2xl border border-emerald-100 bg-[#f4fbf7] p-6 text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-[#24a982] shadow-sm"><LoaderCircle size={30} className="animate-spin"/></div><h3 className="mt-4 text-lg font-extrabold">กำลังค้นหาคู่แข่ง</h3><p className="mt-1 text-sm text-slate-500">รอผู้เล่นที่เลือกบทเรียนเดียวกันเข้าร่วม</p><p className="mt-3 flex items-center justify-center gap-2 text-xs font-bold text-[#168565]"><Clock3 size={14}/> ค้นหาแล้ว {seconds} วินาที</p><button onClick={() => void cancel()} disabled={busy} className="soft-btn mt-5 w-full justify-center text-rose-600">{busy ? "กำลังยกเลิก…" : <><XCircle size={16}/> ยกเลิกการค้นหา</>}</button></div>}
          {queue.status === "matched" && <div className="mt-7 rounded-2xl border border-emerald-200 bg-[#f1fbf5] p-6 text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-[#24a982] shadow-sm"><Trophy size={30}/></div><h3 className="mt-4 text-xl font-extrabold text-[#168565]">จับคู่สำเร็จ!</h3><p className="mt-2 text-sm leading-6 text-slate-600">พบคู่แข่งสำหรับบทเรียนนี้แล้ว ระบบสร้างห้องแข่งขันเรียบร้อย</p><p className="mt-4 break-all rounded-xl bg-white p-3 text-xs text-slate-400">Match ID: {queue.match.id}</p><p className="mt-3 text-xs text-slate-500">เข้าสู่ห้องแข่งขันเพื่อเริ่มทำแบบทดสอบได้ทันที</p><button onClick={() => router.push(`/ranked/match/${encodeURIComponent(queue.match.id)}`)} className="primary-btn mt-5 w-full justify-center">เข้าสู่ห้องแข่งขัน <Swords size={17}/></button></div>}
        </div>
      </section>
    </main>
  );
}

export default function RankedPage() {
  return <Suspense fallback={<main className="shell p-10">กำลังโหลด…</main>}><RankedQueueContent/></Suspense>;
}
