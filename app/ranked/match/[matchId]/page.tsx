"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, LoaderCircle, Swords, Trophy, XCircle } from "lucide-react";
import { getSupabase } from "@/lib/supabase";

type Question = { id: string; prompt: string; english: string; explanation: string; options: { id: string; text: string; position: number }[] };
type MatchData = {
  match: { id: string; status: string; winner_id: string | null; lesson_xp: number };
  lesson: { id: string; title: string; level: string };
  questions: Question[];
  me: { score: number; total: number; finished: boolean; result: string | null; xpBefore: number | null; xpChange: number | null; xpAfter: number | null };
  opponent: { score: number; total: number; finished: boolean; result: string | null; xpBefore: number | null; xpChange: number | null; xpAfter: number | null };
  answered: string[];
};

export default function RankedMatchPage() {
  const params = useParams<{ matchId: string }>();
  const router = useRouter();
  const matchId = params.matchId;
  const [data, setData] = useState<MatchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const token = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("ยังไม่ได้ตั้งค่า Supabase");
    const { data: session, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session.session) {
      router.replace("/auth?next=" + encodeURIComponent("/ranked/match/" + matchId));
      throw new Error("กรุณาเข้าสู่ระบบก่อนเล่น Ranked");
    }
    return session.session.access_token;
  }, [matchId, router]);

  const refresh = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const accessToken = await token();
      const response = await fetch("/api/ranked/match/" + encodeURIComponent(matchId), { cache: "no-store", headers: { Authorization: "Bearer " + accessToken } });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "โหลดการแข่งขันไม่สำเร็จ");
      setData(payload.data as MatchData);
      setError("");
    } catch (e) { setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด"); }
    finally { if (!quiet) setLoading(false); }
  }, [matchId, token]);

  useEffect(() => { void refresh(); }, [refresh]);
  const matchStatus = data?.match.status;
  useEffect(() => {
    if (matchStatus !== "active") return;
    const timer = window.setInterval(() => { void refresh(true); }, 2500);
    return () => window.clearInterval(timer);
  }, [matchStatus, refresh]);

  const current = useMemo(() => data?.questions.find((q) => !data.answered.includes(q.id)) ?? null, [data]);

  const submit = async () => {
    if (!data || !current || selected === null || submitting || data.me.finished) return;
    setSubmitting(true); setError("");
    try {
      const accessToken = await token();
      const response = await fetch("/api/ranked/match/" + encodeURIComponent(matchId), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + accessToken },
        body: JSON.stringify({ questionId: current.id, optionPosition: current.options[selected].position }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "ส่งคำตอบไม่สำเร็จ");
      setSelected(null);
      await refresh(true);
    } catch (e) { setError(e instanceof Error ? e.message : "ส่งคำตอบไม่สำเร็จ"); }
    finally { setSubmitting(false); }
  };

  if (loading && !data) return <main className="shell flex min-h-screen items-center justify-center"><div className="panel p-8 text-center"><LoaderCircle className="mx-auto animate-spin text-[#24a982]" size={30}/><p className="mt-3 font-bold">กำลังโหลดห้องแข่งขัน…</p></div></main>;
  if (!data) return <main className="shell flex min-h-screen items-center justify-center p-5"><section className="panel max-w-lg p-8 text-center"><XCircle className="mx-auto text-rose-500" size={36}/><h1 className="mt-4 text-xl font-extrabold">เปิดการแข่งขันไม่ได้</h1><p role="alert" className="mt-3 text-sm text-rose-600">{error}</p><Link href="/learning" className="primary-btn mt-6">กลับเส้นทางการเรียน</Link></section></main>;

  const finished = data.match.status !== "active";
  const label = data.me.result === "winner" ? "คุณชนะการแข่งขัน!" : data.me.result === "loser" ? "คุณแพ้การแข่งขัน" : data.me.result === "forfeit" ? "หมดเวลา — ถูกปรับแพ้" : data.me.result === "draw" ? "เสมอ — ไม่มีการเปลี่ยน XP" : "การแข่งขันสิ้นสุด";

  return (
    <main className="shell min-h-screen py-6 md:py-10"><div className="mx-auto max-w-3xl">
      <Link href="/learning" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500"><ArrowLeft size={17}/> ออกจากห้องแข่งขัน</Link>
      <section className="mt-6 overflow-hidden rounded-[28px] border border-[#e5ece7] bg-white shadow-[0_18px_55px_rgba(28,65,52,.07)]">
        <header className="bg-[#172d35] px-6 py-7 text-white md:px-9">
          <div className="flex items-center justify-between"><span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-extrabold tracking-widest text-emerald-200"><Swords size={14}/> RANKED 1V1</span><span className="text-xs font-bold text-slate-300">{finished ? "MATCH FINISHED" : "LIVE MATCH"}</span></div>
          <h1 className="mt-4 text-2xl font-extrabold md:text-3xl">{data.lesson.title}</h1>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/10 p-4"><p className="text-xs text-slate-300">คะแนนของคุณ</p><p className="mt-1 text-2xl font-extrabold">{data.me.score}<span className="text-sm text-slate-300">/{data.questions.length}</span></p><p className="mt-1 text-xs text-slate-300">{data.me.finished ? "ส่งคำตอบครบแล้ว" : "กำลังแข่งขัน"}</p></div>
            <div className="rounded-2xl bg-white/10 p-4"><p className="text-xs text-slate-300">คู่แข่ง</p><p className="mt-1 text-2xl font-extrabold">{data.opponent.score}<span className="text-sm text-slate-300">/{data.questions.length}</span></p><p className="mt-1 text-xs text-slate-300">{data.opponent.finished ? "ส่งคำตอบครบแล้ว" : "กำลังทำข้อสอบ"}</p></div>
          </div>
        </header>
        <div className="p-6 md:p-9">
          {error && <p role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
          {finished ? <div className="py-5 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[26px] bg-[#e3f6ed] text-[#168565]">{data.me.result === "winner" ? <Trophy size={40}/> : data.me.result === "loser" ? <XCircle size={40}/> : <CheckCircle2 size={40}/>}</div>
            <p className="eyebrow mt-6">FINAL RESULT</p><h2 className="mt-2 text-3xl font-extrabold">{label}</h2>
            <p className="mt-3 text-sm text-slate-500">คะแนน {data.me.score}/{data.questions.length} · คู่แข่ง {data.opponent.score}/{data.questions.length}</p>
            <div className="mx-auto mt-7 grid max-w-md grid-cols-2 gap-3 text-left">
              <div className="rounded-2xl bg-[#f2faf5] p-4"><p className="text-xs text-slate-500">XP ก่อนแข่ง</p><p className="mt-1 text-xl font-extrabold">{data.me.xpBefore ?? "—"}</p></div>
              <div className="rounded-2xl bg-[#f2faf5] p-4"><p className="text-xs text-slate-500">XP เปลี่ยนแปลง</p><p className={"mt-1 text-xl font-extrabold " + ((data.me.xpChange ?? 0) >= 0 ? "text-[#168565]" : "text-rose-600")}>{data.me.xpChange == null ? "—" : (data.me.xpChange > 0 ? "+" : "") + data.me.xpChange}</p></div>
            </div>
            <p className="mt-4 text-sm font-bold text-slate-600">XP คงเหลือ: {data.me.xpAfter ?? "—"}</p><Link href="/learning" className="primary-btn mt-7">กลับเส้นทางการเรียน</Link>
          </div> : data.me.finished ? <div className="py-10 text-center">
            <LoaderCircle className="mx-auto animate-spin text-[#24a982]" size={38}/><h2 className="mt-4 text-xl font-extrabold">ส่งคำตอบครบแล้ว!</h2><p className="mt-2 text-sm leading-6 text-slate-500">กำลังรอคู่แข่งทำข้อสอบให้เสร็จ ระบบจะตัดสินผลและปรับ XP อัตโนมัติ</p><p className="mt-4 text-xs font-bold text-[#168565]">ตรวจสอบสถานะอัตโนมัติ</p>
          </div> : current ? <>
            <div className="mb-6 flex justify-between text-xs font-bold text-slate-500"><span>ข้อที่ตอบแล้ว {data.answered.length}/{data.questions.length}</span><span>{Math.round(data.answered.length / data.questions.length * 100)}%</span></div>
            <div className="progress-track mb-7"><div className="progress-fill" style={{ width: (data.answered.length / data.questions.length * 100) + "%" }}/></div>
            <p className="eyebrow">QUESTION {data.answered.length + 1} / {data.questions.length}</p><h2 className="mt-3 text-xl font-extrabold leading-relaxed md:text-2xl">{current.prompt}</h2>
            {current.english && <div className="my-6 rounded-2xl bg-[#f4faf6] p-5 text-center text-2xl font-extrabold">{current.english}</div>}
            <div className="space-y-3">{current.options.map((option, index) => <button key={option.id} disabled={submitting} onClick={() => setSelected(index)} className={"flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition " + (selected === index ? "border-[#24a982] bg-[#effaf4]" : "border-slate-100 bg-white hover:border-emerald-200")}><span className={"flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold " + (selected === index ? "bg-[#24a982] text-white" : "bg-slate-100 text-slate-500")}>{String.fromCharCode(65 + index)}</span><span className="font-semibold">{option.text}</span></button>)}</div>
            <button onClick={() => void submit()} disabled={selected === null || submitting} className="primary-btn mt-7 w-full justify-center py-4 disabled:cursor-not-allowed disabled:opacity-40">{submitting ? <LoaderCircle size={18} className="animate-spin"/> : <CheckCircle2 size={18}/>} ส่งคำตอบ</button>
            <p className="mt-3 text-center text-xs leading-5 text-slate-400">ส่งคำตอบแล้วไม่สามารถแก้ไขได้ · ต้องตอบถูกอย่างน้อย {Math.min(4, data.questions.length)} ข้อจึงมีสิทธิ์ชนะ</p>
          </> : <p>ไม่พบคำถามที่ยังไม่ได้ตอบ</p>}
        </div>
      </section>
    </div></main>
  );
}
