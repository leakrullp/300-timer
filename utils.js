window.printShiftData = (index) => {
  const shifts = JSON.parse(localStorage.getItem("shifts")) || [];

  if (index <= 0 || index > shifts.length) {
    console.log("Den vagt du søgte, findes ikke på listen.");
  } else if (!index) {
    console.log(JSON.stringify(shifts, null, 2));
  } else {
    console.log(JSON.stringify(shifts[index - 1], null, 2));
  }
};
