import {sessionStatus, prescription} from './dataUtils.js';
import {PROGRAM_DATA} from './programData.js';
/**
 * Coach Update Generator & WhatsApp Sharing Utility
 * Transforms completed workout session into formatted text for coach
 */

export const CoachUpdater = {
  /**
   * Formats completed workout data into clean message format
   */
  generateSummaryText(sessionLog) {
    const { dayName, week, date, durationMins, exercises, coachNotes, rpeRating } = sessionLog;

    let text = `🏋️‍♀️ *SNC Program Update - Week ${week}*\n`;
    text += `${PROGRAM_DATA.programs[sessionLog.programId]?.title || 'SNC training'}\n`;
    text += `📌 *${dayName}*\n`;
    text += `📅 Date: ${date} | ⏱ Duration: ${durationMins ?? 'Not recorded'}${durationMins == null ? '' : ' mins'}\n`;
    text += `Status: ${sessionStatus(sessionLog)}\n`;
    if (rpeRating) {
      text += `🔥 Session Overall RPE: ${rpeRating}/10\n`;
    }
    text += `----------------------------------------\n\n`;

    // Group logged sets by exercise
    if (exercises && Object.keys(exercises).length > 0) {
      Object.entries(exercises).forEach(([exId, exData]) => {
        if (!exData.sets?.some(set => set.completed)) return;
        const exName = exData.name || exId;
        text += `🔹 *${exName}*\n`;
        if (Array.isArray(exData.sets)) {
          exData.sets.forEach((set, idx) => {
            if (set.completed) {
              const weightStr = set.weight ? `${set.weight}kg${set.loadCount===2?" per hand × 2":" total load"}` : "BW";
              const repsStr = /^\d+$/.test(String(set.reps)) ? `${set.reps} reps` : String(set.reps);
              const sideStr = (set.sides||prescription(set.reps).sides)===2 && !/ES|each side|per side/i.test(String(set.reps)) ? " each side" : "";
              const rpeStr = set.rpe ? ` @ RPE ${set.rpe}` : "";
              text += `   Set ${idx + 1}: ${weightStr} x ${repsStr}${sideStr}${rpeStr}\n`;
            }
          });
        }
        text += `\n`;
      });
    }

    if (coachNotes && coachNotes.trim()) {
      text += `📝 *Notes for Coach*:\n"${coachNotes.trim()}"\n\n`;
    }

    text += `💪 Logged via SNC Personal Workout App`;

    return text;
  },

  /**
   * Generates a direct WhatsApp web/app link with pre-filled message
   */
  getWhatsAppShareUrl(sessionLog, phoneNumber = "") {
    const formattedText = this.generateSummaryText(sessionLog);
    const encodedText = encodeURIComponent(formattedText);
    if (phoneNumber && phoneNumber.trim()) {
      const cleanPhone = phoneNumber.replace(/[^0-9]/g, "");
      return `https://wa.me/${cleanPhone}?text=${encodedText}`;
    }
    return `https://wa.me/?text=${encodedText}`;
  },

  /**
   * Copies formatted summary text to clipboard
   */
  async copyToClipboard(text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // Fallback for older browsers
        const textarea = document.createElement("textarea");
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        const copied = document.execCommand("copy");
        document.body.removeChild(textarea);
        return copied;
      }
    } catch (err) {
      console.error("Copy failed", err);
      return false;
    }
  }
};
