/**
 * Main Application Orchestrator & View Controller
 * Live Gemini AI Vision Meal Photo Recognition & Meal Deletion
 */

import { PROGRAM_DATA } from './programData.js';
import { StorageEngine } from './storage.js';
import { WorkoutEngine } from './workoutEngine.js';
import { CoachUpdater } from './coachUpdater.js';
import { ProgressiveEngine } from './progressiveEngine.js';
import { ExcelExporter } from './excelExporter.js';
import { NutritionEngine } from './nutritionEngine.js';
import { AIVisionEstimator } from './aiVisionEstimator.js';
import { WhoopTracker } from './whoopTracker.js';
import {installImprovements,acquireEditor,notify,confirmPartial} from './improvements.js';
import { escapeHtml, programProgress, mainCompletion, localDateKey } from './dataUtils.js';

const DBZ_INSPIRATIONAL_QUOTES = [
  "PUSH PAST YOUR LIMITS. BREAK YOUR CEILING.",
  "WORK HARD, STUDY WELL, AND EAT AND SLEEP PLENTY!",
  "POWER COMES IN RESPONSE TO A NEED, NOT A DESIRE.",
  "TRAIN LIKE A SAIYAN IN THE HYPERBOLIC TIME CHAMBER.",
  "PAIN IS TEMPORARY. POWER IS FOREVER.",
  "OUTWORK EVERY CEILING YOU EVER PLACED ON YOURSELF.",
  "EVERY REP IS A STEP CLOSER TO SUPER SAIYAN STRENGTH."
];

