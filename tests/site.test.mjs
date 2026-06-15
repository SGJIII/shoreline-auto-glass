import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

const rootDir = path.resolve(new URL("..", import.meta.url).pathname);
const siteDir = path.join(rootDir, "site");
const individualNamePattern = new RegExp(["bl", "ake|farns", "worth"].join(""), "i");
const expectedPages = [
  "/",
  "/cape-cod-windshield-repair/",
  "/south-coast-windshield-repair/",
  "/south-shore-windshield-repair/",
  "/marthas-vineyard-windshield-repair/",
  "/nantucket-windshield-repair/",
  "/adas-calibration/",
  "/fleet-adas-calibration/",
  "/insurance/",
  "/warranty/",
  "/fleet-request-received/",
  "/thank-you/",
  "/privacy/",
];
const regionPages = [
  "/cape-cod-windshield-repair/",
  "/south-coast-windshield-repair/",
  "/south-shore-windshield-repair/",
  "/marthas-vineyard-windshield-repair/",
  "/nantucket-windshield-repair/",
];

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

const htmlFiles = walk(siteDir).filter((file) => file.endsWith(".html"));
const functionDir = path.join(rootDir, "netlify", "functions");
const jsFiles = [
  ...walk(path.join(siteDir, "assets")).filter((file) => file.endsWith(".js")),
  ...(existsSync(functionDir) ? walk(functionDir).filter((file) => file.endsWith(".js") || file.endsWith(".mjs")) : []),
];
const cssFiles = walk(path.join(siteDir, "assets")).filter((file) => file.endsWith(".css"));

function read(file) {
  return readFileSync(file, "utf8");
}

function sitePathToFile(sitePath) {
  const cleanPath = sitePath.split("#")[0].split("?")[0];

  if (cleanPath === "/" || cleanPath === "") {
    return path.join(siteDir, "index.html");
  }

  const directPath = path.join(siteDir, cleanPath);

  if (existsSync(directPath) && !directPath.endsWith(path.sep)) {
    return directPath;
  }

  return path.join(siteDir, cleanPath, "index.html");
}

function assertLocalPathExists(sitePath, context) {
  const cleanPath = sitePath.split("#")[0].split("?")[0] || "/";
  const target = sitePathToFile(cleanPath);
  assert.ok(existsSync(target), `${context} points to missing local path: ${sitePath}`);
}

function idsForFile(file) {
  const html = read(file);
  return new Set([...html.matchAll(/\sid=["']([^"']+)["']/g)].map((match) => match[1]));
}

function assertAnchorExists(sitePath, sourceFile, context) {
  const hash = sitePath.includes("#") ? sitePath.split("#")[1] : "";

  if (!hash) {
    return;
  }

  const cleanPath = sitePath.split("#")[0].split("?")[0];
  const targetFile = cleanPath ? sitePathToFile(cleanPath) : sourceFile;
  const ids = idsForFile(targetFile);
  assert.ok(ids.has(hash), `${context} points to missing anchor #${hash} in ${targetFile}`);
}

function extractAttributes(html, attr) {
  const pattern = new RegExp(`\\s${attr}=["']([^"']+)["']`, "g");
  return [...html.matchAll(pattern)].map((match) => match[1]);
}

function isExternal(value) {
  return /^(https?:)?\/\//.test(value);
}

function isSkippableReference(value) {
  return (
    !value ||
    value.startsWith("#") ||
    value.startsWith("tel:") ||
    value.startsWith("mailto:") ||
    value.startsWith("data:") ||
    value.startsWith("%23") ||
    value.startsWith("javascript:")
  );
}

function assertAssetExists(value, context) {
  if (isExternal(value) || isSkippableReference(value)) {
    return;
  }

  const cleanPath = value.split("#")[0].split("?")[0];
  const target = cleanPath.startsWith("/")
    ? path.join(siteDir, cleanPath)
    : path.join(path.dirname(context.sourceFile), cleanPath);

  assert.ok(existsSync(target), `${context.label} points to missing asset: ${value}`);
}

