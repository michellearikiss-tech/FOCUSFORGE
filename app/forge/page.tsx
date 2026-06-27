"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import type { User } from "@supabase/supabase-js";

const backgroundMap: Record<string, string> = {
  Library: "/library-night.png",
  Rain: "/rainforest-study.png",
  Forest: "/meadow-study.png",
  Stars: "/starry-study.png",
};

const columns = [
  { key: "now", title: "NOW", label: "Do first", hint: "The one thing that needs your attention first." },
  { key: "next", title: "NEXT", label: "Plan", hint: "Important, but not immediate." },
  { key: "later", title: "LATER", label: "Keep for later", hint: "Worth keeping, not worth starting now." },
  { key: "letgo", title: "LET GO", label: "Release", hint: "Noise, distractions, and things to release." },
];

type Task = {
  id: string;
  user_id: string;
  column_key: string;
  text: string;
  done: boolean;
  created_at?: string;
};

type TaskMap = Record<string, Task[]>;

export default function ForgePage() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [setting, setSetting] = useState("Library");
  const [message, setMessage] = useState("Checking login...");
  const [tasks, setTasks] = useState<TaskMap>({
    now: [],
    next: [],
    later: [],
    letgo: [],
  });
  const [selectedTask, setSelectedTask] = useState<{ task: Task; column: string } | null>(null);

  useEffect(() => {
    setSetting(localStorage.getItem("focusSetting") || "Library");

    let alive = true;

    async function checkAuth() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (!alive) return;

      if (error) {
        setUser(null);
        setAuthChecked(true);
        setMessage(error.message);
        return;
      }

      setUser(user);
      setAuthChecked(true);

      if (user) {
        setMessage("");
        loadTasks(user.id);
      } else {
        setMessage("Please log in before adding tasks.");
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;

      setUser(currentUser);
      setAuthChecked(true);

      if (currentUser) {
        setMessage("");
        loadTasks(currentUser.id);
      } else {
        setTasks({ now: [], next: [], later: [], letgo: [] });
        setMessage("Please log in before adding tasks.");
      }
    });

    checkAuth();

    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, []);

  async function loadTasks(userId: string) {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) {
      setMessage(`Could not load tasks: ${error.message}`);
      return;
    }

    const grouped: TaskMap = { now: [], next: [], later: [], letgo: [] };

    data?.forEach((task) => {
      if (grouped[task.column_key]) {
        grouped[task.column_key].push(task);
      }
    });

    setTasks(grouped);
  }

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
    setTasks({ now: [], next: [], later: [], letgo: [] });
    setMessage("Logged out.");
  }

  async function addTask(column: string, text: string) {
    if (!user) {
      window.location.href = "/login";
      return;
    }

    const cleanText = text.trim();
    if (!cleanText) return;

    const { data, error } = await supabase
      .from("tasks")
      .insert({
        user_id: user.id,
        column_key: column,
        text: cleanText,
        done: false,
      })
      .select()
      .single();

    if (error) {
      setMessage(`Could not add task: ${error.message}`);
      return;
    }

    setTasks((prev) => ({
      ...prev,
      [column]: [...prev[column], data],
    }));

    setMessage("");
  }

  async function completeTask() {
    if (!selectedTask) return;

    const { task, column } = selectedTask;

    const { error } = await supabase
      .from("tasks")
      .update({ done: true })
      .eq("id", task.id);

    if (error) {
      setMessage(`Could not complete task: ${error.message}`);
      return;
    }

    setTasks((prev) => ({
      ...prev,
      [column]: prev[column].map((item) =>
        item.id === task.id ? { ...item, done: true } : item
      ),
    }));

    setSelectedTask(null);
  }

  async function deleteTask() {
    if (!selectedTask) return;

    const { task, column } = selectedTask;

    const { error } = await supabase.from("tasks").delete().eq("id", task.id);

    if (error) {
      setMessage(`Could not delete task: ${error.message}`);
      return;
    }

    setTasks((prev) => ({
      ...prev,
      [column]: prev[column].filter((item) => item.id !== task.id),
    }));

    setSelectedTask(null);
  }

  function startFocus() {
    if (!selectedTask) return;
    localStorage.setItem("activeTask", selectedTask.task.text);
    window.location.href = "/focus";
  }

  const backgroundImage = backgroundMap[setting] || backgroundMap.Library;

  return (
    <main style={{ position: "relative", minHeight: "100vh", overflowX: "hidden" }}>
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          backgroundImage: `url('${backgroundImage}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(6px)",
          transform: "scale(1.04)",
        }}
      />

      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1,
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.58), rgba(0,0,0,0.48), rgba(0,0,0,0.62))",
        }}
      />

      <div style={pageContentStyle}>
        <header style={headerStyle}>
          <div>
            <p style={smallLabel}>FocusForge</p>
            <h1 style={mainTitle}>What matters now?</h1>
          </div>

          <div style={headerActionsStyle}>
            <div style={{ textAlign: "right" }}>
              <p style={{ margin: 0, fontSize: "13px", color: "rgba(241,232,218,0.5)" }}>
                {!authChecked ? "Checking account" : user ? "Signed in as" : "Not signed in"}
              </p>

              <p style={{ margin: "4px 0 0", fontSize: "14px", color: "rgba(241,232,218,0.78)" }}>
                {!authChecked ? "Please wait..." : user?.email || "Login needed to save tasks"}
              </p>
            </div>

            <div style={actionRowStyle}>
              <a href="/calendar" style={featureButtonStyle}>Calendar</a>
              <a href="/check-in" style={secondaryFeatureButtonStyle}>Change Space</a>

              {user ? (
                <button type="button" onClick={logout} style={logoutButton}>Logout</button>
              ) : (
                <a href="/login" style={logoutButton}>Login</a>
              )}
            </div>
          </div>
        </header>

        {message && <div style={messageStyle}>{message}</div>}

        <section style={quadrantGrid}>
          {columns.map((column) => (
            <Quadrant
              key={column.key}
              title={column.title}
              label={column.label}
              hint={column.hint}
              tasks={tasks[column.key]}
              disabled={false}
              onAdd={(text) => addTask(column.key, text)}
              onSelect={(task) => setSelectedTask({ task, column: column.key })}
            />
          ))}
        </section>
      </div>

      {selectedTask && (
        <div style={modalOverlay}>
          <div style={modalCard}>
            <button type="button" onClick={() => setSelectedTask(null)} style={closeButton}>×</button>

            <p style={smallLabel}>Selected Thought</p>
            <h2 style={modalTitle}>{selectedTask.task.text}</h2>
            <p style={modalText}>Choose what happens next.</p>

            <button type="button" onClick={startFocus} style={primaryButtonStyle}>Start Focus</button>
            <button type="button" onClick={completeTask} style={secondaryButtonStyle}>Mark Complete</button>
            <button type="button" onClick={deleteTask} style={dangerButtonStyle}>Delete</button>
          </div>
        </div>
      )}
    </main>
  );
}

function Quadrant({
  title,
  label,
  hint,
  tasks,
  disabled,
  onAdd,
  onSelect,
}: {
  title: string;
  label: string;
  hint: string;
  tasks: Task[];
  disabled: boolean;
  onAdd: (text: string) => void;
  onSelect: (task: Task) => void;
}) {
  const [value, setValue] = useState("");

  return (
    <div style={quadrantCard}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "14px", marginBottom: "14px" }}>
        <div>
          <p style={columnTitle}>{title}</p>
          <h2 style={columnLabel}>{label}</h2>
        </div>

        <span style={{ color: "rgba(241,232,218,0.38)", fontSize: "22px" }}>→</span>
      </div>

      <p style={hintStyle}>{hint}</p>

      <div style={{ display: "grid", gap: "12px" }}>
        {tasks.map((task) => (
          <button key={task.id} type="button" onClick={() => onSelect(task)} style={taskButton(task.done)}>
            {task.done ? "✓" : "○"} {task.text}
          </button>
        ))}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onAdd(value);
            setValue("");
          }}
        >
          <input
            value={value}
            disabled={disabled}
            onChange={(e) => setValue(e.target.value)}
            placeholder="+ Add Thought"
            style={inputStyle(disabled)}
          />
        </form>
      </div>
    </div>
  );
}

const pageContentStyle = {
  position: "relative" as const,
  zIndex: 10,
  minHeight: "100vh",
  width: "100%",
  boxSizing: "border-box" as const,
  padding: "clamp(28px, 7vw, 44px) clamp(18px, 6vw, 56px)",
  color: "rgba(241,232,218,0.92)",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "24px",
  marginBottom: "24px",
  flexWrap: "wrap" as const,
};

const headerActionsStyle = {
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "flex-end",
  gap: "16px",
  maxWidth: "100%",
};

const actionRowStyle = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap" as const,
  justifyContent: "flex-end",
};

const smallLabel = {
  margin: 0,
  letterSpacing: "0.34em",
  textTransform: "uppercase" as const,
  color: "rgba(241,232,218,0.58)",
  fontSize: "13px",
};

const mainTitle = {
  margin: "10px 0 0",
  fontFamily: "Cormorant Garamond, Georgia, serif",
  fontSize: "clamp(3rem, 14vw, 4.6rem)",
  fontWeight: 300,
  lineHeight: 0.95,
};

const messageStyle = {
  marginBottom: "20px",
  border: "1px solid rgba(241,232,218,0.22)",
  borderRadius: "18px",
  background: "rgba(10,8,6,0.32)",
  padding: "13px 16px",
  color: "rgba(241,232,218,0.72)",
  fontSize: "14px",
};

const quadrantGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: "22px",
};

const quadrantCard = {
  minHeight: "230px",
  borderRadius: "28px",
  border: "1px solid rgba(241,232,218,0.24)",
  background: "rgba(10,8,6,0.24)",
  backdropFilter: "blur(14px)",
  padding: "24px",
  boxSizing: "border-box" as const,
};

const columnTitle = {
  margin: 0,
  letterSpacing: "0.26em",
  textTransform: "uppercase" as const,
  fontSize: "13px",
  color: "rgba(241,232,218,0.68)",
};

const columnLabel = {
  margin: "8px 0 0",
  fontFamily: "Cormorant Garamond, Georgia, serif",
  fontSize: "clamp(2rem, 9vw, 2.8rem)",
  fontWeight: 300,
};

const hintStyle = {
  margin: "0 0 22px",
  fontSize: "15px",
  lineHeight: 1.6,
  color: "rgba(241,232,218,0.58)",
};

function inputStyle(disabled: boolean) {
  return {
    width: "100%",
    boxSizing: "border-box" as const,
    marginTop: "4px",
    border: "1px solid rgba(241,232,218,0.18)",
    borderRadius: "999px",
    background: disabled ? "rgba(255,255,255,0.025)" : "rgba(255,255,255,0.04)",
    padding: "13px 18px",
    color: disabled ? "rgba(241,232,218,0.35)" : "rgba(241,232,218,0.9)",
    outline: "none",
    fontSize: "14px",
  };
}

function taskButton(done: boolean) {
  return {
    width: "100%",
    textAlign: "left" as const,
    border: "1px solid rgba(241,232,218,0.13)",
    borderRadius: "16px",
    background: "rgba(255,255,255,0.045)",
    color: done ? "rgba(241,232,218,0.42)" : "rgba(241,232,218,0.86)",
    fontSize: "15px",
    cursor: "pointer",
    textDecoration: done ? "line-through" : "none",
    padding: "12px 14px",
  };
}

const modalOverlay = {
  position: "fixed" as const,
  inset: 0,
  zIndex: 30,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(0,0,0,0.48)",
  backdropFilter: "blur(10px)",
  padding: "18px",
};

const modalCard = {
  width: "min(440px, 100%)",
  borderRadius: "30px",
  border: "1px solid rgba(241,232,218,0.3)",
  background: "rgba(10,8,6,0.8)",
  padding: "34px",
  boxSizing: "border-box" as const,
};

const closeButton = {
  float: "right" as const,
  background: "transparent",
  border: "none",
  color: "rgba(241,232,218,0.7)",
  fontSize: "24px",
  cursor: "pointer",
};

const modalTitle = {
  fontFamily: "Cormorant Garamond, Georgia, serif",
  fontSize: "2.5rem",
  fontWeight: 300,
  margin: "14px 0 8px",
};

const modalText = {
  color: "rgba(241,232,218,0.6)",
  margin: "0 0 34px",
  fontSize: "15px",
};

const featureButtonStyle = {
  border: "1px solid rgba(241,232,218,0.32)",
  borderRadius: "999px",
  background: "rgba(241,232,218,0.11)",
  color: "rgba(241,232,218,0.92)",
  padding: "12px 22px",
  textDecoration: "none",
  fontSize: "15px",
};

const secondaryFeatureButtonStyle = {
  ...featureButtonStyle,
  background: "rgba(255,255,255,0.06)",
  color: "rgba(241,232,218,0.82)",
};

const logoutButton = {
  ...secondaryFeatureButtonStyle,
  cursor: "pointer",
};

const primaryButtonStyle = {
  width: "100%",
  padding: "16px",
  borderRadius: "999px",
  border: "1px solid rgba(241,232,218,0.38)",
  background: "rgba(241,232,218,0.1)",
  color: "rgba(241,232,218,0.92)",
  fontSize: "16px",
  cursor: "pointer",
  marginBottom: "14px",
};

const secondaryButtonStyle = {
  width: "100%",
  padding: "14px",
  border: "none",
  background: "transparent",
  color: "rgba(241,232,218,0.72)",
  fontSize: "15px",
  cursor: "pointer",
};

const dangerButtonStyle = {
  ...secondaryButtonStyle,
  color: "rgba(241,160,150,0.72)",
};