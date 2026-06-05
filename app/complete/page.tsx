"use client";

export default function CompletePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#050403",
        color: "rgba(241,232,218,0.9)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "40px",
      }}
    >
      <div>
        <p
          style={{
            letterSpacing: "0.34em",
            textTransform: "uppercase",
            color: "rgba(241,232,218,0.5)",
            marginBottom: "28px",
          }}
        >
          Session Complete
        </p>

        <h1
          style={{
            fontFamily: "Cormorant Garamond, Georgia, serif",
            fontWeight: 300,
            fontSize: "clamp(3rem,6vw,6rem)",
            lineHeight: 1.05,
            margin: 0,
          }}
        >
          You already are
          <br />
          <em>becoming them.</em>
        </h1>

        <button
          onClick={() => {
            window.location.href = "/forge";
          }}
          style={{
            marginTop: "52px",
            borderRadius: "999px",
            border: "1px solid rgba(241,232,218,0.34)",
            background: "rgba(255,255,255,0.05)",
            color: "rgba(241,232,218,0.86)",
            padding: "16px 58px",
            cursor: "pointer",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
          }}
        >
          Return to Forge
        </button>
      </div>
    </main>
  );
}