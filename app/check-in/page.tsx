"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAudio } from "../context/AudioContext";

type Scene = "library" | "rain" | "forest" | "stars";

const environments: {
  name: string;
  scene: Scene;
  image: string;
}[] = [
  { name: "Library", scene: "library", image: "/library-night.png" },
  { name: "Rain", scene: "rain", image: "/rainforest-study.png" },
  { name: "Forest", scene: "forest", image: "/meadow-study.png" },
  { name: "Stars", scene: "stars", image: "/starry-study.png" },
];

const states = ["Energized", "Steady", "Tired", "Overwhelmed"];

export default function CheckIn() {
  const router = useRouter();
  const { changeNoise } = useAudio();

  const [environment, setEnvironment] = useState(environments[0]);
  const [state, setState] = useState("Steady");

  function chooseEnvironment(name: string) {
    const next = environments.find((item) => item.name === name);
    if (!next) return;

    setEnvironment(next);
    changeNoise(next.scene);
  }

  function enterFocus() {
    localStorage.setItem("focusSetting", environment.name);
    localStorage.setItem("focusState", state);
    router.push("/prepare");
  }

  return (
    <main style={{ position: "relative", minHeight: "100vh", overflow: "hidden" }}>
      <div
        key={environment.image}
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url('${environment.image}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(8px)",
          transform: "scale(1.05)",
        }}
      />

      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.42)" }} />

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
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "rgba(241,232,218,0.65)",
            marginBottom: "24px",
          }}
        >
          Before You Begin
        </p>

        <h1
          style={{
            fontFamily: "Cormorant Garamond, Georgia, serif",
            fontWeight: 300,
            fontSize: "clamp(2.4rem,4vw,4.2rem)",
            lineHeight: 1.08,
            maxWidth: "820px",
            color: "rgba(241,232,218,0.56)",
            marginBottom: "64px",
          }}
        >
          The life you want
          <br />
          <em style={{ color: "rgba(241,232,218,0.5)" }}>
            is earned in moments like this.
          </em>
        </h1>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "80px",
            width: "min(1000px,90vw)",
          }}
        >
          <EnvironmentGroup selected={environment.name} onSelect={chooseEnvironment} />

          <ChoiceGroup
            title="How Are You Arriving Today?"
            items={states}
            selected={state}
            onSelect={setState}
          />
        </div>

        <button
          onClick={enterFocus}
          style={{
            marginTop: "60px",
            width: "380px",
            height: "72px",
            borderRadius: "999px",
            border: "1px solid rgba(241,232,218,0.35)",
            background: "rgba(255,255,255,0.05)",
            backdropFilter: "blur(12px)",
            color: "rgba(241,232,218,0.9)",
            fontSize: "1rem",
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            cursor: "pointer",
          }}
        >
          Enter Focus →
        </button>
      </div>
      <div
  style={{
    position: "absolute",
    bottom: "28px",
    left: "32px",
    letterSpacing: "0.34em",
    textTransform: "uppercase",
    fontSize: "12px",
    color: "rgba(241,232,218,0.38)",
  }}
>
  FocusForge
</div>
    </main>
  );
}

function EnvironmentGroup({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <div>
      <p
        style={{
          marginBottom: "20px",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "rgba(241,232,218,0.65)",
        }}
      >
        Choose Your Space
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px" }}>
        {environments.map((item) => {
          const active = selected === item.name;

          return (
            <button
              key={item.name}
              onClick={() => onSelect(item.name)}
              style={{
                height: "120px",
                borderRadius: "24px",
                border: active
                  ? "1px solid rgba(241,232,218,0.75)"
                  : "1px solid rgba(241,232,218,0.25)",
                background: active ? "rgba(241,232,218,0.12)" : "rgba(0,0,0,0.15)",
                backdropFilter: "blur(12px)",
                color: "rgba(241,232,218,0.9)",
                fontSize: "1.15rem",
                cursor: "pointer",
              }}
            >
              {item.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ChoiceGroup({
  title,
  items,
  selected,
  onSelect,
}: {
  title: string;
  items: string[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <div>
      <p
        style={{
          marginBottom: "20px",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "rgba(241,232,218,0.65)",
        }}
      >
        {title}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px" }}>
        {items.map((item) => {
          const active = selected === item;

          return (
            <button
              key={item}
              onClick={() => onSelect(item)}
              style={{
                height: "120px",
                borderRadius: "24px",
                border: active
                  ? "1px solid rgba(241,232,218,0.75)"
                  : "1px solid rgba(241,232,218,0.25)",
                background: active ? "rgba(241,232,218,0.12)" : "rgba(0,0,0,0.15)",
                backdropFilter: "blur(12px)",
                color: "rgba(241,232,218,0.9)",
                fontSize: "1.15rem",
                cursor: "pointer",
              }}
            >
              {item}
            </button>
          );
        })}
      </div>
    </div>
  );
}