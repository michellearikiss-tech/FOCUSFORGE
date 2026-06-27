"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

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
  return (
    <Suspense fallback={<main style={{ height: "100svh", background: "#0b0807" }} />}>
      <PrepareContent />
    </Suspense>
  );
}

function PrepareContent() {
  const searchParams = useSearchParams();

  const setting = searchParams.get("space") || "Library";
  const state = searchParams.get("state") || "Steady";

  const backgroundImage = backgroundMap[setting] || backgroundMap.Library;
  const quote = quoteMap[state] || quoteMap.Steady;

  return (
    <>
      <meta httpEquiv="refresh" content="3;url=/forge" />

      <main
        style={{
          position: "relative",
          height: "100svh",
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
            filter: "blur(5px)",
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
              "linear-gradient(to bottom, rgba(0,0,0,0.42), rgba(0,0,0,0.66))",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 10,
            height: "100svh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "28px",
            color: "rgba(241,232,218,0.9)",
            boxSizing: "border-box",
          }}
        >
          <p
            style={{
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: "rgba(241,232,218,0.55)",
              marginBottom: "24px",
              fontSize: "11px",
            }}
          >
            {setting} · {state}
          </p>

          <h1
            style={{
              fontFamily: "Cormorant Garamond, Georgia, serif",
              fontWeight: 300,
              fontSize: "clamp(2.6rem, 9vw, 5.4rem)",
              lineHeight: 1.05,
              maxWidth: "900px",
              color: "rgba(241,232,218,0.88)",
              margin: 0,
            }}
          >
            {quote}
          </h1>

          <p
            style={{
              marginTop: "32px",
              color: "rgba(241,232,218,0.55)",
              letterSpacing: "0.14em",
              fontSize: "12px",
            }}
          >
            Preparing your focus space...
          </p>

          <a
            href="/forge"
            style={{
              marginTop: "28px",
              width: "100%",
              maxWidth: "360px",
              height: "54px",
              borderRadius: "999px",
              border: "1px solid rgba(241,232,218,0.36)",
              background: "rgba(255,255,255,0.08)",
              color: "rgba(241,232,218,0.9)",
              fontSize: "14px",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textDecoration: "none",
            }}
          >
            Continue to Forge →
          </a>
        </div>
      </main>
    </>
  );
}