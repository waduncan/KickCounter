export type AppTab = "today" | "insights" | "history" | "profile";

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

export interface UserProfile {
  user_id: string;
  expected_due_date: string | null;
  baby_name: string | null;
  doctor_name: string | null;
  doctor_phone: string | null;
  doctor_website: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserProfileInput {
  expectedDueDate: string;
  babyName: string;
  doctorName: string;
  doctorPhone: string;
  doctorWebsite: string;
}
