"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

type Environment = {
  name: string;
  image: string;
};

const environments: Environment[] = [
  { name: "Library", image: "/library-night.png" },
  { name: "Rain", image: "/rainforest-study.png" },
  { name: "Forest", image: "/meadow-study.png" },
  { name: "Stars", image: "/starry-study.png" },
];

const states = ["Energized", "Steady", "Tired", "Overwhelmed"];

export default function CheckIn() {
  return (
    <Suspense fallback={<main style={mainStyle} />}>
      <CheckInContent />
    </Suspense>
  );
}

function CheckInContent() {
  const searchParams = useSearchParams();

  const space = searchParams.get("space") || "Library";
  const state = searchParams.get("state") || "Steady";

  const environment =
    environments.find((item) => item.name === space) || environments[0];

  function optionHref(nextSpace: string, nextState: string) {
    return `/check-in?space=${encodeURIComponent(
      nextSpace
    )}&state=${encodeURIComponent(nextState)}`;
  }

  function prepareHref() {
    return `/prepare?space=${encodeURIComponent(
      space
    )}&state=${encodeURIComponent(state)}`;
  }

  return (
    <main style={mainStyle}>
      <div
        style={{
          ...backgroundStyle,
          backgroundImage: `url('${environment.image}')`,
        }}
      />

      <div style={overlayStyle} />

      <div style={contentStyle}>
        <p style={topLabel}>Before You Begin</p>

        <h1 style={titleStyle}>
          The life you want
          <br />
          <em style={{ color: "rgba(241,232,218,0.56)" }}>
            is earned in moments like this.
          </em>
        </h1>

        <div style={groupsGrid}>
          <div style={{ width: "100%" }}>
            <p style={groupLabel}>Choose Your Space</p>

            <div style={buttonGrid}>
              {environments.map((item) => (
                <a
                  key={item.name}
                  href={optionHref(item.name, state)}
                  style={space === item.name ? activeChoiceButton : choiceButton}
                >
                  {item.name}
                </a>
              ))}
            </div>
          </div>

          <div style={{ width: "100%" }}>
            <p style={groupLabel}>How Are You Arriving Today?</p>

            <div style={buttonGrid}>
              {states.map((item) => (
                <a
                  key={item}
                  href={optionHref(space, item)}
                  style={state === item ? activeChoiceButton : choiceButton}
                >
                  {item}
                </a>
              ))}
            </div>
          </div>
        </div>

        <a
  href={prepareHref()}
  onClick={() => {
    localStorage.setItem("focusSetting", space);
    localStorage.setItem("focusState", state);
  }}
  style={enterButton}
>
  Enter Focus →
</a>

        <div style={brandStyle}>FocusForge</div>
      </div>
    </main>
  );
}

const mainStyle = {
  position: "relative" as const,
  height: "100svh",
  overflow: "hidden",
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
    "linear-gradient(to bottom, rgba(0,0,0,0.42), rgba(0,0,0,0.66))",
  pointerEvents: "none" as const,
  zIndex: 1,
};

const contentStyle = {
  position: "relative" as const,
  zIndex: 10,
  height: "100svh",
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center" as const,
  padding: "18px 20px",
  color: "rgba(241,232,218,0.9)",
  boxSizing: "border-box" as const,
};

const topLabel = {
  letterSpacing: "0.24em",
  textTransform: "uppercase" as const,
  color: "rgba(241,232,218,0.62)",
  margin: "0 0 10px",
  fontSize: "10px",
};

const titleStyle = {
  fontFamily: "Cormorant Garamond, Georgia, serif",
  fontWeight: 300,
  fontSize: "clamp(2rem, 6vw, 4.2rem)",
  lineHeight: 1.05,
  maxWidth: "760px",
  color: "rgba(241,232,218,0.64)",
  margin: "0 0 24px",
};

const groupsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "24px",
  width: "100%",
  maxWidth: "980px",
};

const groupLabel = {
  margin: "0 0 12px",
  letterSpacing: "0.18em",
  textTransform: "uppercase" as const,
  color: "rgba(241,232,218,0.66)",
  fontSize: "11px",
};

const buttonGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "14px",
  width: "100%",
};

const choiceButton = {
  height: "78px",
  borderRadius: "22px",
  border: "1px solid rgba(241,232,218,0.25)",
  background: "rgba(0,0,0,0.16)",
  color: "rgba(241,232,218,0.9)",
  fontSize: "1rem",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textDecoration: "none",
};

const activeChoiceButton = {
  ...choiceButton,
  border: "1px solid rgba(241,232,218,0.78)",
  background: "rgba(241,232,218,0.16)",
};

const enterButton = {
  marginTop: "28px",
  width: "100%",
  maxWidth: "440px",
  height: "58px",
  borderRadius: "999px",
  border: "1px solid rgba(241,232,218,0.4)",
  background: "rgba(255,255,255,0.08)",
  color: "rgba(241,232,218,0.94)",
  fontSize: "0.92rem",
  letterSpacing: "0.2em",
  textTransform: "uppercase" as const,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textDecoration: "none",
};

const brandStyle = {
  marginTop: "14px",
  letterSpacing: "0.3em",
  textTransform: "uppercase" as const,
  fontSize: "9px",
  color: "rgba(241,232,218,0.28)",
};