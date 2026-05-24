(function () {
  const toggle = document.querySelector("[data-nav-toggle]");
  const menu = document.querySelector("[data-nav-menu]");
  const year = document.querySelector("[data-year]");
  const quoteTriggers = document.querySelectorAll(".quote-trigger");
  const dropdowns = document.querySelectorAll(".nav-dropdown");

  if (year) {
    year.textContent = String(new Date().getFullYear());
  }

  function closeMenu() {
    if (!toggle || !menu) {
      return;
    }
    menu.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  }

  function closeDropdowns(except) {
    dropdowns.forEach((dropdown) => {
      if (dropdown !== except) {
        dropdown.removeAttribute("open");
      }
    });
  }

  if (toggle && menu) {
    toggle.addEventListener("click", () => {
      const isOpen = menu.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });

    menu.addEventListener("click", (event) => {
      if (event.target instanceof HTMLAnchorElement) {
        closeDropdowns();
        closeMenu();
      }
    });
  }

  dropdowns.forEach((dropdown) => {
    dropdown.addEventListener("toggle", () => {
      if (dropdown.open) {
        closeDropdowns(dropdown);
      }
    });
  });

  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) {
      return;
    }

    if (!event.target.closest(".nav-dropdown")) {
      closeDropdowns();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeDropdowns();
    }
  });

  quoteTriggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      closeDropdowns();
      closeMenu();
    });
  });
})();
