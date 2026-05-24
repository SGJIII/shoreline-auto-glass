import { execFileSync } from "node:child_process";

const baseUrl = (process.env.SITE_URL || "https://www.shorelineglassco.com").replace(/\/$/, "");
const paths = [
  "/",
  "/cape-cod-windshield-replacement/",
  "/south-coast-auto-glass/",
  "/south-shore-auto-glass/",
  "/marthas-vineyard-auto-glass/",
  "/nantucket-auto-glass/",
  "/adas-calibration/",
  "/fleet-adas-calibration/",
  "/insurance/",
  "/fleet-request-received/",
  "/thank-you/",
  "/privacy/",
  "/sitemap.xml",
  "/robots.txt",
  "/assets/main.js?v=20260524b",
  "/assets/analytics.js?v=20260524b",
  "/assets/quote-form.js?v=20260522",
  "/assets/styles.css?v=20260524f",
  "/insurance-claims",
  "/auto-glass-insurance",
  "/windshield-insurance-claim",
  "/glass-insurance-claim",
  "/fleet-auto-glass",
  "/dealership-auto-glass",
  "/commercial-auto-glass",
  "/windshield-calibration",
];

const failures = [];

for (const path of paths) {
  const url = `${baseUrl}${path}`;
  const status = execFileSync("curl", [
    "-sS",
    "-L",
    "-o",
    "/dev/null",
    "-w",
    "%{http_code}",
    url,
  ], { encoding: "utf8" }).trim();

  if (!/^2\d\d$/.test(status)) {
    failures.push(`${status} ${url}`);
  } else {
    console.log(`ok ${status} ${url}`);
  }
}

if (failures.length > 0) {
  console.error(`\nLive smoke failures:\n${failures.join("\n")}`);
  process.exit(1);
}
