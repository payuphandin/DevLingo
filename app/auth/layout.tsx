import { Suspense } from "react";

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <Suspense fallback={<main className="shell py-16 text-center text-slate-500">กำลังโหลด…</main>}>{children}</Suspense>;
}
