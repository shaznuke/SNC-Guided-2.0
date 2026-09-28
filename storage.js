import {
  readJSON,
  writeJSON,
  storageKeys,
  storageIssues,
  transaction,
  downloadJSON,
} from "./persistence.js";
import {
  numericReps,
  localDateKey,
  programIdFor,
  validDate,
} from "./dataUtils.js";
import { validTutorialLinks } from "./tutorialLinks.js";
const K = {
  week: "snc_current_week",
  history: "snc_completed_sessions",
  draft: "snc_active_workout",
  prs: "snc_personal_records",
  cycles: "snc_cycles",
  trash: "snc_trash",
  prefs: "snc_preferences",
};
const object = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const number = (v) => typeof v === "number" && Number.isFinite(v) && v >= 0;
const validSets = (ex) =>
  object(ex) &&
  Object.values(ex).every(
    (e) =>
      object(e) &&
      typeof e.name === "string" &&
      Array.isArray(e.sets) &&
      e.sets.length <= 100 &&
      e.sets.every(
        (s) =>
          object(s) &&
          typeof s.completed === "boolean" &&
          (s.weight === "" ||
            (Number.isFinite(Number(s.weight)) && Number(s.weight) >= 0)) &&
          ["number", "string"].includes(typeof s.reps) &&
          String(s.reps).length < 100 &&
          (s.sides === undefined || [1, 2].includes(s.sides)) &&
          (s.loadCount === undefined || [1, 2].includes(s.loadCount)),
      ),
  );
const validSession = (s) =>
  object(s) &&
  typeof s.id === "string" &&
  /^p[12]_day[123]$/.test(s.dayId) &&
  Number.isInteger(s.week) &&
  s.week >= 1 &&
  s.week <= 6 &&
  validSets(s.exercises) &&
  (!s.status || ["completed", "partial"].includes(s.status));
const validDraft = (d) =>
  d === null ||
  (object(d) &&
    /^p[12]_day[123]$/.test(d.dayId) &&
    Number.isInteger(d.weekNum) &&
    d.weekNum >= 1 &&
    d.weekNum <= 6 &&
    validSets(d.loggedData));
const validMeals = (v) =>
  Array.isArray(v) &&
  v.every(
    (m) =>
      object(m) &&
      typeof m.id === "string" &&
      typeof m.name === "string" &&
      ["calories", "protein", "carbs", "fat"].every((f) => number(m[f])),
  );
const validWhoop = (v) =>
  object(v) &&
  [
    ["recoveryScore", 100],
    ["dayStrain", 21],
    ["sleepPerformance", 100],
  ].every(([f, max]) => number(v[f]) && v[f] <= max);
const validNutrition = (v) =>
  v === null ||
  (object(v) &&
    ["weightKg", "heightCm", "age", "activityLevel"].every(
      (f) => Number.isFinite(Number(v[f])) && Number(v[f]) > 0,
    ) &&
    ["male", "female"].includes(v.gender) &&
    ["targetProtein", "targetCarbs", "targetFat"].every(
      (f) => Number.isFinite(Number(v[f])) && Number(v[f]) >= 0,
    ) &&
    (!("targetCalories" in v) || Number(v.targetCalories) > 0));
const validCycles = (v) =>
  object(v) &&
  Object.entries(v).every(
    ([p, c]) =>
      ["phase1", "phase2"].includes(p) &&
      object(c) &&
      Array.isArray(c.items) &&
      c.items.every(
        (i) =>
          object(i) && typeof i.id === "string" && typeof i.name === "string",
      ) &&
      c.items.some((i) => i.id === c.active),
  );
const validPreferences = (v) =>
  object(v) &&
  validTutorialLinks(v.exerciseTutorials) &&
  (!("restSeconds" in v) || (number(v.restSeconds) && v.restSeconds <= 600)) &&
  (!("increment" in v) || (number(v.increment) && v.increment <= 50)) &&
  (!("exerciseIncrements" in v) ||
    (object(v.exerciseIncrements) &&
      Object.values(v.exerciseIncrements).every((n) => number(n) && n <= 50)));
