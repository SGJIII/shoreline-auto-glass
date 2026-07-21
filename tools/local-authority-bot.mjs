#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const USER_AGENT = "ShorelineAuthorityBot/1.0 (+https://www.shorelineglassco.com/; info@shorelineglassco.com)";

function parseArgs(argv) {
  const options = {
    config: path.join(ROOT, "config", "seo-authority.json"),
    outreachLog: path.join(ROOT, "data", "seo", "outreach-log.csv"),
    output: path.join(ROOT, "reports", "seo-authority", "monthly-report.md"),
    json: path.join(ROOT, "reports", "seo-authority", "monthly-report.json"),
    csv: path.join(ROOT, "reports", "seo-authority", "prospects.csv"),
    offline: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--offline") {
      options.offline = true;
    } else if (arg.startsWith("--") && argv[index + 1]) {
      const key = arg.slice(2);
      if (Object.hasOwn(options, key)) {
        options[key] = path.resolve(argv[index + 1]);
        index += 1;
      }
    }
  }

  return options;
}

function markdown(value) {
  return String(value ?? "")
    .replaceAll("|", "\\|")
    .replaceAll("\n", " ")
    .trim();
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (quoted && char === '"' && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }

  const [headers = [], ...records] = rows;
  return records.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])));
}

function digits(value) {
  return String(value ?? "").replace(/\D/g, "").slice(-10);
}

