const shifts = JSON.parse(localStorage.getItem("shifts")) || [];

window.printShift = (index) => {
  if (!index) {
    console.log(JSON.stringify(shifts, null, 2));
  }
};
