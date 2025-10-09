import {
  BsBellFill,
  BsChevronDown,
  BsChevronRight,
  BsGearFill,
  BsInfoCircleFill,
} from "solid-icons/bs";
import { Accessor, createEffect, createSignal, For, onMount, Show } from "solid-js";
import SearchBar from "./SearchBar";
import useVideoPlayer from "./useVideoPlayer";
import useWsVideo from "./useWsVideo";
import GoBackButton from "./GoBackButton";
import { appConfig, updates, wsClient } from "../utils";
import { createMessage } from "../../message";
import { FaSolidChevronRight } from "solid-icons/fa";

export default function StreamView(props: {
  sidebar: any;
  id: Accessor<string>;
}) {
  const videoPlayer = useVideoPlayer();
  useWsVideo({ id: props.id, videoPlayer });

  const name = () => appConfig()?.streams?.[props.id()]?.label || props.id();

  createEffect(() => {
    const b = createMessage({
      // 2 is FULL FPS
      type: "viewing", streams: {
        [props.id()]: { priority: 2 }
      }
    });
    wsClient?.send(b);
  });

  const relevantUpdates = () => {
    return updates().filter((u) => u.media_id === props.id()).toReversed();
  }

  const [showUpdateBar, setShowUpdateBar] = createSignal(true);

  return (
    <div class="h-screen flex flex-col overflow-hidden">
      <div class="flex items-start flex-1">
        {props.sidebar}

        <div class="flex-1 flex flex-col h-full">
          <div class="flex-none h-12 relative flex items-center px-2 gap-2">
            <GoBackButton />

            <button class="flex items-center space-x-2 text-neutral-400 hover:text-white px-2 h-12">
              <div class="text-xs  font-semibold">{name()}</div>
              {/* <BsChevronDown class="w-4 h-4" /> */}
            </button>

            <div class="flex-1" />
            <SearchBar placeholder={() => "Search Library"} />

            {/* <button class="rounded-full p-2  hover:bg-neutral-800 hover:text-white text-neutral-400">
              <BsGearFill class="w-4 h-4 " />
            </button>

            <button class="rounded-full p-2  hover:bg-neutral-800 hover:text-white text-neutral-400">
              <BsInfoCircleFill class="w-4 h-4 " />
            </button> */}


            <Show when={!showUpdateBar()} >
              <button
                onClick={() => setShowUpdateBar(true)}
                class="rounded-full p-2  hover:bg-neutral-800 hover:text-white text-neutral-400">
                <BsBellFill class="w-4 h-4 " />
              </button>
            </Show>
          </div>
          <videoPlayer.component />
        </div>

        <Show when={showUpdateBar()}>
          <div class="flex flex-col w-sm overflow-hidden h-screen bg-neutral-900">
            <div class="flex-none h-12 flex items-center border-b border-neutral-800 space-x-2 px-4">
              <BsBellFill class="w-4 h-4 text-neutral-400" />
              <div class="font-semibold text-sm">Updates</div>
              <div class="flex-1" />
              <button
                onClick={() => setShowUpdateBar(false)}
                class="bg-neutral-900 rounded-full p-2 hover:bg-neutral-800 text-neutral-400">
                <FaSolidChevronRight class="w-4 h-4 text-neutral-400" />
              </button>
            </div>
            <Show when={relevantUpdates().length === 0} fallback={
              <div class="flex-1 overflow-y-auto">
                <For each={relevantUpdates()}>{(update) =>
                  <div class="p-4 border-b border-neutral-800 space-y-2 card">
                    <div class="text-xs text-neutral-400">{new Date(update.at_time).toLocaleString()}</div>
                    <div class="text-sm">{update.description}</div>
                  </div>
                }</For>
              </div>
            }>
              <div class="flex-1 flex items-center justify-center text-neutral-400">AI is indexing this stream, waiting for updates.</div>
            </Show>
          </div>
        </Show>
      </div >
    </div >
  );
}
