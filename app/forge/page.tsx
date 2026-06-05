"use client";

import { useEffect, useState } from "react";

const backgroundMap: Record<string, string> = {
  Library: "/library-night.png",
  Rain: "/rainforest-study.png",
  Forest: "/meadow-study.png",
  Stars: "/starry-study.png",
};

const columns = [
  {
    key: "now",
    title: "NOW",
    label: "Do first",
    hint: "The one thing that needs your attention first.",
  },
  {
    key: "next",
    title: "NEXT",
    label: "Plan",
    hint: "Important, but not immediate.",
  },
  {
    key: "later",
    title: "LATER",
    label: "Keep for later",
    hint: "Worth keeping, not worth starting now.",
  },
  {
    key: "letgo",
    title: "LET GO",
    label: "Release",
    hint: "Noise, distractions, and things to release.",
  },
];

type Task = {
  text: string;
  done: boolean;
};

type TaskMap = Record<string, Task[]>;

export default function ForgePage() {
  const [setting, setSetting] = useState("Library");
  const [tasks, setTasks] = useState<TaskMap>({
    now: [],
    next: [],
    later: [],
    letgo: [],
  });

  const [selectedTask, setSelectedTask] = useState<{
    column: string;
    index: number;
    text: string;
  } | null>(null);

  useEffect(() => {
    setSetting(localStorage.getItem("focusSetting") || "Library");

    const saved = localStorage.getItem("forgeTasks");
    if (saved) {
      setTasks(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("forgeTasks", JSON.stringify(tasks));
  }, [tasks]);

  const backgroundImage = backgroundMap[setting] || "/library-night.png";

  function addTask(column: string, text: string) {
    if (!text.trim()) return;

    setTasks((prev) => ({
      ...prev,
      [column]: [...prev[column], { text: text.trim(), done: false }],
    }));
  }

  function completeTask() {
    if (!selectedTask) return;

    setTasks((prev) => ({
      ...prev,
      [selectedTask.column]: prev[selectedTask.column].map((task, index) =>
        index === selectedTask.index ? { ...task, done: true } : task
      ),
    }));

    setSelectedTask(null);
  }

  function deleteTask() {
    if (!selectedTask) return;

    setTasks((prev) => ({
      ...prev,
      [selectedTask.column]: prev[selectedTask.column].filter(
        (_, index) => index !== selectedTask.index
      ),
    }));

    setSelectedTask(null);
  }

  function startFocus() {
    if (!selectedTask) return;

    localStorage.setItem("activeTask", selectedTask.text);
    window.location.href = "/focus";
  }

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
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.58), rgba(0,0,0,0.48), rgba(0,0,0,0.62))",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 10,
          minHeight: "100vh",
          padding: "44px 56px",
          color: "rgba(241,232,218,0.92)",
        }}
      >
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "34px",
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                letterSpacing: "0.34em",
                textTransform: "uppercase",
                color: "rgba(241,232,218,0.58)",
                fontSize: "13px",
              }}
            >
              FocusForge
            </p>

            <h1
              style={{
                margin: "10px 0 0",
                fontFamily: "Cormorant Garamond, Georgia, serif",
                fontSize: "clamp(2.4rem,4.2vw,4.6rem)",
                fontWeight: 300,
                lineHeight: 1,
                color: "rgba(241,232,218,0.9)",
              }}
            >
              What matters now?
            </h1>
          </div>

          <a
            href="/check-in"
            style={{
              color: "rgba(241,232,218,0.72)",
              textDecoration: "none",
              fontSize: "15px",
            }}
          >
            Change Space
          </a>
        </header>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "24px",
          }}
        >
          {columns.map((column) => (
            <Quadrant
              key={column.key}
              columnKey={column.key}
              title={column.title}
              label={column.label}
              hint={column.hint}
              tasks={tasks[column.key]}
              onAdd={(text) => addTask(column.key, text)}
              onSelect={(index, text) =>
                setSelectedTask({
                  column: column.key,
                  index,
                  text,
                })
              }
            />
          ))}
        </section>
      </div>

      {selectedTask && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 30,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.48)",
            backdropFilter: "blur(10px)",
          }}
        >
          <div
            style={{
              width: "440px",
              borderRadius: "30px",
              border: "1px solid rgba(241,232,218,0.3)",
              background: "rgba(10,8,6,0.8)",
              padding: "34px",
              color: "rgba(241,232,218,0.92)",
              boxShadow: "0 30px 80px rgba(0,0,0,0.45)",
            }}
          >
            <button
              onClick={() => setSelectedTask(null)}
              style={{
                float: "right",
                background: "transparent",
                border: "none",
                color: "rgba(241,232,218,0.7)",
                fontSize: "24px",
                cursor: "pointer",
              }}
            >
              ×
            </button>

            <p
              style={{
                margin: "0 0 14px",
                letterSpacing: "0.24em",
                textTransform: "uppercase",
                color: "rgba(241,232,218,0.55)",
                fontSize: "12px",
              }}
            >
              Selected Thought
            </p>

            <h2
              style={{
                fontFamily: "Cormorant Garamond, Georgia, serif",
                fontSize: "2.5rem",
                fontWeight: 300,
                margin: "0 0 8px",
                lineHeight: 1.05,
              }}
            >
              {selectedTask.text}
            </h2>

            <p
              style={{
                color: "rgba(241,232,218,0.6)",
                margin: "0 0 34px",
                fontSize: "15px",
              }}
            >
              Choose what happens next.
            </p>

            <button onClick={startFocus} style={primaryButtonStyle}>
              Start Focus
            </button>

            <button onClick={completeTask} style={secondaryButtonStyle}>
              Mark Complete
            </button>

            <button onClick={deleteTask} style={dangerButtonStyle}>
              Delete
            </button>
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
  onAdd,
  onSelect,
}: {
  columnKey: string;
  title: string;
  label: string;
  hint: string;
  tasks: Task[];
  onAdd: (text: string) => void;
  onSelect: (index: number, text: string) => void;
}) {
  const [value, setValue] = useState("");

  return (
    <div
      style={{
        minHeight: "260px",
        borderRadius: "28px",
        border: "1px solid rgba(241,232,218,0.24)",
        background: "rgba(10,8,6,0.24)",
        backdropFilter: "blur(14px)",
        padding: "28px 30px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.16)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "14px",
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              letterSpacing: "0.26em",
              textTransform: "uppercase",
              fontSize: "13px",
              color: "rgba(241,232,218,0.68)",
            }}
          >
            {title}
          </p>

          <h2
            style={{
              margin: "8px 0 0",
              fontFamily: "Cormorant Garamond, Georgia, serif",
              fontSize: "2rem",
              fontWeight: 300,
              color: "rgba(241,232,218,0.88)",
            }}
          >
            {label}
          </h2>
        </div>

        <span
          style={{
            color: "rgba(241,232,218,0.38)",
            fontSize: "22px",
          }}
        >
          →
        </span>
      </div>

      <p
        style={{
          margin: "0 0 22px",
          maxWidth: "480px",
          fontSize: "15px",
          lineHeight: 1.6,
          color: "rgba(241,232,218,0.58)",
        }}
      >
        {hint}
      </p>

      <div
        style={{
          display: "grid",
          gap: "12px",
        }}
      >
        {tasks.map((task, index) => (
          <button
            key={`${task.text}-${index}`}
            onClick={() => onSelect(index, task.text)}
            style={{
              width: "100%",
              textAlign: "left",
              border: "1px solid rgba(241,232,218,0.13)",
              borderRadius: "16px",
              background: "rgba(255,255,255,0.045)",
              color: task.done
                ? "rgba(241,232,218,0.42)"
                : "rgba(241,232,218,0.86)",
              fontSize: "15px",
              cursor: "pointer",
              textDecoration: task.done ? "line-through" : "none",
              padding: "12px 14px",
            }}
          >
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
            onChange={(e) => setValue(e.target.value)}
            placeholder="+ Add Thought"
            style={{
              width: "100%",
              marginTop: "4px",
              border: "1px solid rgba(241,232,218,0.18)",
              borderRadius: "999px",
              background: "rgba(255,255,255,0.04)",
              padding: "13px 18px",
              color: "rgba(241,232,218,0.9)",
              outline: "none",
              fontSize: "14px",
            }}
          />
        </form>
      </div>
    </div>
  );
}

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
  width: "100%",
  padding: "14px",
  border: "none",
  background: "transparent",
  color: "rgba(241,160,150,0.72)",
  fontSize: "15px",
  cursor: "pointer",
};