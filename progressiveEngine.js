import { StorageEngine } from "./storage.js";
import { PROGRAM_DATA } from "./programData.js";
import { numericReps, programIdFor, cycleIdFor } from "./dataUtils.js";
export const ProgressiveEngine = {
  getPreviousWeekLog(
    exerciseId,
    currentWeek,
    programId = PROGRAM_DATA.getActiveProgram().id,
    dayId,
    setIdx = 0,
    cycleId = StorageEngine.getActiveCycle(programId),
  ) {
    const session = StorageEngine.getCompletedSessions()
      .filter(
        (s) =>
          programIdFor(s) === programId &&
          (!dayId || s.dayId === dayId) &&
          cycleIdFor(s) === cycleId &&
          Number(s.week) === Number(currentWeek) - 1 &&
          s.exercises?.[exerciseId]?.sets?.[setIdx]?.completed,
      )
      .sort((a, b) => b.timestamp - a.timestamp)[0];
    return session
      ? { ...session.exercises[exerciseId], sourceDate: session.date }
      : null;
  },
  getSetSuggestion(
    exerciseId,
    currentWeek,
    setIdx,
    targetReps,
    programId = PROGRAM_DATA.getActiveProgram().id,
    dayId,
    increment,
    cycleId,
  ) {
    const prefs = StorageEngine.getPreferences();
    increment ??= prefs.exerciseIncrements?.[exerciseId] ?? prefs.increment;
    const log = this.getPreviousWeekLog(
      exerciseId,
      currentWeek,
      programId,
      dayId,
      setIdx,
      cycleId,
    );
    const previous = log?.sets?.[setIdx],
      empty = {
        hasData: false,
        text: `Target: ${targetReps}`,
        suggestedWeight: "",
      };
    if (!previous?.completed) return empty;
    const prevWeight = Number(previous.weight),
      prevReps = numericReps(previous.reps),
      target = numericReps(targetReps);
    if (!Number.isFinite(prevWeight) || prevWeight < 0 || !prevReps || !target)
      return empty;
    const rpe = Number(previous.rpe),
      increase =
        prevWeight > 0 &&
        prevReps >= target &&
        rpe > 0 &&
        rpe <= 8 &&
        increment > 0;
    const suggestedWeight =
        Math.round((prevWeight + (increase ? increment : 0)) * 100) / 100,
      deltaStr = increase ? `(+${increment}kg; optional)` : "(Maintain)";
    return {
      hasData: true,
      prevWeight,
      prevReps,
      suggestedWeight,
      deltaStr,
      text: `Last Week (${log.sourceDate}): ${prevWeight}kg × ${previous.reps} → Today: ${suggestedWeight}kg × ${targetReps} ${deltaStr}`,
    };
  },
};
