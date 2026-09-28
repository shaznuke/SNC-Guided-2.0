import { PROGRAM_DATA } from "./programData.js";
export function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function validDate(value) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value)) &&
    new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value
  );
}
export function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}
export function prescription(value) {
  const text = String(value ?? "").trim();
  let m = text.match(/^(\d+)\s*(ES|each side|per side)$/i);
  if (m) return { reps: Number(m[1]), sides: 2, durationSec: null };
  m = text.match(/^(\d+(?:\.\d+)?)\s*(s|sec|secs|seconds|min|mins|minutes)$/i);
  if (m)
    return {
      reps: 0,
      sides: 1,
      durationSec: Number(m[1]) * (/^m/i.test(m[2]) ? 60 : 1),
    };
  return {
    reps: /^\d+$/.test(text) ? Number(text) : 0,
    sides: 1,
    durationSec: null,
  };
}
export function numericReps(value) {
  return prescription(value).reps;
}
export function setVolume(set) {
  const parsed = prescription(set.reps),
    sides = Number(set.sides || parsed.sides),
    loadCount = Number(set.loadCount || 1);
  return set.completed && Number(set.weight) > 0
    ? Number(set.weight) * parsed.reps * sides * loadCount
    : 0;
}
export function programIdFor(s) {
  return (
    s.programId ||
    (/^p1_/.test(s.dayId) ? "phase1" : /^p2_/.test(s.dayId) ? "phase2" : null)
  );
}
export function cycleIdFor(s) {
  return s.cycleId || `legacy-${programIdFor(s)}`;
}
export function mainCompletion(session) {
  const day = PROGRAM_DATA.programs[programIdFor(session)]?.days.find(
    (d) => d.id === session.dayId,
  );
  const main =
    day?.sections
      .filter((s) => s.type === "mains")
      .flatMap((s) => s.exercises) || [];
  const total = main.reduce((n, e) => n + e.sets, 0);
  const done = main.reduce(
    (n, e) =>
      n +
      (session.exercises?.[e.id]?.sets || [])
        .slice(0, e.sets)
        .filter((s) => s.completed && numericReps(s.reps) > 0).length,
    0,
  );
  return { done, total, complete: total > 0 && done === total };
}
export function sessionStatus(s) {
  return s.status || (mainCompletion(s).complete ? "completed" : "partial");
}
export function programProgress(history, program, cycleId) {
  const days = new Set(program.days.map((d) => d.id));
  const slots = new Set(
    history
      .filter(
        (s) =>
          programIdFor(s) === program.id &&
          (!cycleId || cycleIdFor(s) === cycleId) &&
          days.has(s.dayId) &&
          Number.isInteger(s.week) &&
          s.week >= 1 &&
          s.week <= 6 &&
          sessionStatus(s) === "completed",
      )
      .map((s) => `${s.week}:${s.dayId}`),
  );
  const total = program.weeksCount * days.size;
  return {
    completed: slots.size,
    total,
    percent: Math.round((slots.size / total) * 100),
    weeks: Array.from(
      { length: 6 },
      (_, i) => [...days].filter((d) => slots.has(`${i + 1}:${d}`)).length,
    ),
  };
}
