"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";

type StudySession = {
  id: string;
  user_id: string;
  task_name: string | null;
  duration_minutes: number;
  completed_at: string;
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
      .limit(80);

    if (error) {
      console.error("Load sessions error:", error);
      alert("Failed to load history.");
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
  const todaySessions = groupedSessions[getToday()] || [];
  const todayMinutes = todaySessions.reduce(
    (sum, session) => sum + session.duration_minutes,
    0
  );

  return (
    <main style={pageStyle}>
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage: `url('${background}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(1.4px)",
          transform: "scale(1.018)",
        }}
      />

      <div
        style={{
          position: "fixed",
          inset: 0,
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.42), rgba(0,0,0,0.5), rgba(0,0,0,0.64))",
        }}
      />

      <div style={contentWrapStyle}>
        <header style={headerStyle}>
          <p style={labelStyle}>FocusForge Journal</p>

          <nav style={navStyle}>
            <a href="/" style={linkStyle}>
              Home
            </a>
            <a href="/forge" style={linkStyle}>
              Forge
            </a>
            <a href="/calendar" style={linkStyle}>
              Calendar
            </a>
          </nav>
        </header>

        <section style={threeColumnStyle}>
          <section style={journeyCardStyle}>
            <h1 style={titleStyle}>Your Journey</h1>

            <p style={quoteStyle}>
              You are not starting over.
              <br />
              You are continuing the story.
            </p>

            <div style={summaryStyle}>
              <div>
                <p style={summaryNumberStyle}>{sessions.length}</p>
                <p style={summaryLabelStyle}>Sessions</p>
              </div>

              <div style={summaryDividerStyle} />

              <div>
                <p style={summaryNumberStyle}>{totalMinutes}</p>
                <p style={summaryLabelStyle}>Minutes Focused</p>
              </div>
            </div>
          </section>

          <aside style={rhythmCardStyle}>
            <p style={smallCapsStyle}>Monthly Rhythm</p>

            <h2 style={rhythmTitleStyle}>
              {new Date().toLocaleString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </h2>

            <p style={rhythmHintStyle}>
              Every square is a page you wrote.
            </p>

            <div style={heatmapGridStyle}>
              {monthlyDays.map((day) => {
                const dateString = formatDate(day);
                const stats = monthlyStats[dateString] || {
                  minutes: 0,
                  sessions: 0,
                };
                const isToday = dateString === getToday();
                const isHovered = hoveredDay === dateString;

                return (
                  <div
                    key={dateString}
                    onMouseEnter={() => setHoveredDay(dateString)}
                    onMouseLeave={() => setHoveredDay(null)}
                    style={{ position: "relative" }}
                  >
                    <div
                      style={{
                        ...heatmapCellStyle,
                        ...getHeatmapColor(stats.minutes),
                        ...(isToday ? todayHeatmapCellStyle : {}),
                      }}
                    />

                    {isHovered && (
                      <div style={tooltipStyle}>
                        <p style={tooltipDateStyle}>{formatShortDate(day)}</p>
                        <p style={tooltipTextStyle}>{stats.minutes} minutes</p>
                        <p style={tooltipTextStyle}>
                          {stats.sessions}{" "}
                          {stats.sessions === 1 ? "session" : "sessions"}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={legendStyle}>
              <span style={legendTextStyle}>Less</span>
              <span style={{ ...legendBoxStyle, ...getHeatmapColor(0) }} />
              <span style={{ ...legendBoxStyle, ...getHeatmapColor(30) }} />
              <span style={{ ...legendBoxStyle, ...getHeatmapColor(95) }} />
              <span style={{ ...legendBoxStyle, ...getHeatmapColor(130) }} />
              <span style={legendTextStyle}>More</span>
            </div>

            <div style={rhythmRuleStyle}>
              <p style={ruleTextStyle}>Cream: studied</p>
              <p style={ruleTextStyle}>Gold: 90+ min</p>
              <p style={ruleTextStyle}>Deep gold: 120+ min</p>
            </div>
          </aside>

          <section style={todayCardStyle}>
            <div style={todayHeaderStyle}>
              <div>
                <p style={smallCapsStyle}>Today</p>
                <h2 style={todayTitleStyle}>Study Log</h2>
              </div>

              <p style={todayMinutesStyle}>{todayMinutes} min</p>
            </div>

            <p style={todayLineStyle}>
              {todaySessions.length > 0
                ? "You showed up today."
                : "No page written yet today."}
            </p>

            <div style={todayListStyle}>
              {loading ? (
                <p style={mutedStyle}>Loading...</p>
              ) : todaySessions.length === 0 ? (
                <a href="/check-in" style={buttonStyle}>
                  Begin Today
                </a>
              ) : (
                todaySessions.map((session) => (
                  <div key={session.id} style={sessionCardStyle}>
                    <div>
                      <p style={sessionTitleStyle}>
                        {session.task_name || "Deep Work Session"}
                      </p>
                      <p style={sessionMetaStyle}>
                        {formatTime(session.completed_at)} · focused
                      </p>
                    </div>

                    <p style={durationStyle}>{session.duration_minutes} min</p>
                  </div>
                ))
              )}
            </div>
          </section>
        </section>

        <section style={pastJournalStyle}>
          {loading ? (
            <p style={mutedStyle}>Loading your journey...</p>
          ) : sessions.length === 0 ? null : (
            Object.entries(groupedSessions)
              .filter(([date]) => date !== getToday())
              .map(([date, daySessions], index) => {
                const dayMinutes = daySessions.reduce(
                  (sum, session) => sum + session.duration_minutes,
                  0
                );

                return (
                  <article key={date} style={dayEntryStyle}>
                    <div style={dayHeaderStyle}>
                      <div>
                        <p style={dateStyle}>{formatDateLabel(date)}</p>
                        <p style={dayLineStyle}>{getEntryLine(index + 1)}</p>
                      </div>

                      <p style={dayMinutesStyle}>{dayMinutes} min</p>
                    </div>

                    <div style={sessionListStyle}>
                      {daySessions.map((session) => (
                        <div key={session.id} style={sessionCardStyle}>
                          <div>
                            <p style={sessionTitleStyle}>
                              {session.task_name || "Deep Work Session"}
                            </p>
                            <p style={sessionMetaStyle}>
                              {formatTime(session.completed_at)} · focused
                            </p>
                          </div>

                          <p style={durationStyle}>
                            {session.duration_minutes} min
                          </p>
                        </div>
                      ))}
                    </div>
                  </article>
                );
              })
          )}
        </section>
      </div>
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

function getEntryLine(index: number) {
  const lines = [
    "You showed up.",
    "A quiet step still counts.",
    "Momentum is built quietly.",
    "The chain stayed alive.",
    "You returned to yourself.",
    "Another page in your journey.",
  ];

  return lines[index % lines.length];
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

const pageStyle = {
  position: "relative" as const,
  minHeight: "100vh",
  overflowX: "hidden" as const,
  overflowY: "auto" as const,
  color: "rgba(241,232,218,0.9)",
  fontFamily: "Cormorant Garamond, Georgia, serif",
};

const contentWrapStyle = {
  position: "relative" as const,
  zIndex: 10,
  minHeight: "100vh",
  padding: "38px 52px 90px",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: "34px",
};

const labelStyle = {
  margin: 0,
  letterSpacing: "0.32em",
  textTransform: "uppercase" as const,
  fontSize: "12px",
  color: "rgba(241,232,218,0.42)",
};

const navStyle = {
  display: "flex",
  gap: "18px",
};

const linkStyle = {
  color: "rgba(241,232,218,0.62)",
  textDecoration: "none",
  fontSize: "15px",
};

const threeColumnStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 420px 1fr",
  gap: "28px",
  alignItems: "stretch",
  maxWidth: "1420px",
  marginBottom: "28px",
};

const glassCardStyle = {
  borderRadius: "28px",
  border: "1px solid rgba(241,232,218,0.15)",
  background: "rgba(10,8,6,0.3)",
  backdropFilter: "blur(14px)",
  padding: "26px",
};

const journeyCardStyle = {
  ...glassCardStyle,
  minHeight: "390px",
};

const titleStyle = {
  margin: "0 0 26px",
  fontSize: "clamp(2.2rem,3.5vw,3.7rem)",
  fontWeight: 300,
  lineHeight: 1,
  color: "rgba(241,232,218,0.9)",
};

const quoteStyle = {
  margin: 0,
  fontSize: "clamp(1.05rem,1.7vw,1.55rem)",
  lineHeight: 1.45,
  color: "rgba(241,232,218,0.72)",
  fontStyle: "italic",
};

const summaryStyle = {
  marginTop: "28px",
  display: "inline-flex",
  alignItems: "center",
  gap: "24px",
  border: "1px solid rgba(241,232,218,0.14)",
  borderRadius: "22px",
  padding: "15px 24px",
  background: "rgba(255,255,255,0.035)",
};

const summaryNumberStyle = {
  margin: 0,
  fontSize: "2rem",
  lineHeight: 1,
  color: "rgba(241,232,218,0.88)",
};

const summaryLabelStyle = {
  margin: "7px 0 0",
  letterSpacing: "0.16em",
  textTransform: "uppercase" as const,
  fontSize: "10px",
  color: "rgba(241,232,218,0.42)",
};

const summaryDividerStyle = {
  width: "1px",
  height: "38px",
  background: "rgba(241,232,218,0.14)",
};

const rhythmCardStyle = {
  ...glassCardStyle,
  minHeight: "390px",
};

const smallCapsStyle = {
  margin: 0,
  letterSpacing: "0.22em",
  textTransform: "uppercase" as const,
  fontSize: "11px",
  color: "rgba(241,232,218,0.42)",
};

const rhythmTitleStyle = {
  margin: "8px 0 0",
  fontSize: "1.9rem",
  fontWeight: 300,
  color: "rgba(241,232,218,0.88)",
};

const rhythmHintStyle = {
  margin: "8px 0 22px",
  fontSize: "13px",
  color: "rgba(241,232,218,0.44)",
};

const heatmapGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(7, 34px)",
  gap: "8px",
};

const heatmapCellStyle = {
  width: "34px",
  height: "34px",
  borderRadius: "9px",
};

const todayHeatmapCellStyle = {
  outline: "1px solid rgba(241,232,218,0.68)",
  outlineOffset: "3px",
};

const legendStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: "7px",
  marginTop: "18px",
};

const legendTextStyle = {
  fontSize: "11px",
  color: "rgba(241,232,218,0.4)",
};

const legendBoxStyle = {
  width: "13px",
  height: "13px",
  borderRadius: "4px",
};

const rhythmRuleStyle = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap" as const,
  marginTop: "16px",
};

const ruleTextStyle = {
  margin: 0,
  fontSize: "12px",
  color: "rgba(241,232,218,0.44)",
};

const todayCardStyle = {
  ...glassCardStyle,
  minHeight: "390px",
  maxHeight: "470px",
  overflowY: "auto" as const,
};

const todayHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "18px",
  alignItems: "flex-start",
};

const todayTitleStyle = {
  margin: "8px 0 0",
  fontSize: "2rem",
  fontWeight: 300,
};

const todayMinutesStyle = {
  margin: 0,
  color: "rgba(241,232,218,0.58)",
  fontSize: "15px",
};

const todayLineStyle = {
  margin: "18px 0",
  fontStyle: "italic",
  color: "rgba(241,232,218,0.54)",
};

const todayListStyle = {
  display: "grid",
  gap: "10px",
};

const tooltipStyle = {
  position: "absolute" as const,
  left: "50%",
  bottom: "44px",
  transform: "translateX(-50%)",
  zIndex: 50,
  minWidth: "130px",
  borderRadius: "13px",
  border: "1px solid rgba(241,232,218,0.18)",
  background: "rgba(12,10,8,0.92)",
  backdropFilter: "blur(12px)",
  padding: "9px 10px",
  boxShadow: "0 16px 40px rgba(0,0,0,0.28)",
  pointerEvents: "none" as const,
  textAlign: "center" as const,
};

const tooltipDateStyle = {
  margin: 0,
  fontSize: "14px",
  color: "rgba(241,232,218,0.88)",
};

const tooltipTextStyle = {
  margin: "4px 0 0",
  fontSize: "11px",
  color: "rgba(241,232,218,0.52)",
};

const pastJournalStyle = {
  maxWidth: "920px",
  display: "grid",
  gap: "16px",
};

const dayEntryStyle = {
  borderRadius: "26px",
  border: "1px solid rgba(241,232,218,0.14)",
  background: "rgba(10,8,6,0.3)",
  backdropFilter: "blur(14px)",
  padding: "22px 24px",
};

const dayHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "20px",
  alignItems: "flex-start",
  marginBottom: "14px",
};

const dateStyle = {
  margin: 0,
  fontSize: "1.55rem",
  color: "rgba(241,232,218,0.9)",
};

const dayLineStyle = {
  margin: "5px 0 0",
  fontSize: "0.95rem",
  fontStyle: "italic",
  color: "rgba(241,232,218,0.52)",
};

const dayMinutesStyle = {
  margin: "6px 0 0",
  color: "rgba(241,232,218,0.56)",
  fontSize: "14px",
  whiteSpace: "nowrap" as const,
};

const sessionListStyle = {
  display: "grid",
  gap: "10px",
};

const sessionCardStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "18px",
  borderRadius: "17px",
  border: "1px solid rgba(241,232,218,0.1)",
  background: "rgba(255,255,255,0.04)",
  padding: "13px 15px",
};

const sessionTitleStyle = {
  margin: 0,
  fontSize: "1.08rem",
  color: "rgba(241,232,218,0.86)",
};

const sessionMetaStyle = {
  margin: "4px 0 0",
  fontSize: "12px",
  color: "rgba(241,232,218,0.42)",
};

const durationStyle = {
  margin: 0,
  fontSize: "14px",
  color: "rgba(241,232,218,0.62)",
  whiteSpace: "nowrap" as const,
};

const mutedStyle = {
  color: "rgba(241,232,218,0.52)",
};

const buttonStyle = {
  display: "inline-block",
  marginTop: "8px",
  borderRadius: "999px",
  border: "1px solid rgba(241,232,218,0.28)",
  padding: "12px 24px",
  color: "rgba(241,232,218,0.82)",
  textDecoration: "none",
};