test("all expected pages exist", () => {
  for (const page of expectedPages) {
    assertLocalPathExists(page, "expected page");
  }
});

test("HTML links, form actions, scripts, and image assets resolve locally", () => {
  for (const file of htmlFiles) {
    const html = read(file);

    for (const href of extractAttributes(html, "href")) {
      if (href.startsWith("#")) {
        assertAnchorExists(href, file, file);
        continue;
      }

      if (isSkippableReference(href) || isExternal(href)) {
        continue;
      }

      if (href.startsWith("/assets/")) {
        assertAssetExists(href, { sourceFile: file, label: file });
        continue;
      }

      assertLocalPathExists(href, file);
      assertAnchorExists(href, file, file);
    }

    for (const action of extractAttributes(html, "action")) {
      if (isSkippableReference(action) || isExternal(action)) {
        continue;
      }

      assertLocalPathExists(action, `${file} form action`);
    }

    for (const src of extractAttributes(html, "src")) {
      assertAssetExists(src, { sourceFile: file, label: file });
    }
  }
});

test("CSS url() assets resolve locally", () => {
  for (const file of cssFiles) {
    const css = read(file);
    const urls = [...css.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map((match) => match[1]);

    for (const url of urls) {
      assertAssetExists(url, { sourceFile: file, label: file });
    }
  }
});

test("Netlify redirect targets resolve locally", () => {
  const redirects = read(path.join(siteDir, "_redirects")).split(/\r?\n/);

  for (const line of redirects) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const [, target] = trimmed.split(/\s+/);

    if (!target || isExternal(target) || target.includes(":splat")) {
      continue;
    }

    assertLocalPathExists(target, `redirect ${trimmed}`);
    assertAnchorExists(target, sitePathToFile("/"), `redirect ${trimmed}`);
  }
});

test("sitemap URLs resolve to local static pages", () => {
  const sitemap = read(path.join(siteDir, "sitemap.xml"));
  const urls = [...sitemap.matchAll(/<loc>https:\/\/www\.shorelineglassco\.com([^<]*)<\/loc>/g)]
    .map((match) => match[1]);

  assert.ok(urls.length > 0, "sitemap should contain production URLs");

  for (const url of urls) {
    assertLocalPathExists(url, "sitemap");
  }

  for (const page of expectedPages.filter((page) => !page.includes("request-received"))) {
    assert.ok(
      sitemap.includes(`https://www.shorelineglassco.com${page}`),
      `sitemap should include ${page}`,
    );
  }
});

test("JSON-LD blocks parse as JSON", () => {
  for (const file of htmlFiles) {
    const html = read(file);
    const blocks = [...html.matchAll(/<script type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/g)];

    for (const block of blocks) {
      assert.doesNotThrow(() => JSON.parse(block[1]), `${file} has invalid JSON-LD`);
    }
  }
});

test("JavaScript assets have valid syntax", () => {
  for (const file of jsFiles) {
    assert.doesNotThrow(
      () => execFileSync(process.execPath, ["--check", file], { stdio: "pipe" }),
      `${file} should pass node --check`,
    );
  }
});

