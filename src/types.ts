export type AppTab = "today" | "insights" | "history";

export interface KickSession {
  id: string;
  user_id: string;
  started_at: string;
  ended_at: string;
  duration_seconds: number;
  kick_count: number;
  movement_times_seconds: number[];
  note: string | null;
  created_at: string;
}

export interface NewKickSession {
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  kickCount: number;
  movementTimesSeconds: number[];
  note: string;
}

export interface UserIdentity {
  id: string;
  email: string;
}
