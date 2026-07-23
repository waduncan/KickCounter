import { formatDuration } from "../lib/format";
import type { KickSession } from "../types";

interface InsightsProps {
  sessions: KickSession[];
  loading: boolean;
}

function average(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = average(values);
  return Math.sqrt(average(values.map((value) => (value - mean) ** 2)));
}

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function activityStreak(sessions: KickSession[]): number {
  const days = [...new Set(sessions.map((session) => dateKey(new Date(session.started_at))))]
    .map((key) => {
      const [year, month, day] = key.split("-").map(Number);
      return new Date(year, month, day).getTime();
    })
    .sort((a, b) => b - a);
  if (!days.length) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayGap = Math.round((today.getTime() - days[0]) / 86_400_000);
  if (dayGap > 1) return 0;

  let streak = 1;
  for (let i = 1; i < days.length; i += 1) {
    if (Math.round((days[i - 1] - days[i]) / 86_400_000) !== 1) break;
    streak += 1;
  }
  return streak;
}

function buildLinePoints(sessions: KickSession[]): string {
  const values = sessions.map((session) => session.duration_seconds);
  if (!values.length) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);
  return values
    .map((value, index) => {
      const x = values.length === 1 ? 280 : 28 + (index / (values.length - 1)) * 504;
      const y = 150 - ((value - min) / range) * 112;
      return `${x},${y}`;
    })
    .join(" ");
}

