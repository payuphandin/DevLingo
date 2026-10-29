import { getSupabase } from "@/lib/supabase";

export type LearnerProgress = { xp: number; completed: string[]; streak: number; lastDay: string };
export const emptyProgress: LearnerProgress = { xp: 0, completed: [], streak: 0, lastDay: "" };

export async function loadLearnerProgress(): Promise<{ progress: LearnerProgress; email: string | null }> {
  const supabase = getSupabase();
  if (!supabase) return { progress: emptyProgress, email: null };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { progress: emptyProgress, email: null };
  const { data, error } = await supabase.from("learner_progress")
    .select("xp, completed, streak, last_day").eq("user_id", user.id).maybeSingle();
  if (error) {
    console.error("Unable to load learner progress:", error.message);
    return { progress: emptyProgress, email: user.email ?? null };
  }
  return {
    email: user.email ?? null,
    progress: data ? {
      xp: data.xp ?? 0,
      completed: data.completed ?? [],
      streak: data.streak ?? 0,
      lastDay: data.last_day ?? "",
    } : emptyProgress,
  };
}

export async function saveLearnerProgress(progress: LearnerProgress): Promise<{ error: string | null }> {
  const supabase = getSupabase();
  if (!supabase) return { error: "ยังไม่ได้ตั้งค่า Supabase" };
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return { error: "กรุณาเข้าสู่ระบบก่อนบันทึกความก้าวหน้า" };
  const { error } = await supabase.from("learner_progress").upsert({
    user_id: user.id,
    xp: progress.xp,
    completed: progress.completed,
    streak: progress.streak,
    last_day: progress.lastDay || null,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });
  return { error: error?.message ?? null };
}
