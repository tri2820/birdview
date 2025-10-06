import { FaSolidArrowLeft, FaSolidExpand } from "solid-icons/fa";
import { Accessor, createEffect, For, onMount } from "solid-js";
import { appConfig, goBackTabId, setTabId, tabId, wsClient } from "../utils";
import useVideoPlayer from "./useVideoPlayer";
import useWsVideo from "./useWsVideo";
import GoBackButton from "./GoBackButton";
import { createMessage } from "../../message";

function StreamItem(props: { id: Accessor<string> }) {
  const videoPlayer = useVideoPlayer();
  useWsVideo({ id: props.id, videoPlayer });

  const label = () => {
    return appConfig()?.streams?.[props.id()]?.label || props.id();
  };
  return (
    <div class="h-full overflow-hidden relative ">
      <videoPlayer.component />

      <div class="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black to-99% to-transparent">
        {label()}
      </div>
    </div>
  );
}

export default function MultiView() {
  const streamIds: () => string[] = () => (tabId() as any).stream_ids ?? [];

  const numCols = () => {
    const n = streamIds().length;
    return Math.min(4, Math.ceil(Math.sqrt(n)));
  };

  createEffect(() => {
    const b = createMessage({
      type: "viewing", streams: streamIds().reduce((acc: Record<string, { priority: number }>, id) => {
        // 2 is FULL FPS
        acc[id] = { priority: 2 };
        return acc;
      }, {})
    });
    wsClient?.send(b);
  })

  return (
    <div class="h-full flex flex-col">
      <div class="flex-none px-2 py-2 flex items-center space-x-2">
        <GoBackButton />

        <button onClick={() => { }} class="btn-primary">
          <FaSolidExpand class="w-4 h-4" />
          <div class="font-bold text-sm">Fullscreen</div>
        </button>
      </div>

      <div
        class="grid flex-1 border-t border-neutral-800 divide-x divide-y divide-neutral-800"
        style={{
          "grid-template-columns": `repeat(${numCols()}, minmax(0, 1fr))`,
        }}
      >
        <For each={streamIds()}>
          {(id) => (
            <div
              class="cursor-pointer"
              onClick={() => {
                setTabId({ type: "stream", stream_id: id });
              }}
            >
              <StreamItem id={() => id} />
            </div>
          )}
        </For>
      </div>
    </div>
  );
}
