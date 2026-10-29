"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BookOpen, ChartNoAxesCombined, House, Layers3, LogIn, LogOut, Sparkles, Volume2 } from "lucide-react";
import { getSupabase } from "@/lib/supabase";

const items = [
  { href: "/", label: "หน้าหลัก", icon: House },
  { href: "/learning", label: "เส้นทางการเรียน", icon: Layers3 },
  { href: "/vocabulary", label: "คลังคำศัพท์", icon: BookOpen },
  { href: "/progress", label: "ความก้าวหน้า", icon: ChartNoAxesCombined },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setEmail(session?.user.email ?? null));
    return () => listener.subscription.unsubscribe();
  }, []);

  async function signOut() {
    const supabase = getSupabase();
    if (supabase) await supabase.auth.signOut();
    setEmail(null);
    router.push("/auth");
    router.refresh();
  }

  return (
    <aside className="sidebar">
      <Link href="/" className="sidebar-brand flex items-center gap-3 px-3 mb-8 mt-2">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#24a982] text-white shadow-md shadow-emerald-100"><Volume2 size={23}/></span>
        <span><strong className="block text-xl tracking-tight">devlingo<span className="text-[#24a982]">.</span></strong><small className="text-xs text-slate-400">learn a little, grow a lot</small></span>
      </Link>
      <nav className="flex flex-row gap-1 lg:flex-col">
        {items.map(({href,label,icon:Icon}) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return <Link key={href} href={href} className={`nav-item ${active ? "active" : ""}`}><Icon size={19}/><span className="nav-label">{label}</span></Link>;
        })}
      </nav>
      <div className="mt-8 hidden rounded-2xl bg-[#f0edff] p-4 lg:block">
        <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-violet-500"><Sparkles size={18}/></div>
        <p className="text-sm font-bold text-slate-800">ก้าวเล็ก ๆ ทุกวัน</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">ฝึกวันละ 5 นาที ก็ช่วยให้ภาษาอังกฤษดีขึ้นได้</p>
      </div>
      <div className="mt-4 rounded-2xl border border-[#e5ece7] bg-white p-3">
        {email ? <>
          <p className="truncate px-1 text-xs font-semibold text-slate-500" title={email}>{email}</p>
          <button onClick={signOut} className="nav-item mt-1 w-full"><LogOut size={17}/><span className="nav-label text-sm">ออกจากระบบ</span></button>
        </> : <Link href="/auth" className="nav-item"><LogIn size={18}/><span className="nav-label text-sm">เข้าสู่ระบบ / สมัครสมาชิก</span></Link>}
      </div>
    </aside>
  );
}
