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

type Mode = "timer" | "stopwatch";
type Phase = "focus" | "break";

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

  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id || "");
    }

    loadUser();

    const savedTask = localStorage.getItem("activeTask") || "Deep Work Session";
    const savedSetting = localStorage.getItem("focusSetting") || "Library";

    setTask(savedTask);
    setSetting(savedSetting);
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

  const backgroundImage = backgroundMap[setting] || backgroundMap.Library;

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

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  async function beginSession() {
    setMessage("");
    await startSounds(sceneMap[setting] || "library");

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
    startSounds(sceneMap[setting] || "library");
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
    <main style={pageStyle}>
      <div
        style={{
          ...backgroundStyle,
          backgroundImage: `url('${backgroundImage}')`,
        }}
      />

      <div style={overlayStyle} />

      <div style={contentStyle}>
        <header style={headerStyle}>
          <div>
            <p style={smallLabel}>FocusForge</p>
            <h1 style={mainTitle}>Stay with the moment.</h1>
          </div>

          <div style={navStyle}>
            <a href="/forge" style={navButton}>
              Forge
            </a>
            <a href="/calendar" style={navButton}>
              Calendar
            </a>
            <a href="/check-in" style={navButton}>
              Change Space
            </a>
          </div>
        </header>

        {!started ? (
          <section style={setupLayout}>
            <div style={setupHero}>
              <p style={smallLabel}>{setting} · Focus Setup</p>
              <h2 style={taskTitle}>{task}</h2>
              <p style={descriptionText}>
                Choose your rhythm, settle into your space, and begin when you are ready.
              </p>
            </div>

            <div style={setupCard}>
              <div style={modeSwitch}>
                <button
                  type="button"
                  onClick={() => {
                    setMode("timer");
                    setSeconds(focusMinutes * 60);
                  }}
                  style={mode === "timer" ? activeModeButton : modeButton}
                >
                  Timer
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode("stopwatch");
                    setSeconds(0);
                  }}
                  style={mode === "stopwatch" ? activeModeButton : modeButton}
                >
                  Stopwatch
                </button>
              </div>

              {mode === "timer" ? (
                <>
                  <p style={sectionLabel}>Focus Duration</p>
                  <div style={buttonGrid}>
                    {[15, 25, 45, 60].map((min) => (
                      <button
                        key={min}
                        type="button"
                        onClick={() => {
                          setFocusMinutes(min);
                          setSeconds(min * 60);
                        }}
                        style={focusMinutes === min ? activeOptionButton : optionButton}
                      >
                        {min} min
                      </button>
                    ))}
                  </div>

                  <p style={sectionLabel}>Break Duration</p>
                  <div style={buttonGrid}>
                    {[5, 10, 15].map((min) => (
                      <button
                        key={min}
                        type="button"
                        onClick={() => setBreakMinutes(min)}
                        style={breakMinutes === min ? activeOptionButton : optionButton}
                      >
                        {min} min
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div style={stopwatchNote}>
                  <p style={sectionLabel}>Open Session</p>
                  <p style={descriptionText}>
                    Stopwatch mode counts upward. Use it when you want to stay until the work feels
                    complete.
                  </p>
                </div>
              )}

              <div style={soundPreviewBox}>
                <SoundSlider label="Noise" value={noiseVolume} onChange={setNoiseVolume} />
                <SoundSlider label="Music" value={musicVolume} onChange={setMusicVolume} />
              </div>

              <button type="button" onClick={beginSession} style={beginButton}>
                Begin Session →
              </button>
            </div>
          </section>
        ) : (
          <section style={sessionLayout}>
            <div style={timerCard}>
              <p style={smallLabel}>
                {setting} · {phase === "focus" ? "Focus" : "Break"}
              </p>

              <h2 style={taskTitle}>{task}</h2>

              <div style={circleWrap}>
                <svg viewBox="0 0 120 120" style={circleSvg}>
                  <circle cx="60" cy="60" r="52" style={circleTrack} />
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    style={{
                      ...circleProgress,
                      strokeDashoffset: 326.7 - 326.7 * progress,
                    }}
                  />
                </svg>

                <div style={timerText}>
                  {String(minutes).padStart(2, "0")}:
                  {String(remainingSeconds).padStart(2, "0")}
                </div>
              </div>

              <p style={sessionHint}>
                {phase === "focus"
                  ? "Leave everything else outside. This is the only thing that matters right now."
                  : "Step back. Breathe. Then return."}
              </p>

              <div style={controlRow}>
                <button type="button" onClick={pauseOrResume} style={controlButton}>
                  {running ? "Pause" : "Resume"}
                </button>

                <button type="button" onClick={completeSession} style={controlButton}>
                  Complete
                </button>

                <button type="button" onClick={resetSession} style={controlButton}>
                  Reset
                </button>
              </div>

              {message && <p style={messageStyle}>{message}</p>}
            </div>

            <aside style={sidePanel}>
              <div style={infoCard}>
                <p style={smallLabel}>Sound Space</p>

                <div style={{ marginTop: "18px", display: "grid", gap: "18px" }}>
                  <SoundSlider label="Noise" value={noiseVolume} onChange={setNoiseVolume} />
                  <SoundSlider label="Music" value={musicVolume} onChange={setMusicVolume} />
                </div>
              </div>

              <div style={infoCard}>
                <p style={smallLabel}>Studying Right Now</p>
                <h3 style={onlineNumber}>{running ? "128" : "127"}</h3>
                <p style={cardText}>
                  A quiet room of students is working with you. No likes, no comments, just presence.
                </p>
              </div>

              <div style={infoCard}>
                <p style={smallLabel}>After This</p>
                <p style={cardText}>
                  Completing this session sends it into your study history and helps build your streak.
                </p>
              </div>
            </aside>
          </section>
        )}
      </div>
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
    <label style={sliderWrap}>
      <span>{label}</span>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={sliderInput}
      />
    </label>
  );
}
const pageStyle = {
  position: "relative" as const,
  minHeight: "100svh",
  overflowX: "hidden" as const,
  background: "#0b0807",
};

