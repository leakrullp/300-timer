const shifts = JSON.parse(localStorage.getItem("shifts")) || [];

window.printShiftData = (index) => {
  if (index <= 0 || index > shifts.length) {
    console.log("Det vagt-nr du søgte, findes ikke på listen.");
  } else if (!index) {
    console.log(JSON.stringify(shifts, null, 2));
  } else {
    console.log(JSON.stringify(shifts[index - 1], null, 2));
  }
};
