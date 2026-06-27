"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";

type StudySession = {
  completed_at: string;
};

function getHomeBackground() {
  const hour = new Date().getHours();
  return hour >= 18 || hour < 6 ? "/reading-night.png" : "/library-study.png";
}

export default function Home() {
  const [background, setBackground] = useState("/library-study.png");
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    setBackground(getHomeBackground());
    loadStreak();
  }, []);

  async function loadStreak() {
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) return;

    const { data, error } = await supabase
      .from("study_sessions")
      .select("completed_at")
      .eq("user_id", userData.user.id)
      .order("completed_at", { ascending: false });

    if (error) {
      console.error("Load streak error:", error);
      return;
    }

    setStreak(calculateStreak(data || []));
  }

  function calculateStreak(sessions: StudySession[]) {
    const studyDays = Array.from(
      new Set(
        sessions.map((session) =>
          new Date(session.completed_at).toISOString().split("T")[0]
        )
      )
    );

    let count = 0;
    const today = new Date();

    for (let i = 0; i < 365; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateString = date.toISOString().split("T")[0];

      if (studyDays.includes(dateString)) {
        count++;
      } else {
        break;
      }
    }

    return count;
  }

  function getStreakMessage(days: number) {
    if (days >= 365) return "A year of showing up.";
    if (days >= 100) return "This is becoming who you are.";
    if (days >= 30) return "Momentum is building.";
    if (days >= 7) return "A week of consistency.";
    if (days >= 1) return "You showed up today.";
    return "Every streak starts with one day.";
  }

  return (
    <main
      style={{
        position: "relative",
        height: "100svh",
        width: "100%",
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
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.25), rgba(0,0,0,0.48))",
          pointerEvents: "none",
        }}
      />

      <section
        style={{
          position: "relative",
          zIndex: 2,
          height: "100svh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "22px",
          boxSizing: "border-box",
          transform: "translateY(-10px)",
        }}
      >
        <h1
          style={{
            fontFamily: "Cormorant Garamond, Georgia, serif",
            fontSize: "clamp(2.7rem, 10vw, 5.6rem)",
            fontWeight: 300,
            lineHeight: 1.04,
            color: "var(--text-primary, rgba(241,232,218,0.9))",
            margin: 0,
          }}
        >
          Become someone
          <br />
          <em style={{ color: "rgba(241,232,218,0.84)" }}>
            you would admire.
          </em>
        </h1>

        <p
          style={{
            marginTop: "22px",
            maxWidth: "330px",
            fontSize: "clamp(11px, 3vw, 14px)",
            lineHeight: 1.8,
            letterSpacing: "0.14em",
            color: "var(--text-secondary, rgba(241,232,218,0.66))",
          }}
        >
          The life you want is earned in moments like this.
        </p>

        <div
          style={{
            marginTop: "20px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "5px",
          }}
        >
          <span
            style={{
              fontSize: "11px",
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              color: "rgba(241,232,218,0.62)",
            }}
          >
            {streak} Day Streak
          </span>

          <span
            style={{
              fontSize: "13px",
              fontStyle: "italic",
              color: "var(--text-muted, rgba(241,232,218,0.42))",
            }}
          >
            {getStreakMessage(streak)}
          </span>
        </div>

        <a
          href="/check-in"
          style={{
            marginTop: "26px",
            width: "min(82vw, 300px)",
            borderRadius: "999px",
            padding: "15px 0",
            border: "1px solid rgba(241,232,218,0.46)",
            background: "rgba(241,232,218,0.12)",
            boxShadow: "0 0 34px rgba(241,232,218,0.12)",
            color: "rgba(241,232,218,0.96)",
            fontSize: "15px",
            letterSpacing: "0.13em",
            textDecoration: "none",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
        >
          Begin
        </a>

        <nav
          style={{
            marginTop: "16px",
            width: "min(86vw, 340px)",
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "10px",
          }}
        >
          {[
            ["Calendar", "/calendar"],
            ["Forge", "/forge"],
            ["History", "/history"],
          ].map(([label, href]) => (
            <a
              key={label}
              href={href}
              style={{
                borderRadius: "999px",
                border: "1px solid rgba(241,232,218,0.18)",
                background: "rgba(241,232,218,0.07)",
                color: "rgba(241,232,218,0.66)",
                padding: "10px 0",
                textDecoration: "none",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                fontSize: "12px",
                letterSpacing: "0.08em",
              }}
            >
              {label}
            </a>
          ))}
        </nav>

        <div
          style={{
            position: "absolute",
            bottom: "18px",
            left: 0,
            right: 0,
            letterSpacing: "0.34em",
            textTransform: "uppercase",
            fontSize: "10px",
            color: "rgba(241,232,218,0.32)",
          }}
        >
          FocusForge
        </div>
      </section>
    </main>
  );
}