const backgroundStyle = {
  position: "fixed" as const,
  inset: 0,
  backgroundSize: "cover",
  backgroundPosition: "center",
  filter: "blur(4px)",
  transform: "scale(1.04)",
  pointerEvents: "none" as const,
  zIndex: 0,
};

const overlayStyle = {
  position: "fixed" as const,
  inset: 0,
  background:
    "radial-gradient(circle at 48% 22%, rgba(241,232,218,0.16), transparent 34%), linear-gradient(to bottom, rgba(0,0,0,0.48), rgba(0,0,0,0.66))",
  pointerEvents: "none" as const,
  zIndex: 1,
};

const contentStyle = {
  position: "relative" as const,
  zIndex: 10,
  minHeight: "100svh",
  padding: "clamp(22px, 5vw, 46px)",
  boxSizing: "border-box" as const,
  color: "rgba(241,232,218,0.92)",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "20px",
  flexWrap: "wrap" as const,
  marginBottom: "clamp(26px, 5vw, 50px)",
};

const navStyle = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap" as const,
  justifyContent: "flex-end",
};

const navButton = {
  border: "1px solid rgba(241,232,218,0.24)",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.055)",
  color: "rgba(241,232,218,0.84)",
  padding: "11px 17px",
  textDecoration: "none",
  fontSize: "14px",
  backdropFilter: "blur(12px)",
};

const smallLabel = {
  margin: 0,
  letterSpacing: "0.28em",
  textTransform: "uppercase" as const,
  color: "rgba(241,232,218,0.55)",
  fontSize: "12px",
};

const mainTitle = {
  margin: "10px 0 0",
  fontFamily: "Cormorant Garamond, Georgia, serif",
  fontSize: "clamp(2.6rem, 9vw, 5.4rem)",
  fontWeight: 300,
  lineHeight: 0.95,
};

const setupLayout = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) minmax(320px, 520px)",
  gap: "clamp(22px, 5vw, 46px)",
  alignItems: "center",
};

const setupHero = {
  minHeight: "420px",
  borderRadius: "36px",
  border: "1px solid rgba(241,232,218,0.18)",
  background: "rgba(10,8,6,0.24)",
  backdropFilter: "blur(16px)",
  padding: "clamp(26px, 5vw, 48px)",
  boxSizing: "border-box" as const,
  display: "flex",
  flexDirection: "column" as const,
  justifyContent: "center",
};

const taskTitle = {
  margin: "16px 0 16px",
  fontFamily: "Cormorant Garamond, Georgia, serif",
  fontSize: "clamp(2.4rem, 8vw, 4.6rem)",
  fontWeight: 300,
  lineHeight: 1,
};

const descriptionText = {
  margin: 0,
  color: "rgba(241,232,218,0.62)",
  fontSize: "15px",
  lineHeight: 1.7,
  maxWidth: "520px",
};

const setupCard = {
  borderRadius: "32px",
  border: "1px solid rgba(241,232,218,0.22)",
  background: "rgba(10,8,6,0.34)",
  backdropFilter: "blur(18px)",
  padding: "26px",
  boxSizing: "border-box" as const,
};

const modeSwitch = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "10px",
};

const modeButton = {
  borderRadius: "999px",
  border: "1px solid rgba(241,232,218,0.2)",
  background: "rgba(255,255,255,0.045)",
  color: "rgba(241,232,218,0.68)",
  minHeight: "48px",
  cursor: "pointer",
};

const activeModeButton = {
  ...modeButton,
  border: "1px solid rgba(241,232,218,0.62)",
  background: "rgba(241,232,218,0.14)",
  color: "rgba(241,232,218,0.94)",
};

