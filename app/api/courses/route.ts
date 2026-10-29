import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET() {
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: "Supabase ยังไม่ได้ตั้งค่า", data: [] }, { status: 503 });
  const { data, error } = await supabase.from("courses").select("*").order("title");
  if (error) {
    console.error("GET /api/courses failed:", error.message);
    return NextResponse.json({ error: "ไม่สามารถโหลดหลักสูตรได้" }, { status: 500 });
  }
  return NextResponse.json({ data: data ?? [] });
}