class AppController {
  constructor() {
    this.currentWeek = StorageEngine.getCurrentWeek();
    this.activeWorkout = null;
    this.activeTab = "home";

    this.initDOMReferences();
    this.bindEvents();
    window.addEventListener('snc-save-status', event => {
      const status = document.getElementById('saveStatus');
      status.textContent = event.detail.saved ? 'Saved on this device' : 'Save failed — keep this app open and download a backup in Settings.';
      status.classList.toggle('save-error', !event.detail.saved);
    });
    window.addEventListener('error', event => {
      document.getElementById('saveStatus').textContent = event.message || 'Something went wrong. Keep the app open and back up your data.';
      document.getElementById('saveStatus').classList.add('save-error');
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.resetMetronomeUI();
        if (this.activeTab !== 'active') this.checkActiveDraftSession();
        this.renderWhoopHeader();
        if (this.activeTab === 'nutrition') this.renderNutrition();
        if (this.activeTab === 'whoop') this.renderWhoop();
      }
    });
    this.initInspirationalQuote();
    this.checkActiveDraftSession();
    this.render();
    this.registerServiceWorker();
    installImprovements(this);
  }

  initDOMReferences() {
    this.programSelect = document.getElementById("programSelect");
    this.weekSelect = document.getElementById("weekSelect");
    this.navTabs = document.querySelectorAll(".nav-tab");
    this.motivationalQuote = document.getElementById("motivationalQuote");

    this.activeDraftResumeBanner = document.getElementById("activeDraftResumeBanner");
    this.activeDraftTitle = document.getElementById("activeDraftTitle");
    this.activeDraftSub = document.getElementById("activeDraftSub");
    this.btnResumeDraftSession = document.getElementById("btnResumeDraftSession");

    this.holisticProgressPct = document.getElementById("holisticProgressPct");
    this.holisticProgressBar = document.getElementById("holisticProgressBar");
    this.weeksGridChips = document.getElementById("weeksGridChips");

    this.viewHome = document.getElementById("viewHome");
    this.viewActiveSession = document.getElementById("viewActiveSession");
    this.viewHistory = document.getElementById("viewHistory");
    this.viewNutrition = document.getElementById("viewNutrition");
    this.viewWhoop = document.getElementById("viewWhoop");
    this.viewSettings = document.getElementById("viewSettings");

    this.dayCardsContainer = document.getElementById("dayCardsContainer");
    this.sessionExercisesContainer = document.getElementById("sessionExercisesContainer");
    this.historyListContainer = document.getElementById("historyListContainer");

    this.homeProgramTitle = document.getElementById("homeProgramTitle");

    this.sessionTitle = document.getElementById("sessionTitle");
    this.sessionTimer = document.getElementById("sessionTimer");
    this.btnFinishSession = document.getElementById("btnFinishSession");
    this.btnDiscardActiveSession = document.getElementById("btnDiscardActiveSession");

    this.metronomeVisualBar = document.getElementById("metronomeVisualBar");
    this.metronomeStatusText = document.getElementById("metronomeStatusText");

    this.floatingRestTimer = document.getElementById("floatingRestTimer");
    this.restTimerDisplay = document.getElementById("restTimerDisplay");
    this.btnSkipRest = document.getElementById("btnSkipRest");

    this.coachModal = document.getElementById("coachModal");
    this.reportPreview = document.getElementById("reportPreview");
    this.btnShareWhatsApp = document.getElementById("btnShareWhatsApp");
    this.btnCopyReport = document.getElementById("btnCopyReport");
    this.btnCloseCoachModal = document.getElementById("btnCloseCoachModal");
    this.coachNotesInput = document.getElementById("coachNotesInput");
    this.rpeSlider = document.getElementById("rpeSlider");
    this.rpeValDisplay = document.getElementById("rpeValDisplay");

    this.btnToggleMetronome = document.getElementById("btnToggleMetronome");

    this.btnExportExcelCoach = document.getElementById("btnExportExcelCoach");

    this.whoopHeaderBanner = document.getElementById("whoopHeaderBanner");
    this.whoopHeaderTitle = document.getElementById("whoopHeaderTitle");
    this.whoopHeaderAdvice = document.getElementById("whoopHeaderAdvice");
    this.whoopZoneBadge = document.getElementById("whoopZoneBadge");
    this.whoopAdviceText = document.getElementById("whoopAdviceText");
    this.whoopRecoveryInput = document.getElementById("whoopRecoveryInput");
    this.whoopStrainInput = document.getElementById("whoopStrainInput");
    this.whoopSleepInput = document.getElementById("whoopSleepInput");
    this.btnSaveWhoop = document.getElementById("btnSaveWhoop");

    this.bmrValueDisplay = document.getElementById("bmrValueDisplay");
    this.tdeeValueDisplay = document.getElementById("tdeeValueDisplay");
    this.calsProgressText = document.getElementById("calsProgressText");
    this.calsProgressBar = document.getElementById("calsProgressBar");
    this.proteinProgressText = document.getElementById("proteinProgressText");
    this.carbsProgressText = document.getElementById("carbsProgressText");
    this.fatsProgressText = document.getElementById("fatsProgressText");
    this.mealPhotoInput = document.getElementById("mealPhotoInput");
    this.mealsListContainer = document.getElementById("mealsListContainer");
    this.btnEditBMR = document.getElementById("btnEditBMR");
    this.bmrModal = document.getElementById("bmrModal");
    this.btnCloseBMRModal = document.getElementById("btnCloseBMRModal");
    this.bmrWeightInput = document.getElementById("bmrWeightInput");
    this.bmrHeightInput = document.getElementById("bmrHeightInput");
    this.bmrAgeInput = document.getElementById("bmrAgeInput");
    this.bmrActivityInput = document.getElementById("bmrActivityInput");
    this.btnCalculateBMR = document.getElementById("btnCalculateBMR");

    this.geminiApiKeyInput = document.getElementById("geminiApiKeyInput");
    this.btnSaveApiKey = document.getElementById("btnSaveApiKey");
    this.btnForceUpdateApp = document.getElementById("btnForceUpdateApp");
    this.btnExportData = document.getElementById("btnExportData");
    this.btnResetData = document.getElementById("btnResetData");
  }

  initInspirationalQuote() {
    if (this.motivationalQuote) {
      const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
      const selectedQuote = DBZ_INSPIRATIONAL_QUOTES[dayOfYear % DBZ_INSPIRATIONAL_QUOTES.length];
      this.motivationalQuote.textContent = selectedQuote;
    }
  }

  checkActiveDraftSession() {
    const draft = StorageEngine.getActiveWorkoutDraft();
    this.activeDraftResumeBanner.classList.toggle('hidden', !draft || this.activeTab === 'active');
    if (!draft) return;
    this.activeDraftTitle.textContent = 'Active Session Saved!';
    const program = PROGRAM_DATA.programs[draft.programId];
    const day = program?.days.find(d => d.id === draft.dayId);
    this.activeDraftSub.textContent = `${day?.name || 'Workout'} · Week ${draft.weekNum}`;
    this.btnResumeDraftSession.onclick = () => {
      if (this.activeWorkout && !this.activeWorkout.disposed) {
        this.switchTab('active');
      } else {
        const latest = StorageEngine.getActiveWorkoutDraft();
        if (latest) this.resumeDraftWorkout(latest);
      }
    };
  }

  resumeDraftWorkout(draft) {
    this.activeWorkout?.dispose();
    if (draft.programId) PROGRAM_DATA.setActiveProgram(draft.programId);
    this.currentWeek = Number(draft.weekNum);
    StorageEngine.setCurrentWeek(this.currentWeek);
    this.programSelect.value = PROGRAM_DATA.getActiveProgram().id;
    this.weekSelect.value = this.currentWeek;
    this.resetMetronomeUI();
    if (this.activeDraftResumeBanner) this.activeDraftResumeBanner.classList.add("hidden");
    
    this.activeWorkout = new WorkoutEngine(draft.dayId, draft.weekNum, draft);
    
    this.activeWorkout.onClockTick = (formattedTime) => {
      if (this.sessionTimer) this.sessionTimer.textContent = formattedTime;
    };

    this.activeWorkout.onSetCompleted = (exId, setIdx) => {
      this.activeWorkout.startRestTimer(StorageEngine.getPreferences().restSeconds, (secLeft) => {
        this.showFloatingRestTimer(secLeft);
      }, () => {
        this.hideFloatingRestTimer();
      });
    };

    this.sessionTitle.textContent = `${this.activeWorkout.dayData.name} · Week ${this.activeWorkout.weekNum}`;
    this.sessionTimer.textContent = this.activeWorkout.getFormattedElapsed();
    this.renderActiveSessionExercises();
    this.switchTab("active");
  }

  bindEvents() {
    if (this.programSelect) {
      this.programSelect.value = PROGRAM_DATA.getActiveProgram().id;
      this.programSelect.addEventListener("change", (e) => {
        PROGRAM_DATA.setActiveProgram(e.target.value);
        this.renderHome();
      });
    }

    if (this.weekSelect) {
      this.weekSelect.value = this.currentWeek.toString();
      this.weekSelect.addEventListener("change", (e) => {
        this.currentWeek = parseInt(e.target.value, 10);
        StorageEngine.setCurrentWeek(this.currentWeek);
        this.renderHome();
      });
    }

    this.navTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const targetView = tab.getAttribute("data-target");
        this.switchTab(targetView);
      });
    });

    if (this.btnExportExcelCoach) {
      this.btnExportExcelCoach.addEventListener("click", () => {
        ExcelExporter.exportCoachSpreadsheet();
      });
    }

    if (this.whoopHeaderBanner) {
      this.whoopHeaderBanner.addEventListener("click", () => this.switchTab("whoop"));
    }
    if (this.btnSaveWhoop) {
      this.btnSaveWhoop.addEventListener("click", () => {
        WhoopTracker.saveTodayWhoopData({
          recoveryScore: this.whoopRecoveryInput ? this.whoopRecoveryInput.value : 78,
          dayStrain: this.whoopStrainInput ? this.whoopStrainInput.value : 12.4,
          sleepPerformance: this.whoopSleepInput ? this.whoopSleepInput.value : 85
        });
        this.renderWhoop();
        this.renderWhoopHeader();
        alert("✓ WHOOP metrics saved!");
      });
    }

    if (this.btnEditBMR) {
      this.btnEditBMR.addEventListener("click", () => {
        const settings = NutritionEngine.getNutritionSettings();
        this.bmrWeightInput.value = settings.weightKg;
        this.bmrHeightInput.value = settings.heightCm;
        this.bmrAgeInput.value = settings.age;
        this.bmrActivityInput.value = settings.activityLevel;
        document.getElementById('bmrGenderInput').value = settings.gender;
        if (this.bmrModal) this.bmrModal.classList.remove('hidden');
      });
    }
    if (this.btnCloseBMRModal) {
      this.btnCloseBMRModal.addEventListener("click", () => {
        if (this.bmrModal) this.bmrModal.classList.add("hidden");
      });
    }
    if (this.btnCalculateBMR) {
      this.btnCalculateBMR.addEventListener("click", () => {
        NutritionEngine.saveNutritionSettings({
          ...NutritionEngine.getNutritionSettings(),
          weightKg: this.bmrWeightInput ? this.bmrWeightInput.value : 62,
          heightCm: this.bmrHeightInput ? this.bmrHeightInput.value : 165,
          age: this.bmrAgeInput ? this.bmrAgeInput.value : 26,
          gender: document.getElementById('bmrGenderInput').value,
          activityLevel: this.bmrActivityInput ? this.bmrActivityInput.value : 1.55,
        });
        if (this.bmrModal) this.bmrModal.classList.add("hidden");
        this.renderNutrition();
      });
    }

    document.getElementById('btnAnalyzeMeal').onclick = () => this.mealPhotoInput.click();
    document.getElementById('btnManualMeal').onclick = () => this.openMealEditor();
    document.getElementById('btnCloseMeal').onclick = () => document.getElementById('mealModal').close();
    document.getElementById('mealForm').onsubmit = event => {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(event.target));
      NutritionEngine.addMealLog(values);
      document.getElementById('mealModal').close();
      this.renderNutrition();
    };
    this.mealPhotoInput.addEventListener('change', async event => {
      const file = event.target.files[0];
      if (!file) return;
      const status = document.getElementById('mealAnalysisStatus');
      this.mealPhotoInput.disabled = true;
      document.getElementById('btnAnalyzeMeal').disabled = true;
      status.textContent = 'Preparing photo, then sending it to Google…';
      document.getElementById('btnTakeMealPhoto').disabled=true;
      document.getElementById('viewNutrition').setAttribute('aria-busy','true');
      try {
        const result = await AIVisionEstimator.analyzeMealPhotoFile(file);
        if (result.success) {
          status.textContent = 'Estimate ready. Review the portion and values before saving.';
          this.openMealEditor(result);
        } else {
          status.textContent = result.error;
          if (result.requiresKey) this.switchTab('settings');
        }
      } finally {
        this.mealPhotoInput.disabled = false;
        document.getElementById('btnAnalyzeMeal').disabled = false;
        this.mealPhotoInput.value = '';
        document.getElementById('btnTakeMealPhoto').disabled=!navigator.onLine;
        document.getElementById('btnAnalyzeMeal').disabled=!navigator.onLine;
        document.getElementById('viewNutrition').setAttribute('aria-busy','false');
      }
    });

    if (this.btnSaveApiKey && this.geminiApiKeyInput) {
      this.geminiApiKeyInput.value = AIVisionEstimator.getStoredApiKey();
      document.getElementById('geminiModelInput').value = AIVisionEstimator.getModel();
      this.btnSaveApiKey.addEventListener("click", () => {
        AIVisionEstimator.setModel(document.getElementById('geminiModelInput').value);
        AIVisionEstimator.setStoredApiKey(this.geminiApiKeyInput.value);
        document.getElementById('geminiConnectionStatus').textContent = 'Settings saved. Test the connection to verify this key and model.';
        this.btnSaveApiKey.textContent = '✓ Gemini settings saved';
      });
    }

    document.getElementById('btnTestGeminiConnection').addEventListener('click', async event => {
      const button = event.currentTarget;
      const status = document.getElementById('geminiConnectionStatus');
      if (this.geminiApiKeyInput.value.trim() !== AIVisionEstimator.getStoredApiKey() ||
          document.getElementById('geminiModelInput').value.trim() !== AIVisionEstimator.getModel()) {
        status.textContent = 'Save the key and model changes before testing.';
        return;
      }
      button.disabled = true;
      status.textContent = 'Testing a real request to Google…';
      try {
        const result = await AIVisionEstimator.testConnection();
        status.textContent = result.success
          ? `✓ Google connection verified with ${result.model}. Next, analyze a meal photo to check the full image flow.`
          : result.error;
      } finally { button.disabled = false; }
    });

    this.btnForceUpdateApp.addEventListener('click', async () => {
      if (this.activeWorkout && !this.activeWorkout.disposed && !this.activeWorkout.saveDraft()) return;
      const registration = await navigator.serviceWorker?.getRegistration(new URL('./', location.href).href);
      if (!registration) { alert('Offline support is not ready. Reload while online.'); return; }
      this.btnForceUpdateApp.disabled = true;
      try {
        await registration.update();
        if (registration.installing) await new Promise(resolve => {
          const worker = registration.installing;
          worker.addEventListener('statechange', () => {
            if (['installed','redundant'].includes(worker.state)) resolve();
          });
        });
        if (registration.waiting) {
          navigator.serviceWorker.addEventListener('controllerchange', () => location.reload(), { once: true });
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        } else alert('You are using the latest available app.');
      } catch { alert('Could not check for updates. Try again when online.'); }
      finally { this.btnForceUpdateApp.disabled = false; }
    });

    if (this.btnSkipRest) {
      this.btnSkipRest.addEventListener("click", () => {
        if (this.activeWorkout) this.activeWorkout.stopRestTimer();
        this.hideFloatingRestTimer();
      });
    }

    if (this.btnFinishSession) {
      this.btnFinishSession.addEventListener("click", () => {
        this.openCoachUpdateModal();
      });
    }

    if (this.btnDiscardActiveSession) {
      this.btnDiscardActiveSession.addEventListener("click", () => {
        if (confirm("Cancel and discard current active session?")) {
          if (this.activeWorkout) {
            this.activeWorkout.dispose();
            this.activeWorkout = null;
          }
          StorageEngine.clearActiveWorkout();
          this.hideFloatingRestTimer();
          this.resetMetronomeUI();
          if (this.activeDraftResumeBanner) this.activeDraftResumeBanner.classList.add("hidden");
          this.switchTab("home");
        }
      });
    }

    if (this.rpeSlider) {
      this.rpeSlider.addEventListener("input", (e) => {
        if (this.rpeValDisplay) this.rpeValDisplay.textContent = e.target.value;
        this.persistCoachEdits();
      });
    }

    this.coachNotesInput.addEventListener('input', () => this.persistCoachEdits());
    if (this.btnCloseCoachModal) {
      this.btnCloseCoachModal.addEventListener("click", () => {
        this.closeCoachUpdateModal();
        this.switchTab("home");
      });
    }

    if (this.btnShareWhatsApp) {
      this.btnShareWhatsApp.addEventListener("click", () => {
        if (this.latestSessionLog) {
          const notes = this.coachNotesInput ? this.coachNotesInput.value : "";
          const rpe = this.rpeSlider ? this.rpeSlider.value : 8;
          this.latestSessionLog.coachNotes = notes;
          this.latestSessionLog.rpeRating = rpe;
          
          const waUrl = CoachUpdater.getWhatsAppShareUrl(this.latestSessionLog);
          window.open(waUrl, "_blank");
          this.closeCoachUpdateModal();
          this.switchTab("home");
        }
      });
    }

    if (this.btnCopyReport) {
      this.btnCopyReport.addEventListener("click", async () => {
        if (this.latestSessionLog) {
          const notes = this.coachNotesInput ? this.coachNotesInput.value : "";
          const rpe = this.rpeSlider ? this.rpeSlider.value : 8;
          this.latestSessionLog.coachNotes = notes;
          this.latestSessionLog.rpeRating = rpe;

          const text = CoachUpdater.generateSummaryText(this.latestSessionLog);
          const copied = await CoachUpdater.copyToClipboard(text);
          if (copied) {
            this.btnCopyReport.textContent = "✓ Copied to Clipboard!";
            setTimeout(() => {
              this.btnCopyReport.textContent = "📋 Copy Summary Text";
            }, 2000);
          }
        }
      });
    }

    if (this.btnToggleMetronome) {
      this.btnToggleMetronome.addEventListener("click", () => {
        if (this.activeWorkout) {
          this.activeWorkout.unlockIOSAudio();

          if (this.activeWorkout.metronomeActive) {
            this.activeWorkout.stopMetronome();
            this.btnToggleMetronome.classList.remove("active");
            this.btnToggleMetronome.textContent = "⏱ Voice Metronome (3s)";
            if (this.metronomeVisualBar) this.metronomeVisualBar.classList.add("hidden");
          } else {
            this.btnToggleMetronome.classList.add("active");
            if (this.metronomeVisualBar) this.metronomeVisualBar.classList.remove("hidden");
            
            this.activeWorkout.startMetronome((stepText, stepIdx) => {
              if (this.metronomeStatusText) {
                this.metronomeStatusText.textContent = stepText;
              }
              this.btnToggleMetronome.textContent = `⏱ Metronome: ${stepText}`;
            });
          }
        }
      });
    }

    if (this.btnExportData) {
      this.btnExportData.addEventListener("click", () => StorageEngine.exportBackupJSON());
    }

    if (this.btnResetData) {
      this.btnResetData.addEventListener("click", () => {
        if (confirm("Are you sure you want to reset all workout history and PRs? This cannot be undone.")) {
          this.activeWorkout?.dispose();
          StorageEngine.resetAllData();
          location.reload();
        }
      });
    }
  }

  resetMetronomeUI() {
    this.btnToggleMetronome.classList.remove('active');
    this.btnToggleMetronome.textContent = '⏱ Voice Metronome (3s)';
    this.metronomeVisualBar.classList.add('hidden');
  }

  openMealEditor(estimate = {}) {
    const form = document.getElementById('mealForm');
    form.reset();
    for (const key of ['name', 'calories', 'protein', 'carbs', 'fat', 'notes']) {
      form.elements[key].value = estimate[key] ?? '';
    }
    document.getElementById('mealModal').showModal();
  }

  persistCoachEdits() {
    if (!this.latestSessionLog) return;
    this.latestSessionLog.coachNotes = this.coachNotesInput.value;
    this.latestSessionLog.rpeRating = Number(this.rpeSlider.value);
    StorageEngine.saveCompletedSession(this.latestSessionLog);
    this.reportPreview.textContent = CoachUpdater.generateSummaryText(this.latestSessionLog);
  }

  switchTab(tabName) {
    if (tabName === 'active' && this.activeWorkout && !this.activeWorkout.disposed) {
      this.currentWeek = this.activeWorkout.weekNum;
      PROGRAM_DATA.setActiveProgram(this.activeWorkout.activeProgram.id);
      StorageEngine.setCurrentWeek(this.currentWeek);
      this.programSelect.value = this.activeWorkout.activeProgram.id;
      this.weekSelect.value = this.currentWeek;
    }
    this.activeTab = tabName;
    this.checkActiveDraftSession();
    
    this.navTabs.forEach((t) => {
      if (t.getAttribute("data-target") === tabName) {
        t.classList.add("active");
      } else {
        t.classList.remove("active");
      }
    });

    [this.viewHome, this.viewActiveSession, this.viewHistory, this.viewNutrition, this.viewWhoop, this.viewSettings].forEach((v) => {
      if (v) v.classList.add("hidden");
    });

    if (tabName === "home") {
      this.viewHome.classList.remove("hidden");
      this.renderHome();
    } else if (tabName === "history") {
      this.viewHistory.classList.remove("hidden");
      this.renderHistory();
    } else if (tabName === "nutrition") {
      this.viewNutrition.classList.remove("hidden");
      this.renderNutrition();
    } else if (tabName === "whoop") {
      this.viewWhoop.classList.remove("hidden");
      this.renderWhoop();
    } else if (tabName === "settings") {
      this.viewSettings.classList.remove("hidden");
    } else if (tabName === "active") {
      this.viewActiveSession.classList.remove("hidden");
    }
  }

  render() {
    this.renderWhoopHeader();
    this.switchTab("home");
  }

  renderWhoopHeader() {
    const wData = WhoopTracker.getTodayWhoopData(localDateKey());
    const advice = WhoopTracker.getReadinessAdvice(wData.recoveryScore);
    if (this.whoopHeaderTitle) this.whoopHeaderTitle.textContent = wData.recoveryScore == null ? 'Log today’s WHOOP recovery' : `WHOOP Recovery: ${wData.recoveryScore}% (${advice.zone} Zone)`;
    if (this.whoopHeaderAdvice) this.whoopHeaderAdvice.textContent = advice.advice;
    this.whoopHeaderBanner.style.borderColor = advice.color;
    this.whoopHeaderBanner.querySelector('.quote-icon').textContent = ({GREEN:'🟢',YELLOW:'🟡',RED:'🔴'})[advice.zone] || '⌚';
  }

  renderHolisticProgress() {
    const history = StorageEngine.getCompletedSessions();
    const activeProg = PROGRAM_DATA.getActiveProgram();
    const progress = programProgress(history, activeProg, StorageEngine.getActiveCycle(activeProg.id));
    if (this.holisticProgressPct) this.holisticProgressPct.textContent = `${progress.percent}% · ${progress.completed}/${progress.total} sessions`;
    if (this.holisticProgressBar) this.holisticProgressBar.style.width = `${progress.percent}%`;

    if (this.weeksGridChips) {
      this.weeksGridChips.innerHTML = "";
      for (let w = 1; w <= 6; w++) {
        const weekSessions = progress.weeks[w - 1];
        const isDone = weekSessions >= 3;
        const chip = document.createElement("div");
        chip.style.cssText = `font-size: 0.7rem; font-weight: 800; padding: 4px; border-radius: var(--radius-sm); border: 1px solid ${isDone ? 'var(--accent-green)' : 'rgba(255,255,255,0.1)'}; background: ${isDone ? 'rgba(0,255,136,0.15)' : 'rgba(255,255,255,0.02)'}; color: ${isDone ? 'var(--accent-green)' : 'var(--text-muted)'};`;
        chip.textContent = isDone ? `✓ W${w}` : weekSessions > 0 || w === this.currentWeek ? `⏳ W${w}` : `W${w}`;
        this.weeksGridChips.appendChild(chip);
      }
    }
  }

  renderHome() {
    this.renderHolisticProgress();
    if (!this.dayCardsContainer) return;
    this.dayCardsContainer.innerHTML = "";

    const activeProg = PROGRAM_DATA.getActiveProgram();
    const targetInfo = activeProg.getWeekTarget(this.currentWeek);

    if (this.homeProgramTitle) {
      this.homeProgramTitle.textContent = activeProg.title;
      document.getElementById('programDescription').textContent = activeProg.id === 'phase2' ? 'Four-set pyramids · 15, 12, 9, 6 reps · 3s eccentric.' : 'Foundation · 3 working sets · 8 → 10 → 12 reps over six weeks.';
    }

    activeProg.days.forEach((day) => {
      const card = document.createElement("div");
      card.className = "glass-card day-card";

      const repsLabel = activeProg.id === 'phase2' && !day.sections.some(s=>s.exercises.some(e=>e.pyramidReps)) ? 'Circuit · 3 sets' : targetInfo.reps && Array.isArray(targetInfo.reps)
        ? "Pyramid (15,12,9,6)"
        : `${targetInfo.reps} Reps`;

      card.innerHTML = `
        <div class="day-header">
          <h3 class="day-title">${day.name}</h3>
        </div>
        <div class="day-subtitle">${day.subtitle}</div>
        <div class="day-meta-tags">
          <span class="tag tag-highlight">⚡ Week ${this.currentWeek}: ${repsLabel}</span>
          <span class="tag">3s Eccentric Focus</span>
        </div>
        <button class="btn-start-day">
          <span>🔥 START TRAINING</span>
        </button>
      `;

      card.querySelector(".btn-start-day").addEventListener("click", () => {
        this.startWorkout(day.id);
      });

      this.dayCardsContainer.appendChild(card);
    });
  }

  startWorkout(dayId) {
    if (this.activeWorkout && !this.activeWorkout.disposed) { this.switchTab('active'); return; }
    const draft = StorageEngine.getActiveWorkoutDraft();
    if (draft) { this.resumeDraftWorkout(draft); return; }
    this.latestSessionLog = null;
    this.coachNotesInput.value = '';
    this.rpeSlider.value = 8;
    this.rpeValDisplay.textContent = '8';
    this.resetMetronomeUI();
    if (this.activeDraftResumeBanner) this.activeDraftResumeBanner.classList.add("hidden");
    this.activeWorkout = new WorkoutEngine(dayId, this.currentWeek);
    
    this.activeWorkout.onClockTick = (formattedTime) => {
      if (this.sessionTimer) this.sessionTimer.textContent = formattedTime;
    };

    this.activeWorkout.onSetCompleted = (exId, setIdx) => {
      this.activeWorkout.startRestTimer(StorageEngine.getPreferences().restSeconds, (secLeft) => {
        this.showFloatingRestTimer(secLeft);
      }, () => {
        this.hideFloatingRestTimer();
      });
    };

    this.sessionTitle.textContent = `${this.activeWorkout.dayData.name} · Week ${this.activeWorkout.weekNum}`;
    this.sessionTimer.textContent = this.activeWorkout.getFormattedElapsed();
    this.renderActiveSessionExercises();
    this.switchTab("active");
  }

  renderActiveSessionExercises() {
    if (!this.sessionExercisesContainer || !this.activeWorkout) return;
    this.sessionExercisesContainer.innerHTML = "";

    const dayData = this.activeWorkout.dayData;

    dayData.sections.forEach((section) => {
      const secHeader = document.createElement("h4");
      secHeader.style.cssText = "color: var(--accent-gold); margin: 20px 0 10px 0; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 800;";
      secHeader.textContent = section.title;
      this.sessionExercisesContainer.appendChild(secHeader);

      section.exercises.forEach((ex) => {
        const exCard = document.createElement("div");
        exCard.className = "glass-card exercise-card";

        let supersetBadgeHTML = "";
        if (ex.superset) {
          supersetBadgeHTML = `<div class="superset-badge">SUPERSET ${ex.supersetRole}</div>`;
        }

        let commentsHTML = "";
        if (ex.comments) {
          commentsHTML = `<div class="exercise-comments">💡 ${ex.comments}</div>`;
        }

        const loggedEx = this.activeWorkout.loggedData[ex.id];

        let setsRowsHTML = loggedEx.sets.map((setObj, sIdx) => {
          const sug = ProgressiveEngine.getSetSuggestion(ex.id, this.activeWorkout.weekNum, sIdx, setObj.reps, this.activeWorkout.activeProgram.id, dayData.id, undefined, this.activeWorkout.cycleId);

          const sugBannerHTML = `<div id="suggestion_${ex.id}_${sIdx}" class="suggestion-pill ${sug.hasData ? '' : 'hidden'}">${escapeHtml(sug.text)}</div>`;

          return `
            ${sugBannerHTML}
            <div class="set-row ${setObj.completed ? 'completed' : ''}" id="setRow_${ex.id}_${sIdx}">
              <div class="set-label">Set ${setObj.setNum}</div>
              <input type="number" min="0" step="0.5" aria-label="Weight in kilograms" class="set-input" placeholder="${sug.suggestedWeight ? sug.suggestedWeight + 'kg' : 'kg'}" value="${escapeHtml(setObj.weight)}" id="inputW_${ex.id}_${sIdx}">
              <input type="text" aria-label="Repetitions or hold time" class="set-input" placeholder="reps" value="${escapeHtml(setObj.reps)}" id="inputR_${ex.id}_${sIdx}">
              <input type="text" aria-label="Set effort RPE" class="set-input" placeholder="RPE" value="${escapeHtml(setObj.rpe)}" id="inputRPE_${ex.id}_${sIdx}">
              <button class="btn-check-set" aria-label="Toggle set completed" aria-pressed="${setObj.completed}" id="btnCheck_${ex.id}_${sIdx}">
                ${setObj.completed ? '✓' : '○'}
              </button>
            </div>
          `;
        }).join("");

        exCard.innerHTML = `
          ${supersetBadgeHTML}
          <div class="exercise-title-row">
            <div class="exercise-name">${ex.name}</div>
          </div>
          ${commentsHTML}
          <div class="sets-header-row">
            <span>SET</span>
            <span>KG</span>
            <span>REPS</span>
            <span>RPE</span>
            <span>LOG</span>
          </div>
          ${setsRowsHTML}
        `;

        this.sessionExercisesContainer.appendChild(exCard);

        loggedEx.sets.forEach((setObj, sIdx) => {
          const btnCheck = exCard.querySelector(`#btnCheck_${ex.id}_${sIdx}`);
          const inputW = exCard.querySelector(`#inputW_${ex.id}_${sIdx}`);
          const inputR = exCard.querySelector(`#inputR_${ex.id}_${sIdx}`);
          const inputRPE = exCard.querySelector(`#inputRPE_${ex.id}_${sIdx}`);

          for (const [input, field] of [[inputW,'weight'],[inputR,'reps'],[inputRPE,'rpe']]) {
            input.addEventListener('input', () => {
              setObj[field] = input.value;
              if (field === 'reps') {
                const suggestion = ProgressiveEngine.getSetSuggestion(ex.id, this.activeWorkout.weekNum, sIdx, input.value, this.activeWorkout.activeProgram.id, dayData.id, undefined, this.activeWorkout.cycleId);
                const pill = document.getElementById(`suggestion_${ex.id}_${sIdx}`);
                pill.textContent = suggestion.text;
                pill.classList.toggle('hidden', !suggestion.hasData);
                inputW.placeholder = suggestion.suggestedWeight ? `${suggestion.suggestedWeight}kg` : 'kg';
                if (!input.value.trim()) {
                  setObj.completed = false;
                  btnCheck.setAttribute('aria-pressed', 'false');
                  btnCheck.textContent = '○';
                  exCard.querySelector(`#setRow_${ex.id}_${sIdx}`).classList.remove('completed');
                }
              }
              this.activeWorkout.saveDraft();
            });
          }
          if (btnCheck) {
            btnCheck.addEventListener("click", () => {
              if (!setObj.completed && (!inputW.checkValidity() || !inputR.value.trim())) {
                alert('Enter a non-negative weight (or leave blank for bodyweight) and repetitions or time.');
                return;
              }
              const weightVal = inputW ? inputW.value : '';
              const repsVal = inputR ? inputR.value : "";
              const rpeVal = inputRPE ? inputRPE.value : "";

              this.activeWorkout.toggleSetCompleted(ex.id, sIdx, weightVal, repsVal, rpeVal);
              
              btnCheck.setAttribute('aria-pressed', String(loggedEx.sets[sIdx].completed));
              const row = exCard.querySelector(`#setRow_${ex.id}_${sIdx}`);
              if (row) {
                if (loggedEx.sets[sIdx].completed) {
                  row.classList.add("completed");
                  btnCheck.textContent = "✓";
                } else {
                  row.classList.remove("completed");
                  btnCheck.textContent = "○";
                }
              }
            });
          }
        });
      });
    });
  }

  renderNutrition() {
    const settings = NutritionEngine.getNutritionSettings();
    const totals = NutritionEngine.getTodayTotals();
    const metrics = [['Calories', totals.calories, settings.targetCalories, 'kcal', 'gold'], ['Protein',totals.protein,settings.targetProtein,'g','orange'], ['Carbs',totals.carbs,settings.targetCarbs,'g','cyan'], ['Fat',totals.fat,settings.targetFat,'g','green']];
    document.getElementById('macroRings').innerHTML = metrics.map(([name,value,target,unit,color]) => `<div class="macro-item"><div class="macro-ring" role="img" aria-label="${name}: ${value} of ${target} ${unit}" style="--progress:${target > 0 ? Math.min(100, value / target * 100) : 0}%;--ring:var(--accent-${color})"><strong>${value}</strong></div><b>${name}</b><small>of ${target} ${unit}</small></div>`).join('');

    if (this.bmrValueDisplay) this.bmrValueDisplay.textContent = `${settings.bmr.toLocaleString()} kcal`;
    if (this.tdeeValueDisplay) this.tdeeValueDisplay.textContent = `${settings.tdee.toLocaleString()} kcal`;

    if (this.calsProgressText) this.calsProgressText.textContent = `${totals.calories} / ${settings.tdee} kcal`;
    if (this.calsProgressBar) {
      const pct = Math.min(100, Math.round((totals.calories / settings.tdee) * 100));
      this.calsProgressBar.style.width = `${pct}%`;
    }

    if (this.proteinProgressText) this.proteinProgressText.textContent = `${totals.protein} / ${settings.targetProtein}g`;
    if (this.carbsProgressText) this.carbsProgressText.textContent = `${totals.carbs} / ${settings.targetCarbs}g`;
    if (this.fatsProgressText) this.fatsProgressText.textContent = `${totals.fat} / ${settings.targetFat}g`;

    if (this.mealsListContainer) {
      this.mealsListContainer.innerHTML = "";
      const meals = NutritionEngine.getTodayMealLogs();

      if (meals.length === 0) {
        this.mealsListContainer.innerHTML = `
          <div style="text-align: center; color: var(--text-muted); padding: 20px 0; font-size: 0.85rem;">
            No meals logged for this date yet. Snap a meal/drink photo above!
          </div>
        `;
        return;
      }

      meals.forEach((m) => {
        const card = document.createElement("div");
        card.className = "history-card";
        card.innerHTML = `
          <div class="history-card-header">
            <span>🍽 ${escapeHtml(m.name)}</span>
            <div style="display: flex; gap: 8px; align-items: center;">
              <span style="color: var(--accent-gold);">${m.calories} kcal</span>
              <button class="btn-timer-action" style="background: rgba(255,68,68,0.2); color: #ff4444;" data-delete-meal>🗑 Delete</button>
            </div>
          </div>
          <div class="history-card-date">⏱ ${escapeHtml(m.time)} | P: ${m.protein}g • C: ${m.carbs}g • F: ${m.fat}g</div>
          ${m.notes ? `<div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 4px;">💡 ${escapeHtml(m.notes)}</div>` : ''}
        `;

        const btnDeleteMeal = card.querySelector('[data-delete-meal]');
        if (btnDeleteMeal) {
          btnDeleteMeal.addEventListener("click", () => {
            NutritionEngine.deleteMealLog(m.id);
            this.renderNutrition();
          });
        }

        this.mealsListContainer.appendChild(card);
      });
    }
  }

  renderWhoop() {
    const wData = WhoopTracker.getTodayWhoopData();
    const advice = WhoopTracker.getReadinessAdvice(wData.recoveryScore);

    if (this.whoopZoneBadge) {
      this.whoopZoneBadge.textContent = advice.title;
      this.whoopZoneBadge.style.color = advice.color;
    }
    if (this.whoopAdviceText) this.whoopAdviceText.textContent = advice.advice;

    if (this.whoopRecoveryInput) this.whoopRecoveryInput.value = wData.recoveryScore;
    if (this.whoopStrainInput) this.whoopStrainInput.value = wData.dayStrain;
    if (this.whoopSleepInput) this.whoopSleepInput.value = wData.sleepPerformance;
  }

  showFloatingRestTimer(secLeft) {
    if (!this.floatingRestTimer) return;
    this.floatingRestTimer.classList.remove("hidden");
    if (this.restTimerDisplay) {
      const mins = Math.floor(secLeft / 60);
      const secs = secLeft % 60;
      this.restTimerDisplay.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
    }
  }

  hideFloatingRestTimer() {
    if (this.floatingRestTimer) this.floatingRestTimer.classList.add("hidden");
  }

  async openCoachUpdateModal() {
    if (!this.activeWorkout) return;

    const overallRpe = this.rpeSlider ? Number(this.rpeSlider.value) : 8;
    const coachNotes = this.coachNotesInput ? this.coachNotesInput.value : "";

    const completed = Object.values(this.activeWorkout.loggedData).some(ex => ex.sets.some(set => set.completed));
    if (!completed) { alert('Check at least one completed set before finishing.'); return; }
    const c=mainCompletion({programId:this.activeWorkout.activeProgram.id,dayId:this.activeWorkout.dayData.id,exercises:this.activeWorkout.loggedData});
    if(!c.complete && !await confirmPartial(c))return;
    this.latestSessionLog = this.activeWorkout.finishSession(overallRpe, coachNotes);
    this.coachModal.querySelector('.modal-title').textContent=c.complete?'Session completed':'Partial workout saved';
    this.hideFloatingRestTimer();
    this.resetMetronomeUI();
    
    const summaryText = CoachUpdater.generateSummaryText(this.latestSessionLog);
    if (this.reportPreview) this.reportPreview.textContent = summaryText;

    this.coachModal.classList.remove("hidden");
  }

  closeCoachUpdateModal() {
    this.persistCoachEdits();
    if (this.coachModal) this.coachModal.classList.add('hidden');
    this.hideFloatingRestTimer();
    if (this.metronomeVisualBar) this.metronomeVisualBar.classList.add("hidden");
    this.activeWorkout = null;
    this.latestSessionLog = null;
    this.renderHolisticProgress();
  }

  renderHistory() {
    if (!this.historyListContainer) return;
    this.historyListContainer.innerHTML = "";

    const history = StorageEngine.getCompletedSessions();

    if (history.length === 0) {
      this.historyListContainer.innerHTML = `
        <div style="text-align: center; color: var(--text-muted); padding: 40px 0;">
          <div style="font-size: 2.2rem; margin-bottom: 8px;">📋</div>
          <p>No completed workout logs yet.</p>
          <p style="font-size: 0.82rem;">Complete your first session to view coach updates & logs here!</p>
        </div>
      `;
      return;
    }

    history.forEach((log) => {
      const card = document.createElement("div");
      card.className = "history-card";
      
      const summaryText = CoachUpdater.generateSummaryText(log);

      card.innerHTML = `
        <div class="history-card-header">
          <span>${escapeHtml(log.dayName)} (Week ${log.week})</span>
          <div style="display: flex; gap: 8px; align-items: center;">
            <span>⏱ ${log.durationMins}m</span>
            <button class="btn-timer-action btn-delete-log" style="background: rgba(255,68,68,0.2); color: #ff4444;" data-delete-session>🗑 Delete</button>
          </div>
        </div>
        <div class="history-card-date">📅 ${escapeHtml(log.date)} ${log.rpeRating ? `| RPE ${log.rpeRating}/10` : ''}</div>
        <pre style="margin-top: 10px; font-family: monospace; font-size: 0.78rem; color: var(--text-secondary); background: rgba(0,0,0,0.4); padding: 10px; border-radius: var(--radius-sm); white-space: pre-wrap;">${escapeHtml(summaryText)}</pre>
      `;

      const btnDelete = card.querySelector('[data-delete-session]');
      if (btnDelete) {
        btnDelete.addEventListener("click", () => {
          if (confirm(`Delete workout log for ${escapeHtml(log.dayName)} (Week ${log.week})?`)) {
            StorageEngine.deleteCompletedSession(log.id);
            this.renderHistory();
            this.renderHolisticProgress();
          }
        });
      }

      this.historyListContainer.appendChild(card);
    });
  }

  registerServiceWorker() {
    if(!('serviceWorker' in navigator))return;
    const register=()=>navigator.serviceWorker.register('./sw.js').catch(()=>notify('Offline setup failed. Reopen while online.'));
    if(document.readyState==='complete')register();else window.addEventListener('load',register,{once:true});
  }

}

document.addEventListener("DOMContentLoaded", async () => {
  try { if(await acquireEditor()) window.sncApp = new AppController(); } catch(error) { document.body.textContent="Could not open saved records: "+error.message+". Keep your site data and try freeing device storage."; }
});
