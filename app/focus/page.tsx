"use client";

import { useEffect, useMemo, useState } from "react";
import { useAudio } from "../context/AudioContext";
import { supabase } from "@/utils/supabase/client";

const backgroundMap: Record<string, string> = {
  Library: "/library-night.png",
  Rain: "/rainforest-study.png",
  Forest: "/meadow-study.png",
  Stars: "/starry-study.png",
};

const sceneMap: Record<string, "library" | "rain" | "forest" | "stars"> = {
  Library: "library",
  Rain: "rain",
  Forest: "forest",
  Stars: "stars",
};

const quietThoughts = [
  "Quiet progress is still progress.",
  "Stay where your feet are.",
  "One page at a time.",
  "Do not rush this hour.",
  "Your future self will thank you.",
  "Small focus becomes real change.",
  "Begin again, gently.",
  "You are building something quietly.",
  "Let this moment be enough.",
  "The work matters because you chose it.",
];

type Mode = "timer" | "stopwatch";
type Phase = "focus" | "break";

type Journey = {
  focusMinutes: number;
  sessions: number;
  completedTasks: number;
};

export default function FocusPage() {
  const {
    startSounds,
    noiseVolume,
    musicVolume,
    setNoiseVolume,
    setMusicVolume,
    stopSounds,
  } = useAudio();

  const [userId, setUserId] = useState("");
  const [task, setTask] = useState("Deep Work Session");
  const [setting, setSetting] = useState("Library");

  const [mode, setMode] = useState<Mode>("timer");
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);

  const [started, setStarted] = useState(false);
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<Phase>("focus");
  const [seconds, setSeconds] = useState(25 * 60);
  const [message, setMessage] = useState("");

  const [journey, setJourney] = useState<Journey>({
    focusMinutes: 0,
    sessions: 0,
    completedTasks: 0,
  });

  useEffect(() => {
    async function loadUserAndToday() {
      const { data } = await supabase.auth.getUser();
      const currentUserId = data.user?.id || "";

      setUserId(currentUserId);

      if (currentUserId) {
        loadTodayJourney(currentUserId);
      }
    }

    setTask(localStorage.getItem("activeTask") || "Deep Work Session");
    setSetting(localStorage.getItem("focusSetting") || "Library");
    loadUserAndToday();
  }, []);

  useEffect(() => {
    if (!started || !running) return;

    const interval = window.setInterval(() => {
      setSeconds((prev) => {
        if (mode === "stopwatch") return prev + 1;

        if (prev <= 1) {
          if (phase === "focus") {
            setPhase("break");
            return breakMinutes * 60;
          }

          setRunning(false);
          stopSounds();
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [started, running, mode, phase, breakMinutes, stopSounds]);

  async function loadTodayJourney(currentUserId: string) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const { data: sessions } = await supabase
      .from("study_sessions")
      .select("duration_minutes")
      .eq("user_id", currentUserId)
      .gte("created_at", start.toISOString());

    const { data: completedTasks } = await supabase
      .from("tasks")
      .select("id")
      .eq("user_id", currentUserId)
      .eq("done", true)
      .gte("completed_at", start.toISOString());

    const focusTotal =
      sessions?.reduce((sum, item) => sum + Number(item.duration_minutes || 0), 0) || 0;

    setJourney({
      focusMinutes: focusTotal,
      sessions: sessions?.length || 0,
      completedTasks: completedTasks?.length || 0,
    });
  }

  const backgroundImage = backgroundMap[setting] || backgroundMap.Library;
  const scene = sceneMap[setting] || "library";

  const totalSeconds = useMemo(() => {
    if (mode === "stopwatch") return Math.max(seconds, 1);
    return phase === "focus" ? focusMinutes * 60 : breakMinutes * 60;
  }, [mode, seconds, phase, focusMinutes, breakMinutes]);

  const progress = useMemo(() => {
    if (mode === "stopwatch") {
      const softLimit = Math.max(focusMinutes * 60, 1);
      return Math.min(seconds / softLimit, 1);
    }

    return 1 - seconds / Math.max(totalSeconds, 1);
  }, [mode, seconds, totalSeconds, focusMinutes]);

  const quietThought = useMemo(() => {
    const today = new Date();
    const seed =
      today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();

    return quietThoughts[seed % quietThoughts.length];
  }, []);

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  const todayHours = Math.floor(journey.focusMinutes / 60);
  const todayMins = journey.focusMinutes % 60;
  const todayText =
    todayHours > 0 ? `${todayHours}h ${todayMins}m` : `${journey.focusMinutes}m`;

  async function beginSession() {
    setMessage("");
    await startSounds(scene);
    setStarted(true);
    setRunning(true);
    setPhase("focus");
    setSeconds(mode === "timer" ? focusMinutes * 60 : 0);
  }

  function pauseOrResume() {
    if (running) {
      setRunning(false);
      stopSounds();
      return;
    }

    setRunning(true);
    startSounds(scene);
  }

  function resetSession() {
    stopSounds();
    setStarted(false);
    setRunning(false);
    setPhase("focus");
    setSeconds(focusMinutes * 60);
    setMessage("");
  }

  async function completeSession() {
    stopSounds();
    setRunning(false);

    const durationMinutes =
      mode === "timer"
        ? phase === "focus"
          ? Math.max(1, focusMinutes - Math.ceil(seconds / 60))
          : focusMinutes
        : Math.max(1, Math.floor(seconds / 60));

    if (!userId) {
      window.location.href = "/complete";
      return;
    }

    const { error } = await supabase.from("study_sessions").insert({
      user_id: userId,
      task_name: task,
      duration_minutes: durationMinutes,
    });

    if (error) {
      console.error("Save study session error:", error);
      setMessage("Session finished, but it could not be saved.");
      return;
    }

    window.location.href = "/complete";
  }

  return (
    <main className={`focus-page scene-${scene}`}>
      <div className="background" style={{ backgroundImage: `url('${backgroundImage}')` }} />
      <div className="overlay" />

      <div className={started ? "content session-mode" : "content setup-mode"}>
        {!started && (
          <header className="header">
            <div>
              <p className="brand">FocusForge</p>
              <h1>Stay with the moment.</h1>
            </div>

            <nav>
              <a href="/forge">Forge</a>
              <a href="/calendar">Calendar</a>
              <a href="/check-in">Change Space</a>
            </nav>
          </header>
        )}

        {!started ? (
          <section className="setup-screen">
            <div className="setup-card">
              <p className="eyebrow">{setting} · Focus Setup</p>

              <p className="tiny-title">Today&apos;s Task</p>
              <h2>{task}</h2>

              <div className="soft-line" />

              <div className="mode-switch">
                <button
                  type="button"
                  onClick={() => {
                    setMode("timer");
                    setSeconds(focusMinutes * 60);
                  }}
                  className={mode === "timer" ? "active" : ""}
                >
                  Timer
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode("stopwatch");
                    setSeconds(0);
                  }}
                  className={mode === "stopwatch" ? "active" : ""}
                >
                  Stopwatch
                </button>
              </div>

              {mode === "timer" ? (
                <div className="duration-area">
                  <div>
                    <p className="section-label">Focus Duration</p>
                    <div className="option-grid">
                      {[15, 25, 45, 60].map((min) => (
                        <button
                          key={min}
                          type="button"
                          onClick={() => {
                            setFocusMinutes(min);
                            setSeconds(min * 60);
                          }}
                          className={focusMinutes === min ? "active" : ""}
                        >
                          {min} min
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="section-label">Break Duration</p>
                    <div className="option-grid break-grid">
                      {[5, 10, 15].map((min) => (
                        <button
                          key={min}
                          type="button"
                          onClick={() => setBreakMinutes(min)}
                          className={breakMinutes === min ? "active" : ""}
                        >
                          {min} min
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="stopwatch-note">
                  Stopwatch counts upward until you choose to complete.
                </div>
              )}

              <div className="soft-line small" />

              <div className="sound-stack">
                <SoundSlider label="Noise" value={noiseVolume} onChange={setNoiseVolume} />
                <SoundSlider label="Music" value={musicVolume} onChange={setMusicVolume} />
              </div>

              <button type="button" onClick={beginSession} className="begin-button">
                Begin Session →
              </button>

              <p className="setup-note">You can adjust sound during the session.</p>
            </div>
          </section>
        ) : (
          <section className="session-screen">
            <div className="timer-card">
              <p className="eyebrow">
                {setting} · {phase === "focus" ? "Focus" : "Break"}
              </p>

              <p className="tiny-title">Today&apos;s Task</p>
              <h2>{task}</h2>

              <div className="circle-wrap">
                <svg viewBox="0 0 120 120">
                  <circle className="circle-track" cx="60" cy="60" r="52" />
                  <circle
                    className="circle-progress"
                    cx="60"
                    cy="60"
                    r="52"
                    style={{ strokeDashoffset: 326.7 - 326.7 * progress }}
                  />
                </svg>

                <div className="timer-text">
                  {String(minutes).padStart(2, "0")}:
                  {String(remainingSeconds).padStart(2, "0")}
                </div>
              </div>

              <p className="session-hint">
                {phase === "focus" ? "Leave everything else outside." : "Step back. Breathe."}
              </p>

              <button type="button" onClick={pauseOrResume} className="main-control">
                {running ? "Pause" : "Resume"}
              </button>

              <div className="secondary-controls">
                <button type="button" onClick={resetSession}>
                  Reset
                </button>

                <button type="button" onClick={completeSession}>
                  Complete
                </button>
              </div>

              {message && <p className="message">{message}</p>}
            </div>

            <aside className="side-panel">
              <div className="info-card sound-card">
                <p className="eyebrow">Sound Space</p>
                <div className="sound-stack">
                  <SoundSlider label="Noise" value={noiseVolume} onChange={setNoiseVolume} />
                  <SoundSlider label="Music" value={musicVolume} onChange={setMusicVolume} />
                </div>
              </div>

              <div className="info-card journey-card">
                <p className="eyebrow">Today&apos;s Journey</p>
                <div className="journey-main">{todayText}</div>

                <div className="journey-grid">
                  <div>
                    <span>{journey.sessions}</span>
                    <p>Sessions</p>
                  </div>

                  <div>
                    <span>{journey.completedTasks}</span>
                    <p>Tasks</p>
                  </div>
                </div>
              </div>

              <div className="info-card thought-card">
                <p className="eyebrow">A Quiet Thought</p>
                <p>{quietThought}</p>
              </div>
            </aside>
          </section>
        )}
      </div>

      <style jsx>{`
        .focus-page {
          --accent: rgba(255, 255, 255, 0.1);
          --accent-strong: rgba(255, 255, 255, 0.16);
          --text: rgba(244, 238, 228, 0.92);
          --muted: rgba(244, 238, 228, 0.56);
          position: relative;
          width: 100vw;
          height: 100svh;
          overflow: hidden;
          background: #0b0807;
          color: var(--text);
        }

        .scene-rain {
          --accent: rgba(78, 118, 92, 0.2);
          --accent-strong: rgba(97, 139, 111, 0.28);
        }

        .scene-stars {
          --accent: rgba(74, 85, 137, 0.2);
          --accent-strong: rgba(90, 104, 165, 0.28);
        }

        .scene-library {
          --accent: rgba(103, 71, 48, 0.22);
          --accent-strong: rgba(126, 86, 58, 0.28);
        }

        .scene-forest {
          --accent: rgba(230, 226, 210, 0.12);
          --accent-strong: rgba(238, 234, 220, 0.18);
        }

        .background {
          position: fixed;
          inset: 0;
          z-index: 0;
          background-size: cover;
          background-position: center;
          filter: blur(4px);
          transform: scale(1.04);
        }

        .overlay {
          position: fixed;
          inset: 0;
          z-index: 1;
          background:
            radial-gradient(circle at 50% 18%, rgba(241, 232, 218, 0.11), transparent 34%),
            linear-gradient(to bottom, rgba(0, 0, 0, 0.42), rgba(0, 0, 0, 0.72));
        }

        .content {
          position: relative;
          z-index: 10;
          width: 100%;
          height: 100svh;
          box-sizing: border-box;
          overflow: hidden;
        }

        .setup-mode {
          padding: 24px 34px;
          display: flex;
          flex-direction: column;
        }

        .session-mode {
          padding: 18px 24px;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 18px;
          margin-bottom: 4px;
          flex: 0 0 auto;
        }

        .brand,
        .eyebrow {
          margin: 0;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: rgba(244, 238, 228, 0.54);
          font-size: 10px;
        }

        h1 {
          margin: 6px 0 0;
          font-family: Cormorant Garamond, Georgia, serif;
          font-size: clamp(2.6rem, 5.4vw, 4.8rem);
          font-weight: 300;
          line-height: 0.92;
        }

        nav {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        nav a {
          border: 1px solid rgba(244, 238, 228, 0.22);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.045);
          color: rgba(244, 238, 228, 0.8);
          padding: 9px 15px;
          text-decoration: none;
          font-size: 14px;
          backdrop-filter: blur(12px);
        }

        .setup-screen {
          flex: 1;
          min-height: 0;
          display: grid;
          place-items: center;
        }

        .setup-card {
          width: min(620px, 100%);
          max-height: 100%;
          border-radius: 30px;
          border: 1px solid rgba(244, 238, 228, 0.18);
          background:
            linear-gradient(to bottom, rgba(255, 255, 255, 0.055), rgba(255, 255, 255, 0.025)),
            rgba(10, 8, 6, 0.18);
          backdrop-filter: blur(16px);
          box-sizing: border-box;
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.18);
          padding: 20px 24px;
          text-align: center;
        }

        .tiny-title {
          margin: 13px 0 0;
          color: var(--muted);
          font-size: 13px;
        }

        h2 {
          margin: 6px 0 8px;
          font-family: Cormorant Garamond, Georgia, serif;
          font-size: clamp(2.4rem, 5vw, 4.15rem);
          font-weight: 300;
          line-height: 0.96;
        }

        .soft-line {
          height: 1px;
          width: 100%;
          margin: 14px 0;
          background: linear-gradient(
            to right,
            transparent,
            rgba(244, 238, 228, 0.2),
            transparent
          );
        }

        .soft-line.small {
          margin: 14px 0 12px;
        }

        .mode-switch {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 9px;
        }

        .mode-switch button,
        .option-grid button {
          min-height: 40px;
          border-radius: 999px;
          border: 1px solid rgba(244, 238, 228, 0.18);
          background: rgba(255, 255, 255, 0.04);
          color: rgba(244, 238, 228, 0.68);
          cursor: pointer;
          font-size: 13px;
        }

        .mode-switch button.active,
        .option-grid button.active {
          border-color: rgba(244, 238, 228, 0.34);
          background: var(--accent);
          color: rgba(244, 238, 228, 0.92);
        }

        .duration-area {
          display: grid;
          gap: 0;
        }

        .section-label {
          margin: 13px 0 7px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(244, 238, 228, 0.48);
          font-size: 10px;
          text-align: left;
        }

        .option-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 8px;
        }

        .break-grid {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .stopwatch-note {
          margin-top: 14px;
          border: 1px solid rgba(244, 238, 228, 0.14);
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.035);
          padding: 13px;
          color: rgba(244, 238, 228, 0.58);
          font-size: 13px;
        }

        .sound-stack {
          display: grid;
          gap: 10px;
        }

        .begin-button {
          margin-top: 16px;
          width: 100%;
          min-height: 50px;
          border-radius: 999px;
          border: 1px solid rgba(244, 238, 228, 0.24);
          background: rgba(255, 255, 255, 0.065);
          color: rgba(244, 238, 228, 0.9);
          cursor: pointer;
          letter-spacing: 0.13em;
          font-size: 14px;
          transition: 0.25s ease;
        }

        .begin-button:hover {
          background: var(--accent-strong);
          border-color: rgba(244, 238, 228, 0.36);
        }

        .setup-note {
          margin: 9px 0 0;
          color: rgba(244, 238, 228, 0.42);
          font-size: 12px;
        }

        .session-screen {
          width: 100%;
          height: calc(100svh - 36px);
          display: grid;
          grid-template-columns: minmax(0, 1.45fr) minmax(280px, 0.55fr);
          gap: 16px;
        }

        .timer-card,
        .info-card {
          border: 1px solid rgba(244, 238, 228, 0.18);
          background: rgba(10, 8, 6, 0.3);
          backdrop-filter: blur(18px);
          box-sizing: border-box;
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.2);
        }

        .timer-card {
          min-height: 0;
          border-radius: 34px;
          padding: 18px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .circle-wrap {
          position: relative;
          width: min(330px, 30vw);
          aspect-ratio: 1;
          margin: 0 auto 10px;
        }

        .circle-wrap svg {
          width: 100%;
          height: 100%;
          transform: rotate(-90deg);
        }

        .circle-track {
          fill: none;
          stroke: rgba(244, 238, 228, 0.13);
          stroke-width: 5;
        }

        .circle-progress {
          fill: none;
          stroke: rgba(244, 238, 228, 0.72);
          stroke-width: 5;
          stroke-linecap: round;
          stroke-dasharray: 326.7;
          transition: stroke-dashoffset 500ms ease;
        }

        .timer-text {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          font-family: Cormorant Garamond, Georgia, serif;
          font-size: clamp(4rem, 8vw, 6.6rem);
          font-weight: 300;
        }

        .session-hint {
          margin: 0 0 12px;
          color: rgba(244, 238, 228, 0.58);
          font-size: 13px;
        }

        .main-control {
          min-width: 160px;
          min-height: 46px;
          border-radius: 999px;
          border: 1px solid rgba(244, 238, 228, 0.3);
          background: var(--accent);
          color: rgba(244, 238, 228, 0.94);
          cursor: pointer;
          font-size: 14px;
        }

        .secondary-controls {
          display: flex;
          gap: 10px;
          margin-top: 9px;
        }

        .secondary-controls button {
          min-width: 104px;
          min-height: 38px;
          border-radius: 999px;
          border: 1px solid rgba(244, 238, 228, 0.2);
          background: rgba(255, 255, 255, 0.04);
          color: rgba(244, 238, 228, 0.75);
          cursor: pointer;
        }

        .message {
          margin: 10px 0 0;
          color: rgba(244, 238, 228, 0.66);
          font-size: 13px;
        }

        .side-panel {
          min-height: 0;
          display: grid;
          grid-template-rows: 0.85fr 0.85fr 1fr;
          gap: 10px;
        }

        .info-card {
          min-height: 0;
          border-radius: 24px;
          padding: 14px 16px;
          overflow: hidden;
        }

        .sound-card {
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .journey-main {
          margin: 8px 0;
          font-family: Cormorant Garamond, Georgia, serif;
          font-size: 2.2rem;
          font-weight: 300;
        }

        .journey-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .journey-grid div {
          border: 1px solid rgba(244, 238, 228, 0.13);
          border-radius: 16px;
          padding: 8px;
          background: rgba(255, 255, 255, 0.035);
        }

        .journey-grid span {
          display: block;
          font-size: 18px;
          color: rgba(244, 238, 228, 0.9);
        }

        .journey-grid p {
          margin: 3px 0 0;
          color: rgba(244, 238, 228, 0.52);
          font-size: 11px;
        }

        .thought-card p:last-child {
          margin: 10px 0 0;
          font-family: Cormorant Garamond, Georgia, serif;
          font-size: clamp(1.45rem, 2.3vw, 2rem);
          line-height: 1.08;
          font-weight: 300;
          color: rgba(244, 238, 228, 0.86);
        }

        @media (max-width: 900px) {
          nav {
            display: none;
          }

          .setup-mode {
            padding: 16px;
          }

          h1 {
            font-size: 2.4rem;
          }

          .session-mode {
            padding: 12px;
          }

          .session-screen {
            height: calc(100svh - 24px);
            grid-template-columns: 1fr;
            grid-template-rows: 1fr auto;
            gap: 10px;
          }

          .side-panel {
            grid-template-columns: 1fr 1fr;
            grid-template-rows: auto auto;
          }

          .sound-card {
            grid-column: 1 / -1;
          }

          .circle-wrap {
            width: min(270px, 58vw);
          }
        }

        @media (max-width: 560px) {
          .setup-mode {
            padding: 10px 12px;
          }

          .header {
            margin-bottom: 8px;
          }

          .brand {
            font-size: 9px;
          }

          .eyebrow {
            font-size: 9px;
            letter-spacing: 0.2em;
          }

          h1 {
            font-size: 1.8rem;
          }

          .setup-card {
            padding: 13px;
            border-radius: 24px;
          }

          .tiny-title {
            margin-top: 8px;
            font-size: 12px;
          }

          h2 {
            font-size: 2rem;
            margin: 4px 0 6px;
          }

          .soft-line {
            margin: 10px 0;
          }

          .mode-switch button,
          .option-grid button {
            min-height: 34px;
            font-size: 12px;
          }

          .option-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 7px;
          }

          .break-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .section-label {
            margin: 9px 0 6px;
            font-size: 9px;
          }

          .begin-button {
            min-height: 44px;
            margin-top: 11px;
            font-size: 12px;
          }

          .setup-note {
            display: none;
          }

          .session-screen {
            height: calc(100svh - 24px);
          }

          .timer-card {
            padding: 12px;
            border-radius: 24px;
          }

          .timer-card h2 {
            font-size: 1.8rem;
          }

          .circle-wrap {
            width: min(215px, 58vw);
          }

          .timer-text {
            font-size: clamp(3rem, 14vw, 4.4rem);
          }

          .session-hint {
            display: none;
          }

          .main-control {
            min-height: 40px;
            min-width: 142px;
          }

          .secondary-controls button {
            min-height: 34px;
            min-width: 88px;
            font-size: 12px;
          }

          .side-panel {
            display: grid;
            grid-template-columns: 1fr;
            gap: 7px;
          }

          .info-card {
            padding: 10px 12px;
            border-radius: 18px;
          }

          .journey-card .eyebrow,
          .journey-grid {
            display: none;
          }

          .journey-main {
            margin: 0;
            font-size: 1.35rem;
          }

          .journey-main::before {
            content: "Today · ";
            color: rgba(244, 238, 228, 0.55);
            font-size: 12px;
          }

          .thought-card p:last-child {
            margin-top: 6px;
            font-size: 1.15rem;
          }
        }

        @media (max-height: 720px) and (max-width: 560px) {
          h1 {
            display: none;
          }

          .header {
            margin-bottom: 5px;
          }

          .setup-card {
            padding: 11px;
          }

          .circle-wrap {
            width: min(190px, 54vw);
          }

          .thought-card {
            display: none;
          }
        }
      `}</style>
    </main>
  );
}

function SoundSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="slider">
      <span>{label}</span>

      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />

      <style jsx>{`
        .slider {
          display: grid;
          grid-template-columns: 54px 1fr;
          gap: 10px;
          align-items: center;
          color: rgba(244, 238, 228, 0.66);
          font-size: 13px;
        }

        input {
          width: 100%;
          accent-color: rgba(244, 238, 228, 0.78);
          cursor: pointer;
        }

        @media (max-width: 560px) {
          .slider {
            grid-template-columns: 46px 1fr;
            gap: 8px;
            font-size: 12px;
          }
        }
      `}</style>
    </label>
  );
}