function formatHours(num) {
  return num.toLocaleString("da-DK", {
    minimumFractionDigits: 0, // don’t show decimals if whole
    maximumFractionDigits: 2, // show up to 2 decimals if needed
  });
}

export { formatHours };
