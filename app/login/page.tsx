"use client";

import { supabase } from "@/utils/supabase/client";

export default function LoginPage() {
  async function signInWithGoogle() {
    const origin = window.location.origin;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback?next=/forge`,
      },
    });

    if (error) {
      alert(error.message);
    }
  }

  return (
    <main style={mainStyle}>
      <div style={cardStyle}>
        <p style={smallLabel}>FocusForge</p>
        <h1 style={titleStyle}>Welcome back</h1>
        <p style={textStyle}>Sign in to save your tasks, sessions, and streaks.</p>

        <button type="button" onClick={signInWithGoogle} style={buttonStyle}>
          Continue with Google
        </button>
      </div>
    </main>
  );
}

const mainStyle = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#0c0907",
  color: "rgba(241,232,218,0.92)",
  padding: "28px",
};

const cardStyle = {
  width: "min(90vw, 520px)",
  borderRadius: "34px",
  border: "1px solid rgba(241,232,218,0.22)",
  background: "rgba(10,8,6,0.58)",
  padding: "42px",
  textAlign: "center" as const,
};

const smallLabel = {
  margin: 0,
  letterSpacing: "0.34em",
  textTransform: "uppercase" as const,
  color: "rgba(241,232,218,0.58)",
  fontSize: "13px",
};

const titleStyle = {
  fontFamily: "Cormorant Garamond, Georgia, serif",
  fontSize: "clamp(3rem, 10vw, 5rem)",
  fontWeight: 300,
  margin: "16px 0",
};

const textStyle = {
  color: "rgba(241,232,218,0.62)",
  fontSize: "17px",
  lineHeight: 1.6,
  marginBottom: "30px",
};

const buttonStyle = {
  width: "100%",
  padding: "16px",
  borderRadius: "999px",
  border: "1px solid rgba(241,232,218,0.38)",
  background: "rgba(241,232,218,0.1)",
  color: "rgba(241,232,218,0.92)",
  fontSize: "16px",
  cursor: "pointer",
};