const sectionLabel = {
  margin: "26px 0 12px",
  letterSpacing: "0.2em",
  textTransform: "uppercase" as const,
  color: "rgba(241,232,218,0.52)",
  fontSize: "12px",
};

const buttonGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "10px",
};

const optionButton = {
  borderRadius: "18px",
  border: "1px solid rgba(241,232,218,0.18)",
  background: "rgba(255,255,255,0.045)",
  color: "rgba(241,232,218,0.72)",
  minHeight: "48px",
  cursor: "pointer",
};

const activeOptionButton = {
  ...optionButton,
  border: "1px solid rgba(241,232,218,0.5)",
  background: "rgba(241,232,218,0.13)",
  color: "rgba(241,232,218,0.92)",
};

const stopwatchNote = {
  borderRadius: "22px",
  border: "1px solid rgba(241,232,218,0.14)",
  background: "rgba(255,255,255,0.035)",
  padding: "18px",
  marginTop: "20px",
};

const soundPreviewBox = {
  marginTop: "24px",
  display: "grid",
  gap: "16px",
};

const beginButton = {
  marginTop: "28px",
  width: "100%",
  minHeight: "56px",
  borderRadius: "999px",
  border: "1px solid rgba(241,232,218,0.38)",
  background: "rgba(241,232,218,0.13)",
  color: "rgba(241,232,218,0.94)",
  cursor: "pointer",
  letterSpacing: "0.12em",
};

const sessionLayout = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.2fr) minmax(300px, 0.8fr)",
  gap: "24px",
  alignItems: "stretch",
};

const timerCard = {
  minHeight: "620px",
  borderRadius: "38px",
  border: "1px solid rgba(241,232,218,0.22)",
  background: "rgba(10,8,6,0.32)",
  backdropFilter: "blur(18px)",
  padding: "clamp(24px, 5vw, 46px)",
  boxSizing: "border-box" as const,
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center" as const,
};

const circleWrap = {
  position: "relative" as const,
  width: "min(340px, 76vw)",
  aspectRatio: "1",
  margin: "4px auto 26px",
};

const circleSvg = {
  width: "100%",
  height: "100%",
  transform: "rotate(-90deg)",
};

const circleTrack = {
  fill: "none",
  stroke: "rgba(241,232,218,0.13)",
  strokeWidth: 5,
};

const circleProgress = {
  fill: "none",
  stroke: "rgba(241,232,218,0.72)",
  strokeWidth: 5,
  strokeLinecap: "round" as const,
  strokeDasharray: 326.7,
  transition: "stroke-dashoffset 500ms ease",
};

const timerText = {
  position: "absolute" as const,
  inset: 0,
  display: "grid",
  placeItems: "center",
  fontFamily: "Cormorant Garamond, Georgia, serif",
  fontSize: "clamp(4rem, 14vw, 7.2rem)",
  fontWeight: 300,
};

const sessionHint = {
  margin: "0 auto 28px",
  color: "rgba(241,232,218,0.62)",
  fontSize: "15px",
  lineHeight: 1.7,
  maxWidth: "440px",
};

const controlRow = {
  display: "flex",
  gap: "12px",
  justifyContent: "center",
  flexWrap: "wrap" as const,
};

const controlButton = {
  borderRadius: "999px",
  border: "1px solid rgba(241,232,218,0.26)",
  background: "rgba(255,255,255,0.055)",
  color: "rgba(241,232,218,0.86)",
  padding: "14px 24px",
  minWidth: "110px",
  cursor: "pointer",
};

const messageStyle = {
  margin: "18px 0 0",
  color: "rgba(241,232,218,0.66)",
  fontSize: "14px",
};

const sidePanel = {
  display: "grid",
  gap: "18px",
};

const infoCard = {
  borderRadius: "30px",
  border: "1px solid rgba(241,232,218,0.2)",
  background: "rgba(10,8,6,0.3)",
  backdropFilter: "blur(18px)",
  padding: "24px",
  boxSizing: "border-box" as const,
};

const onlineNumber = {
  margin: "14px 0 4px",
  fontFamily: "Cormorant Garamond, Georgia, serif",
  fontSize: "3.4rem",
  fontWeight: 300,
};

const cardText = {
  margin: "12px 0 0",
  color: "rgba(241,232,218,0.58)",
  fontSize: "14px",
  lineHeight: 1.7,
};

const sliderWrap = {
  display: "grid",
  gridTemplateColumns: "64px 1fr",
  alignItems: "center",
  gap: "12px",
  width: "100%",
  color: "rgba(241,232,218,0.68)",
  fontSize: "14px",
};

const sliderInput = {
  width: "100%",
  accentColor: "rgba(241,232,218,0.78)",
  cursor: "pointer",
};

const mobileStyles = `
@media (max-width: 900px) {
  main div[data-focus-layout="setup"],
  main div[data-focus-layout="session"] {
    grid-template-columns: 1fr !important;
  }
}
`;