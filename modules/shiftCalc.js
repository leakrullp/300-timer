import isSupplementTime from "./helligdage.js";

export function calculateEligibleHours(shift) {
  const { date, start, end, roomtime, breaks } = shift;

  const startDT = new Date(`${date}T${start}`);
  let endDT = new Date(`${date}T${end}`);
  if (endDT <= startDT) endDT.setDate(endDT.getDate() + 1);

  // Map break intervals safely
  const breakIntervals = (breaks || []).map((b) => {
    let bStart = new Date(`${date}T${b.start}`);
    let bEnd = new Date(`${date}T${b.end}`);
    if (bStart < startDT) bStart.setDate(bStart.getDate() + 1);
    if (bEnd <= bStart) bEnd.setDate(bEnd.getDate() + 1);
    return { start: bStart, end: bEnd };
  });

  let eligibleMinutes = 0;
  let current = new Date(startDT);

  while (current < endDT) {
    if (isSupplementTime(current)) {
      // If we have detailed breaks, check if current minute is inside one
      if (breaks && breaks.length > 0) {
        const isDuringBreak = breakIntervals.some(
          (b) => current >= b.start && current < b.end,
        );
        if (!isDuringBreak) eligibleMinutes++;
      } else {
        // No detailed breaks (Old data or Checkbox active)
        eligibleMinutes++;
      }
    }
    current.setMinutes(current.getMinutes() + 1);
  }

  let result = eligibleMinutes / 60;

  return result;
}

export function calculateTotalShiftHours(startTime, endTime) {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  let diff = eh * 60 + em - (sh * 60 + sm);
  if (diff < 0) diff += 24 * 60; // overnight
  if (diff === 0) return 24;
  return diff / 60;
}

// Helper to format the date
export function formatShiftDate(dateString) {
  const date = new Date(dateString);
  let formatted = date.toLocaleDateString("da-DA", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  formatted = formatted.replace(".", ""); // remove dot from weekday
  return formatted;
}

// Helper for duration
export function calculateDiffMinutes(s, e) {
  const [sh, sm] = s.split(":").map(Number);
  const [eh, em] = e.split(":").map(Number);
  let diff = eh * 60 + em - (sh * 60 + sm);
  if (diff < 0) diff += 1440;
  return diff;
}
