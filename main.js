import {
  renderShifts,
  saveShifts,
  clearShiftStorage,
} from "./modules/shiftService.js";
import { calculateDiffMinutes } from "./modules/shiftCalc.js";
import {
  animateBurgerMenu,
  closeMenuWhenLinkIsClicked,
} from "./modules/menu.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("shift-form");
  const list = document.getElementById("shift-list");
  const totalEl = document.getElementById("total-hours");
  const includeRoomCheckbox = document.querySelector(
    'input[name="include-hours"]',
  );

  document.getElementById("delete-shift-data").addEventListener("click", () => {
    clearShiftStorage();
  });

  // Load shifts from localStorage
  let shifts = JSON.parse(localStorage.getItem("shifts")) || [];
  shifts = shifts.map((s) => ({
    ...s,
    roomtime: s.roomtime ? Number(s.roomtime) : 0,
  }));

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
        renderShifts(totalEl, shifts, list, includeRoomCheckbox);
      });
    }

    saveShifts(shifts);

    // 1. Target the button and the container
    const addBreakBtn = document.getElementById("add-break-btn");
    const additionalBreaksContainer =
      document.getElementById("additional-breaks");

    if (addBreakBtn) {
      addBreakBtn.addEventListener("click", () => {
        const MAX_BREAKS = 9;

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
                    Retur på værelse kl.
                    <input type="time" name="startOfBreak[]">
                </label>
                <label>
                    Blev kaldt igen kl.
                    <span class="info-tooltip">
                            ⓘ
                            <span class="tooltip-text">
                                Dette felt skal være tomt, hvis du ikke blev kaldt igen efter du gik på værelse.
                            </span>
                        </span>
                    <input type="time" name="endOfBreak[]">
                </label>
            `;

        additionalBreaksContainer.appendChild(newGroup);
      });
    }

    window.deleteShift = function (index) {
      const confirmed = confirm(
        "Er du sikker på, at du vil slette denne vagt?\nDette kan ikke gøres om.",
      );
      if (confirmed) {
        shifts.splice(index, 1);
        saveShifts(shifts);
        renderShifts(totalEl, shifts, list, includeRoomCheckbox);
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

      let breaksArray = [];
      let totalRoomMinutes = 0;

      for (let i = 0; i < startInputs.length; i++) {
        const sVal = startInputs[i].value;
        const eVal = endInputs[i].value;

        if (sVal) {
          const endValue = eVal || end; // if empty → use shift end

          breaksArray.push({ start: sVal, end: endValue });

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
        breaks: breaksArray, // New detailed support
      });

      saveShifts(shifts);
      renderShifts(totalEl, shifts, list, includeRoomCheckbox);

      additionalBreaksContainer.innerHTML = "";

      // preserve checkbox state
      if (includeRoomCheckbox)
        includeRoomCheckbox.checked = includeRoomCheckbox.checked;
    });
    //end of listener!!

    // Initial render
    renderShifts(totalEl, shifts, list, includeRoomCheckbox);
  }

  // ========================
  // BURGER MENU LOGIC
  // ========================
  const burger = document.getElementById("burger");
  const navLinks = document.getElementById("nav-links");
  const burgerIcon = document.getElementById("burger-icon");

  if (burger && navLinks && burgerIcon) {
    animateBurgerMenu(burger, navLinks, burgerIcon);
    closeMenuWhenLinkIsClicked(navLinks, burgerIcon);
  }
});
