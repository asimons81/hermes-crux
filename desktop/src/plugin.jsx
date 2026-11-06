import React from "react";
import * as sdk from "@hermes/plugin-sdk";
import { CruxApp } from "./App.jsx";
export default {
  id: "hermes-crux",
  name: "Crux — Decision Atlas",
  register(ctx) {
    const api = async (path, options) => {
      const epoch =
        typeof sdk.gatewayActivationEpoch === "function"
          ? sdk.gatewayActivationEpoch()
          : null;
      const result = await ctx.rest(path, options);
      if (epoch !== null && sdk.gatewayActivationEpoch() !== epoch)
        throw Error(
          "The active Hermes connection changed. Reopen Crux to load this profile’s models.",
        );
      return result;
    };
    let selectedId = null;
    const listeners = new Set();
    const refreshListeners = new Set();
    const refresh = () => refreshListeners.forEach((f) => f());
    ctx.onEvent("plugin.hermes-crux.study.changed", refresh);
    ctx.onEvent("gateway.ready", refresh);
    ctx.setInterval(refresh, 30000);
    const navigate = (id) => {
      selectedId = id || selectedId;
      listeners.forEach((f) => f(selectedId));
      sdk.host.navigate("/crux");
    };
    function Page() {
      const [id, setId] = React.useState(selectedId),
        [epoch, setEpoch] = React.useState(0),
        [openKey, setOpenKey] = React.useState(0);
      React.useEffect(() => {
        const fn = () => setEpoch((x) => x + 1);
        const open = (nextId) => {
          setId(nextId);
          setOpenKey((x) => x + 1);
        };
        listeners.add(open);
        refreshListeners.add(fn);
        return () => {
          listeners.delete(open);
          refreshListeners.delete(fn);
        };
      }, []);
      return (
        <CruxApp key={openKey} api={api} initialId={id} refreshEpoch={epoch} />
      );
    }
    ctx.registerMany([
      {
        id: "page",
        area: sdk.ROUTES_AREA,
        data: { path: "/crux" },
        render: () => <Page />,
      },
      {
        id: "nav",
        area: sdk.SIDEBAR_NAV_AREA,
        data: { path: "/crux", label: "Crux", codicon: "compass" },
      },
      {
        id: "open",
        area: sdk.PALETTE_AREA,
        data: {
          id: "crux.open",
          label: "Crux: Open decision atlas",
          keywords: ["decision", "assumptions", "threshold", "crux"],
          run: () => navigate(),
        },
      },
    ]);
    if (typeof sdk.TRANSCRIPT_DIRECTIVE_AREA === "string")
      ctx.register({
        id: "crux-card",
        area: sdk.TRANSCRIPT_DIRECTIVE_AREA,
        data: {
          name: "crux",
          render: ({ attrs }) =>
            /^[a-f0-9]{32}$/.test(attrs.id || "") ? (
              <CruxApp
                api={api}
                initialId={attrs.id}
                compact
                onNavigate={navigate}
              />
            ) : null,
        },
      });
  },
};
