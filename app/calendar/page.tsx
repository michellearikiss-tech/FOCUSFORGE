"use client";

import { useEffect, useState } from "react";

type CalendarEvent = {
  id: string;
  user_id: string;
  title: string;
  event_date: string;
  event_time: string | null;
  event_type: string | null;
  notes: string | null;
};

type StudySession = {
  id: string;
  user_id: string;
  task_name: string | null;
  duration_minutes: number;
  completed_at: string;
};

type DailyReflection = {
  id: string;
  user_id: string;
  entry_date: string;
  mood: string | null;
  note: string | null;
};

const moods = [
  { label: "Calm", emoji: "🌙" },
  { label: "Tired", emoji: "☁️" },
  { label: "Anxious", emoji: "🌧️" },
  { label: "Motivated", emoji: "✨" },
  { label: "Proud", emoji: "🌿" },
  { label: "Overwhelmed", emoji: "🌊" },
];

function getPageBackground() {
  const hour = new Date().getHours();
  return hour >= 18 || hour < 6 ? "/reading-night.png" : "/library-study.png";
}

export default function CalendarPage() {}
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [reflections, setReflections] = useState<DailyReflection[]>([]);
  const [userId, setUserId] = useState("");
  const [background, setBackground] = useState("/library-study.png");
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const [selectedDate, setSelectedDate] = useState(getToday());
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const [title, setTitle] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventType, setEventType] = useState("test");
  const [notes, setNotes] = useState("");

  const [selectedMood, setSelectedMood] = useState("");
  const [journalNote, setJournalNote] = useState("");

  useEffect(() => {
    setBackground(getPageBackground());
    loadData();

    function handleResize() {
      setIsMobile(window.innerWidth <= 760);
    }

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    const reflection = reflections.find(
      (item) => item.entry_date === selectedDate
    );

    setSelectedMood(reflection?.mood || "");
    setJournalNote(reflection?.note || "");
  }, [selectedDate, reflections]);

  async function loadData() {
    const { supabase } = await import("@/utils/supabase/client");

    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      window.location.href = "/login";
      return;
    }

    setUserId(data.user.id);

    const { data: eventData } = await supabase
      .from("events")
      .select("*")
      .eq("user_id", data.user.id)
      .order("event_date", { ascending: true });

    const { data: sessionData } = await supabase
      .from("study_sessions")
      .select("*")
      .eq("user_id", data.user.id)
      .order("completed_at", { ascending: false });

    const { data: reflectionData } = await supabase
      .from("daily_reflections")
      .select("*")
      .eq("user_id", data.user.id);

    setEvents(eventData || []);
    setSessions(sessionData || []);
    setReflections(reflectionData || []);

    async function addEvent() {
      const { supabase } = await import("@/utils/supabase/client");
  
      if (!title.trim() || !userId) return;
  
      const { data, error } = await supabase
        .from("events")
        .insert({
          user_id: userId,
          title: title.trim(),
          event_date: selectedDate,
          event_time: eventTime || null,
          event_type: eventType,
          notes: notes || null,
        })
        .select()
        .single();
  
      if (error) {
        console.error(error);
        alert("Failed to add event.");
        return;
      }
  
      setEvents((prev) => [...prev, data]);
      setTitle("");
      setEventTime("");
      setEventType("test");
      setNotes("");
    }
  
    async function deleteEvent(id: string) {
      const { supabase } = await import("@/utils/supabase/client");
  
      const { error } = await supabase.from("events").delete().eq("id", id);
  
      if (error) {
        console.error(error);
        alert("Failed to delete event.");
        return;
      }
  
      setEvents((prev) => prev.filter((event) => event.id !== id));
    }
  
    async function saveReflection() {
      const { supabase } = await import("@/utils/supabase/client");
  
      if (!userId) return;
  
      const { data, error } = await supabase
        .from("daily_reflections")
        .upsert(
          {
            user_id: userId,
            entry_date: selectedDate,
            mood: selectedMood || null,
            note: journalNote || null,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id,entry_date",
          }
        )
        .select()
        .single();
  
      if (error) {
        console.error(error);
        alert("Failed to save journal.");
        return;
      }
  
      setReflections((prev) => {
        const exists = prev.some((item) => item.entry_date === selectedDate);
  
        if (exists) {
          return prev.map((item) =>
            item.entry_date === selectedDate ? data : item
          );
        }
  
        return [...prev, data];
      });
    }
  
    function goToPreviousMonth() {
      setCurrentMonth((prev) => {
        return new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
      });
    }
  
    function goToNextMonth() {
      setCurrentMonth((prev) => {
        return new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
      });
    }
  
    const selectedEvents = events.filter(
      (event) => event.event_date === selectedDate
    );
  
    const monthDays = getMonthDays(currentMonth);
  
    const futureEvents = events
      .filter((event) => getDaysNumber(event.event_date) >= 0)
      .sort(
        (a, b) =>
          new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
      );
  
    const highlightEvents = futureEvents.filter(
      (event) => event.event_type === "test" || event.event_type === "deadline"
    );
  
    const nextBigEvent = highlightEvents[0];
    const laterEvents = highlightEvents.slice(1, 4);
  
    const countdownSection = (
      <aside style={isMobile ? mobileCountdownCardStyle : countdownCardStyle}>
        <div style={countdownHeaderRowStyle}>
          <div>
            <p style={smallCapsStyle}>Coming Up</p>
            <h2 style={isMobile ? mobileCountdownTitleStyle : sideTitleStyle}>
              Countdown
            </h2>
          </div>
        </div>
  
        {!nextBigEvent ? (
          <p style={mutedStyle}>No upcoming tests or deadlines.</p>
        ) : (
          <div style={isMobile ? mobileCountdownCompactStyle : undefined}>
            <div style={isMobile ? mobileHeroEventStyle : heroEventStyle}>
              <div style={{ minWidth: 0 }}>
                <p style={smallCapsStyle}>Next</p>
  
                <h3
                  style={
                    isMobile ? mobileHeroEventTitleStyle : heroEventTitleStyle
                  }
                >
                  {nextBigEvent.title}
                </h3>
  
                <p
                  style={
                    isMobile ? mobileHeroCountdownStyle : heroCountdownStyle
                  }
                >
                  {getDaysLeft(nextBigEvent.event_date)}
                </p>
  
                <p style={mutedStyle}>
                  {formatPrettyDate(nextBigEvent.event_date)}
                  {nextBigEvent.event_time
                    ? ` · ${nextBigEvent.event_time}`
                    : ""}
                </p>
              </div>
  
              <span
                style={{
                  ...typePillStyle,
                  background: getEventColor(nextBigEvent.event_type),
                }}
              >
                {nextBigEvent.event_type}
              </span>
            </div>
  
            {laterEvents.length > 0 && (
              <div style={isMobile ? mobileTimelineStyle : timelineStyle}>
                {!isMobile && <p style={smallCapsStyle}>Later</p>}
  
                {laterEvents.map((event) => (
                  <div
                    key={event.id}
                    style={
                      isMobile ? mobileTimelineItemStyle : timelineItemStyle
                    }
                  >
                    <div style={{ minWidth: 0 }}>
                      <p style={timelineTitleStyle}>{event.title}</p>
                      <p style={mutedStyle}>
                        {formatPrettyDate(event.event_date)}
                      </p>
                    </div>
  
                    <p
                      style={
                        isMobile
                          ? mobileTimelineCountdownStyle
                          : timelineCountdownStyle
                      }
                    >
                      {getDaysLeft(event.event_date)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </aside>
    );
    const calendarSection = (
      <section style={calendarCardStyle}>
        <div style={monthHeaderStyle}>
          <button onClick={goToPreviousMonth} style={monthButtonStyle}>
            ←
          </button>
  
          <h2 style={monthTitleStyle}>
            {currentMonth.toLocaleString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </h2>
  
          <button onClick={goToNextMonth} style={monthButtonStyle}>
            →
          </button>
        </div>
  
        <div style={weekGridStyle}>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <p key={day} style={weekDayStyle}>
              {day}
            </p>
          ))}
        </div>
  
        <div style={monthGridStyle}>
          {monthDays.map((day, index) => {
            if (!day) {
              return (
                <div
                  key={`empty-${index}`}
                  style={isMobile ? mobileEmptyDayStyle : emptyDayStyle}
                />
              );
            }
  
            const dateString = formatDate(day);
            const dayEvents = events.filter(
              (event) => event.event_date === dateString
            );
            const isSelected = selectedDate === dateString;
            const isToday = getToday() === dateString;
            const focusInfo = getFocusInfo(dateString, sessions);
            const reflection = reflections.find(
              (item) => item.entry_date === dateString
            );
            const isHovered = hoveredDate === dateString;
            const mood = getMood(reflection?.mood || "");
  
            return (
              <button
                key={dateString}
                onMouseEnter={() => setHoveredDate(dateString)}
                onMouseLeave={() => setHoveredDate(null)}
                onClick={() => setSelectedDate(dateString)}
                style={{
                  ...(isMobile ? mobileDayCellStyle : dayCellStyle),
                  ...(isSelected ? selectedDayCellStyle : {}),
                  ...(isToday ? todayCellStyle : {}),
                }}
              >
                <div style={dayTopRowStyle}>
                  <span style={isMobile ? mobileDayNumberStyle : dayNumberStyle}>
                    {day.getDate()}
                  </span>
  
                  {mood && (
                    <span style={isMobile ? mobileMoodEmojiStyle : moodEmojiStyle}>
                      {mood.emoji}
                    </span>
                  )}
                </div>
  
                <div style={dayEventsStyle}>
                  {focusInfo.minutes > 0 && (
                    <div style={isMobile ? mobileFocusMiniStyle : focusMiniStyle}>
                      {isMobile
                        ? `${focusInfo.minutes}m`
                        : `${focusInfo.minutes} min focused`}
                    </div>
                  )}
  
                  {dayEvents.slice(0, isMobile ? 1 : 2).map((event) => (
                    <div
                      key={event.id}
                      style={{
                        ...(isMobile ? mobileMiniEventStyle : miniEventStyle),
                        background: getEventColor(event.event_type),
                      }}
                    >
                      {event.title}
                    </div>
                  ))}
  
                  {dayEvents.length > (isMobile ? 1 : 2) && (
                    <p style={moreEventsStyle}>
                      +{dayEvents.length - (isMobile ? 1 : 2)} more
                    </p>
                  )}
                </div>
  
                {!isMobile && isHovered && (
                  <div style={calendarTooltipStyle}>
                    <p style={tooltipTitleStyle}>{formatPrettyDate(dateString)}</p>
                    <p style={tooltipTextStyle}>Focus: {focusInfo.minutes} min</p>
                    <p style={tooltipTextStyle}>Sessions: {focusInfo.sessions}</p>
                    <p style={tooltipTextStyle}>
                      Mood:{" "}
                      {mood ? `${mood.emoji} ${mood.label}` : "Not recorded"}
                    </p>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </section>
    );
  
    const selectedDaySection = (
      <section style={selectedCardStyle}>
        <p style={smallCapsStyle}>Selected Day</p>
        <h2 style={selectedDateStyle}>{formatPrettyDate(selectedDate)}</h2>
  
        <div style={isMobile ? mobileSelectedInnerGridStyle : selectedInnerGridStyle}>
          <div style={{ minWidth: 0 }}>
            {selectedEvents.length === 0 ? (
              <p style={mutedStyle}>No events on this day.</p>
            ) : (
              <div style={{ display: "grid", gap: "12px" }}>
                {selectedEvents.map((event) => (
                  <div
                    key={event.id}
                    style={isMobile ? mobileEventCardStyle : eventCardStyle}
                  >
                    <div style={{ minWidth: 0 }}>
                      <p style={eventTitleStyle}>{event.title}</p>
  
                      <p style={mutedStyle}>
                        {event.event_time || "All day"} · {event.event_type}
                      </p>
  
                      {event.notes && <p style={notesStyle}>{event.notes}</p>}
                    </div>
  
                    <button
                      onClick={() => deleteEvent(event.id)}
                      style={deleteButtonStyle}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
  
          <div style={isMobile ? mobileJournalBoxStyle : journalBoxStyle}>
            <p style={smallCapsStyle}>Daily Journal</p>
            <p style={journalPromptStyle}>How did this day feel?</p>
  
            <div style={isMobile ? mobileMoodGridStyle : moodGridStyle}>
              {moods.map((mood) => (
                <button
                  key={mood.label}
                  onClick={() => setSelectedMood(mood.label)}
                  style={{
                    ...(isMobile ? mobileMoodButtonStyle : moodButtonStyle),
                    ...(selectedMood === mood.label ? activeMoodButtonStyle : {}),
                  }}
                >
                  <span style={moodChoiceEmojiStyle}>{mood.emoji}</span>
                  <span>{mood.label}</span>
                </button>
              ))}
            </div>
  
            <textarea
              value={journalNote}
              onChange={(e) => setJournalNote(e.target.value)}
              placeholder="Write a few lines about today..."
              style={isMobile ? mobileJournalTextareaStyle : journalTextareaStyle}
            />
  
            <button onClick={saveReflection} style={buttonStyle}>
              Save Journal
            </button>
          </div>
        </div>
      </section>
    );
    const formSection = (
      <section style={isMobile ? mobileFormCardStyle : formCardStyle}>
        <p style={smallCapsStyle}>Add a Moment</p>
        <h2 style={isMobile ? mobileFormTitleStyle : sideTitleStyle}>New Event</h2>
  
        <label style={fieldLabelStyle}>Date</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          style={isMobile ? mobileInputStyle : inputStyle}
        />
  
        <label style={fieldLabelStyle}>Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Math test"
          style={isMobile ? mobileInputStyle : inputStyle}
        />
  
        <label style={fieldLabelStyle}>Time</label>
        <input
          value={eventTime}
          onChange={(e) => setEventTime(e.target.value)}
          placeholder="18:00"
          style={isMobile ? mobileInputStyle : inputStyle}
        />
  
        <label style={fieldLabelStyle}>Type</label>
        <select
          value={eventType}
          onChange={(e) => setEventType(e.target.value)}
          style={isMobile ? mobileInputStyle : inputStyle}
        >
          <option value="test">Test</option>
          <option value="deadline">Deadline</option>
          <option value="study">Study</option>
          <option value="event">Event</option>
        </select>
  
        <label style={fieldLabelStyle}>Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Unit 5 review"
          style={isMobile ? mobileTextareaStyle : textareaStyle}
        />
  
        <button onClick={addEvent} style={buttonStyle}>
          Save Event
        </button>
      </section>
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
  
        <div style={isMobile ? mobileContentWrapStyle : contentWrapStyle}>
          <header style={isMobile ? mobileHeaderStyle : headerStyle}>
            <div>
              <p style={labelStyle}>FocusForge Calendar</p>
              <h1 style={titleStyle}>Important Days</h1>
            </div>
  
            <nav style={isMobile ? mobileNavStyle : navStyle}>
              <a href="/" style={isMobile ? mobileLinkStyle : linkStyle}>
                Home
              </a>
              <a href="/forge" style={isMobile ? mobileLinkStyle : linkStyle}>
                Forge
              </a>
              <a href="/history" style={isMobile ? mobileLinkStyle : linkStyle}>
                History
              </a>
            </nav>
          </header>
  
          {isMobile ? (
            <section style={mobileStackStyle}>
              {countdownSection}
              {calendarSection}
              {selectedDaySection}
              {formSection}
            </section>
          ) : (
            <>
              <section style={topGridStyle}>
                {calendarSection}
                {countdownSection}
              </section>
  
              <section style={bottomGridStyle}>
                {formSection}
                {selectedDaySection}
              </section>
            </>
          )}
        </div>
      </main>
    );
  }
  
  function getToday() {
    return new Date().toISOString().split("T")[0];
  }
  
  function formatDate(date: Date) {
    return date.toISOString().split("T")[0];
  }
  
  function getMonthDays(month: Date) {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
  
    const firstDay = new Date(year, monthIndex, 1);
    const lastDay = new Date(year, monthIndex + 1, 0);
  
    const days: (Date | null)[] = [];
  
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }
  
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, monthIndex, day));
    }
  
    return days;
  }
  
  function getDaysNumber(dateString: string) {
    const today = new Date(getToday());
    const target = new Date(dateString + "T00:00:00");
  
    return Math.ceil(
      (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
  }
  
  function getDaysLeft(dateString: string) {
    const diff = getDaysNumber(dateString);
  
    if (diff === 0) return "Today";
    if (diff === 1) return "1 day left";
    return `${diff} days left`;
  }
  
  function formatPrettyDate(dateString: string) {
    return new Date(dateString + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
  
  function getFocusInfo(dateString: string, sessions: StudySession[]) {
    const daySessions = sessions.filter(
      (session) =>
        new Date(session.completed_at).toISOString().split("T")[0] === dateString
    );
  
    return {
      minutes: daySessions.reduce(
        (sum, session) => sum + session.duration_minutes,
        0
      ),
      sessions: daySessions.length,
    };
  }
  
  function getMood(label: string) {
    return moods.find((mood) => mood.label === label);
  }
  
  function getEventColor(type: string | null) {
    if (type === "test") return "rgba(120, 150, 255, 0.28)";
    if (type === "deadline") return "rgba(255, 135, 115, 0.26)";
    if (type === "study") return "rgba(241, 232, 218, 0.22)";
    if (type === "event") return "rgba(213, 169, 102, 0.3)";
    return "rgba(241,232,218,0.16)";
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
  
  const mobileContentWrapStyle = {
    position: "relative" as const,
    zIndex: 10,
    minHeight: "100vh",
    width: "100%",
    boxSizing: "border-box" as const,
    padding: "26px 16px 80px",
  };
  
  const headerStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "34px",
  };
  
  const mobileHeaderStyle = {
    display: "flex",
    flexDirection: "column" as const,
    gap: "14px",
    marginBottom: "22px",
  };
  
  const labelStyle = {
    margin: 0,
    letterSpacing: "0.32em",
    textTransform: "uppercase" as const,
    fontSize: "12px",
    color: "rgba(241,232,218,0.48)",
  };
  
  const titleStyle = {
    margin: "8px 0 0",
    fontSize: "clamp(2.55rem, 13vw, 4rem)",
    fontWeight: 300,
    lineHeight: 1,
    color: "rgba(241,232,218,0.9)",
  };
  
  const navStyle = {
    display: "flex",
    gap: "18px",
  };
  
  const mobileNavStyle = {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap" as const,
  };
  
  const linkStyle = {
    color: "rgba(241,232,218,0.7)",
    textDecoration: "none",
    fontSize: "15px",
    fontWeight: 500,
  };
  
  const mobileLinkStyle = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "999px",
    border: "1px solid rgba(241,232,218,0.22)",
    background: "rgba(241,232,218,0.08)",
    color: "rgba(241,232,218,0.94)",
    textDecoration: "none",
    fontSize: "15px",
    fontWeight: 600,
    padding: "8px 14px",
    minWidth: "74px",
  };
  
  const topGridStyle = {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 360px",
    gap: "28px",
    alignItems: "start",
    maxWidth: "1320px",
    marginBottom: "28px",
  };
  
  const bottomGridStyle = {
    display: "grid",
    gridTemplateColumns: "360px minmax(0, 1fr)",
    gap: "28px",
    maxWidth: "1320px",
  };
  
  const mobileStackStyle = {
    display: "grid",
    gap: "16px",
    width: "100%",
  };
  
  const glassCardStyle = {
    minWidth: 0,
    borderRadius: "28px",
    border: "1px solid rgba(241,232,218,0.15)",
    background: "rgba(10,8,6,0.3)",
    backdropFilter: "blur(14px)",
    padding: "26px",
    boxSizing: "border-box" as const,
  };
  
  const calendarCardStyle = { ...glassCardStyle };
  const countdownCardStyle = { ...glassCardStyle };
  const formCardStyle = { ...glassCardStyle };
  const selectedCardStyle = { ...glassCardStyle };
  
  const mobileCountdownCardStyle = {
    ...glassCardStyle,
    padding: "18px",
  };
  
  const mobileFormCardStyle = {
    ...glassCardStyle,
    padding: "18px",
  };
  
  const countdownHeaderRowStyle = {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "12px",
  };
  
  const mobileCountdownCompactStyle = {
    display: "grid",
    gap: "10px",
  };
  
  const monthHeaderStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "22px",
    gap: "10px",
  };
  
  const monthTitleStyle = {
    fontSize: "clamp(1.65rem, 6vw, 2rem)",
    fontWeight: 300,
    margin: 0,
    textAlign: "center" as const,
  };
  
  const monthButtonStyle = {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    border: "1px solid rgba(241,232,218,0.18)",
    background: "rgba(255,255,255,0.04)",
    color: "rgba(241,232,218,0.82)",
    cursor: "pointer",
    fontSize: "18px",
    flexShrink: 0,
  };
  
  const weekGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
    gap: "6px",
    marginBottom: "9px",
  };
  
  const weekDayStyle = {
    textAlign: "center" as const,
    color: "rgba(241,232,218,0.5)",
    fontSize: "11px",
    fontWeight: 600,
    letterSpacing: "0.04em",
    margin: 0,
  };
  
  const monthGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
    gap: "6px",
  };
  
  const emptyDayStyle = {
    minHeight: "96px",
  };
  
  const mobileEmptyDayStyle = {
    minHeight: "56px",
  };
  
  const dayCellStyle = {
    position: "relative" as const,
    minWidth: 0,
    minHeight: "96px",
    borderRadius: "18px",
    border: "1px solid rgba(241,232,218,0.1)",
    background: "rgba(255,255,255,0.035)",
    color: "rgba(241,232,218,0.82)",
    padding: "10px",
    textAlign: "left" as const,
    cursor: "pointer",
    display: "flex",
    flexDirection: "column" as const,
    justifyContent: "space-between",
    overflow: "hidden",
  };
  
  const mobileDayCellStyle = {
    ...dayCellStyle,
    minHeight: "56px",
    borderRadius: "14px",
    padding: "6px",
  };
  
  const selectedDayCellStyle = {
    border: "1px solid rgba(241,232,218,0.42)",
    background: "rgba(241,232,218,0.075)",
  };
  
  const todayCellStyle = {
    boxShadow: "0 0 0 1px rgba(241,232,218,0.24)",
  };
  
  const dayTopRowStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "2px",
  };
  
  const dayNumberStyle = {
    fontSize: "16px",
    fontWeight: 600,
  };
  
  const mobileDayNumberStyle = {
    fontSize: "13px",
    fontWeight: 700,
  };
  
  const moodEmojiStyle = {
    fontSize: "16px",
    opacity: 0.9,
  };
  
  const mobileMoodEmojiStyle = {
    fontSize: "12px",
    opacity: 0.9,
  };
  const dayEventsStyle = {
    display: "grid",
    gap: "4px",
    minWidth: 0,
  };
  
  const focusMiniStyle = {
    borderRadius: "999px",
    padding: "4px 7px",
    background: "rgba(241,232,218,0.14)",
    color: "rgba(241,232,218,0.78)",
    fontSize: "11px",
    overflow: "hidden",
    whiteSpace: "nowrap" as const,
    textOverflow: "ellipsis",
  };
  
  const mobileFocusMiniStyle = {
    ...focusMiniStyle,
    padding: "3px 4px",
    fontSize: "9px",
    fontWeight: 600,
  };
  
  const miniEventStyle = {
    borderRadius: "999px",
    padding: "4px 7px",
    color: "rgba(241,232,218,0.88)",
    fontSize: "11px",
    overflow: "hidden",
    whiteSpace: "nowrap" as const,
    textOverflow: "ellipsis",
  };
  
  const mobileMiniEventStyle = {
    ...miniEventStyle,
    padding: "3px 4px",
    fontSize: "9px",
    fontWeight: 600,
  };
  
  const moreEventsStyle = {
    margin: 0,
    color: "rgba(241,232,218,0.55)",
    fontSize: "10px",
    fontWeight: 600,
  };
  
  const calendarTooltipStyle = {
    position: "absolute" as const,
    left: "50%",
    bottom: "106px",
    transform: "translateX(-50%)",
    zIndex: 50,
    minWidth: "150px",
    borderRadius: "14px",
    border: "1px solid rgba(241,232,218,0.18)",
    background: "rgba(12,10,8,0.92)",
    backdropFilter: "blur(12px)",
    padding: "10px 12px",
    boxShadow: "0 16px 40px rgba(0,0,0,0.28)",
    pointerEvents: "none" as const,
    textAlign: "center" as const,
  };
  
  const tooltipTitleStyle = {
    margin: 0,
    fontSize: "14px",
    color: "rgba(241,232,218,0.88)",
  };
  
  const tooltipTextStyle = {
    margin: "4px 0 0",
    fontSize: "12px",
    color: "rgba(241,232,218,0.52)",
  };
  
  const smallCapsStyle = {
    margin: 0,
    letterSpacing: "0.18em",
    textTransform: "uppercase" as const,
    color: "rgba(241,232,218,0.55)",
    fontSize: "11px",
    fontWeight: 700,
  };
  
  const sideTitleStyle = {
    margin: "8px 0 18px",
    fontSize: "2rem",
    fontWeight: 400,
    color: "rgba(241,232,218,0.9)",
  };
  
  const mobileCountdownTitleStyle = {
    margin: "6px 0 12px",
    fontSize: "1.75rem",
    fontWeight: 400,
    color: "rgba(241,232,218,0.9)",
  };
  
  const mobileFormTitleStyle = {
    margin: "6px 0 14px",
    fontSize: "1.7rem",
    fontWeight: 400,
    color: "rgba(241,232,218,0.9)",
  };
  
  const heroEventStyle = {
    borderRadius: "24px",
    border: "1px solid rgba(241,232,218,0.14)",
    background: "rgba(255,255,255,0.04)",
    padding: "22px",
  };
  
  const mobileHeroEventStyle = {
    ...heroEventStyle,
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    alignItems: "center",
    gap: "12px",
    borderRadius: "18px",
    padding: "14px",
  };
  
  const heroEventTitleStyle = {
    fontSize: "2.2rem",
    fontWeight: 400,
    margin: "0 0 12px",
    lineHeight: 1,
    color: "rgba(241,232,218,0.9)",
  };
  
  const mobileHeroEventTitleStyle = {
    ...heroEventTitleStyle,
    fontSize: "1.35rem",
    margin: "0 0 6px",
  };
  
  const heroCountdownStyle = {
    fontSize: "1.35rem",
    fontWeight: 500,
    margin: "0 0 10px",
    color: "rgba(241,232,218,0.9)",
  };
  
  const mobileHeroCountdownStyle = {
    ...heroCountdownStyle,
    fontSize: "1rem",
    margin: "0 0 4px",
  };
  
  const typePillStyle = {
    display: "inline-block",
    marginTop: "12px",
    borderRadius: "999px",
    padding: "6px 12px",
    fontSize: "11px",
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: "0.1em",
    color: "rgba(241,232,218,0.9)",
  };
  
  const timelineStyle = {
    marginTop: "22px",
    display: "grid",
    gap: "12px",
  };
  
  const mobileTimelineStyle = {
    marginTop: "10px",
    display: "grid",
    gap: "8px",
  };
  
  const timelineItemStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "18px",
    borderTop: "1px solid rgba(241,232,218,0.12)",
    paddingTop: "14px",
  };
  
  const mobileTimelineItemStyle = {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    gap: "10px",
    alignItems: "center",
    borderTop: "1px solid rgba(241,232,218,0.12)",
    paddingTop: "10px",
  };
  
  const timelineTitleStyle = {
    margin: 0,
    fontSize: "16px",
    fontWeight: 600,
    color: "rgba(241,232,218,0.88)",
    overflowWrap: "break-word" as const,
  };
  
  const timelineCountdownStyle = {
    margin: 0,
    whiteSpace: "nowrap" as const,
    fontWeight: 600,
    color: "rgba(241,232,218,0.72)",
  };
  
  const mobileTimelineCountdownStyle = {
    ...timelineCountdownStyle,
    fontSize: "13px",
  };
  
  const fieldLabelStyle = {
    display: "block",
    marginBottom: "7px",
    fontSize: "13px",
    fontWeight: 600,
    color: "rgba(241,232,218,0.58)",
  };
  
  const inputStyle = {
    width: "100%",
    marginBottom: "14px",
    padding: "12px 13px",
    borderRadius: "15px",
    border: "1px solid rgba(241,232,218,0.16)",
    background: "rgba(255,255,255,0.055)",
    color: "rgba(241,232,218,0.9)",
    boxSizing: "border-box" as const,
    fontSize: "14px",
  };
  
  const mobileInputStyle = {
    ...inputStyle,
    padding: "10px 12px",
    marginBottom: "12px",
    fontSize: "14px",
  };
  
  const textareaStyle = {
    ...inputStyle,
    minHeight: "82px",
    resize: "none" as const,
  };
  
  const mobileTextareaStyle = {
    ...textareaStyle,
    minHeight: "68px",
  };
  
  const buttonStyle = {
    width: "100%",
    padding: "13px",
    borderRadius: "999px",
    border: "1px solid rgba(241,232,218,0.3)",
    background: "rgba(241,232,218,0.08)",
    color: "rgba(241,232,218,0.92)",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: 600,
  };
  
  const selectedDateStyle = {
    margin: "8px 0 18px",
    fontSize: "2rem",
    fontWeight: 400,
    color: "rgba(241,232,218,0.9)",
  };
  
  const selectedInnerGridStyle = {
    display: "grid",
    gridTemplateColumns: "minmax(0,1fr) 420px",
    gap: "24px",
  };
  
  const mobileSelectedInnerGridStyle = {
    display: "grid",
    gap: "14px",
  };
  
  const journalBoxStyle = {
    borderRadius: "22px",
    border: "1px solid rgba(241,232,218,0.12)",
    background: "rgba(255,255,255,0.04)",
    padding: "22px",
  };
  
  const mobileJournalBoxStyle = {
    ...journalBoxStyle,
    padding: "14px",
  };
  
  const journalPromptStyle = {
    margin: "8px 0 12px",
    color: "rgba(241,232,218,0.65)",
    fontWeight: 500,
  };
  
  const moodGridStyle = {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: "10px",
    marginBottom: "14px",
  };
  
  const mobileMoodGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(2,minmax(0,1fr))",
    gap: "8px",
    marginBottom: "12px",
  };
  
  const moodButtonStyle = {
    borderRadius: "999px",
    border: "1px solid rgba(241,232,218,0.16)",
    background: "rgba(255,255,255,0.035)",
    color: "rgba(241,232,218,0.76)",
    padding: "8px 13px",
    display: "flex",
    alignItems: "center",
    gap: "7px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 600,
  };
  
  const mobileMoodButtonStyle = {
    ...moodButtonStyle,
    padding: "7px 9px",
    fontSize: "13px",
  };
  
  const activeMoodButtonStyle = {
    border: "1px solid rgba(241,232,218,0.4)",
    background: "rgba(213,169,102,.2)",
    color: "rgba(241,232,218,0.94)",
  };
  
  const moodChoiceEmojiStyle = {
    fontSize: "15px",
  };
  
  const journalTextareaStyle = {
    width: "100%",
    minHeight: "150px",
    padding: "14px",
    marginBottom: "16px",
    borderRadius: "18px",
    border: "1px solid rgba(241,232,218,0.14)",
    background: "rgba(255,255,255,0.045)",
    color: "rgba(241,232,218,0.9)",
    outline: "none",
    resize: "none" as const,
    boxSizing: "border-box" as const,
    fontSize: "14px",
  };
  
  const mobileJournalTextareaStyle = {
    ...journalTextareaStyle,
    minHeight: "92px",
    padding: "12px",
    marginBottom: "12px",
  };
  
  const eventCardStyle = {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "flex-start",
    borderRadius: "20px",
    border: "1px solid rgba(241,232,218,0.12)",
    background: "rgba(255,255,255,0.04)",
    padding: "16px",
  };
  
  const mobileEventCardStyle = {
    ...eventCardStyle,
    display: "grid",
    gap: "10px",
    padding: "14px",
  };
  
  const eventTitleStyle = {
    margin: 0,
    fontSize: "1.2rem",
    fontWeight: 600,
    color: "rgba(241,232,218,0.88)",
  };
  
  const mutedStyle = {
    color: "rgba(241,232,218,.62)",
    fontWeight: 500,
    overflowWrap: "break-word" as const,
  };
  
  const notesStyle = {
    fontSize: "14px",
    color: "rgba(241,232,218,0.64)",
  };
  
  const deleteButtonStyle = {
    border: "none",
    background: "transparent",
    color: "rgba(241,160,150,.78)",
    cursor: "pointer",
    fontWeight: 600,
    width: "fit-content",
  };