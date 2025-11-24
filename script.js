document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("shift-form");
  const list = document.getElementById("shift-list");
  const totalEl = document.getElementById("total-hours");
  const includeRoomCheckbox = document.querySelector(
    'input[name="include-hours"]'
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
          includeRoomCheckbox.checked ? "1" : "0"
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

      let t = startDateTime;

      while (t < endDateTime) {
        const next = new Date(Math.min(+t + ONE_MIN, +endDateTime));

        const day = t.getDay();
        const hour = t.getHours() + t.getMinutes() / 60;

        const isWeekendOrHoliday = day === 0 || day === 6 || isHoliday(t); // Sunday=0, Saturday=6
        const dur = (next - t) / (1000 * 60 * 60); // preliminary duration

        if (isWeekendOrHoliday) {
          weekend += dur;
        } else {
          if (hour < 6) {
            weekday_00_06 += dur;
          } else if (hour >= 18) {
            weekday_18_24 += dur;
          }
        }

        t = next;
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

      // Totals
      let sumShiftLength = 0,
        sumRoom = 0,
        sumTotal = 0;

      const includeRoomtime = includeRoomCheckbox
        ? includeRoomCheckbox.checked
        : true;

      // Sort shifts by date
      shifts.sort((a, b) => new Date(a.date) - new Date(b.date));

      // Loop through shifts
      shifts.forEach((s, index) => {
        const room = Number(s.roomtime) || 0;

        // Calculate total shift length
        const shiftLength = calculateTotalShiftHours(s.start, s.end);
        // Calculate base hours
        const baseHours = calculateBaseHoursFromShift(s.date, s.start, s.end);
        // Calculate hours that count towards 300 hours
        const totalHours = includeRoomtime ? baseHours : baseHours - room;

        // Accumulate totals
        sumShiftLength += shiftLength;
        sumRoom += room;
        sumTotal += totalHours;

        // Create row
        const row = document.createElement("tr");
        row.innerHTML = `
      <td>${index + 1}</td>
      <td>${formatShiftDate(s.date)}</td>
      <td>${s.start}</td>
      <td>${s.end}</td>
      <td>${formatHours(shiftLength)}</td>
      <td>${formatHours(room)}</td>
      <td>${formatHours(totalHours)}</td>
      <td>
        <button class="rm-from-print rm-btn secondary-btn"
                type="button"
                onclick="deleteShift(${index})">Fjern</button>
      </td>
    `;
        list.appendChild(row);
      });

      // Update footer totals
      totalBaseEl.innerHTML = `<strong>${formatHours(sumShiftLength)}</strong>`;
      totalRoomEl.innerHTML = `<strong>${formatHours(sumRoom)}</strong>`;
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

    window.deleteShift = function (index) {
      const confirmed = confirm(
        "Er du sikker på, at du vil slette denne vagt?\nDette kan ikke gøres om."
      );
      if (confirmed) {
        shifts.splice(index, 1);
        saveShifts();
        renderShifts();
      }
    };

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const date = document.getElementById("date").value;
      const start = document.getElementById("start").value;
      const end = document.getElementById("end").value;

      const myHours = Number(document.getElementById("myHours").value) || 0;
      const myMinutes = Number(document.getElementById("myMinutes").value) || 0;
      const roomtime = myHours + myMinutes / 60;

      shifts.push({ date, start, end, roomtime });
      saveShifts();
      renderShifts();

      // preserve checkbox state
      if (includeRoomCheckbox)
        includeRoomCheckbox.checked = includeRoomCheckbox.checked;
    });

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

function clearStorage() {
  const confirmed = confirm(
    "Er du sikker på, at du vil rydde al data?\nDette kan ikke gøres om."
  );
  if (confirmed) {
    localStorage.clear();
    location.reload();
  }
}

function printPage() {
  window.print();
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
