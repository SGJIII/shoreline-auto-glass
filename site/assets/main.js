(function () {
  const toggle = document.querySelector("[data-nav-toggle]");
  const menu = document.querySelector("[data-nav-menu]");
  const year = document.querySelector("[data-year]");
  const quoteTriggers = document.querySelectorAll(".quote-trigger");
  const dropdowns = document.querySelectorAll(".nav-dropdown");
  const netlifyAjaxForms = document.querySelectorAll("form[data-netlify-ajax]");

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

  netlifyAjaxForms.forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (!(form instanceof HTMLFormElement)) {
        return;
      }

      const submitButton = form.querySelector('button[type="submit"]');

      if (submitButton) {
        submitButton.setAttribute("disabled", "true");
      }

      try {
        const formData = new FormData(form);
        const body = new URLSearchParams();

        formData.forEach((value, key) => {
          body.append(key, String(value));
        });

        const response = await fetch("/", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: body.toString(),
        });

        if (!response.ok) {
          throw new Error("Form submission failed");
        }

        window.location.href = form.action;
      } catch (error) {
        if (submitButton) {
          submitButton.removeAttribute("disabled");
        }

        window.location.href = "mailto:blake.farnsworth@shorelineglassco.com?subject=Fleet%20support%20request&body=Please%20include%20your%20business%20name%2C%20contact%20details%2C%20vehicle%20information%2C%20location%2C%20and%20timing%20needs.";
      }
    });
  });
})();
