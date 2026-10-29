"use client";

import { useMemo, useState } from "react";
import AppSidebar from "@/components/AppSidebar";
import { BookOpen, Search, Volume2, Bookmark } from "lucide-react";

const words = [
  {word:"Curious",meaning:"อยากรู้อยากเห็น",pron:"คิว-เรียส",example:"I am curious about the world.",thai:"ฉันอยากรู้อยากเห็นเกี่ยวกับโลก",level:"ทั่วไป"},
  {word:"Improve",meaning:"พัฒนาให้ดีขึ้น",pron:"อิม-พรูฟ",example:"I want to improve my English.",thai:"ฉันอยากพัฒนาภาษาอังกฤษ",level:"ทั่วไป"},
  {word:"Confident",meaning:"มั่นใจ",pron:"คอน-ฟิ-เดินท์",example:"Be confident when you speak.",thai:"จงมั่นใจเมื่อคุณพูด",level:"ทั่วไป"},
  {word:"Practice",meaning:"ฝึกฝน",pron:"แพรค-ทิส",example:"Practice makes progress.",thai:"การฝึกฝนทำให้เกิดความก้าวหน้า",level:"ทั่วไป"},
  {word:"Curiosity",meaning:"ความอยากรู้อยากเห็น",pron:"คิว-รี-ออ-ซิ-ที",example:"Curiosity helps us learn.",thai:"ความอยากรู้อยากเห็นช่วยให้เราเรียนรู้",level:"ทั่วไป"},
];
export default function VocabularyPage(){
 const [query,setQuery]=useState(""); const [saved,setSaved]=useState<string[]>([]);
 const filtered=useMemo(()=>words.filter(w=>(w.word+" "+w.meaning+" "+w.example).toLowerCase().includes(query.toLowerCase())),[query]);
 return <main className="shell py-7 md:py-9"><div className="app-layout flex gap-9"><AppSidebar/><section className="min-w-0 flex-1"><p className="eyebrow">YOUR WORD COLLECTION</p><h1 className="mt-1 text-3xl font-extrabold">คลังคำศัพท์ <span className="text-[#24a982]">.</span></h1><p className="mt-2 text-sm text-slate-500">รวมคำศัพท์ที่ควรรู้ พร้อมตัวอย่างที่ใช้ได้จริง</p>
 <div className="relative mt-6 max-w-xl"><Search size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="ค้นหาคำศัพท์หรือความหมาย..." className="w-full rounded-2xl border border-[#e5ece7] bg-white py-4 pl-12 pr-4 outline-none focus:border-[#24a982]"/></div>
 <div className="mt-6 flex items-center justify-between"><p className="text-sm font-bold text-slate-500">พบ {filtered.length} คำ</p><p className="flex items-center gap-2 text-xs font-semibold text-slate-400"><Bookmark size={14}/>{saved.length} คำที่บันทึก</p></div>
 <div className="mt-4 grid gap-4 lg:grid-cols-2">{filtered.map(w=><article key={w.word} className="panel p-5"><div className="flex items-start justify-between"><div><h2 className="text-2xl font-extrabold text-[#208d6b]">{w.word}</h2><p className="mt-1 text-xs text-slate-400">{w.pron} · {w.level}</p></div><div className="flex gap-2"><button aria-label={"ฟังเสียง "+w.word} onClick={()=>{if("speechSynthesis" in window){const u=new SpeechSynthesisUtterance(w.word);u.lang="en-US";speechSynthesis.speak(u)}}} className="rounded-xl bg-[#eff9f3] p-2.5 text-[#208d6b]"><Volume2 size={18}/></button><button aria-label={"บันทึก "+w.word} onClick={()=>setSaved(s=>s.includes(w.word)?s.filter(x=>x!==w.word):[...s,w.word])} className={`rounded-xl p-2.5 ${saved.includes(w.word)?"bg-violet-100 text-violet-600":"bg-slate-100 text-slate-500"}`}><Bookmark size={18} fill={saved.includes(w.word)?"currentColor":"none"}/></button></div></div><p className="mt-4 font-bold">{w.meaning}</p><div className="mt-4 rounded-xl bg-[#f6f8f6] p-3"><p className="text-sm font-semibold">{w.example}</p><p className="mt-1 text-xs text-slate-500">{w.thai}</p></div></article>)}</div>
 {filtered.length===0&&<div className="panel mt-5 p-10 text-center"><BookOpen size={28} className="mx-auto text-slate-300"/><p className="mt-3 font-bold">ไม่พบคำศัพท์</p><p className="mt-1 text-sm text-slate-500">ลองค้นหาด้วยคำอื่น</p></div>}
 </section></div></main>;
}
