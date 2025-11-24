const helligdage = {
  2025: {
    nytårsdag: new Date("2025-01-01"),
    skærtorsdag: new Date("2025-04-17"),
    langfredag: new Date("2025-04-18"),
    andenPåskedag: new Date("2025-04-21"),
    kristiHimmelfartsdag: new Date("2025-05-29"),
    andenPinsedag: new Date("2025-06-09"),
    juledag: new Date("2025-12-25"),
    andenJuledag: new Date("2025-12-26"),
  },
  2026: {
    nytårsdag: new Date("2026-01-01"),
    skærtorsdag: new Date("2026-04-02"),
    langfredag: new Date("2026-04-03"),
    andenPåskedag: new Date("2026-04-05"),
    kristiHimmelfartsdag: new Date("2026-05-14"),
    andenPinsedag: new Date("2026-05-25"),
    juledag: new Date("2026-12-25"),
    andenJuledag: new Date("2026-12-26"),
  },
  2027: {
    nytårsdag: new Date("2027-01-01"),
    skærtorsdag: new Date("2027-03-25"),
    langfredag: new Date("2027-03-26"),
    andenPåskedag: new Date("2027-03-29"),
    kristiHimmelfartsdag: new Date("2027-05-06"),
    andenPinsedag: new Date("2027-05-17"),
    juledag: new Date("2027-12-25"),
    andenJuledag: new Date("2027-12-26"),
  },
  2028: {
    nytårsdag: new Date("2028-01-01"),
    skærtorsdag: new Date("2028-04-13"),
    langfredag: new Date("2028-04-14"),
    andenPåskedag: new Date("2028-04-17"),
    kristiHimmelfartsdag: new Date("2028-05-25"),
    andenPinsedag: new Date("2028-06-05"),
    juledag: new Date("2028-12-25"),
    andenJuledag: new Date("2028-12-26"),
  },
};
//global function
window.isHoliday = function (dateStr) {
  const date = new Date(dateStr);
  const year = date.getFullYear();

  if (!helligdage[year]) return false;

  return Object.values(helligdage[year]).some(
    (holiday) =>
      holiday.getFullYear() === date.getFullYear() &&
      holiday.getMonth() === date.getMonth() &&
      holiday.getDate() === date.getDate()
  );
};
