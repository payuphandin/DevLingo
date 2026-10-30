import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getSupabase();

  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase ยังไม่ได้ตั้งค่า", data: [] },
      { status: 503 },
    );
  }

  const { data, error } = await supabase
    .from("vocabulary")
    .select("id,word,meaning_th,pronunciation,example,example_th")
    .eq("published", true)
    .order("word", { ascending: true })
    .limit(500);

  if (error) {
    console.error("GET /api/vocabulary failed:", error.message);
    return NextResponse.json(
      { error: "ไม่สามารถโหลดคำศัพท์จากฐานข้อมูลได้", data: [] },
      { status: 500 },
    );
  }

  return NextResponse.json({ data: data ?? [] });
}
