"use client";

import { useEffect, useState } from "react";

function getHomeBackground() {
  const hour = new Date().getHours();
  return hour >= 18 || hour < 6 ? "/reading-night.png" : "/library-study.png";
}

export default function Home() {
  const [background, setBackground] = useState("/library-study.png");

  useEffect(() => {
    setBackground(getHomeBackground());
  }, []);

  return (
    <main
      style={{
        position: "relative",
        minHeight: "100vh",
        width: "100vw",
        overflow: "hidden",
        backgroundImage: `url('${background}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.28)",
        }}
      />

      <div
        style={{
          position: "relative",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          transform: "translateY(-32px)",
          padding: "0 24px",
        }}
      >
        <h1
          style={{
            fontFamily: "Cormorant Garamond, Georgia, serif",
            fontSize: "clamp(2.9rem,5.3vw,5.6rem)",
            fontWeight: 300,
            lineHeight: 1.08,
            color: "rgba(241,232,218,0.86)",
          }}
        >
          Become someone
          <br />
          <em style={{ color: "rgba(241,232,218,0.82)" }}>
            you would admire.
          </em>
        </h1>

        <p
          style={{
            marginTop: "28px",
            fontSize: "14px",
            letterSpacing: "0.18em",
            color: "rgba(241,232,218,0.62)",
          }}
        >
          The life you want is earned in moments like this.
        </p>

        <a
          href="/check-in"
          style={{
            marginTop: "44px",
            borderRadius: "999px",
            border: "1px solid rgba(241,232,218,0.28)",
            padding: "14px 56px",
            color: "rgba(241,232,218,0.82)",
            textDecoration: "none",
            backdropFilter: "blur(8px)",
          }}
        >
          Begin
        </a>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: "28px",
          left: "32px",
          zIndex: 20,
          letterSpacing: "0.34em",
          textTransform: "uppercase",
          fontSize: "12px",
          color: "rgba(241,232,218,0.32)",
        }}
      >
        FocusForge
      </div>
    </main>
  );
}