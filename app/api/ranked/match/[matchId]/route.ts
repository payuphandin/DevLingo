import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

async function authenticate(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey || !serviceKey) {
    return { response: NextResponse.json({ error: "Supabase ยังตั้งค่าไม่ครบ" }, { status: 503 }) };
  }
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return { response: NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 }) };

  const authClient = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data.user) return { response: NextResponse.json({ error: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่" }, { status: 401 }) };

  const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  return { user: data.user, admin };
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest, context: { params: Promise<{ matchId: string }> }) {
  const auth = await authenticate(request);
  if ("response" in auth) return auth.response;
  const { matchId } = await context.params;
  if (!uuidPattern.test(matchId)) return NextResponse.json({ error: "รหัสการแข่งขันไม่ถูกต้อง" }, { status: 400 });

  const { data: initialMatch, error: matchError } = await auth.admin
    .from("rank_matches")
    .select("id,lesson_id,status,lesson_xp,winner_id,started_at,finished_at,settled_at")
    .eq("id", matchId).maybeSingle();
  if (matchError || !initialMatch) return NextResponse.json({ error: "ไม่พบการแข่งขันนี้" }, { status: 404 });
  let match = initialMatch;

  if (match.status === "active" && Date.now() - Date.parse(match.started_at) >= 20 * 60 * 1000) {
    const { error: expiryError } = await auth.admin.rpc("expire_rank_match", { p_match_id: matchId });
    if (expiryError) console.error("Ranked match expiry failed:", expiryError.message);
    const refreshed = await auth.admin.from("rank_matches")
      .select("id,lesson_id,status,lesson_xp,winner_id,started_at,finished_at,settled_at")
      .eq("id", matchId).maybeSingle();
    if (refreshed.error || !refreshed.data) return NextResponse.json({ error: "ตรวจสอบสถานะการแข่งขันไม่สำเร็จ" }, { status: 500 });
    match = refreshed.data;
  }

  const { data: players, error: playersError } = await auth.admin
    .from("rank_match_players")
    .select("user_id,result,score,total_questions,finished_at,xp_before,xp_change,xp_after")
    .eq("match_id", matchId);
  if (playersError) {
    console.error("Ranked players lookup failed:", playersError.message);
    return NextResponse.json({ error: "โหลดข้อมูลผู้เล่นไม่สำเร็จ" }, { status: 500 });
  }
  const me = players?.find((player) => player.user_id === auth.user.id);
  if (!players || players.length !== 2 || !me) return NextResponse.json({ error: "คุณไม่มีสิทธิ์เข้าถึงการแข่งขันนี้" }, { status: 403 });
  const opponent = players.find((player) => player.user_id !== auth.user.id);

  const { data: lesson, error: lessonError } = await auth.admin
    .from("lessons").select("id,title,content").eq("id", match.lesson_id).maybeSingle();
  if (lessonError || !lesson) return NextResponse.json({ error: "ไม่พบบทเรียนของการแข่งขัน" }, { status: 404 });

  const { data: exercises, error: exerciseError } = await auth.admin
    .from("exercises").select("id").eq("lesson_id", match.lesson_id).eq("title", "Practice quiz");
  if (exerciseError || !exercises?.length) return NextResponse.json({ error: "บทเรียนนี้ไม่มีแบบทดสอบ" }, { status: 422 });

  const { data: questionRows, error: questionError } = await auth.admin
    .from("questions").select("id,prompt,english,explanation,position")
    .in("exercise_id", exercises.map((item) => item.id)).order("position", { ascending: true });
  if (questionError || !questionRows?.length) return NextResponse.json({ error: "โหลดโจทย์ไม่สำเร็จ" }, { status: 500 });

  const { data: options, error: optionsError } = await auth.admin
    .from("question_options").select("id,question_id,option_text,position")
    .in("question_id", questionRows.map((item) => item.id)).order("position", { ascending: true });
  if (optionsError) return NextResponse.json({ error: "โหลดตัวเลือกไม่สำเร็จ" }, { status: 500 });

  const { data: answers, error: answersError } = await auth.admin
    .from("rank_match_answers").select("question_id,is_correct")
    .eq("match_id", matchId).eq("user_id", auth.user.id);
  if (answersError) return NextResponse.json({ error: "โหลดสถานะคำตอบไม่สำเร็จ" }, { status: 500 });

  const content = (lesson.content ?? {}) as { lesson_key?: string; level?: string };
  return NextResponse.json({
    data: {
      match,
      lesson: { id: content.lesson_key ?? lesson.id, title: lesson.title, level: content.level ?? "Beginner" },
      questions: questionRows.map((question) => ({
        id: question.id,
        prompt: question.prompt,
        english: question.english ?? "",
        explanation: question.explanation ?? "",
        options: (options ?? []).filter((option) => option.question_id === question.id).map((option) => ({
          id: option.id, text: option.option_text, position: option.position,
        })),
      })),
      me: { score: me.score, total: me.total_questions, finished: Boolean(me.finished_at), result: me.result, xpBefore: me.xp_before, xpChange: me.xp_change, xpAfter: me.xp_after },
      opponent: { score: opponent?.score ?? 0, total: opponent?.total_questions ?? questionRows.length, finished: Boolean(opponent?.finished_at), result: opponent?.result, xpBefore: opponent?.xp_before, xpChange: opponent?.xp_change, xpAfter: opponent?.xp_after },
      answered: (answers ?? []).map((answer) => answer.question_id),
    },
  });
}

export async function POST(request: NextRequest, context: { params: Promise<{ matchId: string }> }) {
  const auth = await authenticate(request);
  if ("response" in auth) return auth.response;
  const { matchId } = await context.params;
  if (!uuidPattern.test(matchId)) return NextResponse.json({ error: "รหัสการแข่งขันไม่ถูกต้อง" }, { status: 400 });

  let body: { questionId?: unknown; optionPosition?: unknown };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "ข้อมูลคำตอบไม่ถูกต้อง" }, { status: 400 }); }

  const optionPosition = Number(body.optionPosition);
  if (typeof body.questionId !== "string" || !uuidPattern.test(body.questionId) ||
      !Number.isInteger(optionPosition) || optionPosition < 0 || optionPosition > 4) {
    return NextResponse.json({ error: "กรุณาเลือกคำตอบให้ถูกต้อง" }, { status: 400 });
  }

  const { data, error } = await auth.admin.rpc("submit_rank_answer", {
    p_user_id: auth.user.id,
    p_match_id: matchId,
    p_question_id: body.questionId,
    p_option_position: optionPosition,
  });
  if (error) {
    console.error("Ranked answer submission failed:", error.message);
    const status = error.code === "42501" ? 403 : error.code === "P0002" ? 404 : 409;
    return NextResponse.json({ error: error.message || "ส่งคำตอบไม่สำเร็จ" }, { status });
  }
  return NextResponse.json({ data });
}
