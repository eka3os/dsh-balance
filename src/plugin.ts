export const name = "dsh-balance";
export const version = "0.1.0";

export function apply(ctx) {
  const slots = ctx.get("slots");
  if (!slots) return;

  slots.inject("sidebar.footer.action", () => slots.register(
    {
      name: "sidebar.footer.action",
      id: "dsh-balance",
      order: 100,
      inject: () => ({
        wide: true,
        renderSlot: (name, props) => {
          if (name === "dsh-balance") {
            return React.createElement(
              "div",
              { style: { display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "var(--dsw-alias-label-primary)" } },
              React.createElement(
                "span",
                null,
                "[provider website icon]"
              ),
              React.createElement(
                "span",
                null,
                "000,000.00 CNY / USD"
              )
            );
          }
          return null;
        }
      })
    },
    (props) => {
      // Balance display component
      return React.createElement(
        "div",
        {
          style: {
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            paddingRight: "12px",
            fontFamily: "inherit",
            fontSize: "14px"
          }
        },
        React.createElement(
          "span",
          null,
          "[provider website icon]"
        ),
        React.createElement(
          "span",
          null,
          "000,000.00 CNY / USD"
        )
      );
    }
  ));
}