(function () {
  const MEASUREMENT_ID = "G-HD12WQSBNM";

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () {
    window.dataLayer.push(arguments);
  };

  window.gtag("js", new Date());
  window.gtag("config", MEASUREMENT_ID);

  function eventLabel(element) {
    const explicitLabel = element.getAttribute("data-analytics-label");

    if (explicitLabel) {
      return explicitLabel;
    }

    return element.textContent.trim().replace(/\s+/g, " ") || element.href || "unknown";
  }

  function trackEvent(eventName, params) {
    if (typeof window.gtag !== "function") {
      return;
    }

    window.gtag("event", eventName, {
      page_location: window.location.href,
      page_path: window.location.pathname,
      ...params,
    });
  }

  window.shorelineAnalytics = {
    trackEvent,
  };

  function safeSessionStorage() {
    try {
      return window.sessionStorage;
    } catch (error) {
      return null;
    }
  }

  function hasTrackedQuoteSubmission(storage) {
    if (!storage) {
      return false;
    }

    try {
      return Boolean(storage.getItem("shoreline_quote_submitted_tracked"));
    } catch (error) {
      return false;
    }
  }

  function markQuoteSubmissionTracked(storage) {
    if (!storage) {
      return;
    }

    try {
      storage.setItem("shoreline_quote_submitted_tracked", "true");
    } catch (error) {
      // Analytics should never interrupt the thank-you page experience.
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    try {
      const path = window.location.pathname;
      const searchParams = new URLSearchParams(window.location.search);
      const storage = safeSessionStorage();

      if (path.startsWith("/thank-you/") && !searchParams.get("fleet") && !hasTrackedQuoteSubmission(storage)) {
        markQuoteSubmissionTracked(storage);

        trackEvent("quote_request_submitted", {
          event_category: "lead",
          method: "glassbiller_redirect",
        });

        trackEvent("generate_lead", {
          event_category: "lead",
          method: "glassbiller_redirect",
        });
      }

      if (path.startsWith("/thank-you/") && searchParams.get("sms") === "received") {
        trackEvent("sms_opt_in_submitted", {
          event_category: "lead",
          method: "netlify_form",
        });
      }

      if (path.startsWith("/thank-you/") && searchParams.get("fleet") === "received") {
        trackEvent("fleet_support_submitted", {
          event_category: "lead",
          method: "netlify_form",
        });

        trackEvent("generate_lead", {
          event_category: "lead",
          method: "fleet_support_form",
        });
      }

      document.querySelectorAll(".quote-trigger, .gb-get-quote-button").forEach((element) => {
        element.addEventListener("click", () => {
          trackEvent("quote_request_started", {
            event_category: "lead",
            link_text: eventLabel(element),
          });
        });
      });

      document.querySelectorAll('a[href^="tel:"]').forEach((link) => {
        link.addEventListener("click", () => {
          trackEvent("phone_click", {
            event_category: "contact",
            phone_number: link.getAttribute("href").replace("tel:", ""),
            link_text: eventLabel(link),
          });
        });
      });

      document.querySelectorAll('a[href^="mailto:"]').forEach((link) => {
        link.addEventListener("click", () => {
          trackEvent("email_click", {
            event_category: "contact",
            email_address: link.getAttribute("href").replace("mailto:", ""),
            link_text: eventLabel(link),
          });
        });
      });

      document.querySelectorAll('a[href*="google.com/maps"], a[href*="g.page/"]').forEach((link) => {
        link.addEventListener("click", () => {
          trackEvent("google_review_link_click", {
            event_category: "reviews",
            link_url: link.href,
            link_text: eventLabel(link),
          });
        });
      });
    } catch (error) {
      // Ignore analytics failures so contact and thank-you pages keep working.
    }
  });
})();
