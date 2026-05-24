import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const rootDir = path.resolve(new URL("..", import.meta.url).pathname);
const siteDir = path.join(rootDir, "site");
const expectedPages = [
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
];

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

const htmlFiles = walk(siteDir).filter((file) => file.endsWith(".html"));
const jsFiles = walk(path.join(siteDir, "assets")).filter((file) => file.endsWith(".js"));
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
  const fleetPage = read(path.join(siteDir, "fleet-adas-calibration", "index.html"));
  assert.match(fleetPage, /name=["']fleet-support["']/, "fleet form should have the expected name");
  assert.match(fleetPage, /data-netlify=["']true["']/, "fleet form should use Netlify Forms");
  assert.match(fleetPage, /data-netlify-ajax=["']true["']/, "fleet form should submit without POST landing pages");
  assert.match(fleetPage, /action=["']\/fleet-request-received\/["']/, "fleet form should use the fleet success page");
  assert.match(fleetPage, /name=["']send_to["'] value=["']blake\.farnsworth@shorelineglassco\.com["']/, "fleet form should include Blake recipient metadata");

  for (const field of ["business_name", "contact_name", "phone", "email", "account_type", "location", "vehicle_details"]) {
    assert.match(fleetPage, new RegExp(`name=["']${field}["']`), `fleet form should include ${field}`);
  }

  const thanksPage = read(path.join(siteDir, "thank-you", "index.html"));
  assert.match(thanksPage, /name=["']sms-opt-in["']/, "SMS opt-in form should exist");
  assert.match(thanksPage, /data-netlify=["']true["']/, "SMS opt-in should use Netlify Forms");
  assert.match(thanksPage, /name=["']sms_consent["'][^>]*required/, "SMS opt-in checkbox should be required");
});

test("GlassBiller embed is configured but not submitted by tests", () => {
  const quoteForm = read(path.join(siteDir, "assets", "quote-form.js"));
  assert.match(quoteForm, /shop-id["'], ["']2870["']/, "GlassBiller shop ID should be 2870");
  assert.match(quoteForm, /button-position["'], ["']left["']/, "GlassBiller fixed button should be left aligned");
  assert.match(quoteForm, /\/thank-you\//, "GlassBiller should redirect to the thank-you page");
});

test("critical marketing and trust content is present", () => {
  const home = read(path.join(siteDir, "index.html"));
  const fleet = read(path.join(siteDir, "fleet-adas-calibration", "index.html"));
  const adas = read(path.join(siteDir, "adas-calibration", "index.html"));
  const insurance = read(path.join(siteDir, "insurance", "index.html"));

  assert.match(home, /Hands down the best auto glass service I've ever experienced!/, "temporary Google review should be visible");
  assert.doesNotMatch(home, /No published Google reviews yet/, "placeholder review copy should not be visible");
  assert.match(home, /ANSI\/AGSC\/AGRSS-certified technician/, "certification trust signal should be on the homepage");
  assert.match(home, /Tell your insurance company you want Shoreline/, "homepage should promote insurance claim help");
  assert.match(fleet, /Fleet ADAS Calibration &amp; Auto Glass/, "fleet page headline should exist");
  assert.match(fleet, /ANSI\/AGSC\/AGRSS-certified operating partner/, "fleet page should mention certification");
  assert.match(adas, /ADAS Calibration After Windshield Replacement/, "ADAS page headline should exist");
  assert.match(insurance, /Tell Your Insurance Company You Want Shoreline Auto Glass/, "insurance page headline should exist");
  assert.match(insurance, /major glass claim TPAs/, "insurance page should mention major glass claim TPAs");
  assert.match(insurance, /I choose Shoreline Auto Glass for my auto glass claim/, "insurance page should include a customer script");
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
  assert.doesNotMatch(siteText, /—/, "site should not contain em dashes");
});