test("lead forms are configured for Netlify and real success pages", () => {
  const home = read(path.join(siteDir, "index.html"));
  const fleetPage = read(path.join(siteDir, "fleet-adas-calibration", "index.html"));
  const mainJs = read(path.join(siteDir, "assets", "main.js"));
  assert.match(home, /<form name=["']fleet-support["'][^>]*hidden/, "homepage should include hidden fleet form detection markup");
  assert.match(home, /<form name=["']sms-opt-in["'][^>]*hidden/, "homepage should include hidden SMS form detection markup");
  assert.match(fleetPage, /name=["']fleet-support["']/, "fleet form should have the expected name");
  assert.match(fleetPage, /data-netlify=["']true["']/, "fleet form should use Netlify Forms");
  assert.match(fleetPage, /\snetlify\s/, "fleet form should include the boolean Netlify attribute");
  assert.match(fleetPage, /data-netlify-ajax=["']true["']/, "fleet form should submit without POST landing pages");
  assert.match(fleetPage, /action=["']\/fleet-request-received\/["']/, "fleet form should use the fleet success page");
  assert.doesNotMatch(fleetPage, /name=["']send_to["']/, "fleet form should not expose person-specific recipient metadata");
  assert.match(fleetPage, /data-form-status/, "fleet form should include an inline status message");
  assert.doesNotMatch(mainJs, /mailto:/, "fleet form should not fall back to customer email");

  for (const field of ["business_name", "contact_name", "phone", "email", "account_type", "location", "vehicle_details"]) {
    assert.match(fleetPage, new RegExp(`name=["']${field}["']`), `fleet form should include ${field}`);
  }

  const thanksPage = read(path.join(siteDir, "thank-you", "index.html"));
  assert.match(thanksPage, /name=["']sms-opt-in["']/, "SMS opt-in form should exist");
  assert.match(thanksPage, /data-netlify=["']true["']/, "SMS opt-in should use Netlify Forms");
  assert.match(thanksPage, /name=["']sms_consent["'][^>]*required/, "SMS opt-in checkbox should be required");
});

test("Google reviews are loaded through a safe Netlify function", async () => {
  const home = read(path.join(siteDir, "index.html"));
  const reviewsJs = read(path.join(siteDir, "assets", "reviews.js"));
  const netlifyConfig = read(path.join(rootDir, "netlify.toml"));
  const functionPath = path.join(rootDir, "netlify", "functions", "google-reviews.mjs");

  assert.match(home, /data-google-reviews/, "homepage should expose review grid for live Google reviews");
  assert.match(home, /data-google-review-summary/, "homepage should expose review summary for live Google rating");
  assert.match(home, /cdn\.commoninja\.com\/sdk\/latest\/commonninja\.js/, "homepage should load the Common Ninja reviews widget script");
  assert.match(home, /pid-992c7252-797d-48aa-a2b2-3b868ca1c341/, "homepage should include the Common Ninja reviews component");
  assert.match(home, /\/assets\/reviews\.js\?v=20260612a/, "homepage should load reviews script");
  assert.match(reviewsJs, /fetch\(["']\/api\/google-reviews["']/, "reviews script should fetch from first-party endpoint");
  assert.doesNotMatch(reviewsJs, /photoUri|avatar|profile photo/i, "reviews script should not render reviewer photos");
  assert.match(netlifyConfig, /from = ["']\/api\/google-reviews["']/, "Netlify should expose a friendly reviews API route");
  assert.match(netlifyConfig, /to = ["']\/\.netlify\/functions\/google-reviews["']/, "reviews API route should target the reviews function");

  const oldPlacesKey = process.env.GOOGLE_PLACES_API_KEY;
  const oldMapsKey = process.env.GOOGLE_MAPS_API_KEY;
  delete process.env.GOOGLE_PLACES_API_KEY;
  delete process.env.GOOGLE_MAPS_API_KEY;

  try {
    const { handler } = await import(pathToFileURL(functionPath).href);
    const response = await handler({ httpMethod: "GET" });
    const payload = JSON.parse(response.body);

    assert.equal(response.statusCode, 200, "reviews function should return OK without an API key");
    assert.equal(payload.source, "fallback", "reviews function should fall back when no Google key is configured");
    assert.ok(payload.reviews.length > 0, "fallback should include at least one review");
    assert.doesNotMatch(JSON.stringify(payload), /photoUri|avatar/i, "reviews payload should not include reviewer photos");
  } finally {
    if (oldPlacesKey === undefined) {
      delete process.env.GOOGLE_PLACES_API_KEY;
    } else {
      process.env.GOOGLE_PLACES_API_KEY = oldPlacesKey;
    }

    if (oldMapsKey === undefined) {
      delete process.env.GOOGLE_MAPS_API_KEY;
    } else {
      process.env.GOOGLE_MAPS_API_KEY = oldMapsKey;
    }
  }
});

test("GlassBiller embed is configured but not submitted by tests", () => {
  const quoteForm = read(path.join(siteDir, "assets", "quote-form.js"));
  assert.match(quoteForm, /shop-id["'], ["']2870["']/, "GlassBiller shop ID should be 2870");
  assert.match(quoteForm, /button-position["'], ["']left["']/, "GlassBiller fixed button should be left aligned");
  assert.match(quoteForm, /\/thank-you\//, "GlassBiller should redirect to the thank-you page");
  assert.match(quoteForm, /name: ["']VIN["']/, "GlassBiller VIN label should be uppercase");
  assert.match(quoteForm, /Insurance Carrier \/ Claim Number/, "GlassBiller should expose insurance info field");
  assert.match(quoteForm, /Damage Details \(include all glass needed\)/, "GlassBiller should invite multiple glass details");
});

test("critical marketing and trust content is present", () => {
  const home = read(path.join(siteDir, "index.html"));
  const fleet = read(path.join(siteDir, "fleet-adas-calibration", "index.html"));
  const adas = read(path.join(siteDir, "adas-calibration", "index.html"));
  const insurance = read(path.join(siteDir, "insurance", "index.html"));
  const warranty = read(path.join(siteDir, "warranty", "index.html"));

  assert.match(home, /Hands down the best auto glass service I've ever experienced!/, "temporary Google review should be visible");
  assert.doesNotMatch(home, /No published Google reviews yet/, "placeholder review copy should not be visible");
  assert.match(home, /ANSI\/AGSC\/AGRSS-certified technician/, "certification trust signal should be on the homepage");
  assert.match(home, /agsc-membership-2026-wide\.png/, "cropped AGSC membership badge should be on the homepage");
  assert.match(home, /class=["']footer-badge["']/, "AGSC membership badge should appear in the footer");
  assert.match(home, /View the lifetime workmanship warranty/, "homepage should link to the warranty near trust content");
  assert.match(home, /Installations performed by Shoreline are backed by a <a class="text-link" href="\/warranty\/">lifetime workmanship warranty<\/a>/, "homepage replacement card should mention warranty");
  assert.doesNotMatch(home, individualNamePattern, "homepage should keep technician trust brand-forward");
  assert.match(home, /Tell your insurance company you want Shoreline/, "homepage should promote insurance claim help");
  assert.match(fleet, /Fleet ADAS Calibration &amp; Auto Glass/, "fleet page headline should exist");
  assert.match(fleet, /AGSC-certified Shoreline Auto Glass technician/, "fleet page should mention certification");
  assert.match(fleet, /Commercial Windshield Replacement[\s\S]*lifetime workmanship warranty/, "fleet page should mention warranty for commercial windshield replacement");
  assert.doesNotMatch(fleet, individualNamePattern, "fleet page should keep public copy brand-forward");
  assert.match(fleet, /Registered member of the Auto Glass Safety Council/, "fleet page should show AGSC membership");
  assert.match(adas, /ADAS Calibration After Windshield Replacement/, "ADAS page headline should exist");
  assert.match(adas, /After Windshield Replacement[\s\S]*lifetime workmanship warranty/, "ADAS page should mention warranty where windshield replacement is discussed");
  assert.match(insurance, /Tell Your Insurance Company You Want Shoreline Auto Glass/, "insurance page headline should exist");
  assert.match(insurance, /major glass claim TPAs/, "insurance page should mention major glass claim TPAs");
  assert.match(insurance, /I choose Shoreline Auto Glass for my auto glass claim/, "insurance page should include a customer script");
  assert.match(insurance, /Warranty: lifetime workmanship warranty on Shoreline installations/, "insurance page should include warranty in claim details");
  assert.match(insurance, /agsc-membership-2026\.png/, "insurance page should show AGSC membership");
  assert.doesNotMatch(insurance, individualNamePattern, "insurance page should keep public copy brand-forward");
  assert.match(warranty, /Lifetime Workmanship Warranty/, "warranty page should exist");
  assert.match(warranty, /Water leaks related to the installation/, "warranty page should list covered workmanship issues");
  assert.match(warranty, /Damage to the glass after installation is the responsibility of the vehicle owner/, "warranty page should list limitations");
  assert.match(warranty, /stand behind the installation and make it right/, "warranty page should clearly stand behind workmanship");
  assert.match(warranty, /Chip Repair Disclaimer/, "warranty page should include chip repair disclaimer");
  assert.match(warranty, /not intended to be a complete cosmetic solution/, "chip repair disclaimer should set cosmetic expectations");
  assert.match(warranty, /hidden rust, corrosion, pinch weld damage/, "warranty page should exclude hidden damage discovered after removal");
  assert.match(warranty, /ADAS And Recalibration Limitations/, "warranty page should include ADAS limitations");
  assert.match(warranty, /Advanced driver assistance systems are not a replacement for safe driving/, "ADAS disclaimer should preserve safe driving responsibility");
  assert.match(warranty, /within 30 days of discovering a potential workmanship issue/, "warranty page should include notice window");
  assert.match(warranty, /incidental, indirect, special, or consequential damages/, "warranty page should include liability limitation");
  assert.doesNotMatch(warranty, individualNamePattern, "warranty page should keep public copy brand-forward");

  const thanksPage = read(path.join(siteDir, "thank-you", "index.html"));
  assert.match(thanksPage, /sent to Shoreline Auto Glass/, "thank-you page should use customer-facing receipt language");
  assert.doesNotMatch(thanksPage, /leads dashboard/, "thank-you page should not mention internal dashboards");
  assert.match(thanksPage, /data-netlify-ajax=["']true["']/, "SMS opt-in should submit without POST landing pages");
  assert.match(thanksPage, /Text updates enabled/, "SMS opt-in should show a confirmation state");
  assert.match(thanksPage, /successfully opted in to SMS messaging/, "SMS opt-in should show clear success copy");
  assert.match(thanksPage, /Reply STOP at any time to opt out/, "SMS opt-in should show opt-out copy");

  for (const page of regionPages) {
    const region = read(sitePathToFile(page));
    assert.match(region, /lifetime workmanship warranty/, `${page} should mention warranty`);
    assert.match(region, /href=["']\/warranty\//, `${page} should link to warranty`);
  }
});

test("analytics events and IDs are present", () => {
  const analytics = read(path.join(siteDir, "assets", "analytics.js"));
  assert.match(analytics, /G-HD12WQSBNM/, "GA4 measurement ID should be present");
  assert.match(analytics, /quote_request_submitted/, "quote submitted event should be tracked");
  assert.match(analytics, /quote_request_started/, "quote start event should be tracked");
  assert.match(analytics, /fleet_support_submitted/, "fleet support event should be tracked");
  assert.match(analytics, /phone_click/, "phone clicks should be tracked");
  assert.match(analytics, /email_click/, "email clicks should be tracked");
});

test("site copy avoids known bad states", () => {
  const siteText = walk(siteDir)
    .filter((file) => /\.(html|css|js|xml|txt)$/.test(file))
    .map((file) => read(file))
    .join("\n");

  assert.doesNotMatch(siteText, /Page not found/i, "site should not contain page-not-found copy");
  assert.doesNotMatch(siteText, /Massachusettes/i, "site should not contain misspelled Massachusetts");
  assert.doesNotMatch(siteText, /ensure your safety/i, "site should not make absolute ADAS safety claims");
  assert.doesNotMatch(siteText, /—/, "site should not contain em dashes");
  assert.doesNotMatch(siteText, individualNamePattern, "site should not expose individual technician names");
});
