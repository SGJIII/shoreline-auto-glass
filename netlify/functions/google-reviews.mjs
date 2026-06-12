const DEFAULT_PLACE_ID = "ChIJuVwlzHVX4E4RSSLSXUa3n4U";
const DEFAULT_REVIEW_URL = "https://g.page/r/CUki0l1Gt5-FEBI/";
const CACHE_SECONDS = 60 * 60 * 6;

const fallbackReviews = [
  {
    authorName: "Samuel Johnson",
    rating: 5,
    relativeTime: "Google review",
    text: "Hands down the best auto glass service I've ever experienced! From the moment we connected, it felt like they rolled out the red carpet. The repair process was incredibly quick and easy, and Shoreline took excellent care of me. I couldn't be happier with the results. Hopefully, I won't need another glass repair anytime soon, but if I ever do, I'm absolutely using them again.",
  },
];

function json(statusCode, body, cacheSeconds = CACHE_SECONDS) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": `public, max-age=${cacheSeconds}, s-maxage=${cacheSeconds}, stale-while-revalidate=86400`,
    },
    body: JSON.stringify(body),
  };
}

function fallbackPayload(reason) {
  return {
    configured: false,
    source: "fallback",
    reason,
    placeId: process.env.GOOGLE_PLACE_ID || DEFAULT_PLACE_ID,
    placeName: "Shoreline Auto Glass",
    rating: null,
    userRatingCount: null,
    googleMapsUri: DEFAULT_REVIEW_URL,
    reviews: fallbackReviews,
  };
}

function normalizeReview(review) {
  const text = review?.text?.text || review?.originalText?.text || "";
  const rating = Number(review?.rating || 0);
  const authorName = review?.authorAttribution?.displayName || "Google reviewer";

  return {
    authorName,
    rating: Number.isFinite(rating) && rating > 0 ? rating : 5,
    relativeTime: review?.relativePublishTimeDescription || "",
    publishTime: review?.publishTime || "",
    text,
  };
}

export async function handler(event) {
  if (event.httpMethod !== "GET" && event.httpMethod !== "HEAD") {
    return json(405, { error: "Method not allowed" }, 60);
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID || DEFAULT_PLACE_ID;

  if (!apiKey) {
    return json(200, fallbackPayload("missing_google_places_api_key"), 60 * 15);
  }

  const fieldMask = [
    "id",
    "displayName",
    "googleMapsUri",
    "rating",
    "userRatingCount",
    "reviews.rating",
    "reviews.text",
    "reviews.originalText",
    "reviews.publishTime",
    "reviews.relativePublishTimeDescription",
    "reviews.authorAttribution.displayName",
  ].join(",");

  try {
    const response = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=en`, {
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": fieldMask,
      },
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("Google Places reviews request failed", response.status, detail);
      return json(200, fallbackPayload("google_places_request_failed"), 60 * 15);
    }

    const place = await response.json();
    const reviews = Array.isArray(place.reviews)
      ? place.reviews.map(normalizeReview).filter((review) => review.text).slice(0, 5)
      : [];

    if (!reviews.length) {
      return json(200, fallbackPayload("no_google_reviews_returned"), 60 * 15);
    }

    return json(200, {
      configured: true,
      source: "google_places",
      placeId: place.id || placeId,
      placeName: place.displayName?.text || "Shoreline Auto Glass",
      rating: typeof place.rating === "number" ? place.rating : null,
      userRatingCount: typeof place.userRatingCount === "number" ? place.userRatingCount : null,
      googleMapsUri: place.googleMapsUri || DEFAULT_REVIEW_URL,
      reviews,
    });
  } catch (error) {
    console.error("Google reviews function error", error);
    return json(200, fallbackPayload("google_reviews_function_error"), 60 * 15);
  }
}
