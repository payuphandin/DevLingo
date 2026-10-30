"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, Check, Flame, Headphones, Lightbulb, Play, Sparkles, ShieldCheck, Swords, Target, Trophy, Users, Zap } from "lucide-react";
import AppSidebar from "@/components/AppSidebar";
import { loadLearnerProgress, emptyProgress, type LearnerProgress } from "@/lib/progress";

export default function HomePage() {
  const [progress, setProgress] = useState<LearnerProgress>(emptyProgress);
  const [email, setEmail] = useState<string | null>(null);
  useEffect(() => {
    loadLearnerProgress().then(({ progress: saved, email: accountEmail }) => {
      setProgress(saved);
      setEmail(accountEmail);
    });
  }, []);
  const done = progress.completed.length;
  return (
    <main className="shell py-7 md:py-9">
      <div className="app-layout flex gap-9">
        <AppSidebar/>
        <section className="min-w-0 flex-1">
          <header className="mb-7 flex items-center justify-between gap-3">
            <div><p className="eyebrow mb-1">YOUR LEARNING SPACE</p><h1 className="text-2xl font-extrabold tracking-tight">พร้อมเก่งขึ้นอีกนิดหรือยัง? <span>✦</span></h1></div>
            <div className="flex shrink-0 items-center gap-2 rounded-2xl border border-orange-100 bg-orange-50 px-3 py-2 text-sm font-bold text-orange-600"><Flame size={18} fill="currentColor"/>{progress.streak} วัน</div>
          </header>
          {!email && <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-[#dceee5] bg-white p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-extrabold">เก็บ XP และความก้าวหน้าของคุณ</p><p className="mt-1 text-sm text-slate-500">สมัครหรือเข้าสู่ระบบเพื่อบันทึกบทเรียนที่จบไว้ในบัญชีและซิงก์ข้ามอุปกรณ์</p></div><Link href="/auth" className="primary-btn shrink-0">เข้าสู่ระบบ / สมัครสมาชิก <ArrowRight size={16}/></Link></div>}
          <div className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
            <section className="relative overflow-hidden rounded-[28px] bg-[#193e3a] p-6 text-white md:p-8">
              <div className="absolute -right-12 -top-12 h-56 w-56 rounded-full border-[30px] border-white/5"/><div className="absolute right-16 top-14 h-20 w-20 rounded-full bg-[#b6f1d5]/10 blur-sm"/>
              <div className="relative z-10 max-w-lg">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-[#b8f3d7]"><Sparkles size={14}/> YOUR NEXT LITTLE WIN</span>
                <h2 className="hero-title mt-5 text-[38px] font-extrabold leading-tight tracking-tight">ภาษาอังกฤษ<br/>เริ่มได้ที่ <span className="text-[#8ee8bd]">วันนี้</span></h2>
                <p className="mt-3 max-w-sm text-sm leading-6 text-white/70">ไม่ต้องเก่งก่อน แค่เริ่มฝึกทีละบท แล้วให้ความสม่ำเสมอพาคุณไปต่อ</p>
                <Link href="/learning" className="primary-btn mt-6 bg-[#35c895] text-[#103e34] shadow-[0_5px_0_#168565]">เริ่มเรียนเลย <ArrowRight size={17}/></Link>
              </div>
              <div className="relative mt-7 flex items-end justify-between">
                <div className="flex gap-2">{["A","B","C"].map((letter,i)=><div key={letter} className={`flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 font-bold ${i===1?"bg-[#baf4d9] text-[#16483c]":"bg-white/10 text-white/70"}`}>{letter}</div>)}</div>
                <div className="mr-2 flex h-24 w-24 items-center justify-center rounded-[30px] bg-[#b7f0d4] text-[#1a6b54] rotate-6"><BookOpen size={43}/></div>
              </div>
            </section>
            <section className="panel flex flex-col justify-between p-6">
              <div className="flex items-start justify-between"><div><p className="eyebrow">DAILY GOAL</p><h3 className="mt-2 text-xl font-extrabold">เป้าหมายวันนี้</h3></div><div className="rounded-2xl bg-[#fff3d9] p-3 text-amber-600"><Target size={22}/></div></div>
              <div className="my-5 flex items-center gap-5">
                <div className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full" style={{background:`conic-gradient(#2bb889 ${Math.min(100,done*20)}%, #edf2ef 0)`}}><div className="flex h-20 w-20 flex-col items-center justify-center rounded-full bg-white"><strong className="text-2xl">{Math.min(100,done*20)}%</strong><span className="text-[10px] text-slate-400">สำเร็จแล้ว</span></div></div>
                <div><p className="text-sm font-bold">เรียนให้ครบ 1 บท</p><p className="mt-1 text-xs leading-5 text-slate-500">เริ่มจากบทสั้น ๆ เพื่อสร้างนิสัยการเรียนรู้</p><p className="mt-3 text-sm font-bold text-[#209a73]">{done > 0 ? "ทำได้ดีมาก!" : "ทุกบทที่เรียนคือความก้าวหน้า"}</p></div>
              </div>
              <div className="progress-track"><div className="progress-fill" style={{width:`${Math.min(100,done*20)}%`}}/></div>
            </section>
          </div>
          <section className="group relative isolate mt-5 overflow-hidden rounded-[30px] bg-gradient-to-br from-[#241443] via-[#392167] to-[#6845a6] p-6 text-white shadow-[0_22px_55px_rgba(73,47,123,.18)] md:p-8">
            <div className="pointer-events-none absolute inset-0 opacity-[0.12]" style={{backgroundImage:"radial-gradient(#ffffff 0.8px, transparent 0.8px)",backgroundSize:"18px 18px"}} />
            <div className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full border-[42px] border-white/[0.07]" />
            <div className="pointer-events-none absolute -right-2 -top-8 h-52 w-52 rounded-full border border-violet-100/10" />
            <div className="pointer-events-none absolute right-24 top-8 h-28 w-28 rounded-full bg-fuchsia-300/20 blur-3xl" />
            <div className="pointer-events-none absolute bottom-[-70px] left-[42%] h-48 w-48 rounded-full bg-violet-300/15 blur-3xl" />
            <div className="relative z-10 grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
              <div className="max-w-xl">
                <span className="inline-flex items-center gap-2 rounded-full border border-violet-100/15 bg-white/10 px-3 py-1.5 text-xs font-extrabold tracking-wide text-violet-100 shadow-inner shadow-white/5">
                  <Sparkles size={14} className="text-fuchsia-200" /> RANK MATCH <span className="text-violet-300">·</span> 1 VS 1
                </span>
                <h2 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight md:text-4xl">
                  พร้อมดวลความรู้<br />ภาษาอังกฤษหรือยัง?
                </h2>
                <p className="mt-3 max-w-lg text-sm leading-6 text-violet-100/75">
                  ท้าทายผู้เรียนคนอื่นในบทเรียนเดียวกัน ตอบคำถามให้ผ่านเกณฑ์ แล้วคว้า XP ไปด้วยกัน
                </p>
                <Link href="/ranked" className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#e9d5ff] px-5 py-3.5 font-extrabold text-[#392167] shadow-[0_5px_0_#a78bfa] transition hover:-translate-y-0.5 hover:bg-white active:translate-y-1 active:shadow-[0_2px_0_#a78bfa]">
                  เข้าสู่สนาม Rank Match <ArrowRight size={17} />
                </Link>
              </div>
              <div className="relative flex items-end justify-between gap-4 md:flex-col md:items-center">
                <div className="absolute -right-2 top-[-34px] hidden h-24 w-24 rounded-full border border-fuchsia-100/20 md:block" />
                <div className="flex gap-2">
                  {["1", "V", "1"].map((letter, index) => (
                    <div key={index} className={`flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 font-extrabold shadow-lg shadow-black/10 ${index === 1 ? "bg-[#e9d5ff] text-[#392167]" : "bg-white/10 text-violet-100"}`}>
                      {letter}
                    </div>
                  ))}
                </div>
                <div className="relative mr-2 flex h-24 w-24 rotate-6 items-center justify-center rounded-[30px] border border-white/50 bg-gradient-to-br from-[#f5d0fe] to-[#c4b5fd] text-[#4c1d95] shadow-[0_16px_35px_rgba(18,8,42,.25)] transition duration-300 group-hover:rotate-0 md:mr-0 md:h-28 md:w-28">
                  <div className="absolute inset-2 rounded-[23px] border border-white/50" />
                  <Swords size={46} strokeWidth={2.5} />
                  <Sparkles size={15} className="absolute -right-2 -top-2 text-fuchsia-100" />
                </div>
              </div>
            </div>
            <div className="relative mt-6 flex flex-wrap gap-2 text-xs font-bold text-violet-100">
              <span className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3 py-2 backdrop-blur-sm"><Users size={15} /> 2 ผู้เล่น</span>
              <span className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3 py-2 backdrop-blur-sm"><Trophy size={15} /> ผู้ชนะรับ 1.5× XP</span>
              <span className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3 py-2 backdrop-blur-sm"><ShieldCheck size={15} /> ผลการแข่งขันอัตโนมัติ</span>
            </div>
          </section>
          <div className="mt-5 grid gap-5 md:grid-cols-3">
            <div className="panel flex items-center gap-4 p-5"><div className="rounded-2xl bg-[#fff0dc] p-3 text-orange-500"><Zap size={22} fill="currentColor"/></div><div><p className="text-xs font-semibold text-slate-400">XP สะสม</p><p className="mt-1 text-2xl font-extrabold">{progress.xp}<span className="ml-1 text-sm font-semibold text-slate-400">XP</span></p></div></div>
            <div className="panel flex items-center gap-4 p-5"><div className="rounded-2xl bg-[#e4f7ed] p-3 text-emerald-600"><Check size={22}/></div><div><p className="text-xs font-semibold text-slate-400">บทเรียนที่จบแล้ว</p><p className="mt-1 text-2xl font-extrabold">{done}<span className="ml-1 text-sm font-semibold text-slate-400">บท</span></p></div></div>
            <div className="panel flex items-center gap-4 p-5"><div className="rounded-2xl bg-[#eeeaff] p-3 text-violet-600"><Trophy size={22}/></div><div><p className="text-xs font-semibold text-slate-400">ระดับผู้เรียน</p><p className="mt-1 text-xl font-extrabold">{progress.xp < 100 ? "นักเริ่มต้น" : "นักฝึกฝน"}</p></div></div>
          </div>
          <div className="mt-8 grid gap-5 xl:grid-cols-[1.35fr_1fr]">
            <section className="panel p-6 md:p-7">
              <div className="mb-5 flex items-center justify-between"><div><p className="eyebrow">YOUR LEARNING PATH</p><h3 className="mt-1 text-xl font-extrabold">เรียนต่อจากตรงนี้</h3></div><Link href="/learning" className="flex items-center gap-1 text-sm font-bold text-[#209a73]">ดูทั้งหมด <ArrowRight size={15}/></Link></div>
              <div className="rounded-2xl bg-[#f3f8f5] p-4">
                <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#24a982] shadow-sm"><BookOpen size={23}/></div><div><span className="text-[10px] font-extrabold uppercase tracking-wider text-[#209a73]">Beginner · Unit 01</span><h4 className="font-extrabold">เริ่มต้นบทสนทนา</h4><p className="mt-1 text-xs text-slate-500">คำทักทายและแนะนำตัว</p></div></div><span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500">5 นาที</span></div>
                <div className="mt-4 flex items-center gap-3"><div className="progress-track flex-1"><div className="progress-fill" style={{width:done?"100%":"0%"}}/></div><span className="text-xs font-bold text-slate-500">{done? "100%":"0%"}</span></div>
                <Link href="/learning" className="primary-btn mt-4 w-full">ไปที่บทเรียน <Play size={15} fill="currentColor"/></Link>
              </div>
            </section>
            <section className="panel overflow-hidden p-6">
              <div className="flex items-center justify-between"><div><p className="eyebrow">WORD OF THE DAY</p><h3 className="mt-1 text-xl font-extrabold">คำศัพท์วันนี้</h3></div><div className="rounded-2xl bg-[#e7f7f0] p-3 text-[#209a73]"><Lightbulb size={21}/></div></div>
              <div className="my-5 rounded-2xl bg-[#f8f5ff] p-5"><div className="flex items-center gap-3"><h4 className="text-3xl font-extrabold tracking-tight text-[#6154b7]">Curious</h4><button aria-label="ฟังเสียง Curious" onClick={()=>{if("speechSynthesis" in window){const u=new SpeechSynthesisUtterance("curious");u.lang="en-US";speechSynthesis.speak(u)}}} className="rounded-full bg-white p-2 text-violet-500"><Headphones size={17}/></button></div><p className="mt-2 text-sm font-semibold">/ˈkjʊr.i.əs/ · อยากรู้อยากเห็น</p><p className="mt-3 text-sm text-slate-500">I am curious about the world.</p><p className="mt-1 text-xs text-slate-400">ฉันอยากรู้อยากเห็นเกี่ยวกับโลก</p></div>
              <Link href="/vocabulary" className="soft-btn w-full">เปิดคลังคำศัพท์ <ArrowRight size={16}/></Link>
            </section>
          </div>
          <footer className="py-8 text-center text-xs text-slate-400">ค่อย ๆ เรียนรู้ในแบบของคุณ · Made for curious minds <span className="text-[#24a982]">♥</span></footer>
        </section>
      </div>
    </main>
  );
}
