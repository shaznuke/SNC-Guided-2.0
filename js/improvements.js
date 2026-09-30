import { StorageEngine as S } from "./storage.js";
import { NutritionEngine as N } from "./nutritionEngine.js";
import { WhoopTracker as W } from "./whoopTracker.js";
import { PROGRAM_DATA as P } from "./programData.js";
import {
  escapeHtml as esc,
  localDateKey,
  cycleIdFor,
  sessionStatus,
  mainCompletion,
  prescription,
  programIdFor,
} from "./dataUtils.js";
import { storageIssues, recoverTransaction } from "./persistence.js";
import { youtubeVideoUrl } from "./tutorialLinks.js";
export const RELEASE = "2.2.2";
const $ = (id) => document.getElementById(id);
function button(text, handler) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "copy-text-btn";
  b.textContent = text;
  b.onclick = () => {
    try {
      handler();
    } catch (e) {
      notify(e.message);
    }
  };
  return b;
}
export function notify(message) {
  const open = document.querySelector("dialog[open]");
  if (open) {
    let error = open.querySelector(".form-error");
    if (!error) {
      error = document.createElement("p");
      error.className = "form-error";
      error.setAttribute("role", "alert");
      open.append(error);
    }
    error.textContent = message;
  }
  const el = $("appNotice");
  if (el) {
    el.textContent = message;
    el.hidden = false;
  }
}
function dialog(title, html) {
  const d = document.createElement("dialog");
  d.className = "editor-dialog";
  d.setAttribute("aria-label", title);
  d.innerHTML = `<div class="modal-header"><h3>${esc(title)}</h3><button type="button" aria-label="Close dialog">✕</button></div>${html}<p class="form-error" role="alert"></p>`;
  d.querySelector("button").onclick = () => d.close();
  d.addEventListener("close", () => d.remove());
  document.body.append(d);
  d.showModal();
  return d;
}
function field(name, label, value, type = "number", extra = "") {
  return `<label>${esc(label)}<input name="${name}" type="${type}" value="${esc(value ?? "")}" ${type === "number" ? 'min="0" step="any" inputmode="decimal"' : ""} ${extra}></label>`;
}
function tutorialControls(app, exercise, parent) {
  const controls = document.createElement("div");
  controls.className = "exercise-tutorial";
  const render = () => {
    controls.replaceChildren();
    const custom = S.getPreferences().exerciseTutorials?.[exercise.id];
    const url = youtubeVideoUrl(custom || exercise.tutorialUrl);
    if (url) {
      const link = document.createElement("a");
      link.className = "copy-text-btn tutorial-watch";
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "▶ Watch tutorial";
      link.setAttribute("aria-label", `Watch tutorial for ${exercise.name} (opens YouTube)`);
      link.onclick = (event) => {
        if (!app.activeWorkout.saveDraft()) {
          event.preventDefault();
          notify("Your workout could not be saved. Export a backup before leaving the app.");
        }
      };
      controls.append(link);
    }
    controls.append(button(url ? "Edit tutorial link" : "＋ Add tutorial link", () => {
      const d = dialog(`Tutorial: ${exercise.name}`, `<p>Paste the YouTube share link for this exercise. Videos open separately and need an internet connection.</p><form>${field("tutorial", "YouTube video link", custom || url || "", "url", 'required placeholder="https://youtu.be/…" autocomplete="off"')}<button type="submit" class="btn-start-day">Save tutorial link</button></form><div class="tutorial-actions"></div>`);
      d.querySelector("form").onsubmit = (event) => {
        event.preventDefault();
        try {
          const value = youtubeVideoUrl(d.querySelector('[name="tutorial"]').value);
          if (!value) throw new Error("Paste a direct YouTube video link, such as youtube.com/watch?v=… or youtu.be/….");
          const prefs = S.getPreferences();
          S.savePreferences({ ...prefs, exerciseTutorials: { ...prefs.exerciseTutorials, [exercise.id]: value } });
          d.close();
          render();
          notify("Tutorial saved for this exercise. It is included in your backup.");
        } catch (error) { notify(error.message); }
      };
      if (custom) d.querySelector(".tutorial-actions").append(button(exercise.tutorialUrl ? "Use original tutorial" : "Remove tutorial link", () => {
        const prefs = S.getPreferences();
        const links = { ...prefs.exerciseTutorials };
        delete links[exercise.id];
        S.savePreferences({ ...prefs, exerciseTutorials: links });
        d.close();
        render();
        notify("Custom tutorial link removed.");
      }));
    }));
    if (!url) {
      const hint = document.createElement("small");
      hint.textContent = "No tutorial linked yet.";
      controls.append(hint);
    }
  };
  parent.querySelector(".exercise-title-row").after(controls);
  render();
}
function dateControl(section, id, onchange) {
  const l = document.createElement("label");
  l.className = "date-control";
  l.textContent = "Viewing date";
  const i = document.createElement("input");
  i.type = "date";
  i.id = id;
  i.value = localDateKey();
  l.append(i);
  onchange(i.value);
  i.onchange = () => {
    if (i.value) onchange(i.value);
  };
  l.append(
    button("Today", () => {
      i.value = localDateKey();
      onchange(i.value);
    }),
  );
  $(section).prepend(l);
}
function editHistory(app, log) {
  const copy = structuredClone(log);
  const html = `<form><p>Main sets: ${mainCompletion(copy).done}/${mainCompletion(copy).total}. Completion is recalculated when you save.</p>${Object.entries(
    copy.exercises,
  )
    .map(
      ([id, e], ei) =>
        `<fieldset><legend>${esc(e.name)}</legend>${e.sets
          .map((s, si) => {
            const p = prescription(s.reps);
            return `<div class="history-edit-set" data-e="${ei}" data-s="${si}"><b>Set ${si + 1}</b>${field("weight", "kg", s.weight)}${field("reps", "Reps / time", s.reps, "text")}${field("rpe", "RPE", s.rpe)}<label>Sides<select name="sides"><option value="1" ${(s.sides || p.sides) === 1 ? "selected" : ""}>One / total reps</option><option value="2" ${(s.sides || p.sides) === 2 ? "selected" : ""}>Two sides</option></select></label><label>Load entered<select name="loadCount"><option value="1">Total external kg</option><option value="2" ${s.loadCount === 2 ? "selected" : ""}>kg per hand × 2</option></select></label><label><input type="checkbox" name="completed" ${s.completed ? "checked" : ""}> Completed</label></div>`;
          })
          .join("")}</fieldset>`,
    )
    .join(
      "",
    )}${field("notes", "Coach notes", copy.coachNotes, "text")}<button type="submit" class="btn-start-day">Save workout changes</button></form>`;
  const d = dialog("Edit workout", html);
  d.querySelector("form").onsubmit = (e) => {
    e.preventDefault();
    try {
      for (const row of d.querySelectorAll(".history-edit-set")) {
        const ex = Object.values(copy.exercises)[Number(row.dataset.e)],
          s = ex.sets[Number(row.dataset.s)];
        for (const key of ["weight", "reps", "rpe"])
          s[key] = row.querySelector(`[name="${key}"]`).value;
        s.sides = Number(row.querySelector('[name="sides"]').value);
        s.loadCount = Number(row.querySelector('[name="loadCount"]').value);
        s.completed = row.querySelector('[name="completed"]').checked;
        const p = prescription(s.reps);
        s.repCount = p.reps;
        s.durationSec = p.durationSec;
      }
      copy.coachNotes = d.querySelector('[name="notes"]').value;
      copy.status = mainCompletion(copy).complete ? "completed" : "partial";
      S.saveCompletedSession(copy);
      d.close();
      app.renderHistory();
      app.renderHolisticProgress();
      notify("Workout updated. Records and totals recalculated.");
    } catch (error) {
      d.querySelector(".form-error").textContent = error.message;
    }
  };
}
function restore(app) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json,application/json";
  input.hidden = true;
  document.body.append(input);
  input.addEventListener("cancel", () => input.remove(), { once: true });
  input.onchange = async () => {
    try {
      const file = input.files[0];
      if (!file) return;
      if (file.size > 20 * 1024 * 1024)
        throw new Error("Choose a backup smaller than 20 MB.");
      const text = await file.text(),
        data = S.validateBackup(text);
      const d = dialog(
        "Restore backup",
        `<p>${data.completedSessions.length} workouts · ${Object.keys(data.dailyLogs || {}).length} daily logs · ${data.activeWorkout ? "1 active draft" : "no active draft"}.</p><p>Export your current records first. Keys are never imported or exported.</p><p>Merge keeps this device’s records when IDs overlap and preserves current settings/draft. Replace uses the backup’s records and settings; legacy backups only replace fields they contain.</p><label>Restore method<select id="restoreMode"><option value="merge">Merge with this device</option><option value="replace">Replace with backup</option></select></label><div id="restoreActions"></div>`,
      );
      d.querySelector("#restoreActions").append(
        button("Export current records", () =>
          S.exportBackupJSON(
            app.activeWorkout && !app.activeWorkout.disposed
              ? app.activeWorkout.getDraft()
              : undefined,
          ),
        ),
        button("Restore this backup", () => {
          if (app.activeWorkout && !app.activeWorkout.disposed)
            throw new Error(
              "Finish or cancel the active session before restoring. Export it first if needed.",
            );
          const result = S.importBackupJSON(
            text,
            d.querySelector("select").value,
          );
          if (!result.success) throw new Error(result.message);
          location.reload();
        }),
      );
    } catch (e) {
      notify(e.message);
    } finally {
      input.remove();
    }
  };
  input.click();
}
function recycle(app) {
  const d = dialog(
      "Recently deleted",
      `<p>Last 30 deleted meals and sessions. Restoring does not duplicate an existing record.</p><div class="trash-items"></div>`,
    ),
    list = d.querySelector(".trash-items");
  for (const t of S.getTrash()) {
    list.append(
      button(
        `Restore ${t.kind === "meal" ? t.value.name : t.value.dayName} · ${t.date || t.value.date}`,
        () => {
          S.undoDelete(t.id);
          d.close();
          app.renderHistory();
          app.renderNutrition();
          app.renderHolisticProgress();
          notify("Deleted record restored.");
        },
      ),
    );
  }
  if (!S.getTrash().length) list.textContent = "Nothing to restore.";
}
function goals(app) {
  const s = N.getNutritionSettings(),
    d = dialog(
      "Calorie and macro goals",
      `<form>${field("targetCalories", "Daily calorie goal (kcal)", s.targetCalories)}${field("targetProtein", "Protein (g)", s.targetProtein)}${field("targetCarbs", "Carbs (g)", s.targetCarbs)}${field("targetFat", "Fat (g)", s.targetFat)}<p id="goalMath" role="status"></p><button type="button" id="matchCalories" class="copy-text-btn">Use macro calories as calorie goal</button><button type="submit" class="btn-start-day">Save goals</button></form>`,
    );
  const form = d.querySelector("form");
  const sum = () =>
    4 * Number(form.elements.targetProtein.value) +
    4 * Number(form.elements.targetCarbs.value) +
    9 * Number(form.elements.targetFat.value);
  const show = () =>
    (d.querySelector("#goalMath").textContent =
      `These macros total ${Math.round(sum())} kcal. Estimated maintenance: ${s.tdee} kcal. Difference from your goal: ${Math.round(sum() - Number(form.elements.targetCalories.value))} kcal.`);
  form.oninput = show;
  show();
  d.querySelector("#matchCalories").onclick = () => {
    form.elements.targetCalories.value = Math.round(sum());
    show();
  };
  form.onsubmit = (e) => {
    e.preventDefault();
    try {
      N.saveNutritionSettings({
        ...s,
        ...Object.fromEntries(new FormData(form)),
      });
      d.close();
      app.renderNutrition();
    } catch (e) {
      d.querySelector(".form-error").textContent = e.message;
    }
  };
}
function reusable(app) {
  const d = dialog(
      "Saved meals",
      '<p>Choose a meal to review its portion before logging.</p><div class="saved-meals"></div>',
    ),
    list = d.querySelector(".saved-meals");
  for (const m of N.getSavedMeals()) {
    const row = document.createElement("div");
    row.append(
      button(m.name, () => {
        d.close();
        app.openMealEditor({ ...m, id: undefined, time: undefined });
      }),
      button("Remove saved recipe", () => {
        N.removeReusableMeal(m.id);
        d.close();
        reusable(app);
      }),
    );
    list.append(row);
  }
  if (!N.getSavedMeals().length)
    list.textContent =
      "Save a meal from the meal review screen to reuse it here.";
}
function cycles(app) {
  const host = document.createElement("div");
  host.className = "glass-card cycle-controls";
  host.innerHTML =
    '<label>Training block<select id="cycleSelect"></select></label><button type="button" class="copy-text-btn" id="newCycle">＋ Start a new six-week block</button>';
  $("viewHome").prepend(host);
  app.renderCycles = () => {
    const p = P.getActiveProgram(),
      c = S.getCycles(p.id),
      select = $("cycleSelect");
    select.replaceChildren(
      ...c.items.map((i) => {
        const o = document.createElement("option");
        o.value = i.id;
        o.textContent = i.name;
        return o;
      }),
    );
    select.value = c.active;
  };
  $("cycleSelect").onchange = (e) => {
    if (
      (app.activeWorkout && !app.activeWorkout.disposed) ||
      S.getActiveWorkoutDraft()
    ) {
      app.renderCycles();
      notify("Finish or cancel the active session before changing blocks.");
      return;
    }
    S.setActiveCycle(P.getActiveProgram().id, e.target.value);
    app.renderHome();
  };
  $("newCycle").onclick = () => {
    const d = dialog(
      "New six-week block",
      `<form>${field("name", "Block name", "", "text", 'required maxlength="80"')}<p>Your previous workouts remain in History and their original block.</p><button type="submit" class="btn-start-day">Start block</button></form>`,
    );
    d.querySelector("form").onsubmit = (e) => {
      e.preventDefault();
      try {
        S.newCycle(P.getActiveProgram().id, new FormData(e.target).get("name"));
        app.currentWeek = 1;
        app.weekSelect.value = "1";
        d.close();
        app.renderHome();
      } catch (e) {
        d.querySelector(".form-error").textContent = e.message;
      }
    };
  };
  const render = app.renderHome.bind(app);
  app.renderHome = () => {
    render();
    app.renderCycles();
  };
  app.renderCycles();
}
function activeControls(app) {
  const host = document.createElement("div");
  host.className = "glass-card";
  host.innerHTML =
    '<p id="mainSetProgress"></p><button type="button" id="nextSet" class="copy-text-btn">Go to next unchecked main set</button><label>Rest between sets (seconds)<input id="restSeconds" type="number" min="0" max="600" step="15" inputmode="numeric"></label><div id="intervalControls" hidden><label>Bike interval rounds<input id="intervalRounds" type="number" min="1" max="30" value="8" inputmode="numeric"></label><button id="intervalStart" type="button" class="copy-text-btn">Start 30s hard / 30s easy</button><p id="intervalStatus" role="status">Ready</p></div>';
  $("sessionExercisesContainer").before(host);
  $("restSeconds").value = S.getPreferences().restSeconds;
  $("restSeconds").onchange = (e) => {
    try {
      S.savePreferences({
        ...S.getPreferences(),
        restSeconds: Number(e.target.value),
      });
    } catch (error) {
      notify(error.message);
    }
  };
  $("nextSet").onclick = () => {
    const w = app.activeWorkout;
    if (!w) return;
    for (const sec of w.dayData.sections.filter((s) => s.type === "mains"))
      for (const ex of sec.exercises) {
        const i = w.loggedData[ex.id].sets.findIndex((s) => !s.completed);
        if (i >= 0) {
          const row = $(`setRow_${ex.id}_${i}`);
          row.scrollIntoView({
            block: "center",
            behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
              ? "auto"
              : "smooth",
          });
          row.querySelector("input").focus({ preventScroll: true });
          return;
        }
      }
    notify("All main sets are checked.");
  };
  const intervalReset = () => {
    $("intervalStart").textContent = "Start 30s hard / 30s easy";
    $("intervalStatus").textContent = "Stopped. Start again when ready.";
  };
  $("intervalStart").onclick = () => {
    const w = app.activeWorkout;
    if (!w) return;
    if (w.intervalTimerActive) {
      w.stopIntervalTimer();
      intervalReset();
      return;
    }
    const rounds = Number($("intervalRounds").value);
    if (!Number.isInteger(rounds) || rounds < 1 || rounds > 30) {
      notify("Choose 1–30 rounds.");
      return;
    }
    w.unlockIOSAudio();
    $("intervalStart").textContent = "Stop intervals";
    const tick = (sec, phase, round) => {
      $("intervalStatus").textContent =
        `Round ${round}/${rounds} · ${phase} · ${sec}s`;
    };
    w.startIntervalTimer(
      rounds,
      tick,
      (phase, round, sec) => tick(sec, phase, round),
      () => {
        intervalReset();
        $("intervalStatus").textContent = "Intervals complete.";
      },
    );
  };
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) intervalReset();
  });
  const original = app.renderActiveSessionExercises.bind(app);
  app.renderActiveSessionExercises = () => {
    const w = app.activeWorkout;
    if (!w) return;
    original();
    $("intervalControls").hidden = !w.dayData.sections.some((s) =>
      s.exercises.some((e) => e.hasIntervalTimer),
    );
    intervalReset();
    const update = () => {
      const c = mainCompletion({
        programId: w.activeProgram.id,
        dayId: w.dayData.id,
        exercises: w.loggedData,
      });
      $("mainSetProgress").textContent =
        `${c.done}/${c.total} main sets checked · ${c.complete ? "Ready to complete" : "Finishing now saves a partial workout"}`;
    };
    update();
    for (const [id, ex] of Object.entries(w.loggedData)) {
      const card = $(`setRow_${id}_0`)?.closest(".exercise-card");
      // Use the actual row parent even if the visual card class changes.
      const parent = card || $(`setRow_${id}_0`)?.parentElement;
      if (!parent) continue;
      const exercise = w.dayData.sections.flatMap((section) => section.exercises).find((item) => item.id === id);
      tutorialControls(app, exercise, parent);
      const inc = document.createElement("label");
      inc.className = "field-hint";
      inc.textContent = "Optional load increase (kg)";
      const input = document.createElement("input");
      input.type = "number";
      input.min = "0";
      input.max = "50";
      input.step = "0.25";
      input.inputMode = "decimal";
      input.value =
        S.getPreferences().exerciseIncrements?.[id] ??
        S.getPreferences().increment;
      inc.append(input);
      input.onchange = () => {
        try {
          const p = S.getPreferences(),
            v = Number(input.value);
          if (!Number.isFinite(v) || v < 0 || v > 50)
            throw new Error("Use a load step from 0 to 50 kg.");
          S.savePreferences({
            ...p,
            exerciseIncrements: { ...p.exerciseIncrements, [id]: v },
          });
          app.renderActiveSessionExercises();
        } catch (e) {
          notify(e.message);
        }
      };
      const settings = document.createElement("details");
      settings.className = "set-options";
      settings.innerHTML = "<summary>Exercise progression settings</summary>";
      settings.append(inc);
      parent.append(settings);
      ex.sets.forEach((s, i) => {
        const row = $(`setRow_${id}_${i}`),
          r = $(`inputR_${id}_${i}`),
          effort = $(`inputRPE_${id}_${i}`);
        effort.inputMode = "decimal";
        const p = prescription(s.reps);
        r.inputMode = p.reps ? "numeric" : "text";
        r.setAttribute(
          "aria-label",
          `${ex.name}, set ${i + 1}, repetitions or time`,
        );
        row
          .querySelector("input")
          .setAttribute(
            "aria-label",
            `${ex.name}, set ${i + 1}, weight in kilograms`,
          );
        const opts = document.createElement("details");
        opts.className = "set-options";
        opts.innerHTML = `<summary>Set ${i + 1}: sides & load</summary><label>Sides<select data-side><option value="1">One / total reps</option><option value="2">Reps on each of two sides</option></select></label><label>Entered kg<select data-load><option value="1">Total load moved</option><option value="2">Per hand, two weights together</option></select></label><p class="field-hint">For a one-arm row, use total load moved (one dumbbell) and two sides. Seconds are excluded from repetition volume.</p>`;
        const side = opts.querySelector("[data-side]"),
          load = opts.querySelector("[data-load]");
        side.value = s.sides || p.sides;
        load.value = s.loadCount || 1;
        const save = () => {
          const v = prescription(s.reps);
          s.repCount = v.reps;
          s.durationSec = v.durationSec;
          s.sides = Number(side.value);
          s.loadCount = Number(load.value);
          w.saveDraft();
        };
        side.onchange = load.onchange = save;
        r.addEventListener("input", () => {
          if (/ES|each side|per side/i.test(r.value)) side.value = "2";
          save();
        });
        row.after(opts);
        $(`btnCheck_${id}_${i}`).addEventListener("click", update);
      });
    }
  };
}
export function installImprovements(app) {
  document.body.insertAdjacentHTML(
    "afterbegin",
    '<div id="connectionBanner" role="status"></div><div id="appNotice" role="status" hidden></div><div id="updateNotice" hidden><span>An app update is ready.</span><button type="button">Save and update</button></div>',
  );
  $("appNotice").onclick = () => {
    $("appNotice").hidden = true;
  };
  const network = () => {
    $("connectionBanner").textContent = navigator.onLine
      ? ""
      : "Offline · workouts and manual meals stay available. Photo analysis needs internet.";
    document.getElementById("btnAnalyzeMeal").disabled = !navigator.onLine;
    document.getElementById("btnTakeMealPhoto").disabled = !navigator.onLine;
  };
  window.addEventListener("online", network);
  window.addEventListener("offline", network);
  window.addEventListener("snc-storage-issue", () =>
    notify(
      "A saved record needs recovery. Its original data is preserved. Export a backup in Settings.",
    ),
  );
  if (storageIssues.size)
    notify(
      "A saved record needs recovery. Export a backup in Settings before restoring.",
    );
  const extras = document.createElement("div");
  extras.className = "glass-card";
  extras.innerHTML = `<h3>Records & recovery</h3><p>Version ${RELEASE} · Stored on this device</p><p>Export includes workouts, drafts, meals, WHOOP, goals and training blocks. Keys are excluded.</p>`;
  extras.append(
    button("Restore a backup", () => restore(app)),
    button("Recently deleted / Undo", () => recycle(app)),
  );
  $("viewSettings").append(extras);
  app.btnExportData.replaceWith(app.btnExportData.cloneNode(true));
  app.btnExportData = $("btnExportData");
  app.btnExportData.onclick = () =>
    S.exportBackupJSON(
      app.activeWorkout && !app.activeWorkout.disposed
        ? app.activeWorkout.getDraft()
        : undefined,
    );
  dateControl("viewNutrition", "mealDate", (date) => {
    N.setDate(date);
    app.renderNutrition();
  });
  dateControl("viewWhoop", "whoopDate", (date) => {
    W.setDate(date);
    app.renderWhoop();
  });
  const goalHost = document.createElement("div");
  goalHost.className = "action-row";
  goalHost.append(
    button("Edit calorie & macro goals", () => goals(app)),
    button("Use a saved meal", () => reusable(app)),
  );
  $("macroRings").after(goalHost);
  const oldMeal = app.openMealEditor.bind(app);
  app.openMealEditor = (meal = {}) => {
    app.editingMeal = meal.id ? meal : null;
    app.mealEditorDate = N.getDate();
    oldMeal(meal);
    $("mealPortion").value = "1";
    $("saveReusable").checked = false;
  };
  const form = $("mealForm");
  form.insertAdjacentHTML(
    "afterbegin",
    '<label>Portion multiplier<input id="mealPortion" type="number" min="0.1" max="100" value="1" step="0.1" inputmode="decimal"></label><p class="field-hint">Values below describe one portion. The multiplier is applied when saving.</p><label><input type="checkbox" id="saveReusable"> Also save as a reusable meal</label>',
  );
  form.onsubmit = (e) => {
    e.preventDefault();
    try {
      let meal = N.scaleMeal(
        Object.fromEntries(new FormData(form)),
        Number($("mealPortion").value),
      );
      if (app.editingMeal)
        meal = { ...meal, id: app.editingMeal.id, time: app.editingMeal.time };
      N.addMealLog(meal, app.mealEditorDate);
      if ($("saveReusable").checked) N.saveReusableMeal(meal);
      $("mealModal").close();
      app.renderNutrition();
    } catch (e) {
      notify(e.message);
    }
  };
  const originalNutrition = app.renderNutrition.bind(app);
  app.renderNutrition = () => {
    originalNutrition();
    const meals = N.getTodayMealLogs();
    for (const [i, card] of [...app.mealsListContainer.children].entries()) {
      if (!meals[i]) continue;
      card.append(
        button("Edit meal / portion", () => app.openMealEditor(meals[i])),
      );
    }
    const heading = app.mealsListContainer.previousElementSibling;
    if (heading) heading.textContent = `Meals · ${N.getDate()}`;
  };
  app.renderHistory = () => {
    const list = app.historyListContainer;
    list.replaceChildren();
    const filter = document.createElement("label");
    filter.textContent = "Show workouts";
    const select = document.createElement("select");
    select.innerHTML =
      '<option value="current">Selected training block</option><option value="all">All blocks and phases</option>';
    select.value = app.historyFilter || "current";
    select.onchange = () => {
      app.historyFilter = select.value;
      app.renderHistory();
    };
    filter.append(select);
    list.append(filter);
    const program = P.getActiveProgram(),
      history = S.getCompletedSessions().filter(
        (s) =>
          select.value === "all" ||
          (programIdFor(s) === program.id &&
            cycleIdFor(s) === S.getActiveCycle(program.id)),
      );
    if (!history.length)
      list.append(document.createTextNode("No workouts in this view yet."));
    for (const log of history) {
      const card = document.createElement("article");
      card.className = "history-card";
      const c = mainCompletion(log);
      card.innerHTML = `<h3>${esc(log.dayName)} · Week ${log.week}</h3><p>${esc(log.date)} · ${sessionStatus(log) === "completed" ? "Completed" : "Partial"} · ${c.done}/${c.total} main sets</p><p>${esc(log.coachNotes || "")}</p>`;
      card.append(
        button("View / edit all sets", () => editHistory(app, log)),
        button("Delete workout", () => {
          S.deleteCompletedSession(log.id);
          app.renderHistory();
          app.renderHolisticProgress();
          notify("Workout deleted. Restore it in Settings → Recently deleted.");
        }),
      );
      list.append(card);
    }
  };
  cycles(app);
  activeControls(app);
  // Native dialogs trap focus; add equivalent keyboard behavior to the two legacy bottom sheets.
  for (const id of ["bmrModal", "coachModal"]) {
    const modal = $(id);
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute(
      "aria-label",
      id === "bmrModal" ? "Body measurements" : "Workout summary",
    );
    let focusBefore;
    new MutationObserver(() => {
      if (!modal.classList.contains("hidden")) {
        focusBefore = document.activeElement;
        modal.querySelector("button,input")?.focus();
      } else focusBefore?.focus();
    }).observe(modal, { attributes: true, attributeFilter: ["class"] });
    modal.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        modal.querySelector(".btn-close-modal")?.click();
      }
      if (e.key === "Tab") {
        const all = [
          ...modal.querySelectorAll("button,input,select,textarea"),
        ].filter((x) => !x.disabled);
        if (e.shiftKey && document.activeElement === all[0]) {
          e.preventDefault();
          all.at(-1)?.focus();
        } else if (!e.shiftKey && document.activeElement === all.at(-1)) {
          e.preventDefault();
          all[0]?.focus();
        }
      }
    });
  }
  for (const tab of app.navTabs) {
    tab.setAttribute("aria-label", tab.textContent.trim());
  }
  const photoButton = button("Take a meal photo", () => {
    app.mealPhotoInput.setAttribute("capture", "environment");
    app.mealPhotoInput.click();
  });
  photoButton.id = "btnTakeMealPhoto";
  $("btnAnalyzeMeal").before(photoButton);
  $("btnAnalyzeMeal").textContent = "Choose from Photos";
  $("btnAnalyzeMeal").onclick = () => {
    app.mealPhotoInput.removeAttribute("capture");
    app.mealPhotoInput.click();
  };
  network();
  $("updateNotice").querySelector("button").onclick = () =>
    app.btnForceUpdateApp.click();
  if ("serviceWorker" in navigator)
    navigator.serviceWorker.ready.then((reg) => {
      const check = () => {
        $("updateNotice").hidden = !reg.waiting;
      };
      check();
      reg.addEventListener("updatefound", () =>
        reg.installing?.addEventListener("statechange", check),
      );
    });
  app.renderHome();
}
export async function acquireEditor() {
  if (!navigator.locks) {
    document.body.innerHTML =
      '<main class="glass-card"><h1>Update your browser</h1><p>This version needs browser locking to keep multiple tabs from overwriting your records. Open it in a current Safari, Chrome or Edge.</p></main>';
    return false;
  }
  return new Promise((resolve, reject) =>
    navigator.locks
      .request("snc-guided-editor", { ifAvailable: true }, async (lock) => {
        if (!lock) {
          document.body.innerHTML =
            '<main class="glass-card"><h1>Already open in another window</h1><p>Close the other SNC Guided window, then reopen this one. This prevents two windows from overwriting your workout.</p><button onclick="location.reload()">Try again</button></main>';
          resolve(false);
          return;
        }
        recoverTransaction();
        resolve(true);
        await new Promise(() => {}); // Browser releases this lock automatically when this document closes.
      })
      .catch(reject),
  );
}

export function confirmPartial(c) {
  return new Promise((resolve) => {
    const d = dialog(
      "Save partial workout",
      "<p>" +
        c.done +
        "/" +
        c.total +
        ' main sets are checked. This will stay in History without completing this program day.</p><div id="partialActions"></div>',
    );
    let accepted = false;
    d.querySelector("#partialActions").append(
      button("Keep training", () => d.close()),
      button("Save partial workout", () => {
        accepted = true;
        d.close();
      }),
    );
    d.addEventListener("close", () => resolve(accepted));
  });
}
