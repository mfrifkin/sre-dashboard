const PAGES = [
  { name: "GitHub",     id: "kctbh9vrtdwd" },
  { name: "Cloudflare", id: "yh6f0r4529hb" },
  { name: "Atlassian",  id: "bqlf2pcfz5c4" },
  { name: "Stripe",     id: "ybjz9bfx5mbb" },
  { name: "Twilio",     id: "gpkpykbmm5vv" },
  { name: "PagerDuty",  id: "rk3v07m7b16f" },
  { name: "Datadog",    id: "1k6wzpspjf99" },
  { name: "Fastly",     id: "979tzdkwy299" },
  { name: "Sendgrid",   id: "3tgl2vf85cht" },
  { name: "HubSpot",    id: "hsml1814ql3g" },
];

exports.handler = async () => {
  const results = await Promise.allSettled(
    PAGES.map(async (page) => {
      const base = `https://${page.id}.statuspage.io/api/v2`;
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
