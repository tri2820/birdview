import { Match, onCleanup, onMount, Switch } from "solid-js";
import StreamView from "./components/StreamView";
import SideBar from "./components/SideBar";
import {
  parseWsMessage,
  setConfig,
  setLatestWsMessage,
  setTabId,
  setupWs,
  tabId,
} from "./utils";
import TabLayout from "./components/TabLayout";
import HomeMain from "./components/HomeMain";
import MultiView from "./components/MultiView";

export default function App() {
  onMount(() => {
    const socket = setupWs();
    onCleanup(() => {
      console.log("Closing WebSocket connection.");
      socket.close();
    });
  });

  const sidebar = <SideBar />;

  return (
    <Switch fallback={<div>Loading...</div>}>
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

      <Match when={tabId().type === "multiview"}>
        <TabLayout sidebar={sidebar} main={<MultiView />} />
      </Match>
    </Switch>
  );
}