export function Insights({ sessions, loading }: InsightsProps) {
  const durations = sessions.map((session) => session.duration_seconds);
  const avgDuration = Math.round(average(durations));
  const fastest = durations.length ? Math.min(...durations) : 0;
  const avgGap = Math.round(
    average(
      sessions
        .filter((session) => session.kick_count > 1)
        .map((session) => session.duration_seconds / (session.kick_count - 1)),
    ),
  );
  const completionRate = sessions.length
    ? Math.round((sessions.filter((session) => session.kick_count >= 10).length / sessions.length) * 100)
    : 0;
  const consistency = avgDuration
    ? Math.max(0, Math.round(100 - (standardDeviation(durations) / avgDuration) * 100))
    : 0;
  const totalMovements = sessions.reduce((sum, session) => sum + session.kick_count, 0);
  const streak = activityStreak(sessions);
  const recentForLine = [...sessions].slice(0, 8).reverse();
  const linePoints = buildLinePoints(recentForLine);

  const dayParts = [
    { label: "Morning", min: 5, max: 11, color: "coral" },
    { label: "Afternoon", min: 12, max: 16, color: "gold" },
    { label: "Evening", min: 17, max: 21, color: "green" },
    { label: "Night", min: 22, max: 28, color: "ink" },
  ].map((part) => ({
    ...part,
    count: sessions.filter((session) => {
      const hour = new Date(session.started_at).getHours();
      const normalized = hour < 5 ? hour + 24 : hour;
      return normalized >= part.min && normalized <= part.max;
    }).length,
  }));
  const maxDayPart = Math.max(1, ...dayParts.map((part) => part.count));

  const weeklyDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    const matches = sessions.filter(
      (session) => dateKey(new Date(session.started_at)) === dateKey(date),
    );
    return {
      label: new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(date).slice(0, 2),
      count: matches.length,
      duration: Math.round(average(matches.map((session) => session.duration_seconds))),
    };
  });
  const maxWeeklyDuration = Math.max(1, ...weeklyDays.map((day) => day.duration));

  const recentFive = sessions.slice(0, 5).map((session) => session.duration_seconds);
  const previousFive = sessions.slice(5, 10).map((session) => session.duration_seconds);
  const previousAverage = average(previousFive);
  const paceChange = previousAverage
    ? Math.round(((previousAverage - average(recentFive)) / previousAverage) * 100)
    : 0;

  if (loading) {
    return <section className="page-section insights-page"><div className="loading-card">Loading your patterns…</div></section>;
  }

  if (!sessions.length) {
    return (
      <section className="page-section empty-page">
        <p className="eyebrow">Insights</p>
        <h1>Your patterns will take shape here.</h1>
        <p>Complete your first session to begin seeing pace, timing, and consistency.</p>
      </section>
    );
  }

  return (
    <section className="page-section insights-page">
      <header className="page-heading">
        <div>
          <p className="eyebrow">Your personal patterns</p>
          <h1>Insights at a glance.</h1>
          <p>Based on {sessions.length} recorded {sessions.length === 1 ? "session" : "sessions"}.</p>
        </div>
        <span className="data-range">All recorded time</span>
      </header>

      <div className="stat-grid">
        <article className="stat-card stat-card-featured">
          <span>Typical session</span>
          <strong>{formatDuration(avgDuration)}</strong>
          <p>{paceChange > 0 ? `${paceChange}% quicker than the prior five` : "Your rolling average duration"}</p>
        </article>
        <article className="stat-card">
          <span>Fastest session</span>
          <strong>{formatDuration(fastest)}</strong>
          <p>Shortest recorded time</p>
        </article>
        <article className="stat-card">
          <span>Average interval</span>
          <strong>{formatDuration(avgGap)}</strong>
          <p>Estimated time between movements</p>
        </article>
        <article className="stat-card">
          <span>Reached 10</span>
          <strong>{completionRate}%</strong>
          <p>{sessions.filter((session) => session.kick_count >= 10).length} completed sessions</p>
        </article>
      </div>

      <div className="insights-grid">
        <article className="chart-card trend-card">
          <div className="card-heading">
            <div><span>Session pace</span><h2>Recent duration trend</h2></div>
            <span className="chart-key"><i /> Duration</span>
          </div>
          <div className="line-chart-wrap">
            <svg className="line-chart" viewBox="0 0 560 180" role="img" aria-label="Duration of the eight most recent sessions">
              <line x1="28" y1="38" x2="532" y2="38" />
              <line x1="28" y1="94" x2="532" y2="94" />
              <line x1="28" y1="150" x2="532" y2="150" />
              <polyline points={linePoints} />
              {linePoints.split(" ").map((point, index) => {
                const [cx, cy] = point.split(",");
                return <circle key={`${cx}-${cy}-${index}`} cx={cx} cy={cy} r="5" />;
              })}
            </svg>
          </div>
          <div className="chart-axis">
            {recentForLine.map((session) => (
              <span key={session.id}>{new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(session.started_at))}</span>
            ))}
          </div>
        </article>

        <article className="chart-card time-card">
          <div className="card-heading"><div><span>Time of day</span><h2>When you usually track</h2></div></div>
          <div className="daypart-list">
            {dayParts.map((part) => (
              <div className="daypart-row" key={part.label}>
                <div><span>{part.label}</span><strong>{part.count}</strong></div>
                <div className="bar-track"><i className={`bar-${part.color}`} style={{ width: `${(part.count / maxDayPart) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </article>

        <article className="chart-card week-card">
          <div className="card-heading"><div><span>Last 7 days</span><h2>Your weekly rhythm</h2></div><strong>{weeklyDays.reduce((sum, day) => sum + day.count, 0)} sessions</strong></div>
          <div className="week-bars">
            {weeklyDays.map((day) => (
              <div className="week-column" key={day.label}>
                <span>{day.duration ? formatDuration(day.duration) : ""}</span>
                <div><i style={{ height: day.duration ? `${Math.max(16, (day.duration / maxWeeklyDuration) * 100)}%` : "4px" }} /></div>
                <strong>{day.label}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="chart-card totals-card">
          <div className="card-heading"><div><span>All-time snapshot</span><h2>The story so far</h2></div></div>
          <div className="total-list">
            <div><strong>{totalMovements}</strong><span>movements recorded</span></div>
            <div><strong>{sessions.length}</strong><span>total sessions</span></div>
            <div><strong>{streak}</strong><span>day activity streak</span></div>
            <div><strong>{consistency}%</strong><span>pace consistency</span></div>
          </div>
        </article>
      </div>

      <aside className="insight-note">
        <span aria-hidden="true">i</span>
        <p><strong>These are personal patterns, not clinical thresholds.</strong> If you notice a change that worries you, contact your maternity care team.</p>
      </aside>
    </section>
  );
}
