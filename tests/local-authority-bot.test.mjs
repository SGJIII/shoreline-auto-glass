import assert from "node:assert/strict";
import test from "node:test";

import {
  buildOverpassQuery,
  buildReport,
  classifyProspect,
  elementsToProspects,
  parseCsv,
  scoreProspect,
} from "../tools/local-authority-bot.mjs";

const config = {
  business: {
    name: "Shoreline Auto Glass",
    domain: "shorelineglassco.com",
    reviewUrl: "https://example.com/review",
  },
  discovery: { maxProspects: 30 },
  serviceHubs: [
    { name: "Hyannis", region: "Cape Cod", latitude: 41.65, longitude: -70.28, radiusMeters: 10000 },
    { name: "Plymouth", region: "South Shore", latitude: 41.95, longitude: -70.66, radiusMeters: 10000 },
  ],
  guardrails: ["Human approval is required before outreach."],
};

test("CSV parser preserves quoted outreach notes", () => {
  const rows = parseCsv('prospect_name,status,notes\n"Cape Motors",contacted,"Called, follow up next month"\n');
  assert.deepEqual(rows, [{ prospect_name: "Cape Motors", status: "contacted", notes: "Called, follow up next month" }]);
});

test("Overpass query includes each local hub and authority category", () => {
  const query = buildOverpassQuery(config.serviceHubs);
  assert.match(query, /41\.47000,-70\.84000,42\.13000,-70\.10000/);
  assert.match(query, /car_repair/);
  assert.match(query, /car_rental/);
  assert.match(query, /office"="association/);
  assert.match(query, /out center tags/);
});

test("prospects are classified and scored for relationship value", () => {
  const bodyShop = { tags: { name: "Cape Collision and Auto Body", shop: "car_repair" } };
  const dealer = { tags: { name: "Harbor Motors", shop: "car" } };
  const chamber = { tags: { name: "Local Chamber of Commerce" } };
  assert.equal(classifyProspect(bodyShop), "body shop");
  assert.equal(classifyProspect(dealer), "dealership");
  assert.equal(classifyProspect(chamber), "community organization");
  assert.ok(scoreProspect({ category: "body shop", website: "https://example.com", email: "hello@example.com", phone: "774-555-0000" }) > 90);
});

test("OSM elements become deduplicated prospects and honor outreach history", () => {
  const elements = [
    {
      type: "node",
      id: 1,
      lat: 41.651,
      lon: -70.281,
      tags: { name: "Cape Collision", shop: "car_repair", website: "https://capecollision.example", phone: "774-555-0100" },
    },
    {
      type: "way",
      id: 2,
      center: { lat: 41.652, lon: -70.282 },
      tags: { name: "Cape Collision", shop: "car_repair", website: "https://capecollision.example" },
    },
  ];
  const history = [{ prospect_name: "Cape Collision", website: "https://capecollision.example", status: "contacted", notes: "Waiting for reply" }];
  const prospects = elementsToProspects(elements, config, history);
  assert.equal(prospects.length, 1);
  assert.equal(prospects[0].region, "Cape Cod");
  assert.equal(prospects[0].outreachStatus, "contacted");
  assert.equal(prospects[0].notes, "Waiting for reply");
  assert.ok(prospects[0].score < 80, "previously contacted prospects should be deprioritized");
});

test("monthly report contains an approval queue and anti-spam guardrails", () => {
  const prospects = [{
    name: "Cape Collision",
    category: "body shop",
    region: "Cape Cod",
    score: 96,
    pitch: "Useful referral relationship.",
    website: "https://example.com/",
    phone: "",
    email: "",
    sourceUrl: "https://www.openstreetmap.org/node/1",
    outreachStatus: "",
  }];
  const report = buildReport({
    generatedAt: "2026-07-20T12:00:00.000Z",
    config,
    citations: [{ name: "Google Business Profile", status: "live", finalUrl: "https://example.com/profile", note: "Live" }],
    backlinks: [],
    prospects,
  });
  assert.match(report, /Approval Queue/);
  assert.match(report, /Approval required before contact: \*\*Yes\*\*/);
  assert.match(report, /Human approval is required before outreach/);
  assert.match(report, /OpenStreetMap contributors/);
});
