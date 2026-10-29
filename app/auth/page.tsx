"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, LoaderCircle, Volume2 } from "lucide-react";
import { getSupabase } from "@/lib/supabase";

export default function AuthPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace(params.get("next") || "/");
    });
  }, [router, params]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(""); setMessage("");
    const supabase = getSupabase();
    if (!supabase) {
      setError("ยังไม่ได้ตั้งค่า Supabase กรุณาตรวจสอบไฟล์ .env.local");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { display_name: name.trim() } },
        });
        if (authError) throw authError;
        if (data.session) router.replace("/");
        else setMessage("สมัครสมาชิกแล้ว กรุณาตรวจสอบอีเมลเพื่อยืนยันบัญชี จากนั้นเข้าสู่ระบบ");
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (authError) throw authError;
        router.replace(params.get("next") || "/");
        router.refresh();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด กรุณาลองอีกครั้ง");
    } finally {
      setLoading(false);
    }
  }

  return <main className="shell flex min-h-screen items-center justify-center py-10">
    <div className="grid w-full max-w-5xl overflow-hidden rounded-[30px] border border-[#e5ece7] bg-white shadow-xl shadow-emerald-950/5 md:grid-cols-2">
      <section className="relative hidden min-h-[580px] flex-col justify-between overflow-hidden bg-[#193e3a] p-10 text-white md:flex">
        <div className="absolute -right-16 -top-12 h-64 w-64 rounded-full border-[36px] border-white/5" />
        <Link href="/" className="relative flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#24a982]"><Volume2 size={23}/></span><strong className="text-2xl">devlingo<span className="text-[#8ee8bd]">.</span></strong></Link>
        <div className="relative"><span className="rounded-full bg-white/10 px-3 py-2 text-xs font-bold text-[#b8f3d7]">YOUR LEARNING JOURNEY</span><h1 className="mt-5 text-4xl font-extrabold leading-tight">เรียนรู้ทีละนิด<br/>เติบโตได้ทุกวัน</h1><p className="mt-4 max-w-sm leading-7 text-white/70">เข้าสู่ระบบเพื่อบันทึก XP บทเรียนที่สำเร็จ และความต่อเนื่องในการฝึกไว้กับบัญชีของคุณ</p></div>
        <p className="relative text-xs text-white/45">Small steps. Real progress.</p>
      </section>
      <section className="p-6 sm:p-10 md:p-12">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#168565]"><ArrowLeft size={16}/> กลับหน้าหลัก</Link>
        <div className="mt-8"><p className="eyebrow">{mode === "signin" ? "WELCOME BACK" : "START YOUR JOURNEY"}</p><h2 className="mt-2 text-3xl font-extrabold">{mode === "signin" ? "ยินดีที่ได้พบกันอีก" : "สร้างบัญชี Devlingo"}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{mode === "signin" ? "เข้าสู่ระบบเพื่อเรียนต่อจากจุดเดิม" : "สมัครฟรี เพื่อเก็บความก้าวหน้าไว้กับบัญชีของคุณ"}</p></div>
        <form onSubmit={submit} className="mt-7 space-y-4">
          {mode === "signup" && <label className="block text-sm font-bold">ชื่อที่ใช้แสดง<input value={name} onChange={e=>setName(e.target.value)} required maxLength={60} autoComplete="name" placeholder="ชื่อของคุณ" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-[#24a982]"/></label>}
          <label className="block text-sm font-bold">อีเมล<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email" placeholder="you@example.com" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-[#24a982]"/></label>
          <label className="block text-sm font-bold">รหัสผ่าน<div className="relative mt-2"><input type={showPassword?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} required minLength={6} autoComplete={mode==="signin"?"current-password":"new-password"} placeholder="อย่างน้อย 6 ตัวอักษร" className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-12 font-normal outline-none focus:border-[#24a982]"/><button type="button" onClick={()=>setShowPassword(v=>!v)} aria-label={showPassword?"ซ่อนรหัสผ่าน":"แสดงรหัสผ่าน"} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{showPassword?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></label>
          {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
          {message && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}
          <button disabled={loading} className="primary-btn w-full disabled:opacity-60">{loading?<LoaderCircle size={18} className="animate-spin"/>:null}{loading?"กำลังดำเนินการ…":mode==="signin"?"เข้าสู่ระบบ":"สมัครสมาชิก"}</button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">{mode==="signin"?"ยังไม่มีบัญชี?":"มีบัญชีอยู่แล้ว?"} <button onClick={()=>{setMode(mode==="signin"?"signup":"signin");setError("");setMessage("");}} className="font-extrabold text-[#168565]">{mode==="signin"?"สมัครสมาชิก":"เข้าสู่ระบบ"}</button></p>
        <p className="mt-5 text-center text-xs leading-5 text-slate-400">ระบบยืนยันตัวตนให้บริการโดย Supabase Auth</p>
      </section>
    </div>
  </main>;
}
