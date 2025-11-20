document.addEventListener("DOMContentLoaded", () => {
  // ========================
  // SHIFT FORM & TABLE LOGIC
  // ========================
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

    function calculateHours(start, end) {
      const [sh, sm] = start.split(":").map(Number);
      const [eh, em] = end.split(":").map(Number);
      let diff = eh * 60 + em - (sh * 60 + sm);
      if (diff < 0) diff += 24 * 60; // overnight
      return diff / 60;
    }

    function renderShifts() {
      list.innerHTML = "";
      let total = 0;
      const includeRoomtime = includeRoomCheckbox
        ? includeRoomCheckbox.checked
        : true;

      shifts.sort((a, b) => new Date(a.date) - new Date(b.date));

      shifts.forEach((s, index) => {
        const baseHours = calculateHours(s.start, s.end);
        const room = Number(s.roomtime) || 0;
        const totalHours = includeRoomtime ? baseHours : baseHours - room;
        const formattedDate = new Date(s.date).toLocaleDateString();

        total += totalHours;

        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${index + 1}</td>
          <td>${formattedDate}</td>
          <td>${s.start}</td>
          <td>${s.end}</td>
          <td>${formatHours(room)}</td>
          <td>${formatHours(totalHours)}</td>
          <td><button class="rm-from-print rm-btn secondary-btn" type="button" onclick="deleteShift(${index})">Fjern</button></td>
        `;
        list.appendChild(row);
      });

      totalEl.textContent = formatHours(total);
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
      const roomtime = Number(document.getElementById("roomtime").value) || 0;

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