const validTrash = (v) =>
  Array.isArray(v) &&
  v.every(
    (t) =>
      object(t) &&
      typeof t.id === "string" &&
      (t.kind === "session"
        ? validSession(t.value)
        : t.kind === "meal" && validDate(t.date) && validMeals([t.value])),
  );
function prsFor(history) {
  const prs = {};
  for (const s of history.slice().sort((a, b) => a.timestamp - b.timestamp))
    for (const [id, e] of Object.entries(s.exercises || {}))
      for (const set of e.sets || []) {
        const weight = Number(set.weight),
          reps = numericReps(set.reps);
        if (!set.completed || !(weight > 0) || !reps) continue;
        if (
          !prs[id] ||
          weight > prs[id].maxWeight ||
          (weight === prs[id].maxWeight && reps > prs[id].bestReps)
        )
          prs[id] = {
            exerciseName: e.name,
            maxWeight: weight,
            bestReps: reps,
            date: s.date,
            week: s.week,
          };
      }
  return prs;
}
function protect(key) {
  if (storageIssues.has(key))
    throw new Error(
      "Saved data needs recovery. Export a backup before restoring.",
    );
}
export const StorageEngine = {
  getCurrentWeek() {
    const w = Number(localStorage.getItem(K.week));
    return Number.isInteger(w) && w >= 1 && w <= 6 ? w : 1;
  },
  setCurrentWeek(w) {
    if (!Number.isInteger(Number(w)) || w < 1 || w > 6)
      throw new Error("Choose week 1–6.");
    localStorage.setItem(K.week, String(w));
  },
  getCompletedSessions() {
    return readJSON(
      K.history,
      [],
      (v) => Array.isArray(v) && v.every(validSession),
    );
  },
  saveCompletedSession(log) {
    if (!validSession(log))
      throw new Error("Check workout weights and reps before saving.");
    const history = this.getCompletedSessions();
    protect(K.history);
    const i = history.findIndex((s) => s.id === log.id);
    if (i < 0) history.unshift(log);
    else history[i] = log;
    transaction({
      [K.history]: JSON.stringify(history),
      [K.prs]: JSON.stringify(prsFor(history)),
    });
  },
  deleteCompletedSession(id) {
    const history = this.getCompletedSessions(),
      log = history.find((s) => s.id === id);
    if (!log) return;
    protect(K.history);
    const trash = [
      {
        id: crypto.randomUUID(),
        kind: "session",
        value: log,
        deletedAt: Date.now(),
      },
      ...this.getTrash(),
    ].slice(0, 30);
    const next = history.filter((s) => s.id !== id);
    transaction({
      [K.history]: JSON.stringify(next),
      [K.prs]: JSON.stringify(prsFor(next)),
      [K.trash]: JSON.stringify(trash),
    });
  },
  getTrash() {
    return readJSON(K.trash, [], validTrash);
  },
  trashMeal(meal, date) {
    const key = `snc_meals_${date}`,
      meals = readJSON(key, [], Array.isArray);
    protect(key);
    transaction({
      [key]: JSON.stringify(meals.filter((m) => m.id !== meal.id)),
      [K.trash]: JSON.stringify(
        [
          {
            id: crypto.randomUUID(),
            kind: "meal",
            date,
            value: meal,
            deletedAt: Date.now(),
          },
          ...this.getTrash(),
        ].slice(0, 30),
      ),
    });
  },
  undoDelete(id) {
    const trash = this.getTrash(),
      item = trash.find((t) => t.id === id);
    if (!item) return;
    const values = {
      [K.trash]: JSON.stringify(trash.filter((t) => t.id !== id)),
    };
    if (item.kind === "session") {
      const h = this.getCompletedSessions();
      protect(K.history);
      if (!h.some((s) => s.id === item.value.id)) h.unshift(item.value);
      values[K.history] = JSON.stringify(h);
      values[K.prs] = JSON.stringify(prsFor(h));
    } else {
      const key = `snc_meals_${item.date}`,
        m = readJSON(key, [], Array.isArray);
      protect(key);
      if (!m.some((s) => s.id === item.value.id)) m.unshift(item.value);
      values[key] = JSON.stringify(m);
    }
    transaction(values);
  },
  saveActiveWorkoutDraft(d) {
    try {
      writeJSON(K.draft, { ...d, lastSavedTimestamp: Date.now() });
      window.dispatchEvent(
        new CustomEvent("snc-save-status", { detail: { saved: true } }),
      );
      return true;
    } catch {
      window.dispatchEvent(
        new CustomEvent("snc-save-status", { detail: { saved: false } }),
      );
      return false;
    }
  },
  getActiveWorkoutDraft() {
    return readJSON(K.draft, null, validDraft);
  },
  clearActiveWorkout() {
    localStorage.removeItem(K.draft);
  },
  getPRs() {
    return prsFor(this.getCompletedSessions());
  },
  rebuildPRs() {
    writeJSON(K.prs, this.getPRs());
  },
  updatePRs() {
    this.rebuildPRs();
  },
  getPreferences() {
    return {
      ...{ restSeconds: 90, increment: 2.5, exerciseIncrements: {} },
      ...readJSON(K.prefs, {}, validPreferences),
    };
  },
  savePreferences(p) {
    if (!validTutorialLinks(p.exerciseTutorials))
      throw new Error("Use a direct HTTPS YouTube video link for each tutorial.");
    if (
      !Number.isFinite(p.restSeconds) ||
      p.restSeconds < 0 ||
      p.restSeconds > 600 ||
      !Number.isFinite(p.increment) ||
      p.increment < 0 ||
      p.increment > 50
    )
      throw new Error("Rest must be 0–600 seconds and the load step 0–50 kg.");
    writeJSON(K.prefs, p);
  },
  getCycles(programId) {
    const state = readJSON(K.cycles, {}, validCycles);
    return (
      state[programId] || {
        active: `legacy-${programId}`,
        items: [
          {
            id: `legacy-${programId}`,
            name: "Original block",
            createdAt: null,
          },
        ],
      }
    );
  },
  getActiveCycle(programId) {
    return this.getCycles(programId).active;
  },
  setActiveCycle(programId, id) {
    const c = this.getCycles(programId);
    if (!c.items.some((i) => i.id === id)) throw new Error("Unknown block.");
    const state = readJSON(K.cycles, {}, validCycles);
    state[programId] = { ...c, active: id };
    writeJSON(K.cycles, state);
  },
  newCycle(programId, name) {
    if (this.getActiveWorkoutDraft())
      throw new Error(
        "Finish or cancel the active workout before starting a block.",
      );
    protect(K.cycles);
    const c = this.getCycles(programId),
      id = crypto.randomUUID();
    c.items.push({
      id,
      name: String(name || `Block ${c.items.length + 1}`).slice(0, 80),
      createdAt: Date.now(),
    });
    c.active = id;
    protect(K.cycles);
    const state = readJSON(K.cycles, {}, validCycles);
    state[programId] = c;
    transaction({ [K.cycles]: JSON.stringify(state), [K.week]: "1" });
    return id;
  },
  buildBackup(activeWorkout) {
    const dailyLogs = {},
      unreadableRecords = {};
    for (const key of storageKeys()) {
      if (/^snc_(meals|whoop)_\d{4}-\d{2}-\d{2}$/.test(key)) {
        const raw = localStorage.getItem(key);
        try {
          dailyLogs[key] = JSON.parse(raw);
        } catch {
          unreadableRecords[key] = raw;
        }
      }
    }
    // Reading known records detects corruption before collecting the raw recovery copies.
    const data = {
      app: "SNC-Guided-2.0",
      schemaVersion: 3,
      exportedAt: new Date().toISOString(),
      currentWeek: this.getCurrentWeek(),
      completedSessions: this.getCompletedSessions(),
      personalRecords: this.getPRs(),
      activeWorkout:
        activeWorkout === undefined
          ? this.getActiveWorkoutDraft()
          : activeWorkout,
      activeProgram: localStorage.getItem("snc_active_program_id") || "phase2",
      nutritionSettings: readJSON(
        "snc_nutrition_settings",
        null,
        validNutrition,
      ),
      dailyLogs,
      cycles: readJSON(K.cycles, {}, validCycles),
      preferences: this.getPreferences(),
      savedMeals: readJSON("snc_saved_meals", [], Array.isArray),
      trash: this.getTrash(),
      unreadableRecords,
    };
    for (const key of storageIssues)
      unreadableRecords[key] = localStorage.getItem(key);
    return data;
  },
  exportBackupJSON(activeWorkout) {
    const backup = this.buildBackup(activeWorkout);
    downloadJSON(backup, `SNC_Backup_${localDateKey()}.json`);
    return backup;
  },
  validateBackup(text) {
    const d =
      typeof text === "string"
        ? JSON.parse(text, (k, v) => {
            if (["__proto__", "constructor", "prototype"].includes(k))
              throw new Error("Unsafe backup field.");
            return v;
          })
        : text;
    if (d?.unreadableRecords && Object.keys(d.unreadableRecords).length)
      throw new Error(
        "This recovery copy contains unreadable original records. Keep it for recovery and choose an earlier valid backup to restore.",
      );
    if (
      !object(d) ||
      !Array.isArray(d.completedSessions) ||
      !d.completedSessions.every(validSession) ||
      d.schemaVersion > 3
    )
      throw new Error("This is not a supported workout backup.");
    if (
      d.currentWeek !== undefined &&
      (!Number.isInteger(d.currentWeek) ||
        d.currentWeek < 1 ||
        d.currentWeek > 6)
    )
      throw new Error("Invalid backup week.");
    if (d.activeWorkout !== undefined && !validDraft(d.activeWorkout))
      throw new Error("Invalid active workout in backup.");
    if (
      d.activeProgram !== undefined &&
      !["phase1", "phase2", null].includes(d.activeProgram)
    )
      throw new Error("Invalid program.");
    if (
      d.nutritionSettings !== undefined &&
      !validNutrition(d.nutritionSettings)
    )
      throw new Error("Invalid nutrition settings.");
    if (d.dailyLogs !== undefined && !object(d.dailyLogs))
      throw new Error("Invalid daily logs.");
    for (const [key, v] of Object.entries(d.dailyLogs || {})) {
      const m = key.match(/^snc_(meals|whoop)_(\d{4}-\d{2}-\d{2})$/);
      if (
        !m ||
        !validDate(m[2]) ||
        !(m[1] === "meals" ? validMeals(v) : validWhoop(v))
      )
        throw new Error("Invalid meal or WHOOP record in backup.");
    }
    if (d.savedMeals !== undefined && !validMeals(d.savedMeals))
      throw new Error("Invalid saved meals.");
    if (
      d.cycles !== undefined &&
      (!object(d.cycles) ||
        Object.entries(d.cycles).some(
          ([p, c]) =>
            !["phase1", "phase2"].includes(p) ||
            !object(c) ||
            !Array.isArray(c.items) ||
            !c.items.every(
              (i) =>
                object(i) &&
                typeof i.id === "string" &&
                typeof i.name === "string",
            ) ||
            !c.items.some((i) => i.id === c.active),
        ))
    )
      throw new Error("Invalid training blocks.");
    if (
      d.preferences !== undefined &&
      (!object(d.preferences) ||
        !validTutorialLinks(d.preferences.exerciseTutorials) ||
        !number(d.preferences.restSeconds) ||
        d.preferences.restSeconds > 600 ||
        !number(d.preferences.increment) ||
        d.preferences.increment > 50 ||
        !object(d.preferences.exerciseIncrements) ||
        !Object.values(d.preferences.exerciseIncrements).every(
          (v) => number(v) && v <= 50,
        ))
    )
      throw new Error("Invalid workout preferences.");
    if (
      d.trash !== undefined &&
      (!Array.isArray(d.trash) ||
        !d.trash.every(
          (t) =>
            object(t) &&
            typeof t.id === "string" &&
            (t.kind === "session"
              ? validSession(t.value)
              : t.kind === "meal" &&
                validDate(t.date) &&
                validMeals([t.value])),
        ))
    )
      throw new Error("Invalid deleted records.");
    return d;
  },
  importBackupJSON(text, mode = "merge") {
    try {
      if (!["merge", "replace"].includes(mode))
        throw new Error("Choose merge or replace.");
      const d = this.validateBackup(text),
        values = {};
      const merge = (a, b) => [
        ...new Map([...b, ...a].map((s) => [s.id, s])).values(),
      ]; // Current device wins ID conflicts.
      const h =
        mode === "merge"
          ? merge(this.getCompletedSessions(), d.completedSessions)
          : d.completedSessions;
      values[K.history] = JSON.stringify(h);
      values[K.prs] = JSON.stringify(prsFor(h));
      if (mode === "replace") {
        for (const key of storageKeys())
          if (/^snc_(meals|whoop)_\d{4}-\d{2}-\d{2}$/.test(key))
            values[key] = null;
      }
      for (const [key, v] of Object.entries(d.dailyLogs || {}))
        values[key] = JSON.stringify(
          mode === "merge"
            ? key.startsWith("snc_meals_")
              ? merge(readJSON(key, [], Array.isArray), v)
              : readJSON(key, v, object)
            : v,
        );
      const fields = {
        activeWorkout: K.draft,
        activeProgram: "snc_active_program_id",
        nutritionSettings: "snc_nutrition_settings",
        preferences: K.prefs,
        trash: K.trash,
      };
      for (const [field, key] of Object.entries(fields))
        if (
          field in d &&
          (mode === "replace" || localStorage.getItem(key) === null)
        )
          values[key] =
            d[field] === null
              ? null
              : field === "activeProgram"
                ? d[field]
                : JSON.stringify(d[field]);
      if (
        d.currentWeek &&
        (mode === "replace" || localStorage.getItem(K.week) === null)
      )
        values[K.week] = String(d.currentWeek);
      if (d.savedMeals)
        values.snc_saved_meals = JSON.stringify(
          mode === "merge"
            ? merge(
                readJSON("snc_saved_meals", [], Array.isArray),
                d.savedMeals,
              )
            : d.savedMeals,
        );
      if (d.cycles) {
        let cycles = d.cycles;
        if (mode === "merge") {
          cycles = structuredClone(readJSON(K.cycles, {}, validCycles));
          for (const [p, c] of Object.entries(d.cycles))
            cycles[p] = cycles[p]
              ? { ...cycles[p], items: merge(cycles[p].items, c.items) }
              : c;
        }
        values[K.cycles] = JSON.stringify(cycles);
      }
      if (
        mode === "merge" &&
        Object.keys(values).some((k) => storageIssues.has(k))
      )
        throw new Error(
          "A saved record is unreadable. Export recovery data, then use Replace with a valid backup.",
        );
      transaction(values);
      return {
        success: true,
        message: "Backup restored. Credentials were left unchanged.",
      };
    } catch (e) {
      return {
        success: false,
        message:
          e.message || "Restore failed. Your existing data was retained.",
      };
    }
  },
  resetAllData() {
    transaction({
      [K.week]: null,
      [K.history]: null,
      [K.draft]: null,
      [K.prs]: null,
      [K.cycles]: null,
    });
  },
};
