"use client";

import { useEffect, useRef, useState } from "react";
import { useAudio } from "../context/AudioContext";

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

const musicMap: Record<string, string | null> = {
  Library: "/audio/library-music.mp3",
  Rain: "/audio/rain-music.mp3",
  Forest: null,
  Stars: "/audio/stars-music.mp3",
};

export default function FocusPage() {
  const { changeNoise, noiseVolume, setNoiseVolume } = useAudio();
  const musicRef = useRef<HTMLAudioElement | null>(null);

  const [task, setTask] = useState("Deep Work Session");
  const [setting, setSetting] = useState("Library");

  const [mode, setMode] = useState<"timer" | "stopwatch">("timer");
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);

  const [started, setStarted] = useState(false);
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<"focus" | "break">("focus");
  const [seconds, setSeconds] = useState(25 * 60);

  const [musicOn, setMusicOn] = useState(false);
  const [musicVolume, setMusicVolume] = useState(0.25);

  useEffect(() => {
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

  useEffect(() => {
    if (musicRef.current) {
      musicRef.current.volume = musicVolume;
    }
  }, [musicVolume]);

  const backgroundImage = backgroundMap[setting] || "/library-night.png";
  const musicSrc = musicMap[setting];

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  function beginSession() {
    setStarted(true);
    setRunning(true);
    setPhase("focus");
    setSeconds(mode === "timer" ? focusMinutes * 60 : 0);
  }

  function toggleMusic() {
    if (!musicRef.current || !musicSrc) return;

    if (musicOn) {
      musicRef.current.pause();
      setMusicOn(false);
    } else {
      musicRef.current.play();
      setMusicOn(true);
    }
  }

  function completeSession() {
    window.location.href = "/forge";
  }

  return (
    <main style={{ position: "relative", minHeight: "100vh", overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url('${backgroundImage}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(5px)",
          transform: "scale(1.04)",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
        }}
      />

      {musicSrc && <audio ref={musicRef} src={musicSrc} loop />}

      <div
        style={{
          position: "relative",
          zIndex: 10,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "40px",
          color: "rgba(241,232,218,0.9)",
        }}
      >
        {!started ? (
          <>
            <p style={smallLabel}>{setting} · Focus Setup</p>

            <h1 style={titleStyle}>{task}</h1>

            <div style={setupBox}>
              <div style={rowStyle}>
                <button
                  onClick={() => setMode("timer")}
                  style={mode === "timer" ? activeButton : optionButton}
                >
                  Timer
                </button>

                <button
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
                        key={min}
                        onClick={() => setFocusMinutes(min)}
                        style={focusMinutes === min ? activeButton : optionButton}
                      >
                        {min} min
                      </button>
                    ))}
                  </div>

                  <p style={sectionLabel}>Break Duration</p>
                  <div style={rowStyle}>
                    {[5, 10, 15].map((min) => (
                      <button
                        key={min}
                        onClick={() => setBreakMinutes(min)}
                        style={breakMinutes === min ? activeButton : optionButton}
                      >
                        {min} min
                      </button>
                    ))}
                  </div>
                </>
              )}

              <button onClick={beginSession} style={beginButton}>
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

            <p style={{ color: "rgba(241,232,218,0.55)", marginBottom: "40px" }}>
              {phase === "focus"
                ? "Leave everything else outside."
                : "Step back. Breathe. Then return."}
            </p>

            <div style={{ display: "flex", gap: "18px", marginBottom: "38px" }}>
              <button onClick={() => setRunning(!running)} style={circleButton}>
                {running ? "Pause" : "Resume"}
              </button>

              <button onClick={completeSession} style={circleButton}>
                Complete
              </button>
            </div>

            <div style={{ width: "420px", maxWidth: "90vw", display: "grid", gap: "18px" }}>
              <SoundSlider label="Noise" value={noiseVolume} onChange={setNoiseVolume} />

              <SoundSlider label="Music" value={musicVolume} onChange={setMusicVolume} />

              <button
                onClick={toggleMusic}
                disabled={!musicSrc}
                style={{
                  border: "1px solid rgba(241,232,218,0.24)",
                  borderRadius: "999px",
                  background: "rgba(255,255,255,0.05)",
                  color: "rgba(241,232,218,0.78)",
                  padding: "12px 18px",
                  cursor: musicSrc ? "pointer" : "not-allowed",
                }}
              >
                {musicSrc ? (musicOn ? "Music On" : "Start Music") : "No Music for Forest"}
              </button>
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
        gridTemplateColumns: "80px 1fr",
        alignItems: "center",
        gap: "14px",
        color: "rgba(241,232,218,0.62)",
        fontSize: "14px",
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
      />
    </label>
  );
}

const smallLabel = {
  letterSpacing: "0.32em",
  textTransform: "uppercase" as const,
  color: "rgba(241,232,218,0.48)",
  marginBottom: "26px",
};

const titleStyle = {
  fontFamily: "Cormorant Garamond, Georgia, serif",
  fontSize: "clamp(2.3rem,4vw,4.6rem)",
  fontWeight: 300,
  margin: "0 0 36px",
};

const setupBox = {
  width: "520px",
  maxWidth: "92vw",
  borderRadius: "30px",
  border: "1px solid rgba(241,232,218,0.22)",
  background: "rgba(255,255,255,0.05)",
  backdropFilter: "blur(14px)",
  padding: "32px",
};

const rowStyle = {
  display: "flex",
  gap: "12px",
  justifyContent: "center",
  flexWrap: "wrap" as const,
};

const sectionLabel = {
  margin: "28px 0 14px",
  letterSpacing: "0.22em",
  textTransform: "uppercase" as const,
  color: "rgba(241,232,218,0.5)",
  fontSize: "12px",
};

const optionButton = {
  borderRadius: "999px",
  border: "1px solid rgba(241,232,218,0.22)",
  background: "rgba(0,0,0,0.16)",
  color: "rgba(241,232,218,0.7)",
  padding: "12px 20px",
  cursor: "pointer",
};

const activeButton = {
  borderRadius: "999px",
  border: "1px solid rgba(241,232,218,0.7)",
  background: "rgba(241,232,218,0.14)",
  color: "rgba(241,232,218,0.92)",
  padding: "12px 20px",
  cursor: "pointer",
};

const beginButton = {
  marginTop: "34px",
  width: "100%",
  borderRadius: "999px",
  border: "1px solid rgba(241,232,218,0.32)",
  background: "rgba(241,232,218,0.08)",
  color: "rgba(241,232,218,0.9)",
  padding: "16px",
  cursor: "pointer",
  letterSpacing: "0.12em",
};

const timerStyle = {
  fontFamily: "Cormorant Garamond, Georgia, serif",
  fontSize: "clamp(5rem,12vw,11rem)",
  fontWeight: 300,
  lineHeight: 1,
  marginBottom: "34px",
};

const circleButton = {
  width: "118px",
  height: "54px",
  borderRadius: "999px",
  border: "1px solid rgba(241,232,218,0.32)",
  background: "rgba(255,255,255,0.06)",
  color: "rgba(241,232,218,0.86)",
  cursor: "pointer",
};