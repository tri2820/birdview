import { batch, createEffect, Match, onMount, Switch, untrack } from "solid-js";
import EventsMain from "./components/EventsMain";
import HomeMain from "./components/HomeMain";
import MultiView from "./components/MultiView";
import SearchResultMain from "./components/SearchResultMain";
import SettingsMain from "./components/SettingsMain";
import SideBar from "./components/SideBar";
import StreamView from "./components/StreamView";
import TabLayout from "./components/TabLayout";
import {
  localStorage$,
  setLocalStorage$,
  setupWs,
  tabId
} from "./utils";
import { reconcile } from "solid-js/store";
import { set } from "date-fns";

export default function App() {
  onMount(() => {
    setupWs();
  });

  // Load local storage
  onMount(() => {
    const saved = localStorage.getItem("localStorage$")
    if (!saved) return;
    try {
      const s = JSON.parse(saved)
      batch(() => {
        for (const k of Object.keys(s)) {
          setLocalStorage$(k as any, s[k]);
        }
      })
      console.log("Loaded localStorage$", untrack(() => localStorage$));
    } catch (e) {
      console.error("Failed to parse localStorage$", e);
    }

  })

  const sidebar = <SideBar />;

  return (
    <Switch fallback={<div class="p-4">Adventurer, you have reached the deep end. Please reload to go back safely.</div>}>
      <Match when={tabId().type === "stream"}>
        <StreamView sidebar={sidebar} id={() => (tabId() as any).stream_id} />
      </Match>

      <Match when={tabId().type === "home"}>
        <TabLayout sidebar={sidebar} main={<HomeMain />} />
      </Match>

      <Match when={tabId().type === "statistics"}>
        <TabLayout sidebar={sidebar} main={<div>Stats</div>} />
      </Match>

      <Match when={tabId().type === "moments"}>
        <TabLayout sidebar={sidebar} main={<div>Moments</div>} />
      </Match>

      <Match when={tabId().type === "events"}>
        <TabLayout sidebar={sidebar} main={<EventsMain />} />
      </Match>

      <Match when={tabId().type === "multiview"}>
        <TabLayout sidebar={sidebar} main={<MultiView />} />
      </Match>
      <Match when={tabId().type === "settings"}>
        <TabLayout sidebar={sidebar} main={<SettingsMain />} />
      </Match>

      <Match when={tabId().type === "search-result"}>
        <TabLayout sidebar={sidebar} main={<SearchResultMain />} />
      </Match>
    </Switch>
  );
}
