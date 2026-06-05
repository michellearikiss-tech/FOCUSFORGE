"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const backgroundMap: Record<string, string> = {
  Library: "/library-night.png",
  Rain: "/rainforest-study.png",
  Forest: "/meadow-study.png",
  Stars: "/starry-study.png",
};

const quoteMap: Record<string, string> = {
  Energized: "Use it. Build with it.",
  Steady: "You already know what you need to do.",
  Tired: "Start gently. Stay with it.",
  Overwhelmed: "One thing. One hour.",
};

export default function PreparePage() {
  const router = useRouter();

  const [setting, setSetting] = useState("Library");
  const [state, setState] = useState("Steady");

  useEffect(() => {
    const savedSetting = localStorage.getItem("focusSetting") || "Library";
    const savedState = localStorage.getItem("focusState") || "Steady";

    setSetting(savedSetting);
    setState(savedState);

    const timer = setTimeout(() => {
      router.push("/forge");
    }, 2500);

    return () => clearTimeout(timer);
  }, [router]);

  const backgroundImage = backgroundMap[setting] || "/library-night.png";
  const quote = quoteMap[state] || "You already know what you need to do.";

  return (
    <main
      style={{
        position: "relative",
        minHeight: "100vh",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url('${backgroundImage}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(6px)",
          transform: "scale(1.04)",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.42)",
        }}
      />

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
        <p
          style={{
            letterSpacing: "0.35em",
            textTransform: "uppercase",
            color: "rgba(241,232,218,0.55)",
            marginBottom: "28px",
          }}
        >
          {setting} · {state}
        </p>

        <h1
          style={{
            fontFamily: "Cormorant Garamond, Georgia, serif",
            fontWeight: 300,
            fontSize: "clamp(3rem,5vw,5.4rem)",
            lineHeight: 1.05,
            maxWidth: "900px",
            color: "rgba(241,232,218,0.88)",
          }}
        >
          {quote}
        </h1>

        <p
          style={{
            marginTop: "34px",
            color: "rgba(241,232,218,0.55)",
            letterSpacing: "0.16em",
          }}
        >
          Preparing your focus space...
        </p>
      </div>
    </main>
  );
}