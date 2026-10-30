import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function errorStatus(message: string) {
  if (message.includes("XP ไม่เพียงพอ") || message.includes("XP ยังไม่ถึง") ||
      message.includes("บทเรียนก่อนหน้า") || message.includes("คิว Ranked")) return 409;
  if (message.includes("ไม่พบบทเรียน")) return 404;
  return 400;
}

async function getAuthenticatedUser(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey || !serviceRoleKey) {
    return { error: NextResponse.json({ error: "Supabase ยังตั้งค่าไม่ครบสำหรับ Ranked" }, { status: 503 }) };
  }

  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";
  if (!token) {
    return { error: NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อนเล่น Ranked" }, { status: 401 }) };
  }

  const authClient = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data.user) {
    return { error: NextResponse.json({ error: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่" }, { status: 401 }) };
  }

  const admin = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return { user: data.user, admin };
}

export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedUser(request);
  if ("error" in auth) return auth.error;

  const { data: queue, error } = await auth.admin
    .from("rank_queue")
    .select("id,lesson_id,status,match_id,created_at,matched_at")
    .eq("user_id", auth.user.id)
    .in("status", ["waiting", "matched"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Ranked queue status lookup failed:", error.message);
    return NextResponse.json({ error: "ไม่สามารถตรวจสอบสถานะ Ranked ได้" }, { status: 500 });
  }

  if (!queue) return NextResponse.json({ data: { status: "idle" } });

  if (queue.status === "waiting") {
    return NextResponse.json({ data: { status: "waiting", queueId: queue.id, createdAt: queue.created_at } });
  }

  const { data: match, error: matchError } = await auth.admin
    .from("rank_matches")
    .select("id,lesson_id,status,lesson_xp,started_at")
    .eq("id", queue.match_id)
    .maybeSingle();

  if (matchError || !match) {
    console.error("Ranked match lookup failed:", matchError?.message);
    return NextResponse.json({ error: "ไม่พบข้อมูลการแข่งขัน" }, { status: 500 });
  }

  return NextResponse.json({ data: { status: "matched", match } });
}

export async function POST(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey || !serviceRoleKey) {
    return NextResponse.json({ error: "Supabase ยังตั้งค่าไม่ครบสำหรับ Ranked" }, { status: 503 });
  }

  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";
  if (!token) {
    return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อนเล่น Ranked" }, { status: 401 });
  }

  let body: { action?: unknown; lessonKey?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const action = body.action;
  if (action !== "join" && action !== "cancel") {
    return NextResponse.json({ error: "คำสั่ง Ranked ไม่ถูกต้อง" }, { status: 400 });
  }

  if (action === "join" &&
      (typeof body.lessonKey !== "string" || body.lessonKey.trim().length === 0 || body.lessonKey.length > 100)) {
    return NextResponse.json({ error: "กรุณาระบุบทเรียนให้ถูกต้อง" }, { status: 400 });
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

  const rpcName = action === "join" ? "join_rank_queue" : "cancel_rank_queue";
  const rpcArgs = action === "join"
    ? { p_user_id: userData.user.id, p_lesson_key: (body.lessonKey as string).trim() }
    : { p_user_id: userData.user.id };

  const { data, error } = await admin.rpc(rpcName, rpcArgs);
  if (error) {
    console.error("Ranked queue RPC failed:", error.message);
    return NextResponse.json(
      { error: error.message || "ไม่สามารถดำเนินการ Ranked ได้" },
      { status: errorStatus(error.message || "") },
    );
  }

  return NextResponse.json({ data });
}
