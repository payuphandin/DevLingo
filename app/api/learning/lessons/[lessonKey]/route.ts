import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type LessonContent = {
  lesson_key?: string;
  level?: string;
  xp?: number;
  required_xp?: number;
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ lessonKey: string }> },
) {
  const { lessonKey } = await params;
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase ยังไม่ได้ตั้งค่า" }, { status: 503 });
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
    console.error("GET /api/learning/lessons/[lessonKey] course query failed:", courseError.message);
    return NextResponse.json({ error: "ไม่สามารถโหลดหลักสูตรได้" }, { status: 500 });
  }
  if (!course) {
    return NextResponse.json({ error: "ไม่พบหลักสูตร Everyday English Path" }, { status: 404 });
  }

  const { data: lessonRows, error: lessonError } = await supabase
    .from("lessons")
    .select("id,title,description,content,position,estimated_minutes")
    .eq("course_id", course.id)
    .order("position", { ascending: true });

  if (lessonError) {
    console.error("Lesson lookup failed:", lessonError.message);
    return NextResponse.json({ error: "ไม่สามารถโหลดบทเรียนได้" }, { status: 500 });
  }

  const lesson = (lessonRows ?? []).find((row) => {
    const content = (row.content ?? {}) as LessonContent;
    return content.lesson_key === lessonKey;
  });

  if (!lesson) {
    return NextResponse.json({ error: "ไม่พบบทเรียนนี้ใน Supabase" }, { status: 404 });
  }

  const { data: exercises, error: exerciseError } = await supabase
    .from("exercises")
    .select("id,title,position")
    .eq("lesson_id", lesson.id)
    .eq("title", "Practice quiz")
    .order("position", { ascending: true });

  if (exerciseError) {
    console.error("Exercise lookup failed:", exerciseError.message);
    return NextResponse.json({ error: "ไม่สามารถโหลดแบบทดสอบได้" }, { status: 500 });
  }
  if (!exercises?.length) {
    return NextResponse.json(
      { error: "บทเรียนนี้ยังไม่มีแบบทดสอบใน Supabase กรุณารัน SQL สำหรับ seed แบบทดสอบก่อน" },
      { status: 422 },
    );
  }

  const exerciseIds = exercises.map((exercise) => exercise.id);
  const { data: questionRows, error: questionError } = await supabase
    .from("questions")
    .select("*")
    .in("exercise_id", exerciseIds)
    .order("position", { ascending: true });

  if (questionError) {
    console.error("Question lookup failed:", questionError.message);
    return NextResponse.json({ error: "ไม่สามารถโหลดโจทย์ได้" }, { status: 500 });
  }

  const questionIds = (questionRows ?? []).map((question) => question.id);
  const { data: optionRows, error: optionError } = questionIds.length
    ? await supabase
        .from("question_options")
        .select("id,question_id,option_text,position")
        .in("question_id", questionIds)
        .order("position", { ascending: true })
    : { data: [], error: null };

  if (optionError) {
    console.error("Option lookup failed:", optionError.message);
    return NextResponse.json({ error: "ไม่สามารถโหลดตัวเลือกได้" }, { status: 500 });
  }

  const content = (lesson.content ?? {}) as LessonContent;
  const questions = (questionRows ?? []).map((question) => ({
    id: question.id as string,
    prompt: question.prompt as string,
    english: typeof question.english === "string" ? question.english : "",
    explain: (question.explanation as string | null) ?? "",
    position: Number(question.position ?? 0),
    options: (optionRows ?? [])
      .filter((option) => option.question_id === question.id)
      .map((option) => ({
        id: option.id,
        text: option.option_text,
        position: Number(option.position),
      })),
  }));

  if (questions.length === 0 || questions.some((question) => question.options.length < 2)) {
    return NextResponse.json(
      { error: "ข้อมูลโจทย์หรือตัวเลือกใน Supabase ไม่ครบ กรุณาตรวจสอบข้อมูลแบบทดสอบ" },
      { status: 422 },
    );
  }

  return NextResponse.json({
    data: {
      id: typeof content.lesson_key === "string" ? content.lesson_key : lesson.id,
      title: lesson.title,
      sub: lesson.description ?? "",
      level: typeof content.level === "string" ? content.level : "Beginner",
      mins: Number(lesson.estimated_minutes ?? 5),
      xp: Number(content.xp ?? 0),
      requiredXp: Number(content.required_xp ?? 0),
      questions,
    },
  });
}
