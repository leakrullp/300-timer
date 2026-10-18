export function animateBurgerMenu(burger, navLinks, burgerIcon) {
  burger.addEventListener("click", () => {
    navLinks.classList.toggle("show");
    burgerIcon.textContent = navLinks.classList.contains("show")
      ? "close"
      : "menu";
  });
}

export function closeMenuWhenLinkIsClicked(navLinks, burgerIcon) {
  // Close menu when a link is clicked
  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("show");
      burgerIcon.textContent = "menu";
    });
  });
}
