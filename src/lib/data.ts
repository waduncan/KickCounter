import type { KickSession, NewKickSession } from "../types";
import { getSupabase } from "./supabase";

const DEMO_STORAGE_KEY = "little-kicks-demo-sessions";

function dateAt(daysAgo: number, hour: number, minute: number): Date {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  date.setDate(date.getDate() - daysAgo);
  return date;
}

function makeDemoSession(
  index: number,
  daysAgo: number,
  hour: number,
  minute: number,
  durationSeconds: number,
  count = 10,
): KickSession {
  const started = dateAt(daysAgo, hour, minute);
  const ended = new Date(started.getTime() + durationSeconds * 1000);
  const intervals = Array.from({ length: count }, (_, i) =>
    Math.round((durationSeconds / Math.max(1, count)) * (i + 1)),
  );

  return {
    id: `demo-${index}`,
    user_id: "demo-user",
    started_at: started.toISOString(),
    ended_at: ended.toISOString(),
    duration_seconds: durationSeconds,
    kick_count: count,
    movement_times_seconds: intervals,
    note: index === 0 ? "After breakfast, resting on my left side." : null,
    created_at: ended.toISOString(),
  };
}

export function seedDemoSessions(): KickSession[] {
  return [
    makeDemoSession(1, 0, 9, 14, 738),
    makeDemoSession(2, 1, 20, 7, 982),
    makeDemoSession(3, 2, 13, 35, 825),
    makeDemoSession(4, 3, 9, 42, 1104),
    makeDemoSession(5, 4, 19, 18, 901),
    makeDemoSession(6, 6, 10, 5, 1260),
    makeDemoSession(7, 7, 15, 48, 793),
    makeDemoSession(8, 8, 9, 21, 1188),
    makeDemoSession(9, 10, 20, 14, 945),
    makeDemoSession(10, 12, 12, 42, 1036),
    makeDemoSession(11, 13, 8, 57, 872),
  ];
}

function readDemoSessions(): KickSession[] {
  try {
    const saved = localStorage.getItem(DEMO_STORAGE_KEY);
    if (saved) return JSON.parse(saved) as KickSession[];
  } catch {
    // A private browsing mode may block storage; seeded data still keeps the UI useful.
  }
  return seedDemoSessions();
}

function writeDemoSessions(sessions: KickSession[]): void {
  try {
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(sessions));
  } catch {
    // The current in-memory result remains available for this visit.
  }
}

export async function loadSessions(demoMode: boolean): Promise<KickSession[]> {
  if (demoMode) return readDemoSessions();

  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured.");

  const { data, error } = await supabase
    .from("kick_sessions")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(365);

  if (error) throw error;
  return (data ?? []) as KickSession[];
}

export async function createSession(
  input: NewKickSession,
  userId: string,
  demoMode: boolean,
): Promise<KickSession> {
  if (demoMode) {
    const created: KickSession = {
      id: `demo-${crypto.randomUUID()}`,
      user_id: userId,
      started_at: input.startedAt,
      ended_at: input.endedAt,
      duration_seconds: input.durationSeconds,
      kick_count: input.kickCount,
      movement_times_seconds: input.movementTimesSeconds,
      note: input.note.trim() || null,
      created_at: new Date().toISOString(),
    };
    const sessions = [created, ...readDemoSessions()];
    writeDemoSessions(sessions);
    return created;
  }

  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured.");

  const { data, error } = await supabase
    .from("kick_sessions")
    .insert({
      user_id: userId,
      started_at: input.startedAt,
      ended_at: input.endedAt,
      duration_seconds: input.durationSeconds,
      kick_count: input.kickCount,
      movement_times_seconds: input.movementTimesSeconds,
      note: input.note.trim() || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as KickSession;
}
