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

  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("id")
    .eq("title", "Everyday English Path")
    .eq("published", true)
    .order("created_at")
    .limit(1)
    .maybeSingle();

  if (courseError) {
    console.error("GET /api/learning/lessons course query failed:", courseError.message);
    return NextResponse.json({ error: "ไม่สามารถโหลดหลักสูตรได้" }, { status: 500 });
  }

  if (!course) {
    return NextResponse.json(
      { error: "ไม่พบหลักสูตร Everyday English Path ใน Supabase", data: [] },
      { status: 404 },
    );
  }

  const { data: rows, error } = await supabase
    .from("lessons")
    .select("id,title,description,content,position,estimated_minutes")
    .eq("course_id", course.id)
    .eq("published", true)
    .order("position", { ascending: true });

  if (error) {
    console.error("GET /api/learning/lessons query failed:", error.message);
    return NextResponse.json({ error: "ไม่สามารถโหลดบทเรียนจาก Supabase ได้" }, { status: 500 });
  }

  const data = (rows ?? []).map((row) => {
    const content = (row.content ?? {}) as Record<string, unknown>;
    return {
      id: typeof content.lesson_key === "string" ? content.lesson_key : row.id,
      databaseId: row.id,
      title: row.title,
      sub: row.description ?? "",
      level: typeof content.level === "string" ? content.level : "Beginner",
      mins: Number(row.estimated_minutes ?? 5),
      xp: Number(content.xp ?? 0),
      requiredXp: Number(content.required_xp ?? 0),
      position: row.position,
    };
  });

  return NextResponse.json({ data });
}