function normalizeName(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/&amp;/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeWebsite(value) {
  const candidate = String(value ?? "").trim();
  if (!candidate) return "";
  try {
    return new URL(candidate.includes("://") ? candidate : `https://${candidate}`).href;
  } catch {
    return "";
  }
}

function websiteHost(value) {
  try {
    return new URL(normalizeWebsite(value)).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function tagValue(tags, ...keys) {
  for (const key of keys) {
    if (tags?.[key]) return String(tags[key]).trim();
  }
  return "";
}

function elementCoordinates(element) {
  return {
    latitude: Number(element.lat ?? element.center?.lat),
    longitude: Number(element.lon ?? element.center?.lon),
  };
}

function haversineKm(a, b) {
  const radians = (degrees) => (degrees * Math.PI) / 180;
  const earthKm = 6371;
  const dLat = radians(b.latitude - a.latitude);
  const dLon = radians(b.longitude - a.longitude);
  const lat1 = radians(a.latitude);
  const lat2 = radians(b.latitude);
  const value = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * earthKm * Math.asin(Math.sqrt(value));
}

function nearestHub(element, hubs) {
  const point = elementCoordinates(element);
  if (!Number.isFinite(point.latitude) || !Number.isFinite(point.longitude)) return hubs[0];
  return hubs
    .map((hub) => ({ hub, distance: haversineKm(point, hub) }))
    .sort((left, right) => left.distance - right.distance)[0]?.hub;
}

function explicitRegion(element) {
  const tags = element.tags ?? {};
  const locality = normalizeName([
    tagValue(tags, "addr:city", "addr:town", "addr:village"),
    tagValue(tags, "is_in", "is_in:city", "is_in:county"),
    tagValue(tags, "name"),
  ].join(" "));
  const regions = [
    ["Nantucket", ["nantucket", "siasconset", "madaket"]],
    ["Martha's Vineyard", ["vineyard haven", "oak bluffs", "edgartown", "west tisbury", "chilmark", "aquinnah"]],
    ["South Coast", ["new bedford", "fall river", "dartmouth", "westport", "fairhaven", "acushnet", "somerset", "swansea", "mattapoisett", "marion"]],
    ["South Shore", ["plymouth", "kingston", "duxbury", "marshfield", "scituate", "norwell", "hanover", "rockland", "hingham", "weymouth", "bridgewater"]],
    ["Cape Cod", ["barnstable", "hyannis", "yarmouth", "dennis", "harwich", "chatham", "orleans", "eastham", "wellfleet", "truro", "provincetown", "provicnetown", "falmouth", "mashpee", "sandwich", "bourne", "buzzards bay"]],
  ];
  return regions.find(([, places]) => places.some((place) => locality.includes(place)))?.[0] ?? "";
}

function isRelevantCommunity(name) {
  return /chamber|business guild|business association|merchants association|visitor|tourism|economic development/i.test(name);
}

export function classifyProspect(element) {
  const tags = element.tags ?? {};
  const name = tagValue(tags, "name", "brand", "operator");
  const haystack = `${name} ${tagValue(tags, "description")} ${tagValue(tags, "shop")} ${tagValue(tags, "craft")}`.toLowerCase();

  if (tags.office === "association" || /chamber|business association|merchants association|economic development/.test(haystack)) return "community organization";
  if (/collision|auto body|autobody|body shop/.test(haystack)) return "body shop";
  if (tags.shop === "car" || /dealership|dealer|motors|auto sales|automotive group/.test(haystack)) return "dealership";
  if (tags.amenity === "car_rental" || /fleet|truck|commercial vehicle/.test(haystack)) return "fleet operator";
  return "automotive service partner";
}

function pitchFor(category) {
  const pitches = {
    "body shop": "Referral relationship for glass replacement and ADAS calibration when collision work needs a specialist.",
    dealership: "Mobile wholesale glass and ADAS support that can reduce vehicle downtime for sales and service departments.",
    "fleet operator": "Mobile glass and calibration support for vehicles at a depot, office, or job site.",
    "community organization": "Accurate member or local-service listing, community resource inclusion, or a relevant sponsorship opportunity.",
    "automotive service partner": "Mutual referral relationship when a customer needs auto glass or calibration work outside the shop's core service.",
  };
  return pitches[category] ?? pitches["automotive service partner"];
}

export function scoreProspect(prospect) {
  const base = {
    "body shop": 78,
    dealership: 74,
    "fleet operator": 72,
    "community organization": 70,
    "automotive service partner": 52,
  }[prospect.category] ?? 45;
  const contactScore = (prospect.website ? 10 : 0) + (prospect.email ? 8 : 0) + (prospect.phone ? 4 : 0);
  const historyPenalty = prospect.outreachStatus && !/^(new|research)$/i.test(prospect.outreachStatus) ? 35 : 0;
  return Math.max(0, Math.min(100, base + contactScore - historyPenalty));
}

function prospectKey(prospect) {
  return websiteHost(prospect.website) || digits(prospect.phone) || `${normalizeName(prospect.name)}|${normalizeName(prospect.region)}`;
}

export function buildOverpassQuery(hubs) {
  const padding = 0.18;
  const south = Math.min(...hubs.map((hub) => hub.latitude)) - padding;
  const west = Math.min(...hubs.map((hub) => hub.longitude)) - padding;
  const north = Math.max(...hubs.map((hub) => hub.latitude)) + padding;
  const east = Math.max(...hubs.map((hub) => hub.longitude)) + padding;
  const box = `${south.toFixed(5)},${west.toFixed(5)},${north.toFixed(5)},${east.toFixed(5)}`;
  const selectors = [
    `nwr(${box})["shop"~"^(car_repair|car)$"];`,
    `nwr(${box})["craft"="car_repair"];`,
    `nwr(${box})["amenity"="car_rental"];`,
    `nwr(${box})["office"="association"];`,
  ];
  return `[out:json][timeout:60];\n(\n${selectors.join("\n")}\n);\nout center tags;`;
}

export function elementsToProspects(elements, config, outreachRows = []) {
  const history = new Map();
  for (const row of outreachRows) {
    const key = websiteHost(row.website) || digits(row.contact) || `${normalizeName(row.prospect_name)}|${normalizeName(row.region)}`;
    if (key) history.set(key, row);
  }

  const prospects = [];
  for (const element of elements) {
    const tags = element.tags ?? {};
    const name = tagValue(tags, "name", "brand", "operator");
    if (!name) continue;
    const hub = nearestHub(element, config.serviceHubs);
    const website = normalizeWebsite(tagValue(tags, "contact:website", "website", "url"));
    const phone = tagValue(tags, "contact:phone", "phone");
    const email = tagValue(tags, "contact:email", "email");
    const category = classifyProspect(element);
    if (category === "community organization" && !isRelevantCommunity(name)) continue;
    const sourceUrl = `https://www.openstreetmap.org/${element.type}/${element.id}`;
    const prospect = {
      name,
      category,
      region: explicitRegion(element) || hub?.region || "Unknown",
      hub: hub?.name ?? "Unknown",
      website,
      phone,
      email,
      sourceUrl,
      pitch: pitchFor(category),
      outreachStatus: "",
      notes: "",
    };
    const prior = history.get(prospectKey(prospect));
    if (prior) {
      prospect.outreachStatus = prior.status || "tracked";
      prospect.notes = prior.notes || prior.next_action || "Already present in outreach log";
    }
    prospect.score = scoreProspect(prospect);
    prospects.push(prospect);
  }

  const unique = new Map();
  for (const prospect of prospects) {
    const key = prospectKey(prospect);
    const existing = unique.get(key);
    if (!existing || prospect.score > existing.score) unique.set(key, prospect);
  }

  return [...unique.values()].sort((left, right) => right.score - left.score || left.name.localeCompare(right.name));
}

function manualProspects(config, outreachRows) {
  const history = new Map();
  for (const row of outreachRows) {
    const key = websiteHost(row.website) || digits(row.contact) || `${normalizeName(row.prospect_name)}|${normalizeName(row.region)}`;
    if (key) history.set(key, row);
  }
  return (config.manualProspects ?? []).map((item) => {
    const prospect = {
      ...item,
      hub: item.region,
      pitch: pitchFor(item.category),
      outreachStatus: "",
      notes: "Curated regional authority prospect",
    };
    const prior = history.get(prospectKey(prospect));
    if (prior) {
      prospect.outreachStatus = prior.status || "tracked";
      prospect.notes = prior.notes || prior.next_action || "Already present in outreach log";
    }
    prospect.score = scoreProspect(prospect);
    return prospect;
  });
}

function mergeProspects(...lists) {
  const unique = new Map();
  for (const prospect of lists.flat()) {
    const key = prospectKey(prospect);
    const existing = unique.get(key);
    if (!existing || prospect.score > existing.score) unique.set(key, prospect);
  }
  return [...unique.values()].sort((left, right) => right.score - left.score || left.name.localeCompare(right.name));
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 20000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...options,
      headers: { "user-agent": USER_AGENT, accept: "text/html,application/json;q=0.9,*/*;q=0.8", ...(options.headers ?? {}) },
      redirect: "follow",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function discoverProspects(config) {
  const query = buildOverpassQuery(config.serviceHubs);
  const body = new URLSearchParams({ data: query });
  const endpoints = config.discovery.overpassEndpoints ?? [config.discovery.overpassEndpoint];
  const errors = [];
  for (const endpoint of endpoints.filter(Boolean)) {
    try {
      const response = await fetchWithTimeout(
        endpoint,
        {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded;charset=UTF-8" },
          body,
        },
        config.discovery.timeoutMs,
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      return { elements: payload.elements ?? [], query, endpoint };
    } catch (error) {
      errors.push(`${endpoint}: ${error.message}`);
    }
  }
  throw new Error(`Overpass discovery failed. ${errors.join("; ")}`);
}

async function auditCitation(citation, business, offline) {
  if (!citation.profileUrl) {
    return { ...citation, status: "needs profile URL", finalUrl: "", note: "Claim or locate the profile, then add its public URL to the configuration." };
  }
  if (offline) return { ...citation, status: "not checked", finalUrl: citation.profileUrl, note: "Offline run" };
  try {
    const response = await fetchWithTimeout(citation.profileUrl, {}, 25000);
    const html = response.headers.get("content-type")?.includes("text") ? await response.text() : "";
    const plain = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ");
    const nameSeen = normalizeName(plain).includes(normalizeName(business.name));
    const phoneSeen = digits(plain).includes(digits(business.phone));
    return {
      ...citation,
      status: response.ok ? "live" : `HTTP ${response.status}`,
      finalUrl: response.url,
      note: nameSeen || phoneSeen ? `Machine-readable NAP found: ${nameSeen ? "name" : ""}${nameSeen && phoneSeen ? " + " : ""}${phoneSeen ? "phone" : ""}.` : "Profile responds, but its NAP is not machine-verifiable; review it manually.",
    };
  } catch (error) {
    return { ...citation, status: "check failed", finalUrl: citation.profileUrl, note: error.message };
  }
}

async function auditBacklink(target, domain, offline) {
  if (!target.sourceUrl) return { ...target, status: "needs source URL", note: "Add the exact partner or directory page that should link to Shoreline." };
  if (offline) return { ...target, status: "not checked", note: "Offline run" };
  try {
    const response = await fetchWithTimeout(target.sourceUrl, {}, 25000);
    const html = response.headers.get("content-type")?.includes("text") ? await response.text() : "";
    const linked = html.toLowerCase().includes(domain.toLowerCase());
    return { ...target, status: response.ok && linked ? "active" : response.ok ? "link missing" : `HTTP ${response.status}`, note: linked ? "Shoreline domain found on source page." : "Source page loaded, but the Shoreline domain was not found." };
  } catch (error) {
    return { ...target, status: "check failed", note: error.message };
  }
}

function contactRoute(prospect) {
  if (prospect.email) return `[Email](mailto:${prospect.email})`;
  if (prospect.website) return `[Website](${prospect.website})`;
  if (prospect.phone) return prospect.phone;
  return "Research contact";
}

export function buildReport({ generatedAt, config, citations, backlinks, prospects, discoveryError = "" }) {
  const liveCitations = citations.filter((item) => item.status === "live").length;
  const citationGaps = citations.filter((item) => item.status !== "live").length;
  const activeBacklinks = backlinks.filter((item) => item.status === "active").length;
  const newProspects = prospects.filter((item) => !item.outreachStatus).length;
  const lines = [
    `# Shoreline Local Authority Report`,
    "",
    `Generated: ${generatedAt}`,
    "",
    "## Executive Summary",
    "",
    `- Citation profiles confirmed live: **${liveCitations}**`,
    `- Citation profiles needing setup or review: **${citationGaps}**`,
    `- Known backlinks confirmed active: **${activeBacklinks}**`,
    `- New local prospects in this run: **${newProspects}**`,
    `- Review request link: [Open Google review form](${config.business.reviewUrl})`,
  ];

  if (discoveryError) lines.push(`- Discovery warning: **${markdown(discoveryError)}**`);

  lines.push("", "## Approval Queue", "");
  const priority = prospects.filter((item) => !item.outreachStatus).slice(0, 10);
  if (!priority.length) {
    lines.push("No new prospects require approval. Review citation gaps and previously tracked outreach.");
  } else {
    priority.forEach((prospect, index) => {
      lines.push(`${index + 1}. **${markdown(prospect.name)}** (${prospect.category}, ${prospect.region}, score ${prospect.score})`);
      lines.push(`   - Why: ${prospect.pitch}`);
      lines.push(`   - Contact: ${contactRoute(prospect)} | [Source](${prospect.sourceUrl})`);
      lines.push("   - Approval required before contact: **Yes**");
    });
  }

  lines.push("", "## Citation Audit", "", "| Citation | Status | Evidence | Next action |", "|---|---:|---|---|");
  for (const citation of citations) {
    const evidence = citation.finalUrl ? `[Open profile](${citation.finalUrl})` : "No public profile URL recorded";
    const action = citation.status === "live" ? citation.note : `[Claim or configure](${citation.claimUrl})`;
    lines.push(`| ${markdown(citation.name)} | ${markdown(citation.status)} | ${evidence} | ${markdown(action)} |`);
  }

  lines.push("", "## Known Backlink Audit", "");
  if (!backlinks.length) {
    lines.push("No known partner backlinks are configured yet. When a body shop, dealership, chamber, sponsor, or directory publishes a Shoreline link, add the exact source page to `config/seo-authority.json` so future runs verify it automatically.");
  } else {
    lines.push("| Source | Status | Note |", "|---|---:|---|");
    for (const backlink of backlinks) lines.push(`| [${markdown(backlink.name ?? backlink.sourceUrl)}](${backlink.sourceUrl}) | ${markdown(backlink.status)} | ${markdown(backlink.note)} |`);
  }

  lines.push("", "## Scored Local Prospects", "", "| Score | Organization | Type | Region | Contact | Outreach status |", "|---:|---|---|---|---|---|");
  for (const prospect of prospects) {
    lines.push(`| ${prospect.score} | [${markdown(prospect.name)}](${prospect.sourceUrl}) | ${markdown(prospect.category)} | ${markdown(prospect.region)} | ${contactRoute(prospect)} | ${markdown(prospect.outreachStatus || "new")} |`);
  }

  lines.push(
    "",
    "## Outreach Starting Points",
    "",
    "### Body shop or dealership",
    "",
    "Shoreline provides mobile auto glass replacement and ADAS calibration across the region. We would like to learn how your team currently handles glass and calibration work and whether a practical referral or overflow relationship would help your customers. If there is a fit, we can provide accurate Shoreline service information for your resource or partner page.",
    "",
    "### Chamber or community organization",
    "",
    "Shoreline Auto Glass is a local mobile auto glass business serving the region. We would like to confirm the appropriate membership, local-service directory, or sponsorship process so residents can find accurate contact and service information. We are only requesting inclusion where it is useful and consistent with your listing policies.",
    "",
    "## Required Guardrails",
    "",
    ...config.guardrails.map((rule) => `- ${rule}`),
    "",
    "## Monthly Operator Checklist",
    "",
    "1. Approve or reject each top prospect.",
    "2. Add approved contacts to `data/seo/outreach-log.csv` before outreach.",
    "3. Correct inconsistent directory information using the Shoreline name, phone, email, website, and service-area model.",
    "4. Ask completed-job customers for an honest Google review without incentives or rating requirements.",
    "5. Add newly published backlink source URLs to the configuration.",
    "6. Compare the next report with this one and close completed actions.",
    "",
    "Data source: OpenStreetMap contributors through the Overpass API, plus direct checks of configured public citation and backlink URLs. Discovery results are leads for human review, not endorsements.",
    "",
  );

  return lines.join("\n");
}

function prospectsCsv(prospects) {
  const headers = ["score", "prospect_name", "category", "region", "hub", "website", "phone", "email", "outreach_status", "pitch", "source_url"];
  const rows = prospects.map((item) => [item.score, item.name, item.category, item.region, item.hub, item.website, item.phone, item.email, item.outreachStatus, item.pitch, item.sourceUrl]);
  return [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n") + "\n";
}

async function ensureParent(file) {
  await mkdir(path.dirname(file), { recursive: true });
}

export async function run(options) {
  const config = JSON.parse(await readFile(options.config, "utf8"));
  const outreachRows = parseCsv(await readFile(options.outreachLog, "utf8"));
  const generatedAt = new Date().toISOString();
  let elements = [];
  let discoveryError = "";
  let query = "";

  if (!options.offline) {
    try {
      const discovery = await discoverProspects(config);
      elements = discovery.elements;
      query = discovery.query;
    } catch (error) {
      discoveryError = error.message;
    }
  }

  const prospects = mergeProspects(
    elementsToProspects(elements, config, outreachRows),
    manualProspects(config, outreachRows),
  ).slice(0, config.discovery.maxProspects);
  const citations = await Promise.all(config.citations.map((citation) => auditCitation(citation, config.business, options.offline)));
  const backlinks = await Promise.all(config.knownBacklinks.map((target) => auditBacklink(target, config.business.domain, options.offline)));
  const report = buildReport({ generatedAt, config, citations, backlinks, prospects, discoveryError });
  const payload = { generatedAt, discoveryError, query, citations, backlinks, prospects };

  await Promise.all([options.output, options.json, options.csv].map(ensureParent));
  await Promise.all([
    writeFile(options.output, report, "utf8"),
    writeFile(options.json, JSON.stringify(payload, null, 2) + "\n", "utf8"),
    writeFile(options.csv, prospectsCsv(prospects), "utf8"),
  ]);

  return { ...payload, reportPath: options.output, jsonPath: options.json, csvPath: options.csv };
}

const isMain = process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (isMain) {
  run(parseArgs(process.argv.slice(2)))
    .then((result) => {
      console.log(`Local authority report: ${result.reportPath}`);
      console.log(`Prospects: ${result.prospects.length}`);
      if (result.discoveryError) console.warn(`Discovery warning: ${result.discoveryError}`);
    })
    .catch((error) => {
      console.error(error.stack || error.message);
      process.exitCode = 1;
    });
}
