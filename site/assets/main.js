(function () {
  const toggle = document.querySelector("[data-nav-toggle]");
  const menu = document.querySelector("[data-nav-menu]");
  const year = document.querySelector("[data-year]");
  const quoteTriggers = document.querySelectorAll(".quote-trigger");
  const smsModal = document.querySelector("[data-sms-consent-modal]");
  const smsCheckbox = document.querySelector("[data-sms-consent-checkbox]");
  const smsContinue = document.querySelector("[data-sms-consent-continue]");
  const smsCloseButtons = document.querySelectorAll("[data-sms-consent-close]");
  let lastFocusedElement = null;

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

  function openSmsConsent() {
    if (!smsModal || !smsCheckbox || !smsContinue) {
      openGlassBillerModal();
      return;
    }
    lastFocusedElement = document.activeElement;
    smsCheckbox.checked = false;
    smsContinue.disabled = true;
    smsModal.classList.add("is-open");
    smsModal.setAttribute("aria-hidden", "false");
    smsCheckbox.focus();
  }

  function closeSmsConsent() {
    if (!smsModal) {
      return;
    }
    smsModal.classList.remove("is-open");
    smsModal.setAttribute("aria-hidden", "true");
    if (lastFocusedElement instanceof HTMLElement) {
      lastFocusedElement.focus();
    }
  }

  function updateGlassBillerConsentUrl(iframe) {
    if (!iframe || !iframe.src) {
      return;
    }
    const iframeUrl = new URL(iframe.src);
    const sourceUrl = new URL(window.location.href);
    sourceUrl.searchParams.set("sms_opt_in", "true");
    sourceUrl.searchParams.set("sms_consent_at", new Date().toISOString());
    sourceUrl.searchParams.set("sms_terms", `${window.location.origin}/privacy/`);
    iframeUrl.searchParams.set("url", sourceUrl.toString());
    iframe.src = iframeUrl.toString();
  }

  function openGlassBillerModal(attempt = 0) {
    const glassBillerModal = document.querySelector(".gb-modal");
    const glassBillerFrame = document.querySelector(".gb-modal iframe");

    if (!glassBillerModal && attempt < 24) {
      window.setTimeout(() => openGlassBillerModal(attempt + 1), 250);
      return;
    }

    if (!glassBillerModal) {
      window.location.hash = "contact";
      return;
    }

    updateGlassBillerConsentUrl(glassBillerFrame);
    glassBillerModal.style.display = "flex";
  }

  if (toggle && menu) {
    toggle.addEventListener("click", () => {
      const isOpen = menu.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });

    menu.addEventListener("click", (event) => {
      if (event.target instanceof HTMLAnchorElement) {
        closeMenu();
      }
    });
  }

  quoteTriggers.forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      closeMenu();
      openSmsConsent();
    });
  });

  if (smsCheckbox && smsContinue) {
    smsCheckbox.addEventListener("change", () => {
      smsContinue.disabled = !smsCheckbox.checked;
    });
  }

  if (smsContinue && smsCheckbox) {
    smsContinue.addEventListener("click", () => {
      if (!smsCheckbox.checked) {
        smsCheckbox.focus();
        return;
      }
      closeSmsConsent();
      openGlassBillerModal();
    });
  }

  smsCloseButtons.forEach((button) => {
    button.addEventListener("click", closeSmsConsent);
  });

  if (smsModal) {
    smsModal.addEventListener("click", (event) => {
      if (event.target === smsModal) {
        closeSmsConsent();
      }
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && smsModal && smsModal.classList.contains("is-open")) {
      closeSmsConsent();
    }
  });
})();
