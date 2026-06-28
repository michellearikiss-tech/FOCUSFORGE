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
      .limit(120);

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
          <p className="label">FocusForge Journal</p>

          <nav className="nav">
            <a href="/">Home</a>
            <a href="/forge">Forge</a>
            <a href="/calendar">Calendar</a>
          </nav>
        </header>

        <section className="desktop-journey journey-card glass">
          <div className="journey-text">
            <p className="small-caps">Your Journey</p>
            <h1>Your Journey</h1>
            <p>You are not starting over. You are continuing the story.</p>
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
              <span>Focus Days</span>
            </div>
          </div>
        </section>

        <section className="main-grid">
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
              {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
                <span key={`${day}-${index}`}>{day}</span>
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
              <i style={getHeatmapColor(95)} />
              <i style={getHeatmapColor(130)} />
              <span>More</span>
            </div>
          </section>

          <section className="mobile-journey journey-card glass">
            <div className="journey-text">
              <p className="small-caps">Your Journey</p>
              <h1>Your Journey</h1>
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

                {selectedDate === getToday() && (
                  <a href="/check-in">Begin Today</a>
                )}
              </div>
            ) : (
              <div className="session-list">
                {selectedSessions.map((session) => (
                  <article key={session.id} className="session-row">
                    <div className="session-main">
                      <p className="scene">
                        {getSceneIcon(session.scene || session.space)}{" "}
                        {formatScene(session.scene || session.space)}
                      </p>

                      <h3>{session.task_name || "Deep Work Session"}</h3>

                      <span>{formatTime(session.completed_at)}</span>
                    </div>

                    <p className="duration">{session.duration_minutes}m</p>
                  </article>
                ))}
              </div>
            )}
          </section>
        </section>
      </div>

      <style jsx>{`
        .history-page {
          position: relative;
          min-height: 100vh;
          overflow-x: hidden;
          color: rgba(241, 232, 218, 0.9);
          font-family: Cormorant Garamond, Georgia, serif;
        }

        .background {
          position: fixed;
          inset: 0;
          background-size: cover;
          background-position: center;
          filter: blur(1.4px);
          transform: scale(1.018);
        }

        .overlay {
          position: fixed;
          inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(0, 0, 0, 0.42),
            rgba(0, 0, 0, 0.52),
            rgba(0, 0, 0, 0.66)
          );
        }

        .content {
          position: relative;
          z-index: 10;
          width: min(1120px, calc(100% - 44px));
          margin: 0 auto;
          padding: 34px 0 72px;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 26px;
        }

        .label,
        .small-caps {
          margin: 0;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          font-size: 11px;
          color: rgba(241, 232, 218, 0.46);
        }

        .nav {
          display: flex;
          gap: 22px;
        }

        .nav a {
          color: rgba(241, 232, 218, 0.64);
          text-decoration: none;
          font-size: 15px;
        }

        .glass {
          border: 1px solid rgba(241, 232, 218, 0.15);
          background: rgba(10, 8, 6, 0.31);
          backdrop-filter: blur(16px);
          box-shadow: 0 24px 70px rgba(0, 0, 0, 0.22);
        }

        .journey-card {
          border-radius: 30px;
          padding: 24px 28px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 24px;
          margin-bottom: 22px;
        }

        .journey-text h1 {
          margin: 8px 0 8px;
          font-size: clamp(2.15rem, 4vw, 3.55rem);
          line-height: 0.95;
          font-weight: 300;
          color: rgba(241, 232, 218, 0.92);
        }

        .journey-text p:last-child {
          margin: 0;
          font-size: 1.15rem;
          font-style: italic;
          color: rgba(241, 232, 218, 0.62);
        }

        .summary {
          display: flex;
          gap: 12px;
          flex-shrink: 0;
        }

        .summary div {
          min-width: 92px;
          border: 1px solid rgba(241, 232, 218, 0.12);
          border-radius: 21px;
          background: rgba(255, 255, 255, 0.04);
          padding: 13px 14px;
          text-align: center;
        }

        .summary strong {
          display: block;
          font-size: 1.55rem;
          line-height: 1;
          font-weight: 300;
          color: rgba(241, 232, 218, 0.88);
        }

        .summary span {
          display: block;
          margin-top: 7px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          font-size: 10px;
          color: rgba(241, 232, 218, 0.42);
        }

        .main-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.08fr) minmax(320px, 0.92fr);
          gap: 22px;
          align-items: start;
        }

        .rhythm-card,
        .sessions-card {
          border-radius: 30px;
          padding: 24px;
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
        .sessions-top h2 {
          margin: 8px 0 0;
          font-size: clamp(2rem, 3.4vw, 3.25rem);
          line-height: 0.95;
          font-weight: 300;
          color: rgba(241, 232, 218, 0.92);
        }

        .hint {
          margin: 8px 0 0;
          font-size: 14px;
          font-style: italic;
          color: rgba(241, 232, 218, 0.48);
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
          font-size: 11px;
          color: rgba(241, 232, 218, 0.35);
        }

        .heatmap {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 8px;
        }

        .heat-cell {
          position: relative;
          aspect-ratio: 1 / 1;
          border-radius: 15px;
          cursor: pointer;
          color: rgba(241, 232, 218, 0.86);
          font-family: inherit;
          padding: 8px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: flex-start;
          transition: transform 0.18s ease, box-shadow 0.18s ease,
            border-color 0.18s ease;
        }

        .heat-cell:hover {
          transform: translateY(-2px);
        }

        .heat-cell.today {
          outline: 1px solid rgba(241, 232, 218, 0.58);
          outline-offset: 3px;
        }

        .heat-cell.selected {
          box-shadow: 0 0 0 2px rgba(241, 232, 218, 0.76),
            0 16px 32px rgba(0, 0, 0, 0.18);
        }

        .day-number {
          font-size: 14px;
        }

        .day-minutes {
          align-self: flex-end;
          font-size: 11px;
          color: rgba(241, 232, 218, 0.62);
        }

        .tooltip {
          position: absolute;
          left: 50%;
          bottom: calc(100% + 10px);
          transform: translateX(-50%);
          z-index: 50;
          min-width: 124px;
          border-radius: 13px;
          border: 1px solid rgba(241, 232, 218, 0.18);
          background: rgba(12, 10, 8, 0.94);
          padding: 9px 10px;
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.28);
          pointer-events: none;
          text-align: center;
        }

        .tooltip p {
          margin: 0 0 4px;
          font-size: 14px;
          color: rgba(241, 232, 218, 0.88);
        }

        .tooltip span {
          display: block;
          font-size: 11px;
          color: rgba(241, 232, 218, 0.56);
        }

        .legend {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 7px;
          margin-top: 16px;
          color: rgba(241, 232, 218, 0.42);
          font-size: 11px;
        }

        .legend i {
          width: 13px;
          height: 13px;
          display: inline-block;
          border-radius: 4px;
        }

        .sessions-card {
          min-height: 100%;
        }

        .selected-total {
          border: 1px solid rgba(241, 232, 218, 0.12);
          border-radius: 19px;
          background: rgba(255, 255, 255, 0.04);
          padding: 11px 14px;
          min-width: 72px;
          text-align: center;
        }

        .selected-total strong {
          display: block;
          font-size: 1.4rem;
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
          gap: 9px;
        }

        .session-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 14px;
          border: 1px solid rgba(241, 232, 218, 0.1);
          background: rgba(255, 255, 255, 0.04);
          border-radius: 17px;
          padding: 10px 13px;
        }

        .session-main {
          min-width: 0;
        }

        .scene {
          margin: 0 0 3px;
          font-size: 12px;
          color: rgba(241, 232, 218, 0.48);
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
          max-width: 240px;
        }

        .session-row span {
          display: block;
          margin-top: 3px;
          font-size: 12px;
          color: rgba(241, 232, 218, 0.42);
        }

        .duration {
          margin: 0;
          font-size: 14px;
          color: rgba(241, 232, 218, 0.66);
          white-space: nowrap;
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

        .mobile-journey {
          display: none;
        }

        @media (max-width: 900px) {
          .content {
            width: min(100% - 28px, 580px);
            padding: 24px 0 60px;
          }

          .header {
            flex-direction: column;
            gap: 14px;
            margin-bottom: 18px;
          }

          .nav {
            gap: 16px;
          }

          .desktop-journey {
            display: none;
          }

          .mobile-journey {
            display: flex;
            margin: 16px 0 0;
          }

          .main-grid {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .rhythm-card {
            order: 1;
          }

          .mobile-journey {
            order: 2;
          }

          .sessions-card {
            order: 3;
          }

          .rhythm-card,
          .sessions-card,
          .journey-card {
            border-radius: 24px;
            padding: 17px;
          }

          .card-top,
          .sessions-top {
            margin-bottom: 14px;
          }

          .card-top {
            flex-direction: column;
            gap: 4px;
          }

          .hint {
            text-align: left;
          }

          .card-top h2,
          .sessions-top h2 {
            font-size: 2.25rem;
          }

          .journey-card {
            align-items: flex-start;
            flex-direction: column;
            gap: 16px;
          }

          .journey-text h1 {
            font-size: 2.25rem;
          }

          .journey-text p:last-child {
            font-size: 1rem;
          }

          .summary {
            width: 100%;
            gap: 8px;
          }

          .summary div {
            flex: 1;
            min-width: 0;
            padding: 10px 8px;
            border-radius: 17px;
          }

          .summary strong {
            font-size: 1.25rem;
          }

          .heatmap {
            gap: 6px;
          }

          .week-row {
            gap: 6px;
          }

          .heat-cell {
            border-radius: 11px;
            padding: 6px;
          }

          .day-number {
            font-size: 12px;
          }

          .day-minutes {
            font-size: 9px;
          }

          .tooltip {
            display: none;
          }

          .session-row {
            padding: 9px 11px;
            border-radius: 15px;
          }

          .session-row h3 {
            font-size: 0.95rem;
            max-width: 210px;
          }
        }

        @media (max-width: 420px) {
          .content {
            width: min(100% - 22px, 420px);
          }

          .nav a {
            font-size: 14px;
          }

          .card-top h2,
          .sessions-top h2 {
            font-size: 2rem;
          }

          .heatmap {
            gap: 5px;
          }

          .week-row {
            gap: 5px;
          }

          .heat-cell {
            border-radius: 9px;
            padding: 5px;
          }

          .day-minutes {
            display: none;
          }

          .selected-total {
            min-width: 62px;
            padding: 9px 10px;
          }

          .session-row h3 {
            max-width: 170px;
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