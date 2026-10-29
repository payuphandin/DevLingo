import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey) {
    return NextResponse.json({ error: "Supabase ยังไม่ได้ตั้งค่า" }, { status: 503 });
  }
  if (!serviceRoleKey) {
    return NextResponse.json(
      { error: "ยังไม่ได้ตั้งค่า SUPABASE_SERVICE_ROLE_KEY ฝั่งเซิร์ฟเวอร์" },
      { status: 503 },
    );
  }

  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";
  if (!token) {
    return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อนตรวจคำตอบ" }, { status: 401 });
  }

  let body: { questionId?: unknown; optionPosition?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "ข้อมูลคำตอบไม่ถูกต้อง" }, { status: 400 });
  }

  const questionId = typeof body.questionId === "string" ? body.questionId : "";
  const optionPosition = Number(body.optionPosition);
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(questionId) ||
    !Number.isInteger(optionPosition) ||
    optionPosition < 1 ||
    optionPosition > 4
  ) {
    return NextResponse.json({ error: "รหัสโจทย์หรือตัวเลือกไม่ถูกต้อง" }, { status: 400 });
  }

  const authClient = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: userData, error: authError } = await authClient.auth.getUser(token);
  if (authError || !userData.user) {
    return NextResponse.json({ error: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่" }, { status: 401 });
  }

  const admin = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: question, error: questionError } = await admin
    .from("questions")
    .select("id,exercise_id")
    .eq("id", questionId)
    .maybeSingle();

  if (questionError || !question) {
    console.error("Question answer check lookup failed:", questionError?.message);
    return NextResponse.json({ error: "ไม่พบโจทย์นี้" }, { status: 404 });
  }

  const { data: exercise } = await admin
    .from("exercises")
    .select("id,lesson_id,title")
    .eq("id", question.exercise_id)
    .maybeSingle();
  if (!exercise || exercise.title !== "Practice quiz") {
    return NextResponse.json({ error: "ไม่พบแบบทดสอบนี้" }, { status: 404 });
  }

  const { data: lesson } = exercise
    ? await admin
        .from("lessons")
        .select("id,course_id,position")
        .eq("id", exercise.lesson_id)
        .maybeSingle()
    : { data: null };
  const { data: course } = lesson
    ? await admin
        .from("courses")
        .select("id,published,title")
        .eq("id", lesson.course_id)
        .maybeSingle()
    : { data: null };

  if (!lesson || !course?.published || course.title !== "Everyday English Path") {
    return NextResponse.json({ error: "ไม่สามารถตรวจคำตอบของบทเรียนนี้ได้" }, { status: 404 });
  }

  const { data: answerKey, error: answerKeyError } = await admin
    .from("question_answer_keys")
    .select("answer_key")
    .eq("question_id", questionId)
    .maybeSingle();

  if (answerKeyError || !answerKey) {
    console.error("Question answer key lookup failed:", answerKeyError?.message);
    return NextResponse.json({ error: "ไม่พบเฉลยของข้อนี้ใน Supabase" }, { status: 500 });
  }

  const correctOptionPosition = Number(
    (answerKey.answer_key as { correct_option_position?: number }).correct_option_position,
  );
  if (!Number.isInteger(correctOptionPosition)) {
    return NextResponse.json({ error: "รูปแบบเฉลยใน Supabase ไม่ถูกต้อง" }, { status: 500 });
  }

  return NextResponse.json({
    correct: optionPosition === correctOptionPosition,
    correctOptionPosition,
  });
}
