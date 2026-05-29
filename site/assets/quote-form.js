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
    const fields = [
      { id: "gb_first_name", name: "First Name", show: true, required: true },
      { id: "gb_last_name", name: "Last Name", show: true, required: true },
      { id: "gb_phone", name: "Phone", show: true, required: true },
      { id: "gb_email", name: "Email Address", show: true, required: true },
      { id: "gb_address", name: "Service Address", show: true, required: false },
      { id: "gb_vin", name: "VIN", show: true, required: false },
      { id: "gb_vehicle", name: "Vehicle", show: true, required: true },
      { id: "gb_referral", name: "Insurance Carrier / Claim Number", show: true, required: false },
      { id: "gb_description", name: "Damage Details (include all glass needed)", show: true, required: true },
    ];

    script.setAttribute("fields", encodeURIComponent(JSON.stringify(fields)));
    document.body.appendChild(script);
  });
})();
