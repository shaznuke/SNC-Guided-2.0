import { localDateKey, validDate } from "./dataUtils.js";
import { readJSON, writeJSON } from "./persistence.js";
import { StorageEngine } from "./storage.js";

export const NutritionEngine = {
  calculateBMR(weightKg, heightCm, ageYears, gender = "female") {
    const w = Number(weightKg),
      h = Number(heightCm),
      a = Number(ageYears);
    if (
      ![w, h, a].every((n) => Number.isFinite(n) && n > 0) ||
      !["female", "male"].includes(gender)
    ) {
      throw new Error(
        "Enter positive weight, height and age, and select a BMR equation.",
      );
    }
    return Math.round(
      10 * w + 6.25 * h - 5 * a + (gender === "female" ? -161 : 5),
    );
  },
  calculateTDEE(bmr, activityLevel = 1.55) {
    const activity = Number(activityLevel);
    if (![1.2, 1.375, 1.55, 1.725, 1.9].includes(activity))
      throw new Error("Select an activity level.");
    return Math.round(bmr * activity);
  },
  getNutritionSettings() {
    const saved = readJSON(
      "snc_nutrition_settings",
      null,
      (v) =>
        v &&
        Number(v.weightKg) > 0 &&
        Number(v.heightCm) > 0 &&
        Number(v.age) > 0 &&
        ["female", "male"].includes(v.gender) &&
        [1.2, 1.375, 1.55, 1.725, 1.9].includes(Number(v.activityLevel)),
    );
    const settings = saved || {
      weightKg: 62,
      heightCm: 165,
      age: 26,
      gender: "female",
      activityLevel: 1.55,
      targetProtein: 130,
      targetCarbs: 200,
      targetFat: 55,
    };
    const bmr = this.calculateBMR(
      settings.weightKg,
      settings.heightCm,
      settings.age,
      settings.gender,
    );
    return {
      ...settings,
      targetCalories:
        Number(settings.targetCalories) ||
        this.calculateTDEE(bmr, settings.activityLevel),
      bmr,
      tdee: this.calculateTDEE(bmr, settings.activityLevel),
    };
  },
  saveNutritionSettings(settings) {
    const bmr = this.calculateBMR(
      settings.weightKg,
      settings.heightCm,
      settings.age,
      settings.gender,
    );
    const result = {
      ...settings,
      bmr,
      tdee: this.calculateTDEE(bmr, settings.activityLevel),
    };
    for (const key of [
      "targetCalories",
      "targetProtein",
      "targetCarbs",
      "targetFat",
    ]) {
      if (
        !Number.isFinite(Number(result[key])) ||
        Number(result[key]) < 0 ||
        (key === "targetCalories" && Number(result[key]) === 0)
      )
        throw new Error("Enter valid calorie and macro targets.");
      result[key] = Number(result[key]);
    }
    writeJSON("snc_nutrition_settings", result);
    return result;
  },
  selectedDate: null,
  getDate() {
    return this.selectedDate || localDateKey();
  },
  setDate(date) {
    if (!validDate(date)) throw new Error("Choose a valid date.");
    this.selectedDate = date;
  },
  getTodayMealLogs(date = this.getDate()) {
    return readJSON(
      "snc_meals_" + date,
      [],
      (v) =>
        Array.isArray(v) &&
        v.every(
          (m) =>
            m &&
            typeof m.name === "string" &&
            ["calories", "protein", "carbs", "fat"].every(
              (f) => Number.isFinite(m[f]) && m[f] >= 0,
            ),
        ),
    );
  },
  validateMeal(meal) {
    const result = {
      id: meal.id || "meal_" + crypto.randomUUID(),
      time:
        meal.time ||
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      name: String(meal.name || "")
        .trim()
        .slice(0, 200),
      notes: String(meal.notes || "").slice(0, 1500),
    };
    if (!result.name) throw new Error("Enter a meal name.");
    for (const f of ["calories", "protein", "carbs", "fat"]) {
      const v = Number(meal[f]);
      if (meal[f] === "" || meal[f] == null || !Number.isFinite(v) || v < 0)
        throw new Error("Enter non-negative nutrition values.");
      result[f] = Math.round(v * 10) / 10;
    }
    return result;
  },
  addMealLog(meal, date = this.getDate()) {
    if (!validDate(date)) throw new Error("Choose a valid date.");
    const result = this.validateMeal(meal),
      logs = this.getTodayMealLogs(date),
      i = logs.findIndex((m) => m.id === result.id);
    if (i < 0) logs.unshift(result);
    else logs[i] = result;
    writeJSON("snc_meals_" + date, logs);
    return result;
  },
  deleteMealLog(id, date = this.getDate()) {
    const meal = this.getTodayMealLogs(date).find((m) => m.id === id);
    if (meal) StorageEngine.trashMeal(meal, date);
  },
  getSavedMeals() {
    return readJSON(
      "snc_saved_meals",
      [],
      (v) =>
        Array.isArray(v) &&
        v.every(
          (m) =>
            m &&
            typeof m.name === "string" &&
            typeof m.id === "string" &&
            ["calories", "protein", "carbs", "fat"].every(
              (f) => Number.isFinite(m[f]) && m[f] >= 0,
            ),
        ),
    );
  },
  saveReusableMeal(meal) {
    const value = this.validateMeal({
        ...meal,
        id: "saved_" + crypto.randomUUID(),
      }),
      items = this.getSavedMeals();
    writeJSON("snc_saved_meals", [value, ...items]);
    return value;
  },
  removeReusableMeal(id) {
    writeJSON(
      "snc_saved_meals",
      this.getSavedMeals().filter((m) => m.id !== id),
    );
  },
  scaleMeal(meal, factor) {
    if (!Number.isFinite(Number(factor)) || factor <= 0 || factor > 100)
      throw new Error("Choose a portion multiplier between 0 and 100.");
    const out = { ...meal };
    for (const f of ["calories", "protein", "carbs", "fat"])
      out[f] = Math.round(Number(meal[f]) * factor * 10) / 10;
    return out;
  },
  getTodayTotals() {
    return this.getTodayMealLogs().reduce(
      (totals, meal) => {
        for (const f of Object.keys(totals))
          totals[f] = Math.round((totals[f] + Number(meal[f] || 0)) * 10) / 10;
        return totals;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );
  },
};
