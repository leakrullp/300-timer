const form = document.getElementById("shift-form");
const list = document.getElementById("shift-list");
const totalEl = document.getElementById("total-hours");
const includeRoomCheckbox = form.querySelector('input[name="visible"]');

// ---- load & persist policy (checkbox) ----
const POLICY_KEY = "includeRoomtimePolicy";
const savedPolicy = localStorage.getItem(POLICY_KEY);
if (savedPolicy !== null) includeRoomCheckbox.checked = savedPolicy === "1";
includeRoomCheckbox.addEventListener("change", () => {
  localStorage.setItem(POLICY_KEY, includeRoomCheckbox.checked ? "1" : "0");
  renderShifts(); // re-render immediately when toggled
});

// ---- load shifts ----
let shifts = JSON.parse(localStorage.getItem("shifts")) || [];

// Optional: migrate old entries that might have strings
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
  const includeRoomtime = includeRoomCheckbox.checked;

  shifts.forEach((s, index) => {
    const baseHours = calculateHours(s.start, s.end);
    const room = Number(s.roomtime) || 0;
    const totalHours = includeRoomtime ? baseHours : baseHours - room;

    total += totalHours;

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${s.date}</td>
      <td>${s.start}</td>
      <td>${s.end}</td>
      <td>${room.toFixed(2)}</td>
      <td>${totalHours.toFixed(2)}</td>
      <td><button type="button" onclick="deleteShift(${index})">Fjern vagt</button></td>
    `;
    list.appendChild(row);
  });

  totalEl.textContent = total.toFixed(2);
}

function clearStorage() {
  localStorage.clear();
  location.reload();
}

function printPage() {
  window.print();
}

window.deleteShift = function (index) {
  shifts.splice(index, 1);
  saveShifts();
  renderShifts();
};

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const date = document.getElementById("date").value;
  const start = document.getElementById("start").value;
  const end = document.getElementById("end").value;
  const roomtime = Number(document.getElementById("roomtime").value) || 0;

  // store only base data; totals derive from policy at render time
  shifts.push({ date, start, end, roomtime });
  saveShifts();
  renderShifts();

  const currentPolicy = includeRoomCheckbox.checked;
  //form.reset();
  includeRoomCheckbox.checked = currentPolicy;
});

renderShifts();
