export const name = "dsh-balance";
export const inject = ["slots"];

export function apply(ctx) {
  const styles = `
.dsh-balance-slot {
  box-sizing: border-box;
  width: 100%;
  height: 50px;
  margin-bottom: -50px;
  padding: 0 10px 0 8px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  position: relative;
  z-index: 2;
  pointer-events: none;
  color: var(--dsw-alias-label-primary);
  font-family: inherit;
  font-size: 14px;
  line-height: 22px;
  white-space: nowrap;
}
.dsh-balance-value {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  font-variant-numeric: tabular-nums;
}
.dsh-balance-icon {
  flex: none;
  color: var(--dsw-alias-label-secondary);
}
.dsh-balance-text {
  overflow: hidden;
  text-overflow: ellipsis;
}
`;
  ctx.effect(() => {
    const style = document.createElement("style");
    style.dataset.pluginCss = "dsh-balance";
    style.textContent = styles;
    document.head.appendChild(style);
    return () => style.remove();
  }, "dsh-balance: styles");

  ctx.slots.inject("sidebar.footer.action", () => ctx.slots.register(
    {
      name: "sidebar.footer.action",
      id: "dsh-balance",
      order: 100,
      inject: () => ({})
    },
    BalanceDisplay
  ));
}

function BalanceDisplay({ wide }) {
  const [state, setState] = React.useState({ status: "loading", balances: [] });

  React.useEffect(() => {
    if (!wide) return undefined;
    let active = true;
    let timer;

    const refresh = async () => {
      try {
        const response = await fetch("/api/dsh-balance", { headers: { accept: "application/json" } });
        const data = await response.json();
        if (!active) return;
        setState({
          status: response.ok ? "ready" : "error",
          balances: Array.isArray(data.balances) ? data.balances : []
        });
      } catch {
        if (active) setState({ status: "error", balances: [] });
      }
    };

    refresh();
    timer = window.setInterval(refresh, 60000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [wide]);

  if (!wide) return null;

  const values = state.balances
    .slice()
    .sort((a, b) => (a.currency === "CNY" ? -1 : 1) - (b.currency === "CNY" ? -1 : 1))
    .map((item) => `${formatAmount(item.totalBalance)} ${item.currency}`);
  const text = values.length > 0 ? values.join(" / ") : "--";

  return React.createElement(
    "div",
    { className: "dsh-balance-slot", title: "DeepSeek API balance", "aria-label": `DeepSeek API balance ${text}` },
    React.createElement(
      "span",
      { className: "dsh-balance-value" },
      React.createElement(_primitives.FishLogo, { className: "dsh-balance-icon", size: 14 }),
      React.createElement("span", { className: "dsh-balance-text" }, text)
    )
  );
}

function formatAmount(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "--";
  return amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
