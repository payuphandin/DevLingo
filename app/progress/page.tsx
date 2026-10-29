"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppSidebar from "@/components/AppSidebar";
import { BookOpen, Flame, Trophy, Zap, ChartNoAxesCombined, ArrowRight } from "lucide-react";
import { emptyProgress, loadLearnerProgress, type LearnerProgress } from "@/lib/progress";

export default function ProgressPage() {
  const [p, setP] = useState<LearnerProgress>(emptyProgress);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    loadLearnerProgress().then(({ progress, email: accountEmail }) => {
      setP(progress);
      setEmail(accountEmail);
      setLoading(false);
    });
  }, []);
  return <main className="shell py-7 md:py-9"><div className="app-layout flex gap-9"><AppSidebar/><section className="min-w-0 flex-1"><p className="eyebrow">YOUR PROGRESS</p><h1 className="mt-1 text-3xl font-extrabold">ดูพัฒนาการของคุณ</h1><p className="mt-2 text-sm text-slate-500">ทุกความพยายามมีความหมาย มาดูว่าคุณไปถึงไหนแล้ว</p>
    {!email && <div className="panel mt-6 flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-extrabold">เข้าสู่ระบบเพื่อบันทึกความก้าวหน้า</h2><p className="mt-1 text-sm text-slate-500">XP และบทเรียนที่สำเร็จจะถูกผูกกับบัญชีของคุณ</p></div><Link href="/auth" className="primary-btn shrink-0">เข้าสู่ระบบ / สมัครสมาชิก <ArrowRight size={16}/></Link></div>}
    <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[{label:"XP สะสม",value:p.xp,unit:"XP",icon:Zap,bg:"bg-orange-50",color:"text-orange-500"},{label:"บทเรียนที่จบ",value:p.completed.length,unit:"บท",icon:BookOpen,bg:"bg-emerald-50",color:"text-emerald-600"},{label:"เรียนต่อเนื่อง",value:p.streak,unit:"วัน",icon:Flame,bg:"bg-rose-50",color:"text-rose-500"}].map(x=><div key={x.label} className="panel p-5"><div className={`inline-flex rounded-2xl p-3 ${x.bg} ${x.color}`}><x.icon size={22}/></div><p className="mt-4 text-sm font-semibold text-slate-400">{x.label}</p><p className="mt-1 text-3xl font-extrabold">{loading?"—":x.value}<span className="ml-2 text-sm font-semibold text-slate-400">{x.unit}</span></p></div>)}</div>
    <div className="panel mt-5 p-6 md:p-8"><div className="flex items-center gap-3"><div className="rounded-2xl bg-[#eeeaff] p-3 text-violet-600"><ChartNoAxesCombined size={22}/></div><div><h2 className="text-xl font-extrabold">เส้นทางการเรียน</h2><p className="mt-1 text-sm text-slate-500">ความคืบหน้าจากบทเรียนที่ทำสำเร็จ</p></div></div>
      {p.completed.length===0?<div className="mt-6 rounded-2xl border border-dashed border-slate-200 p-8 text-center"><Trophy size={30} className="mx-auto text-slate-300"/><p className="mt-3 font-bold">เริ่มสะสมความสำเร็จแรกของคุณ</p><p className="mt-1 text-sm text-slate-500">เรียนบทแรกเพื่อให้ข้อมูลความก้าวหน้าแสดงที่นี่</p><Link href={email?"/learning":"/auth?next=/learning"} className="primary-btn mt-4">เริ่มบทเรียน</Link></div>:<div className="mt-6 rounded-2xl bg-[#f2faf5] p-5"><div className="flex items-center justify-between"><span className="font-bold">เริ่มต้นบทสนทนา</span><span className="text-sm font-bold text-[#209a73]">สำเร็จแล้ว</span></div><div className="progress-track mt-3"><div className="progress-fill" style={{width:"100%"}}/></div></div>}
    </div>
  </section></div></main>;
}
