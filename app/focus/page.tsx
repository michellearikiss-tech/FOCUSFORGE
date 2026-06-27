"use client";

import { useEffect, useRef, useState } from "react";
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

export default function FocusPage() {
  const { changeNoise, noiseVolume, setNoiseVolume } = useAudio();
  const musicRef = useRef<HTMLAudioElement | null>(null);

  const [userId, setUserId] = useState("");
  const [task, setTask] = useState("Deep Work Session");
  const [setting, setSetting] = useState("Library");

  const [mode, setMode] = useState<"timer" | "stopwatch">("timer");
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);

  const [started, setStarted] = useState(false);
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<"focus" | "break">("focus");
  const [seconds, setSeconds] = useState(25 * 60);

  const [musicVolume, setMusicVolume] = useState(0.25);

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
    changeNoise(sceneMap[savedSetting] || "library");
  }, [changeNoise]);

  useEffect(() => {
    if (!started || !running) return;

    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (mode === "stopwatch") return prev + 1;

        if (prev <= 1) {
          if (phase === "focus") {
            setPhase("break");
            return breakMinutes * 60;
          }

          setRunning(false);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [started, running, mode, phase, breakMinutes]);

  const backgroundImage = backgroundMap[setting] || "/library-night.png";

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  function beginSession() {
    setStarted(true);
    setRunning(true);
    setPhase("focus");
    setSeconds(mode === "timer" ? focusMinutes * 60 : 0);
  }

  async function completeSession() {
    if (!userId) {
      window.location.href = "/complete";
      return;
    }

    const durationMinutes =
      mode === "timer" ? focusMinutes : Math.max(1, Math.floor(seconds / 60));

    const { error } = await supabase.from("study_sessions").insert({
      user_id: userId,
      task_name: task,
      duration_minutes: durationMinutes,
    });

    if (error) {
      console.error("Save study session error:", error);
    }

    window.location.href = "/complete";
  }

  return (
    <main
      style={{
        position: "relative",
        minHeight: "100svh",
        overflow: "hidden",
        background: "#0b0807",
      }}
    >
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage: `url('${backgroundImage}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(3px)",
          transform: "scale(1.04)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div
        style={{
          position: "fixed",
          inset: 0,
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.48), rgba(0,0,0,0.68))",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 10,
          minHeight: "100svh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "24px 20px",
          color: "rgba(241,232,218,0.9)",
          boxSizing: "border-box",
        }}
      >
        {!started ? (
          <>
            <p style={smallLabel}>{setting} · Focus Setup</p>

            <h1 style={titleStyle}>{task}</h1>

            <div style={setupBox}>
              <div style={rowStyle}>
                <button
                  type="button"
                  onClick={() => setMode("timer")}
                  style={mode === "timer" ? activeButton : optionButton}
                >
                  Timer
                </button>

                <button
                  type="button"
                  onClick={() => setMode("stopwatch")}
                  style={mode === "stopwatch" ? activeButton : optionButton}
                >
                  Stopwatch
                </button>
              </div>

              {mode === "timer" && (
                <>
                  <p style={sectionLabel}>Focus Duration</p>
                  <div style={rowStyle}>
                    {[15, 25, 45, 60].map((min) => (
                      <button
                        type="button"
                        key={min}
                        onClick={() => setFocusMinutes(min)}
                        style={
                          focusMinutes === min ? activeButton : optionButton
                        }
                      >
                        {min} min
                      </button>
                    ))}
                  </div>

                  <p style={sectionLabel}>Break Duration</p>
                  <div style={rowStyle}>
                    {[5, 10, 15].map((min) => (
                      <button
                        type="button"
                        key={min}
                        onClick={() => setBreakMinutes(min)}
                        style={
                          breakMinutes === min ? activeButton : optionButton
                        }
                      >
                        {min} min
                      </button>
                    ))}
                  </div>
                </>
              )}

              <button type="button" onClick={beginSession} style={beginButton}>
                Begin Session →
              </button>
            </div>
          </>
        ) : (
          <>
            <p style={smallLabel}>
              {setting} · {phase === "focus" ? "Focus" : "Break"}
            </p>

            <h1 style={titleStyle}>{task}</h1>

            <div style={timerStyle}>
              {String(minutes).padStart(2, "0")}:
              {String(remainingSeconds).padStart(2, "0")}
            </div>

            <p
              style={{
                color: "rgba(241,232,218,0.58)",
                margin: "0 0 30px",
                maxWidth: "320px",
                lineHeight: 1.7,
                fontSize: "14px",
              }}
            >
              {phase === "focus"
                ? "Leave everything else outside."
                : "Step back. Breathe. Then return."}
            </p>

            <div style={controlRow}>
              <button
                type="button"
                onClick={() => setRunning(!running)}
                style={circleButton}
              >
                {running ? "Pause" : "Resume"}
              </button>

              <button type="button" onClick={completeSession} style={circleButton}>
                Complete
              </button>
            </div>

            <div style={soundBox}>
              <SoundSlider
                label="Noise"
                value={noiseVolume}
                onChange={setNoiseVolume}
              />

              <SoundSlider
                label="Music"
                value={musicVolume}
                onChange={setMusicVolume}
              />
            </div>
          </>
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
    <label
      style={{
        display: "grid",
        gridTemplateColumns: "68px 1fr",
        alignItems: "center",
        gap: "12px",
        color: "rgba(241,232,218,0.68)",
        fontSize: "14px",
        width: "100%",
        minHeight: "44px",
      }}
    >
      {label}
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%" }}
      />
    </label>
  );
}

const smallLabel = {
  letterSpacing: "0.26em",
  textTransform: "uppercase" as const,
  color: "rgba(241,232,218,0.5)",
  marginBottom: "18px",
  fontSize: "11px",
};

const titleStyle = {
  fontFamily: "Cormorant Garamond, Georgia, serif",
  fontSize: "clamp(2rem, 7vw, 4.2rem)",
  fontWeight: 300,
  lineHeight: 1.08,
  margin: "0 0 28px",
  maxWidth: "92vw",
};

const setupBox = {
  width: "100%",
  maxWidth: "520px",
  borderRadius: "30px",
  border: "1px solid rgba(241,232,218,0.22)",
  background: "rgba(255,255,255,0.05)",
  padding: "24px",
  boxSizing: "border-box" as const,
};

const rowStyle = {
  display: "flex",
  gap: "12px",
  justifyContent: "center",
  flexWrap: "wrap" as const,
};

const sectionLabel = {
  margin: "26px 0 14px",
  letterSpacing: "0.2em",
  textTransform: "uppercase" as const,
  color: "rgba(241,232,218,0.5)",
  fontSize: "12px",
};

const optionButton = {
  borderRadius: "999px",
  border: "1px solid rgba(241,232,218,0.22)",
  background: "rgba(0,0,0,0.16)",
  color: "rgba(241,232,218,0.72)",
  padding: "13px 20px",
  minHeight: "48px",
  minWidth: "96px",
  cursor: "pointer",
};

const activeButton = {
  ...optionButton,
  border: "1px solid rgba(241,232,218,0.7)",
  background: "rgba(241,232,218,0.14)",
  color: "rgba(241,232,218,0.92)",
};

const beginButton = {
  marginTop: "32px",
  width: "100%",
  borderRadius: "999px",
  border: "1px solid rgba(241,232,218,0.36)",
  background: "rgba(241,232,218,0.1)",
  color: "rgba(241,232,218,0.92)",
  padding: "16px",
  minHeight: "54px",
  cursor: "pointer",
  letterSpacing: "0.12em",
};

const timerStyle = {
  fontFamily: "Cormorant Garamond, Georgia, serif",
  fontSize: "clamp(5rem, 22vw, 11rem)",
  fontWeight: 300,
  lineHeight: 1,
  marginBottom: "26px",
};

const controlRow = {
  display: "flex",
  gap: "14px",
  marginBottom: "32px",
  justifyContent: "center",
  width: "100%",
  maxWidth: "420px",
};

const circleButton = {
  width: "min(42vw, 128px)",
  height: "54px",
  borderRadius: "999px",
  border: "1px solid rgba(241,232,218,0.32)",
  background: "rgba(255,255,255,0.06)",
  color: "rgba(241,232,218,0.86)",
  cursor: "pointer",
};

const soundBox = {
  width: "100%",
  maxWidth: "420px",
  display: "grid",
  gap: "16px",
};