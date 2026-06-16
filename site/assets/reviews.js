(function () {
  const grid = document.querySelector("[data-google-reviews]");
  const summary = document.querySelector("[data-google-review-summary]");
  const widgetShell = document.querySelector("[data-review-widget-shell]");
  const widgetComponent = widgetShell ? widgetShell.querySelector(".commonninja_component") : null;
  const hasReviewWidget = Boolean(widgetShell && widgetComponent);
  let fallbackHasLiveData = false;
  let fallbackVisible = false;

  if (!grid) {
    return;
  }

  if (hasReviewWidget) {
    grid.hidden = true;

    if (summary) {
      summary.hidden = true;
    }
  }

  function widgetHasRendered() {
    if (!widgetShell || !widgetComponent) {
      return false;
    }

    return Boolean(
      widgetShell.querySelector("iframe") ||
        widgetComponent.children.length > 0 ||
        widgetComponent.textContent.trim().length > 20
    );
  }

  function hideFallback() {
    if (!hasReviewWidget) {
      return;
    }

    fallbackVisible = false;
    grid.hidden = true;

    if (summary) {
      summary.hidden = true;
    }
  }

  function showFallback() {
    fallbackVisible = true;
    grid.hidden = false;

    if (summary && fallbackHasLiveData) {
      summary.hidden = false;
    }
  }

  function starText(rating) {
    const rounded = Math.max(1, Math.min(5, Math.round(Number(rating) || 5)));
    return "★".repeat(rounded) + "☆".repeat(5 - rounded);
  }

  function formatCount(count) {
    return new Intl.NumberFormat("en-US").format(count);
  }

  function renderReview(review) {
    const card = document.createElement("article");
    card.className = "review-card";

    const stars = document.createElement("div");
    stars.className = "review-stars";
    stars.setAttribute("aria-label", `${review.rating || 5} star Google review`);
    stars.textContent = starText(review.rating);

    const text = document.createElement("p");
    text.textContent = review.text;

    const source = document.createElement("span");
    const when = review.relativeTime ? `, ${review.relativeTime}` : "";
    source.textContent = `${review.authorName || "Google reviewer"}, Google review${when}`;

    card.append(stars, text, source);
    return card;
  }

  function renderReviews(data) {
    if (!data || !Array.isArray(data.reviews) || data.reviews.length === 0) {
      return;
    }

    grid.replaceChildren(...data.reviews.slice(0, 5).map(renderReview));
    fallbackHasLiveData = true;

    if (summary) {
      if (typeof data.rating === "number" && typeof data.userRatingCount === "number") {
        summary.textContent = `Google rating ${data.rating.toFixed(1)} from ${formatCount(data.userRatingCount)} reviews`;
      } else {
        summary.textContent = "Latest Google reviews";
      }

      summary.hidden = hasReviewWidget && !fallbackVisible;
    }

    if (!hasReviewWidget) {
      grid.hidden = false;
    }
  }

  if (hasReviewWidget) {
    const observer = new MutationObserver(() => {
      if (widgetHasRendered()) {
        hideFallback();
      }
    });

    observer.observe(widgetShell, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    window.addEventListener(
      "error",
      (event) => {
        const target = event.target;

        if (target && target.src && target.src.includes("commoninja.com/sdk/latest/commonninja.js")) {
          showFallback();
        }
      },
      true
    );

    window.setTimeout(() => {
      if (!widgetHasRendered()) {
        showFallback();
      }
    }, 8000);
  }

  fetch("/api/google-reviews", {
    headers: {
      Accept: "application/json",
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Could not load reviews");
      }

      return response.json();
    })
    .then(renderReviews)
    .catch(() => {
      if (summary) {
        summary.hidden = true;
      }
    });
})();
