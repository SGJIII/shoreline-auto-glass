(function () {
  document.addEventListener("DOMContentLoaded", () => {
    const src = "https://web-form.glassbiller.com/index.js";
    const script = document.createElement("script");
    script.setAttribute("src", `${src}?${Date.now()}`);
    script.setAttribute("shop-id", "2870");
    script.setAttribute("button-type", "fixed");
    script.setAttribute("button-position", "left");
    script.setAttribute("button-bg-color", "#90cdf4");
    script.setAttribute("button-border-color", "#00070B");
    script.setAttribute("button-text-color", "#010912");
    script.setAttribute("modal-position", "dialog");
    script.setAttribute("submit-text", "Get a quote");
    script.setAttribute("redirect-url", `${window.location.origin}/thank-you/`);
    script.setAttribute("fields", "%5B%7B%22id%22%3A%22gb_first_name%22%2C%22name%22%3A%22First%20Name%22%2C%22show%22%3Atrue%2C%22required%22%3Atrue%7D%2C%7B%22id%22%3A%22gb_last_name%22%2C%22name%22%3A%22Last%20Name%22%2C%22show%22%3Atrue%2C%22required%22%3Atrue%7D%2C%7B%22id%22%3A%22gb_phone%22%2C%22name%22%3A%22Phone%22%2C%22show%22%3Atrue%2C%22required%22%3Atrue%7D%2C%7B%22id%22%3A%22gb_email%22%2C%22name%22%3A%22Email%20Address%22%2C%22show%22%3Atrue%2C%22required%22%3Atrue%7D%2C%7B%22id%22%3A%22gb_address%22%2C%22name%22%3A%22Address%22%2C%22show%22%3Atrue%2C%22required%22%3Afalse%7D%2C%7B%22id%22%3A%22gb_vin%22%2C%22name%22%3A%22Vin%22%2C%22show%22%3Atrue%2C%22required%22%3Afalse%7D%2C%7B%22id%22%3A%22gb_vehicle%22%2C%22name%22%3A%22Vehicle%22%2C%22show%22%3Atrue%2C%22required%22%3Atrue%7D%2C%7B%22id%22%3A%22gb_referral%22%2C%22name%22%3A%22Referral%22%2C%22show%22%3Atrue%2C%22required%22%3Afalse%7D%2C%7B%22id%22%3A%22gb_description%22%2C%22name%22%3A%22Description%22%2C%22show%22%3Atrue%2C%22required%22%3Atrue%7D%5D");
    document.body.appendChild(script);
  });
})();
