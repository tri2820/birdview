import { createEffect, Match, onMount, Switch } from "solid-js";
import { createMessage } from "../message";
import HomeMain from "./components/HomeMain";
import MultiView from "./components/MultiView";
import SideBar from "./components/SideBar";
import StreamView from "./components/StreamView";
import TabLayout from "./components/TabLayout";
import {
  latestWsMessage,
  setGlobalState,
  setupWs,
  tabId,
  wsClient
} from "./utils";
import EventsMain from "./components/EventsMain";
import { WsHeader } from "../types";
import SettingsMain from "./components/SettingsMain";

export default function App() {
  onMount(() => {
    setupWs();
  });

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
    </Switch>
  );
}
