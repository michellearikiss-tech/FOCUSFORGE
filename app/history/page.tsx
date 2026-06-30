"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";

type StudySession = {
  id: string;
  user_id: string;
  task_name: string | null;
  duration_minutes: number;
  completed_at: string;
  scene?: string | null;
  space?: string | null;
};

function getPageBackground() {
  const hour = new Date().getHours();
  return hour >= 18 || hour < 6 ? "/reading-night.png" : "/library-study.png";
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [background, setBackground] = useState("/library-study.png");
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(getToday());

  useEffect(() => {
    setBackground(getPageBackground());
    loadSessions();
  }, []);

  async function loadSessions() {
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      window.location.href = "/login";
      return;
    }

    const { data, error } = await supabase
      .from("study_sessions")
      .select("*")
      .eq("user_id", userData.user.id)
      .order("completed_at", { ascending: false })
      .limit(160);

    if (error) {
      console.error("Load sessions error:", error);
      alert("Failed to load history.");
      setLoading(false);
      return;
    }

    setSessions(data || []);
    setLoading(false);
  }

  const totalMinutes = sessions.reduce(
    (sum, session) => sum + session.duration_minutes,
    0
  );

  const groupedSessions = groupSessionsByDate(sessions);
  const monthlyDays = getCurrentMonthDays();
  const monthlyStats = getMonthlyStats(sessions);
  const selectedSessions = groupedSessions[selectedDate] || [];
  const selectedMinutes = selectedSessions.reduce(
    (sum, session) => sum + session.duration_minutes,
    0
  );

  const focusDays = Object.keys(groupedSessions).length;
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

  return (
    <main className="history-page">
      <div
        className="background"
        style={{ backgroundImage: `url('${background}')` }}
      />
      <div className="overlay" />

      <div className="content">
        <header className="header">
          <div>
            <p className="label">FocusForge Journal</p>
            <h1>History</h1>
          </div>

          <nav className="nav">
            <a href="/">Home</a>
            <a href="/forge">Forge</a>
            <a href="/calendar">Calendar</a>
          </nav>
        </header>

        <section className="history-layout">
          <section className="rhythm-card glass">
            <div className="card-top">
              <div>
                <p className="small-caps">Monthly Rhythm</p>
                <h2>
                  {new Date().toLocaleString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </h2>
              </div>

              <p className="hint">Tap a day to read that page.</p>
            </div>

            <div className="week-row">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>

            <div className="heatmap">
              {monthlyDays.map((day) => {
                const dateString = formatDate(day);
                const stats = monthlyStats[dateString] || {
                  minutes: 0,
                  sessions: 0,
                };

                const isToday = dateString === getToday();
                const isSelected = dateString === selectedDate;
                const isHovered = hoveredDay === dateString;

                return (
                  <button
                    key={dateString}
                    className={`heat-cell ${isToday ? "today" : ""} ${
                      isSelected ? "selected" : ""
                    }`}
                    style={getHeatmapColor(stats.minutes)}
                    onMouseEnter={() => setHoveredDay(dateString)}
                    onMouseLeave={() => setHoveredDay(null)}
                    onClick={() => setSelectedDate(dateString)}
                  >
                    <span className="day-number">{day.getDate()}</span>

                    {stats.minutes > 0 && (
                      <span className="day-minutes">{stats.minutes}m</span>
                    )}

                    {isHovered && (
                      <div className="tooltip">
                        <p>{formatShortDate(day)}</p>
                        <span>{stats.minutes} minutes</span>
                        <span>
                          {stats.sessions}{" "}
                          {stats.sessions === 1 ? "session" : "sessions"}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="legend">
              <span>Less</span>
              <i style={getHeatmapColor(0)} />
              <i style={getHeatmapColor(30)} />
              <i style={getHeatmapColor(90)} />
              <i style={getHeatmapColor(120)} />
              <span>More</span>
            </div>
          </section>

          <aside className="side-column">
            <section className="journey-card glass">
              <div>
                <p className="small-caps">Your Journey</p>
                <h2>Your Journey</h2>
                <p>You are continuing the story.</p>
              </div>

              <div className="summary">
                <div>
                  <strong>{sessions.length}</strong>
                  <span>Sessions</span>
                </div>

                <div>
                  <strong>{totalHours}</strong>
                  <span>Hours</span>
                </div>

                <div>
                  <strong>{focusDays}</strong>
                  <span>Days</span>
                </div>
              </div>
            </section>

            <section className="sessions-card glass">
              <div className="sessions-top">
                <div>
                  <p className="small-caps">Selected Day</p>
                  <h2>{formatDateLabel(selectedDate)}</h2>
                </div>

                <div className="selected-total">
                  <strong>{selectedMinutes}</strong>
                  <span>min</span>
                </div>
              </div>

              {loading ? (
                <p className="muted">Loading your journey...</p>
              ) : selectedSessions.length === 0 ? (
                <div className="empty-state">
                  <p>No focus sessions recorded on this day yet.</p>
                  {selectedDate === getToday() && <a href="/check-in">Begin Today</a>}
                </div>
              ) : (
                <div className="session-list">
                  {selectedSessions.map((session) => (
                    <article key={session.id} className="session-row">
                      <div className="session-main">
                        <div className="session-top-line">
                          <h3>{session.task_name || "Deep Work Session"}</h3>
                          <p>{session.duration_minutes}m</p>
                        </div>

                        <div className="session-meta">
                          <span>{formatTime(session.completed_at)}</span>
                          <span>
                            {getSceneIcon(session.scene || session.space)}{" "}
                            {formatScene(session.scene || session.space)}
                          </span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </aside>
        </section>
      </div>

      <style jsx>{`
        .history-page {
          position: relative;
          min-height: 100vh;
          overflow-x: hidden;
          color: rgba(241, 232, 218, 0.9);
          font-family: Cormorant Garamond, Georgia, serif;
          background: #0b0807;
        }

        .background {
          position: fixed;
          inset: 0;
          background-size: cover;
          background-position: center;
          filter: blur(1.1px);
          transform: scale(1.012);
        }

        .overlay {
          position: fixed;
          inset: 0;
          background:
            radial-gradient(circle at 42% 18%, rgba(241, 232, 218, 0.08), transparent 34%),
            linear-gradient(
              to bottom,
              rgba(0, 0, 0, 0.52),
              rgba(0, 0, 0, 0.6),
              rgba(0, 0, 0, 0.74)
            );
        }

        .content {
          position: relative;
          z-index: 10;
          width: min(1220px, calc(100% - 54px));
          margin: 0 auto;
          padding: 28px 0 calc(env(safe-area-inset-bottom) + 76px);
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 22px;
        }

        .header h1 {
          margin: 8px 0 0;
          font-size: clamp(3rem, 6vw, 5rem);
          line-height: 0.92;
          font-weight: 300;
          color: rgba(241, 232, 218, 0.92);
        }

        .label,
        .small-caps {
          margin: 0;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          font-size: 11px;
          color: rgba(241, 232, 218, 0.48);
        }

        .nav {
          display: flex;
          gap: 22px;
          padding-top: 4px;
        }

        .nav a {
          color: rgba(241, 232, 218, 0.76);
          text-decoration: none;
          font-size: 16px;
        }

        .glass {
          border: 1px solid rgba(241, 232, 218, 0.15);
          background: rgba(10, 8, 6, 0.35);
          backdrop-filter: blur(14px);
          box-shadow: 0 24px 70px rgba(0, 0, 0, 0.22);
        }

        .history-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 360px;
          gap: 24px;
          align-items: start;
        }

        .rhythm-card,
        .journey-card,
        .sessions-card {
          border-radius: 30px;
          padding: 24px;
        }

        .side-column {
          display: grid;
          gap: 20px;
        }

        .card-top,
        .sessions-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
          margin-bottom: 18px;
        }

        .card-top h2,
        .sessions-top h2,
        .journey-card h2 {
          margin: 8px 0 0;
          line-height: 0.95;
          font-weight: 300;
          color: rgba(241, 232, 218, 0.92);
        }

        .card-top h2 {
          font-size: clamp(2.7rem, 4.6vw, 4.1rem);
        }

        .sessions-top h2 {
          font-size: 2.4rem;
        }

        .journey-card h2 {
          font-size: 2.45rem;
        }

        .journey-card p:last-child {
          margin: 8px 0 0;
          font-size: 1.05rem;
          font-style: italic;
          color: rgba(241, 232, 218, 0.6);
        }

        .hint {
          margin: 8px 0 0;
          font-size: 14px;
          font-style: italic;
          color: rgba(241, 232, 218, 0.5);
          text-align: right;
        }

        .week-row {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 8px;
          margin-bottom: 8px;
        }

        .week-row span {
          text-align: center;
          font-size: 13px;
          color: rgba(241, 232, 218, 0.5);
        }

        .heatmap {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 8px;
        }

        .heat-cell {
          position: relative;
          aspect-ratio: 1 / 0.78;
          min-height: 84px;
          border-radius: 16px;
          cursor: pointer;
          color: rgba(241, 232, 218, 0.86);
          font-family: inherit;
          padding: 9px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: flex-start;
          transition:
            transform 0.18s ease,
            box-shadow 0.18s ease,
            border-color 0.18s ease;
        }

        .heat-cell:hover {
          transform: translateY(-2px);
        }

        .heat-cell.today {
          outline: 1px solid rgba(241, 232, 218, 0.52);
          outline-offset: 3px;
        }

        .heat-cell.selected {
          box-shadow:
            0 0 0 2px rgba(241, 232, 218, 0.74),
            0 16px 32px rgba(0, 0, 0, 0.18);
        }

        .day-number {
          font-size: 15px;
        }

        .day-minutes {
          align-self: flex-end;
          font-size: 11px;
          color: rgba(241, 232, 218, 0.62);
        }

.tooltip {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 14px);
  transform: translateX(-50%);
  z-index: 50;
  min-width: 150px;
  border-radius: 18px;
  border: 1px solid rgba(241, 232, 218, 0.2);
  background: rgba(12, 10, 8, 0.95);
  padding: 15px 18px;
  box-shadow: 0 18px 46px rgba(0, 0, 0, 0.36);
  pointer-events: none;
  text-align: center;
  backdrop-filter: blur(14px);
}

.tooltip p {
  margin: 0 0 8px;
  font-size: 18px;
  color: rgba(241, 232, 218, 0.92);
}

.tooltip span {
  display: block;
  font-size: 14px;
  line-height: 1.55;
  color: rgba(241, 232, 218, 0.68);
}

        .legend {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 7px;
          margin-top: 16px;
          color: rgba(241, 232, 218, 0.44);
          font-size: 12px;
        }

        .legend i {
          width: 15px;
          height: 15px;
          display: inline-block;
          border-radius: 5px;
        }

        .summary {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 9px;
          margin-top: 16px;
        }

        .summary div {
          border: 1px solid rgba(241, 232, 218, 0.12);
          border-radius: 17px;
          background: rgba(255, 255, 255, 0.04);
          padding: 10px 6px;
          text-align: center;
        }

        .summary strong {
          display: block;
          font-size: 1.35rem;
          line-height: 1;
          font-weight: 300;
          color: rgba(241, 232, 218, 0.88);
        }

        .summary span {
          display: block;
          margin-top: 6px;
          letter-spacing: 0.13em;
          text-transform: uppercase;
          font-size: 9px;
          color: rgba(241, 232, 218, 0.42);
        }

        .selected-total {
          border: 1px solid rgba(241, 232, 218, 0.12);
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.04);
          padding: 10px 13px;
          min-width: 68px;
          text-align: center;
        }

        .selected-total strong {
          display: block;
          font-size: 1.35rem;
          line-height: 1;
          font-weight: 300;
        }

        .selected-total span {
          display: block;
          margin-top: 5px;
          font-size: 11px;
          color: rgba(241, 232, 218, 0.42);
        }

        .session-list {
          display: grid;
          gap: 8px;
        }

        .session-row {
          border: 1px solid rgba(241, 232, 218, 0.1);
          background: rgba(255, 255, 255, 0.04);
          border-radius: 16px;
          padding: 10px 12px;
        }

        .session-top-line {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          align-items: baseline;
        }

        .session-row h3 {
          margin: 0;
          font-size: 1rem;
          line-height: 1.2;
          font-weight: 300;
          color: rgba(241, 232, 218, 0.88);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .session-top-line p {
          margin: 0;
          font-size: 13px;
          color: rgba(241, 232, 218, 0.68);
          white-space: nowrap;
        }

        .session-meta {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          margin-top: 5px;
          font-size: 12px;
          color: rgba(241, 232, 218, 0.46);
        }

        .muted {
          margin: 0;
          color: rgba(241, 232, 218, 0.52);
        }

        .empty-state {
          border: 1px solid rgba(241, 232, 218, 0.1);
          background: rgba(255, 255, 255, 0.035);
          border-radius: 20px;
          padding: 20px;
        }

        .empty-state p {
          margin: 0;
          color: rgba(241, 232, 218, 0.52);
        }

        .empty-state a {
          display: inline-block;
          margin-top: 14px;
          border-radius: 999px;
          border: 1px solid rgba(241, 232, 218, 0.28);
          padding: 10px 20px;
          color: rgba(241, 232, 218, 0.82);
          text-decoration: none;
        }

        
  @media (min-width: 901px) and (max-width: 1400px) {
  .content {
    width: min(96%, 1180px);
    padding: 22px 0 calc(env(safe-area-inset-bottom) + 76px);
  }

  .history-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 350px;
    gap: 20px;
  }

  .rhythm-card,
  .journey-card,
  .sessions-card {
    padding: 22px;
  }

  .heatmap,
  .week-row {
    gap: 7px;
  }

  .heat-cell {
    min-height: 62px;
    aspect-ratio: 1 / 0.78;
  }

  .tooltip {
    min-width: 170px;
    padding: 18px 20px;
    border-radius: 18px;
  }

  .tooltip p {
    font-size: 20px;
  }

  .tooltip span {
    font-size: 15px;
  }
}

@media (max-width: 900px) {
  .content {
    width: 100%;
    padding: 18px 14px calc(env(safe-area-inset-bottom) + 82px);
  }

  .header {
    flex-direction: column;
    gap: 12px;
    margin-bottom: 18px;
  }

  .header h1 {
    margin-top: 6px;
    font-size: clamp(3.2rem, 17vw, 4.7rem);
  }

  .history-layout,
  .side-column {
    display: flex;
    flex-direction: column;
    width: 100%;
    gap: 18px;
  }

  .rhythm-card,
  .journey-card,
  .sessions-card {
    width: 100%;
    border-radius: 28px;
    padding: 20px;
  }

  .week-row,
  .heatmap {
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 7px;
  }

  .heat-cell {
    width: 100%;
    aspect-ratio: 1 / 1;
    min-height: 0;
    border-radius: 12px;
    padding: 6px;
  }

  .day-minutes,
  .tooltip {
    display: none;
  }

  .legend {
    justify-content: center;
  }
}

@media (max-width: 420px) {
  .rhythm-card,
  .journey-card,
  .sessions-card {
    padding: 18px;
    border-radius: 26px;
  }

  .week-row,
  .heatmap {
    gap: 6px;
  }

  .heat-cell {
    border-radius: 11px;
    padding: 5px;
  }
}

  .rhythm-card,
  .journey-card,
  .sessions-card {
    padding: 18px;
    border-radius: 26px;
  }

  .week-row,
  .heatmap {
    gap: 6px;
  }

  .heat-cell {
    border-radius: 11px;
    padding: 5px;
  }

  .card-top h2,
  .sessions-top h2,
  .journey-card h2 {
    font-size: 2.05rem;
  }

  .selected-total {
    min-width: 62px;
    padding: 9px 10px;
  }
}
          .content {
            padding-left: 14px;
            padding-right: 14px;
          }

          .rhythm-card,
          .journey-card,
          .sessions-card {
            padding: 18px;
            border-radius: 26px;
          }

          .week-row,
          .heatmap {
            gap: 6px;
          }

          .heat-cell {
            border-radius: 11px;
            padding: 5px;
          }

          .card-top h2,
          .sessions-top h2,
          .journey-card h2 {
            font-size: 2.05rem;
          }

          .selected-total {
            min-width: 62px;
            padding: 9px 10px;
          }
        }
      `}</style>
    </main>
  );
}

function groupSessionsByDate(sessions: StudySession[]) {
  const groups: Record<string, StudySession[]> = {};

  sessions.forEach((session) => {
    const date = new Date(session.completed_at).toISOString().split("T")[0];

    if (!groups[date]) {
      groups[date] = [];
    }

    groups[date].push(session);
  });

  return groups;
}

function getMonthlyStats(sessions: StudySession[]) {
  const statsByDate: Record<string, { minutes: number; sessions: number }> = {};

  sessions.forEach((session) => {
    const date = new Date(session.completed_at).toISOString().split("T")[0];

    if (!statsByDate[date]) {
      statsByDate[date] = { minutes: 0, sessions: 0 };
    }

    statsByDate[date].minutes += session.duration_minutes;
    statsByDate[date].sessions += 1;
  });

  return statsByDate;
}

function getCurrentMonthDays() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();

  const days: Date[] = [];

  for (let day = 1; day <= lastDay; day++) {
    days.push(new Date(year, month, day));
  }

  return days;
}

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function formatDate(date: Date) {
  return date.toISOString().split("T")[0];
}

function formatShortDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatDateLabel(dateString: string) {
  const today = new Date();
  const date = new Date(dateString + "T00:00:00");
  const todayString = today.toISOString().split("T")[0];

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayString = yesterday.toISOString().split("T")[0];

  if (dateString === todayString) return "Today";
  if (dateString === yesterdayString) return "Yesterday";

  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });
}

function formatTime(dateString: string) {
  return new Date(dateString).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatScene(scene?: string | null) {
  if (!scene) return "Focus";

  const value = scene.toLowerCase();

  if (value.includes("library")) return "Library";
  if (value.includes("forest")) return "Forest";
  if (value.includes("rain")) return "Rain";
  if (value.includes("star")) return "Stars";

  return scene;
}

function getSceneIcon(scene?: string | null) {
  const label = formatScene(scene);

  if (label === "Library") return "📚";
  if (label === "Forest") return "🌲";
  if (label === "Rain") return "🌧️";
  if (label === "Stars") return "✨";

  return "🕯️";
}

function getHeatmapColor(minutes: number) {
  if (minutes >= 120) {
    return {
      background: "rgba(151, 103, 55, 0.82)",
      border: "1px solid rgba(218, 174, 108, 0.32)",
    };
  }

  if (minutes >= 90) {
    return {
      background: "rgba(213, 169, 102, 0.78)",
      border: "1px solid rgba(241, 213, 166, 0.34)",
    };
  }

  if (minutes > 0) {
    return {
      background: "rgba(241, 232, 218, 0.68)",
      border: "1px solid rgba(241, 232, 218, 0.3)",
    };
  }

  return {
    background: "rgba(255,255,255,0.045)",
    border: "1px solid rgba(241,232,218,0.08)",
  };
}