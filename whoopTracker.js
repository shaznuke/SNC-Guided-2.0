import { readJSON, writeJSON } from "./persistence.js";
import { localDateKey, validDate } from "./dataUtils.js";

export const WhoopTracker = {
  selectedDate: null,
  getDate() {
    return this.selectedDate || localDateKey();
  },
  setDate(date) {
    if (!validDate(date)) throw new Error("Choose a valid date.");
    this.selectedDate = date;
  },
  getTodayWhoopData(date = this.getDate()) {
    return (
      readJSON(
        `snc_whoop_${date}`,
        null,
        (v) =>
          v &&
          [
            ["recoveryScore", 100],
            ["dayStrain", 21],
            ["sleepPerformance", 100],
          ].every(
            ([f, max]) => Number.isFinite(v[f]) && v[f] >= 0 && v[f] <= max,
          ),
      ) || {
        recoveryScore: null,
        dayStrain: null,
        sleepPerformance: null,
      }
    );
  },
  saveTodayWhoopData(data) {
    const values = {};
    for (const [field, max] of [
      ["recoveryScore", 100],
      ["dayStrain", 21],
      ["sleepPerformance", 100],
    ]) {
      const value = Number(data[field]);
      if (
        data[field] === "" ||
        data[field] == null ||
        !Number.isFinite(value) ||
        value < 0 ||
        value > max
      ) {
        throw new Error(
          `Enter ${field === "dayStrain" ? "strain" : field === "recoveryScore" ? "recovery" : "sleep"} between 0 and ${max}.`,
        );
      }
      values[field] = value;
    }
    values.lastUpdated = this.getDate();
    writeJSON(`snc_whoop_${values.lastUpdated}`, values);
    return values;
  },
  getReadinessAdvice(score) {
    if (score == null || score === "" || !Number.isFinite(Number(score))) {
      return {
        zone: "UNLOGGED",
        color: "var(--text-secondary)",
        title: "Log today’s recovery",
        advice: "Add your WHOOP metrics to see today’s readiness guide.",
      };
    }
    score = Number(score);
    if (score > 66)
      return {
        zone: "GREEN",
        color: "var(--accent-green)",
        title: `🟢 GREEN RECOVERY (${score}%)`,
        advice:
          "Ready for a strong session. Use your warm-up and how you feel to guide effort.",
      };
    if (score >= 34)
      return {
        zone: "YELLOW",
        color: "var(--accent-gold)",
        title: `🟡 YELLOW RECOVERY (${score}%)`,
        advice: "Focus on form and steady effort.",
      };
    return {
      zone: "RED",
      color: "var(--accent-orange)",
      title: `🔴 RED RECOVERY (${score}%)`,
      advice: "Active recovery focus. Consider an easier session or mobility.",
    };
  },
};
