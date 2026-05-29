import { execFileSync } from "node:child_process";

const baseUrl = (process.env.SITE_URL || "https://www.shorelineglassco.com").replace(/\/$/, "");
const paths = [
  "/",
  "/cape-cod-windshield-repair/",
  "/south-coast-windshield-repair/",
  "/south-shore-windshield-repair/",
  "/marthas-vineyard-windshield-repair/",
  "/nantucket-windshield-repair/",
  "/adas-calibration/",
  "/fleet-adas-calibration/",
  "/insurance/",
  "/fleet-request-received/",
  "/thank-you/",
  "/privacy/",
  "/sitemap.xml",
  "/robots.txt",
  "/assets/main.js?v=20260529b",
  "/assets/analytics.js?v=20260524b",
  "/assets/quote-form.js?v=20260529a",
  "/assets/styles.css?v=20260529d",
  "/insurance-claims",
  "/auto-glass-insurance",
  "/windshield-insurance-claim",
  "/glass-insurance-claim",
  "/fleet-auto-glass",
  "/dealership-auto-glass",
  "/commercial-auto-glass",
  "/windshield-calibration",
  "/cape-cod-windshield-replacement",
  "/south-coast-auto-glass",
  "/south-shore-auto-glass",
  "/marthas-vineyard-auto-glass",
  "/nantucket-auto-glass",
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
