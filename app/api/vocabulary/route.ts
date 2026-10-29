import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim().slice(0, 80) ?? "";
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: "Supabase ยังไม่ได้ตั้งค่า", data: [] }, { status: 503 });
  let requestQuery = supabase.from("vocabulary").select("*").limit(100);
  if (query) requestQuery = requestQuery.ilike("word", `%${query.replace(/[%_]/g, "")}%`);
  const { data, error } = await requestQuery;
  if (error) {
    console.error("GET /api/vocabulary failed:", error.message);
    return NextResponse.json({ error: "ไม่สามารถโหลดคำศัพท์ได้" }, { status: 500 });
  }
  return NextResponse.json({ data: data ?? [] });
}
