import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export default async function LoginPage() {
  async function signInWithGoogle() {
    "use server";

    const headerStore = await headers();
    const origin = headerStore.get("origin") || "http://localhost:3000";

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback?next=/forge`,
      },
    });

    if (error) {
      redirect(`/login?error=${encodeURIComponent(error.message)}`);
    }

    if (data.url) {
      redirect(data.url);
    }

    redirect("/login?error=no-url");
  }

  return (
    <main style={mainStyle}>
      <div style={cardStyle}>
        <p style={smallLabel}>FocusForge</p>
        <h1 style={titleStyle}>Welcome back</h1>
        <p style={textStyle}>Sign in to save your tasks, sessions, and streaks.</p>

        <form action={signInWithGoogle}>
          <button type="submit" style={buttonStyle}>
            Continue with Google
          </button>
        </form>
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