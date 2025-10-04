import {
  FaSolidClockRotateLeft,
  FaSolidDisplay,
  FaSolidExpand,
} from "solid-icons/fa";
import { Accessor, createEffect, For, onMount } from "solid-js";
import SearchBar from "./SearchBar";
import useWsVideo from "./useWsVideo";
import useVideoPlayer from "./useVideoPlayer";
import { config, recentSearches, setTabId, wsClient } from "../utils";
import { createMessage } from "../../message";

function StreamItem(props: { id: Accessor<string> }) {
  const videoPlayer = useVideoPlayer({ fit: "cover" });
  useWsVideo({ id: props.id, videoPlayer });

  return (
    <div
      onClick={() => {
        setTabId({ type: "stream", stream_id: props.id() });
      }}
      class="h-32 rounded-2xl overflow-hidden border border-neutral-800 cursor-pointer"
    >
      <videoPlayer.component />
    </div>
  );
}

export default function HomeMain() {
  const streams = () => Object.keys(config()?.streams || {});

  createEffect(() => {
    console.log("HomeMain mounted");
    const streams = config()?.streams || {};
    let subscribedStreams: any = {};
    for (const key of Object.keys(streams)) {
      // 1 is REDUCED FPS (1 fps)
      subscribedStreams[key] = { priority: 1 };
    }
    const b = createMessage({ type: "viewing", streams: subscribedStreams });
    wsClient?.send(b);
  })

  return (
    // Added `isolate` to create a new stacking context. This is important!
    <div class="flex items-center flex-col bg-neutral-950 space-y-16 relative isolate overflow-auto py-32">
      <div class="font-anton font-bold text-white text-6xl text-center relative z-10 ">
        Semantic search
        <br />
        across all cameras
      </div>

      <div class="relative z-40">
        <SearchBar variant="lg" />
      </div>

      <div class="text-left w-[40vw] mt-12 space-y-2 relative z-30">
        <div class="flex items-center space-x-2 text-neutral-300">
          <FaSolidClockRotateLeft class="w-4 h-4" />
          <div class="font-bold">Recent Searches</div>
        </div>

        <div>
          <For each={recentSearches()}>
            {(item) => {
              return (
                <div class="text-neutral-300 hover:text-white cursor-pointer px-6 py-4 border-b border-neutral-800">
                  {item}
                </div>
              );
            }}
          </For>
        </div>
      </div>

      <div class="text-left w-[40vw] mt-12 space-y-4 relative z-30">
        <button
          onClick={() => {
            setTabId({
              type: "multiview",
              stream_ids: streams(),
            });
          }}
          class="btn-primary"
        >
          <FaSolidDisplay class="w-4 h-4" />
          <div class="font-bold text-sm">View All</div>
        </button>

        <div class="grid grid-cols-3 gap-4 ">
          <For each={streams()}>
            {(stream) => <StreamItem id={() => stream} />}
          </For>
        </div>
      </div>
      {/* Gradient blob - z-index: 20 */}
      {/* This will now sit between the title (10) and the search sections (30) */}
      {/* <div class="absolute top-0 left-0 z-20 overflow-hidden w-full h-screen ">
        <div class="gradient-circle"></div>
      </div> */}
    </div>
  );
}
