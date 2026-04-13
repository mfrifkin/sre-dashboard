const PAGES = [
  { name: "GitHub",     url: "https://www.githubstatus.com" },
  { name: "Cloudflare", url: "https://www.cloudflarestatus.com" },
  { name: "Atlassian",  url: "https://status.atlassian.com" },
  { name: "Stripe",     url: "https://status.stripe.com" },
  { name: "Twilio",     url: "https://status.twilio.com" },
  { name: "PagerDuty",  url: "https://status.pagerduty.com" },
  { name: "Datadog",    url: "https://status.datadoghq.com" },
  { name: "Fastly",     url: "https://www.fastlystatus.com" },
  { name: "Discord",    url: "https://discordstatus.com" },
  { name: "HubSpot",    url: "https://status.hubspot.com" },
];

const NINETY_DAYS = 90 * 24 * 60 * 60 * 1000;

function calcMTTR(incidents) {
  const resolved = incidents.filter((i) => i.resolved_at && i.created_at);
  if (!resolved.length) return null;
  const totalMs = resolved.reduce(
    (sum, i) => sum + (new Date(i.resolved_at) - new Date(i.created_at)),
    0
  );
  return Math.round(totalMs / resolved.length / 60000);
}

function weeklyBuckets(incidents) {
  const now = Date.now();
  const buckets = Array(13).fill(0);
  for (const inc of incidents) {
    const age = now - new Date(inc.created_at).getTime();
    if (age > NINETY_DAYS) continue;
    const week = Math.floor(age / (7 * 24 * 60 * 60 * 1000));
    if (week < 13) buckets[12 - week]++;
  }
  return buckets;
}

exports.handler = async () => {
  const cutoff = new Date(Date.now() - NINETY_DAYS).toISOString();

  const results = await Promise.allSettled(
    PAGES.map(async (page) => {
      const base = `${page.url}/api/v2`;
      const [sumRes, incRes, histRes] = await Promise.all([
        fetch(`${base}/summary.json`),
        fetch(`${base}/incidents/unresolved.json`),
        fetch(`${base}/incidents.json?limit=100`),
      ]);

      const summary = await sumRes.json();
      const unresolved = await incRes.json();
      const historical = await histRes.json();

      const allIncidents = historical.incidents ?? [];
      const recent = allIncidents.filter((i) => i.created_at >= cutoff);

      return {
        name: page.name,
        indicator: summary.status?.indicator ?? "none",
        active_incidents: (unresolved.incidents ?? []).map((i) => ({
          name: i.name,
          impact: i.impact,
          status: i.status,
          created_at: i.created_at,
        })),
        mttr_minutes: calcMTTR(recent),
        incident_count_90d: recent.length,
        weekly_buckets: weeklyBuckets(allIncidents),
        components: (summary.components ?? [])
          .filter((c) => !c.group && c.status !== "operational")
          .map((c) => ({ name: c.name, status: c.status })),
      };
    })
  );

  const data = results
    .filter((r) => r.status === "fulfilled")
    .map((r) => r.value);

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=60",
    },
    body: JSON.stringify(data),
  };
};