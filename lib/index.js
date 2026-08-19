export const name = "dsh-balance";
export const inject = ["webServer", "credentials"];

const BALANCE_URL = "https://api.deepseek.com/user/balance";
const API_KEY_REF = "DEEPSEEK_API_KEY";

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "content-length": Buffer.byteLength(payload)
  });
  res.end(payload);
}

function normalizeBalances(value) {
  if (typeof value !== "object" || value === null || !Array.isArray(value.balance_infos)) return [];
  return value.balance_infos
    .filter((item) => typeof item === "object" && item !== null)
    .map((item) => ({
      currency: item.currency,
      totalBalance: item.total_balance
    }))
    .filter((item) => (item.currency === "CNY" || item.currency === "USD") && typeof item.totalBalance === "string");
}

export function apply(ctx) {
  ctx.effect(() => ctx.webServer.register({
    kind: "exact",
    path: "/api/dsh-balance",
    handler: async (req, res) => {
      if (req.method !== "GET" && req.method !== "HEAD") {
        res.writeHead(405, { allow: "GET, HEAD" });
        res.end();
        return;
      }

      const credential = await ctx.credentials.resolve(API_KEY_REF);
      if (credential === undefined) {
        sendJson(res, 503, { error: "missing-credential", balances: [] });
        return;
      }

      try {
        const response = await fetch(BALANCE_URL, {
          headers: {
            accept: "application/json",
            authorization: `Bearer ${credential.value}`
          }
        });
        const raw = await response.text();
        let parsed;
        try {
          parsed = JSON.parse(raw);
        } catch {
          parsed = null;
        }

        if (!response.ok) {
          sendJson(res, 502, { error: "provider-error", balances: [] });
          return;
        }

        sendJson(res, 200, {
          isAvailable: parsed?.is_available === true,
          balances: normalizeBalances(parsed)
        });
      } catch {
        sendJson(res, 502, { error: "request-failed", balances: [] });
      }
    }
  }), "dsh-balance: API route");
}
