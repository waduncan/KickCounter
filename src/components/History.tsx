import { formatDuration, formatSessionDate, formatTime } from "../lib/format";
import type { KickSession } from "../types";

interface HistoryProps {
  sessions: KickSession[];
  loading: boolean;
}

export function History({ sessions, loading }: HistoryProps) {
  if (loading) {
    return <section className="page-section history-page"><div className="loading-card">Loading your history…</div></section>;
  }

  return (
    <section className="page-section history-page">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Your movement log</p>
          <h1>Session history.</h1>
          <p>Every saved count, together in one private timeline.</p>
        </div>
        <div className="history-total"><strong>{sessions.length}</strong><span>Total sessions</span></div>
      </header>

      {!sessions.length ? (
        <div className="history-empty">
          <span className="brand-mark" aria-hidden="true">10</span>
          <h2>No sessions yet</h2>
          <p>Your first saved movement check will show up here.</p>
        </div>
      ) : (
        <div className="history-list">
          <div className="history-header" aria-hidden="true">
            <span>Date</span><span>Started</span><span>Movements</span><span>Duration</span><span>Note</span>
          </div>
          {sessions.map((session, index) => {
            const previous = sessions[index - 1];
            const change = previous
              ? Math.round(((session.duration_seconds - previous.duration_seconds) / previous.duration_seconds) * 100)
              : 0;
            return (
              <article className="history-row" key={session.id}>
                <div className="history-date">
                  <span className="mobile-field-label">Date</span>
                  <strong>{formatSessionDate(session.started_at)}</strong>
                  <small>{new Intl.DateTimeFormat(undefined, { weekday: "long" }).format(new Date(session.started_at))}</small>
                </div>
                <div>
                  <span className="mobile-field-label">Started</span>
                  <strong>{formatTime(session.started_at)}</strong>
                </div>
                <div>
                  <span className="mobile-field-label">Movements</span>
                  <span className={session.kick_count >= 10 ? "count-pill count-complete" : "count-pill"}>{session.kick_count}</span>
                </div>
                <div>
                  <span className="mobile-field-label">Duration</span>
                  <strong>{formatDuration(session.duration_seconds)}</strong>
                  {index > 0 && change !== 0 && <small>{Math.abs(change)}% {change < 0 ? "quicker" : "longer"}</small>}
                </div>
                <div className="history-note">
                  <span className="mobile-field-label">Note</span>
                  <p>{session.note || "—"}</p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
