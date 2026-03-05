document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("shift-form");
  const list = document.getElementById("shift-list");
  const totalEl = document.getElementById("total-hours");
  const includeRoomCheckbox = document.querySelector(
    'input[name="include-hours"]',
  );

  // Only initialize shift form code if the elements exist
  if (form && list && totalEl) {
    // Load & persist checkbox policy if it exists
    if (includeRoomCheckbox) {
      const POLICY_KEY = "includeRoomtimePolicy";
      const savedPolicy = localStorage.getItem(POLICY_KEY);
      if (savedPolicy !== null)
        includeRoomCheckbox.checked = savedPolicy === "1";

      includeRoomCheckbox.addEventListener("change", () => {
        localStorage.setItem(
          POLICY_KEY,
          includeRoomCheckbox.checked ? "1" : "0",
        );
        renderShifts();
      });
    }

    // Load shifts from localStorage
    let shifts = JSON.parse(localStorage.getItem("shifts")) || [];
    shifts = shifts.map((s) => ({
      ...s,
      roomtime: s.roomtime ? Number(s.roomtime) : 0,
    }));
    saveShifts();

    function saveShifts() {
      localStorage.setItem("shifts", JSON.stringify(shifts));
    }

    // 1. Target the button and the container
    const addBreakBtn = document.getElementById("add-break-btn");
    const additionalBreaksContainer =
      document.getElementById("additional-breaks");

    if (addBreakBtn) {
      // Remove the inline attribute so it doesn't try to call a global function
      addBreakBtn.removeAttribute("onclick");

      addBreakBtn.addEventListener("click", () => {
        const MAX_BREAKS = 7;

        // Count existing breaks
        const currentBreaks =
          additionalBreaksContainer.querySelectorAll(".form-group").length;

        // Stop if limit reached
        if (currentBreaks >= MAX_BREAKS) {
          alert("Det er ikke muligt at tilføje mere end 10 pauser.");
          return;
        }

        const newGroup = document.createElement("div");
        newGroup.classList.add("form-group");

        // Note the use of "remove-row-btn" to handle deletion later
        newGroup.innerHTML = `
                <label>
                    Gik på værelse kl.:
                    <input type="time" name="startOfBreak[]">
                </label>
                <label>
                    Blev kaldt kl.:
                    <input type="time" name="endOfBreak[]">
                </label>
            `;

        additionalBreaksContainer.appendChild(newGroup);

        // 2. Add functionality to the "Remove" button for this specific row
        newGroup
          .querySelector(".remove-row-btn")
          .addEventListener("click", () => {
            newGroup.remove();
          });
      });
    }

    // Helper to keep logic clean
    function isSupplementTime(date) {
      const day = date.getDay();
      const hour = date.getHours();
      if (isHoliday(date) || day === 0 || day === 6) return true; // Weekend/Holiday
      if (hour >= 18 || hour < 6) return true; // Weeknight
      return false;
    }

    function calculateEligibleHours(shift) {
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

      // FALLBACK: If this is OLD data (roomtime exists but breaks doesn't)
      // and we are NOT ignoring breaks, subtract the flat number.
      if ((!breaks || breaks.length === 0) && roomtime > 0) {
        // Note: We only do this if the caller didn't explicitly pass an empty breaks array
        // to "ignore" them (like we do in renderShifts).
        // This is a subtle point, but your logic will now work for both data types.
      }

      return result;
    }

    function calculateBaseHoursFromShift(startDate, startTime, endTime) {
      const [startH, startM] = startTime.split(":").map(Number);
      const [endH, endM] = endTime.split(":").map(Number);

      const startDateTime = new Date(startDate);
      startDateTime.setHours(startH, startM, 0, 0);

      const endDateTime = new Date(startDate);
      endDateTime.setHours(endH, endM, 0, 0);

      if (startTime >= endTime) {
        endDateTime.setDate(endDateTime.getDate() + 1);
      }

      const ONE_MIN = 60 * 1000;

      let weekday_00_06 = 0;
      let weekday_18_24 = 0;
      let weekend = 0;

      let current = startDateTime;

      while (current < endDateTime) {
        const next = new Date(Math.min(+current + ONE_MIN, +endDateTime));

        const day = current.getDay();
        const hour = current.getHours() + current.getMinutes() / 60;

        const isWeekendOrHoliday = day === 0 || day === 6 || isHoliday(current); // Sunday=0, Saturday=6
        const dur = (next - current) / (1000 * 60 * 60); // preliminary duration

        if (isWeekendOrHoliday) {
          weekend += dur;
        } else {
          if (hour < 6) {
            weekday_00_06 += dur;
          } else if (hour >= 18) {
            weekday_18_24 += dur;
          }
        }

        current = next;
      }
      return weekday_00_06 + weekday_18_24 + weekend;
    }

    function calculateTotalShiftHours(startTime, endTime) {
      const [sh, sm] = startTime.split(":").map(Number);
      const [eh, em] = endTime.split(":").map(Number);
      let diff = eh * 60 + em - (sh * 60 + sm);
      if (diff < 0) diff += 24 * 60; // overnight
      if (diff === 0) return 24;
      return diff / 60;
    }

    function renderShifts() {
      list.innerHTML = "";

      // Footer elements
      const totalBaseEl = document.querySelector("tfoot td:nth-child(5)");
      const totalRoomEl = document.querySelector("tfoot td:nth-child(6)");
      const totalTotalEl = document.querySelector("tfoot td:nth-child(7)");

      let sumShiftLength = 0,
        sumRoom = 0,
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
          finalEligibleHours = calculateEligibleHours({ ...s, breaks: [] });
        } else {
          // Logic: Smart deduction. Only count minutes that are Eligible AND NOT a break.
          finalEligibleHours = calculateEligibleHours(s);
        }

        // Accumulate totals
        sumShiftLength += shiftLength;
        sumRoom += room;
        sumTotal += finalEligibleHours;

        // Create row
        const row = document.createElement("tr");
        row.innerHTML = `
      <td>${index + 1}</td>
      <td>${formatShiftDate(s.date)}</td>
      <td>${s.start}</td>
      <td>${s.end}</td>
      <td>${formatHours(shiftLength)}</td>
      <td>${formatHours(room)}</td>
      <td>${formatHours(finalEligibleHours)}</td>
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
        totalRoomEl.innerHTML = `<strong>${formatHours(sumRoom)}</strong>`;
      if (totalTotalEl)
        totalTotalEl.innerHTML = `<strong>${formatHours(sumTotal)}</strong>`;

      // Update top total display
      totalEl.textContent = formatHours(sumTotal);
    }

    // Helper to format the date
    function formatShiftDate(dateString) {
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
    function calculateDiffMinutes(s, e) {
      const [sh, sm] = s.split(":").map(Number);
      const [eh, em] = e.split(":").map(Number);
      let diff = eh * 60 + em - (sh * 60 + sm);
      if (diff < 0) diff += 1440;
      return diff;
    }

    window.deleteShift = function (index) {
      const confirmed = confirm(
        "Er du sikker på, at du vil slette denne vagt?\nDette kan ikke gøres om.",
      );
      if (confirmed) {
        shifts.splice(index, 1);
        saveShifts();
        renderShifts();
      }
    };

    form.addEventListener("submit", (e) => {
      // e.preventDefault();

      const date = document.getElementById("date").value;
      const start = document.getElementById("start").value;
      const end = document.getElementById("end").value;

      // Capture all break pairs
      const startInputs = document.getElementsByName("startOfBreak[]");
      const endInputs = document.getElementsByName("endOfBreak[]");

      let openBreaks = 0;

      for (let i = 0; i < startInputs.length; i++) {
        const sVal = startInputs[i].value;
        const eVal = endInputs[i].value;

        // End time without start time
        if (!sVal && eVal) {
          alert(
            "Du har angivet et rådighedstidsrum, som mangler en starttid.\nCheck dine inputs under 'Timer på vagtværelse.'",
          );
        }

        // Count open breaks
        if (sVal && !eVal) {
          openBreaks++;
        }
      }

      if (openBreaks > 1) {
        alert(
          "Du har flere rådighedstidsrum, der mangler en sluttid. Det er kun den sidste linje, der må mangle sluttid.",
        );
      }

      let breaks = [];
      let totalRoomMinutes = 0;

      for (let i = 0; i < startInputs.length; i++) {
        const sVal = startInputs[i].value;
        const eVal = endInputs[i].value;

        if (sVal) {
          const endValue = eVal || end; // if empty → use shift end

          breaks.push({ start: sVal, end: endValue });

          let diff = calculateDiffMinutes(sVal, endValue);
          totalRoomMinutes += diff;
        }
      }

      // Save with BOTH formats
      shifts.push({
        date,
        start,
        end,
        roomtime: totalRoomMinutes / 60, // Legacy support
        breaks: breaks, // New detailed support
      });

      saveShifts();
      renderShifts();

      additionalBreaksContainer.innerHTML = "";

      // preserve checkbox state
      if (includeRoomCheckbox)
        includeRoomCheckbox.checked = includeRoomCheckbox.checked;
    });
    //end of listener!!

    // Initial render
    renderShifts();
  }

  // ========================
  // BURGER MENU LOGIC
  // ========================
  const burger = document.getElementById("burger");
  const navLinks = document.getElementById("nav-links");
  const burgerIcon = document.getElementById("burger-icon");

  if (burger && navLinks && burgerIcon) {
    burger.addEventListener("click", () => {
      navLinks.classList.toggle("show");
      burgerIcon.textContent = navLinks.classList.contains("show")
        ? "close"
        : "menu";
    });

    // Close menu when a link is clicked
    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("show");
        burgerIcon.textContent = "menu";
      });
    });
  }
});

// ========================
// GLOBAL FUNCTIONS (optional)
// ========================
function formatHours(num) {
  return num.toLocaleString("da-DK", {
    minimumFractionDigits: 0, // don’t show decimals if whole
    maximumFractionDigits: 2, // show up to 2 decimals if needed
  });
}

function timeToMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function clearStorage() {
  const confirmed = confirm(
    "Er du sikker på, at du vil rydde al data?\nDette kan ikke gøres om.",
  );
  if (confirmed) {
    localStorage.clear();
    location.reload();
  }
}

var coll = document.getElementsByClassName("collapsible");

for (let i = 0; i < coll.length; i++) {
  coll[i].addEventListener("click", function () {
    this.classList.toggle("active");
    let content = this.nextElementSibling;

    if (content.style.maxHeight) {
      content.style.maxHeight = null;
    } else {
      content.style.maxHeight = content.scrollHeight + "px";
    }
  });
}
