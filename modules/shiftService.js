import { formatHours } from "./dateTimeService.js";
import {
  calculateEligibleHours,
  calculateTotalShiftHours,
  formatShiftDate,
} from "./shiftCalc.js";

export function clearShiftStorage() {
  const confirmed = confirm(
    "Er du sikker på, at du vil rydde al data?\nDette kan ikke gøres om.",
  );
  if (confirmed) {
    localStorage.removeItem("shifts");
    location.reload();
  }
}

export function saveShifts(shifts) {
  localStorage.setItem("shifts", JSON.stringify(shifts));
}

export function renderShifts(totalEl, shifts, list, includeRoomCheckbox) {
  list.innerHTML = "";

  // Footer elements
  const totalBaseEl = document.querySelector("tfoot td:nth-child(5)");
  const totalRoomEl = document.querySelector("tfoot td:nth-child(6)");
  const totalTotalEl = document.querySelector("tfoot td:nth-child(7)");

  let sumShiftLength = 0,
    sumActive = 0,
    sumTotal = 0;

  const includeRoomtime = includeRoomCheckbox
    ? includeRoomCheckbox.checked
    : false;

  // Sort shifts by date
  shifts.sort((a, b) => new Date(a.date) - new Date(b.date));

  shifts.forEach((s, index) => {
    // 1. Total hours physically at work
    const shiftLength = calculateTotalShiftHours(s.start, s.end);

    // 2. Total hours spent in 'vagtværelse' (for the table column display)
    const room = Number(s.roomtime) || 0;

    // 3. Calculate Supplement Hours
    let finalEligibleHours;

    if (includeRoomtime) {
      // Logic: Ignore breaks. Calculate all eligible window hours.
      // We pass a temporary object without breaks to our smart function.
      finalEligibleHours = calculateEligibleHours({
        ...s,
        breaks: [],
      });
    } else {
      // Logic: Smart deduction. Only count minutes that are Eligible AND NOT a break.
      finalEligibleHours = calculateEligibleHours(s);
    }

    const activeHours = shiftLength - room;

    // Accumulate totals
    sumShiftLength += shiftLength;
    sumActive += activeHours;
    sumTotal += finalEligibleHours;

    // Create row
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${formatShiftDate(s.date)}</td>
      <td>${s.start}</td>
      <td>${s.end}</td>
      <td>${formatHours(shiftLength)}</td>
      <td>${formatHours(activeHours)}
      </td>
      <td>${formatHours(finalEligibleHours)}
      </td>
      <td>
        <button class="rm-from-print rm-btn secondary-btn"
                type="button"
                onclick="deleteShift(${index})">Fjern</button>

      </td>
    `;
    list.appendChild(row);
  });

  // Update footer totals
  if (totalBaseEl)
    totalBaseEl.innerHTML = `<strong>${formatHours(sumShiftLength)}</strong>`;
  if (totalRoomEl)
    totalRoomEl.innerHTML = `<strong>${formatHours(sumActive)}</strong>`;
  if (totalTotalEl)
    totalTotalEl.innerHTML = `<strong>${formatHours(sumTotal)}</strong>`;

  // Update top total display
  totalEl.textContent = formatHours(sumTotal);
}
