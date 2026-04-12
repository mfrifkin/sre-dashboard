// IDs sourced from each company's public status page URL
// Format: https://{id}.statuspage.io OR their custom domain which embeds the ID
const PAGES = [
  { name: "GitHub",      url: "https://www.githubstatus.com" },
  { name: "Cloudflare",  url: "https://www.cloudflarestatus.com" },
  { name: "Atlassian",   url: "https://status.atlassian.com" },
  { name: "Stripe",      url: "https://status.stripe.com" },
  { name: "Twilio",      url: "https://status.twilio.com" },
  { name: "PagerDuty",   url: "https://status.pagerduty.com" },
  { name: "Datadog",     url: "https://status.datadoghq.com" },
  { name: "Fastly",      url: "https://www.fastlystatus.com" },
  { name: "Discord",     url: "https://discordstatus.com" },
  { name: "HubSpot",     url: "https://status.hubspot.com" },
];

exports.handler = async () => {
  const results = await Promise.allSettled(
    PAGES.map(async (page) => {
      const base = `${page.url}/api/v2`;
      const [sumRes, incRes] = await Promise.all([
        fetch(`${base}/summary.json`),
        fetch(`${base}/incidents/unresolved.json`),
      ]);
      const summary = await sumRes.json();
      const incidents = await incRes.json();
      return {
        name: page.name,
        indicator: summary.status?.indicator ?? "none",
        description: summary.status?.description ?? "Unknown",
        incidents: (incidents.incidents ?? []).map((inc) => ({
          name: inc.name,
          impact: inc.impact,
          status: inc.status,
          created_at: inc.created_at,
        })),
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
      "Cache-Control": "public, max-age=30",
    },
    body: JSON.stringify(data),
  };
};