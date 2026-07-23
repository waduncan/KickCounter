import { useEffect, useMemo, useState } from "react";
import { formatClock, formatDuration, formatSessionDate, formatTime } from "../lib/format";
import type { KickSession, NewKickSession } from "../types";

type TrackerPhase = "idle" | "active" | "review" | "saved";

interface ActiveDraft {
  startedAt: number;
  endedAt: number | null;
  kickCount: number;
  movementTimesSeconds: number[];
  phase: "active" | "review";
}

interface TrackerProps {
  userId: string;
  sessions: KickSession[];
  onSave: (input: NewKickSession) => Promise<KickSession>;
  onShowInsights: () => void;
}

const TARGET = 10;

function readDraft(key: string): ActiveDraft | null {
  try {
    const value = localStorage.getItem(key);
    if (!value) return null;
    const draft = JSON.parse(value) as ActiveDraft;
    if (!draft.startedAt || !["active", "review"].includes(draft.phase)) return null;
    return draft;
  } catch {
    return null;
  }
}

export function Tracker({ userId, sessions, onSave, onShowInsights }: TrackerProps) {
  const storageKey = `little-kicks-active-${userId}`;
  const restoredDraft = useMemo(() => readDraft(storageKey), [storageKey]);
  const [phase, setPhase] = useState<TrackerPhase>(restoredDraft?.phase ?? "idle");
  const [startedAt, setStartedAt] = useState(restoredDraft?.startedAt ?? 0);
  const [endedAt, setEndedAt] = useState<number | null>(restoredDraft?.endedAt ?? null);
  const [kickCount, setKickCount] = useState(restoredDraft?.kickCount ?? 0);
  const [movementTimes, setMovementTimes] = useState<number[]>(restoredDraft?.movementTimesSeconds ?? []);
  const [now, setNow] = useState(Date.now());
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedSession, setSavedSession] = useState<KickSession | null>(null);

  useEffect(() => {
    if (phase !== "active") return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (phase === "active" || phase === "review") {
      const draft: ActiveDraft = {
        startedAt,
        endedAt,
        kickCount,
        movementTimesSeconds: movementTimes,
        phase,
      };
      try {
        localStorage.setItem(storageKey, JSON.stringify(draft));
      } catch {
        // The active session still works in memory if storage is unavailable.
      }
    } else {
      localStorage.removeItem(storageKey);
    }
  }, [endedAt, kickCount, movementTimes, phase, startedAt, storageKey]);

  const elapsedSeconds = Math.max(
    0,
    Math.floor(((endedAt ?? now) - startedAt) / 1000),
  );
  const lastSession = sessions[0];
  const lastSevenDays = sessions.filter(
    (session) => Date.now() - new Date(session.started_at).getTime() < 7 * 86_400_000,
  );
  const weeklyAverage = lastSevenDays.length
    ? Math.round(lastSevenDays.reduce((sum, session) => sum + session.duration_seconds, 0) / lastSevenDays.length)
    : 0;

  function startSession() {
    const start = Date.now();
    setStartedAt(start);
    setNow(start);
    setEndedAt(null);
    setKickCount(0);
    setMovementTimes([]);
    setNote("");
    setSaveError(null);
    setSavedSession(null);
    setPhase("active");
  }

  function recordMovement() {
    if (phase !== "active" || kickCount >= TARGET) return;
    const tapTime = Date.now();
    const nextCount = kickCount + 1;
    const second = Math.max(0, Math.floor((tapTime - startedAt) / 1000));
    setKickCount(nextCount);
    setMovementTimes((current) => [...current, second]);
    setNow(tapTime);
    if (navigator.vibrate) navigator.vibrate(12);

    if (nextCount === TARGET) {
      setEndedAt(tapTime);
      setPhase("review");
    }
  }

  function removeLastMovement() {
    if (kickCount <= 0) return;
    setKickCount((count) => count - 1);
    setMovementTimes((times) => times.slice(0, -1));
  }

  function finishEarly() {
    if (kickCount === 0) return;
    setEndedAt(Date.now());
    setPhase("review");
  }

  function discardSession() {
    if (!window.confirm("Discard this in-progress session?")) return;
    setPhase("idle");
    setStartedAt(0);
    setEndedAt(null);
    setKickCount(0);
    setMovementTimes([]);
  }

  async function saveSession() {
    if (!endedAt || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      const saved = await onSave({
        startedAt: new Date(startedAt).toISOString(),
        endedAt: new Date(endedAt).toISOString(),
        durationSeconds: elapsedSeconds,
        kickCount,
        movementTimesSeconds: movementTimes,
        note,
      });
      setSavedSession(saved);
      setPhase("saved");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "This session could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  if (phase === "active") {
    const progress = Math.min(100, (kickCount / TARGET) * 100);
    return (
      <section className="tracker-active page-section">
        <div className="active-topline">
          <div>
            <p className="eyebrow">Session in progress</p>
            <h1>Notice. Breathe. Tap.</h1>
          </div>
          <button className="text-button text-danger" type="button" onClick={discardSession}>Discard</button>
        </div>

        <div className="active-layout">
          <div className="counter-stage">
            <div
              className="progress-ring"
              style={{ "--progress": `${progress * 3.6}deg` } as React.CSSProperties}
              aria-label={`${kickCount} of ${TARGET} movements recorded`}
            >
              <div className="progress-ring-inner">
                <strong aria-live="polite">{kickCount}</strong>
                <span>of {TARGET} movements</span>
              </div>
            </div>
            <div className="live-timer">
              <span>Elapsed time</span>
              <strong>{formatClock(elapsedSeconds)}</strong>
            </div>
          </div>

          <div className="tap-zone">
            <button className="movement-button" type="button" onClick={recordMovement}>
              <span className="movement-plus" aria-hidden="true">+</span>
              <strong>I felt a movement</strong>
              <small>Tap once for each kick or movement</small>
            </button>
            <div className="active-actions">
              <button className="button button-quiet" type="button" onClick={removeLastMovement} disabled={kickCount === 0}>
                <span aria-hidden="true">−</span> Undo last
              </button>
              <button className="button button-quiet" type="button" onClick={finishEarly} disabled={kickCount === 0}>
                Finish early
              </button>
            </div>
            <p className="tap-hint">The timer stops automatically at 10.</p>
          </div>
        </div>
      </section>
    );
  }

  if (phase === "review") {
    return (
      <section className="review-page page-section">
        <div className="review-card">
          <div className="completion-badge" aria-hidden="true">✓</div>
          <p className="eyebrow">Session complete</p>
          <h1>{kickCount >= TARGET ? "Ten movements — nicely done." : "Session finished."}</h1>
          <p className="review-lead">Check the details below, make any corrections, then save the session.</p>

          <div className="review-metrics">
            <div>
              <span>Time</span>
              <strong>{formatDuration(elapsedSeconds)}</strong>
            </div>
            <div>
              <span>Movements</span>
              <div className="count-stepper" aria-label="Adjust movement count">
                <button type="button" aria-label="Decrease count" onClick={() => setKickCount((count) => Math.max(1, count - 1))}>−</button>
                <strong aria-live="polite">{kickCount}</strong>
                <button type="button" aria-label="Increase count" onClick={() => setKickCount((count) => Math.min(100, count + 1))}>+</button>
              </div>
            </div>
          </div>

          <label className="note-field">
            <span>Anything you want to remember? <small>Optional</small></span>
            <textarea
              rows={3}
              maxLength={500}
              placeholder="For example: after breakfast, resting on my side…"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </label>

          {saveError && <p className="form-message form-error" role="alert">{saveError}</p>}
          <div className="review-actions">
            {kickCount < TARGET && (
              <button
                className="button button-secondary"
                type="button"
                onClick={() => {
                  setEndedAt(null);
                  setNow(Date.now());
                  setPhase("active");
                }}
              >
                Keep counting
              </button>
            )}
            <button className="button button-primary" type="button" onClick={saveSession} disabled={saving}>
              {saving ? "Saving…" : "Save session"}
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (phase === "saved" && savedSession) {
    return (
      <section className="saved-page page-section">
        <div className="saved-card">
          <div className="saved-sparkles" aria-hidden="true"><i /><i /><i /><i /></div>
          <span className="completion-badge" aria-hidden="true">✓</span>
          <p className="eyebrow">Saved to your history</p>
          <h1>That’s one more moment remembered.</h1>
          <div className="saved-summary">
            <span>{formatTime(savedSession.started_at)}</span>
            <strong>{savedSession.kick_count} movements</strong>
            <span>{formatDuration(savedSession.duration_seconds)}</span>
          </div>
          <div className="review-actions">
            <button className="button button-secondary" type="button" onClick={onShowInsights}>See your insights</button>
            <button className="button button-primary" type="button" onClick={startSession}>Start another</button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="today-page page-section">
      <div className="today-hero">
        <div className="today-copy">
          <p className="eyebrow">Today’s movement check</p>
          <h1>Ready when<br />you are.</h1>
          <p>Get comfortable, settle in, and begin when it feels right.</p>
          <button className="start-button" type="button" onClick={startSession}>
            <span className="start-icon" aria-hidden="true">→</span>
            <span><strong>Start a session</strong><small>Timer begins right away</small></span>
          </button>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="hero-orbit hero-orbit-one" />
          <div className="hero-orbit hero-orbit-two" />
          <div className="hero-ten"><strong>10</strong><span>little<br />moments</span></div>
          <i className="hero-dot hero-dot-one" />
          <i className="hero-dot hero-dot-two" />
          <i className="hero-dot hero-dot-three" />
        </div>
      </div>

      <div className="today-snapshot">
        <div className="snapshot-heading">
          <div>
            <p className="eyebrow">Your recent rhythm</p>
            <h2>A quick look back</h2>
          </div>
          <button className="text-button" type="button" onClick={onShowInsights}>View all insights →</button>
        </div>
        <div className="snapshot-grid">
          <article className="snapshot-card snapshot-latest">
            <span>Last session</span>
            {lastSession ? (
              <>
                <strong>{formatDuration(lastSession.duration_seconds)}</strong>
                <p>{formatSessionDate(lastSession.started_at)} · {formatTime(lastSession.started_at)}</p>
              </>
            ) : (
              <><strong>—</strong><p>Your first session will appear here.</p></>
            )}
          </article>
          <article className="snapshot-card">
            <span>7-day average</span>
            <strong>{weeklyAverage ? formatDuration(weeklyAverage) : "—"}</strong>
            <p>{lastSevenDays.length} {lastSevenDays.length === 1 ? "session" : "sessions"} this week</p>
          </article>
          <article className="snapshot-card snapshot-tip">
            <span className="tip-mark" aria-hidden="true">i</span>
            <div>
              <strong>Trust what you notice.</strong>
              <p>If a movement pattern concerns you, contact your maternity care team.</p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
