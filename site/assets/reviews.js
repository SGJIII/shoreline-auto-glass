(function () {
  const grid = document.querySelector("[data-google-reviews]");
  const summary = document.querySelector("[data-google-review-summary]");

  if (!grid) {
    return;
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

    if (summary) {
      if (typeof data.rating === "number" && typeof data.userRatingCount === "number") {
        summary.textContent = `Google rating ${data.rating.toFixed(1)} from ${formatCount(data.userRatingCount)} reviews`;
      } else {
        summary.textContent = "Latest Google reviews";
      }

      summary.hidden = false;
    }
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
