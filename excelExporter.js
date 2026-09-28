import { StorageEngine } from './storage.js';
import { PROGRAM_DATA } from './programData.js';
import { localDateKey, numericReps, programIdFor, setVolume, cycleIdFor, sessionStatus } from './dataUtils.js';
import { createWorkbook } from './xlsxWriter.js';

export function buildCoachSheets(history, program, cycleId) {
  const sessions = history.filter(s => programIdFor(s) === program.id && (!cycleId || cycleIdFor(s) === cycleId) && s.week >= 1 && s.week <= 6)
    .sort((a,b) => a.timestamp - b.timestamp);
  const summary = new Map();
  const header = ['Date','Routine','Minutes','Session RPE','Exercise','Set','Weight (kg)','Reps / time','Set RPE','Completed','Volume (kg × reps)','Coach notes','Status','Training block','Sides','Load multiplier'];
  const weeks = Array.from({ length: 6 }, (_, i) => ({ name: `Week ${i+1}`, rows: [header] }));
  for (const session of sessions) {
    for (const [id, ex] of Object.entries(session.exercises || {})) {
      for (const set of ex.sets || []) {
        const weight = Number(set.weight) || 0;
        const reps = numericReps(set.reps);
        const volume = setVolume(set);
        weeks[session.week - 1].rows.push([session.date, session.dayName, session.durationMins, session.rpeRating, ex.name, set.setNum, set.weight === '' ? 'Unspecified / BW' : weight, set.reps, set.rpe, set.completed ? 'Yes' : 'No', volume, session.coachNotes || '',sessionStatus(session),cycleIdFor(session),set.sides || (/ES/i.test(String(set.reps))?2:1),set.loadCount || 1]);
        if (!set.completed || weight <= 0 || !reps) continue;
        if (!summary.has(id)) summary.set(id, { name: ex.name, firstSession: session.id, start: weight, best: weight, reps, firstDate: session.date, bestDate: session.date, volume: 0 });
        const entry = summary.get(id);
        if (entry.firstSession === session.id) entry.start = Math.max(entry.start, weight);
        if (weight > entry.best || (weight === entry.best && reps > entry.reps)) {
          entry.best = weight; entry.reps = reps; entry.bestDate = session.date;
        }
        entry.volume += volume;
      }
    }
  }
  return [{ name: 'Executive Summary', rows: [
    ['Exercise','Starting max (kg)','Best max (kg)','Reps at best','First date','Best date','Total volume (kg × reps)'],
    ...[...summary.values()].map(e => [e.name,e.start,e.best,e.reps,e.firstDate,e.bestDate,e.volume]),
    [], ['Program', program.title], ['Sessions logged', sessions.length],
    ['Total external-load volume', [...summary.values()].reduce((sum,e) => sum + e.volume, 0)],
    ['Method', 'Starting max = highest completed weight in first recorded session for that exercise.'],
    ['Volume', 'Completed reps × entered kg × sides × load multiplier. Each-side prescriptions use two sides; holds and bodyweight are excluded. Legacy dumbbell weights remain as entered unless edited.']
  ] }, ...weeks];
}
export const ExcelExporter = {
  exportCoachSpreadsheet() {
    const program = PROGRAM_DATA.getActiveProgram();
    const blob = createWorkbook(buildCoachSheets(StorageEngine.getCompletedSessions(), program, StorageEngine.getActiveCycle(program.id)));
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SNC_Coach_${program.id}_${localDateKey()}.xlsx`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }
};
