// Contract check for the shipped plugin halves, run against the installed DSH.
//   node scripts/check-plugin.mjs
// Verifies the host route's behavior and the client bundle's slot registration,
// so a hand-written client bundle cannot silently drift from the 0.2 contract.
import { readFileSync } from "node:fs";

const failures = [];
const check = (condition, message) => {
  console.log(`  ${condition ? "PASS" : "FAIL"}  ${message}`);
  if (!condition) failures.push(message);
};

// ---------------------------------------------------------------- host half
console.log("host half (lib/index.js)");
const host = await import(new URL("../lib/index.js", import.meta.url).href);

check(
  Array.isArray(host.inject) && host.inject.includes("webServer") && host.inject.includes("credentials"),
  "declares the webServer and credentials services"
);

let route;
const ctx = {
  effect: (fn) => fn(),
  webServer: { register: (r) => { route = r; return () => {}; } },
  credentials: { resolve: async () => undefined }
};
host.apply(ctx);

check(route?.kind === "exact" && route?.path === "/api/dsh-balance", "registers an exact route at /api/dsh-balance");

const call = async (method) => {
  const out = { status: 0, body: "" };
  const res = {
    writeHead: (status) => { out.status = status; },
    end: (body) => { if (body !== undefined) out.body = String(body); }
  };
  await route.handler({ method }, res);
  return out;
};
const json = (out) => { try { return JSON.parse(out.body); } catch { return null; } };

check((await call("POST")).status === 405, "POST is rejected with 405");

const missing = await call("GET");
check(missing.status === 503 && json(missing).error === "missing-credential", "unconfigured credential returns 503 missing-credential");

ctx.credentials.resolve = async () => ({ value: "sk-test", source: "env" });
const providerBody = {
  is_available: true,
  balance_infos: [
    { currency: "CNY", total_balance: "10.00" },
    { currency: "USD", total_balance: "1.00" },
    { currency: "EUR", total_balance: "5.00" },
    { currency: "CNY", total_balance: 3 }
  ]
};
globalThis.fetch = async () => ({ ok: true, text: async () => JSON.stringify(providerBody) });

const ok = await call("GET");
const okJson = json(ok);
check(ok.status === 200 && okJson.isAvailable === true, "successful lookup returns 200 with isAvailable");
check(
  Array.isArray(okJson.balances) && okJson.balances.length === 2 &&
    okJson.balances.every((b) => b.currency === "CNY" || b.currency === "USD") &&
    okJson.balances.every((b) => typeof b.totalBalance === "string"),
  "normalizes only non-empty CNY/USD balances"
);

globalThis.fetch = async () => ({ ok: false, text: async () => "{}" });
check((await call("GET")).status === 502, "provider error returns 502");

globalThis.fetch = async () => ({ ok: true, text: async () => "not json" });
const malformed = await call("GET");
check(malformed.status === 200 && json(malformed).balances.length === 0, "malformed provider body degrades to an empty balance list");

globalThis.fetch = async () => { throw new Error("network down"); };
check((await call("GET")).status === 502, "network failure returns 502");

// -------------------------------------------------------------- client half
console.log("client half (lib/client.js)");
const source = readFileSync(new URL("../lib/client.js", import.meta.url), "utf8");

const React = {
  createElement: (type, props, ...children) => ({
    type,
    props: { ...(props || {}), children: children.length <= 1 ? children[0] : children }
  }),
  useState: (initial) => [initial, () => {}],
  useEffect: () => {}
};
const primitives = { FishLogo: () => null };

const styles = [];
const documentStub = {
  head: { appendChild: (el) => styles.push(el) },
  createElement: () => ({ dataset: {}, textContent: "", remove() {} }),
  querySelectorAll: () => [],
  querySelector: () => null
};
let bundle;
const windowStub = {
  __ModuleLoader__: { load: (m) => { bundle = m; } },
  setInterval: () => 0,
  clearInterval: () => {}
};
const stubRequire = (spec) => {
  if (spec === "react") return React;
  if (spec === "@deepseek-ai/dsh-client-ui-primitives") return primitives;
  throw new Error(`unexpected require: ${spec}`);
};

new Function("window", "document", source)(windowStub, documentStub);

const registration = [];
const clientCtx = {
  effect: (fn) => fn(),
  slots: {
    inject: (key, cb) => { clientCtx.key = key; return cb(); },
    register: (options, component) => registration.push({ options, component })
  }
};

const mod = bundle.factory(stubRequire);
mod.apply(clientCtx);

check(mod.inject.includes("slots"), "client bundle injects the slots service");
check(clientCtx.key === "sidebar.footer.action", "registers into the sidebar footer action slot");
check(registration.length === 1 && registration[0].options.id === "dsh-balance", "uses the dsh-balance slot id");
check(styles.some((s) => s.dataset.pluginCss === "dsh-balance"), "tags its stylesheet for HMR ownership");
check(registration[0].component({ wide: false }) === null, "renders nothing in the collapsed rail");
check(registration[0].component({ wide: true })?.props?.className === "dsh-balance-slot", "renders the balance row when the sidebar is wide");

console.log(failures.length === 0 ? "\nall contract checks passed" : `\n${failures.length} check(s) failed`);
process.exit(failures.length === 0 ? 0 : 1);
