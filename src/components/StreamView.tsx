import {
  BsBellFill,
  BsChevronDown,
  BsGearFill,
  BsInfoCircleFill,
} from "solid-icons/bs";
import { Accessor } from "solid-js";
import { EventBar } from "./EventBar";
import SearchBar from "./SearchBar";
import useVideoPlayer from "./useVideoPlayer";
import useWsVideo from "./useWsVideo";
import GoBackButton from "./GoBackButton";

export default function StreamView(props: {
  sidebar: any;
  id: Accessor<string>;
}) {
  const videoPlayer = useVideoPlayer();
  useWsVideo({ id: props.id, videoPlayer });

  return (
    <div class="h-screen flex flex-col">
      <div class="flex items-start flex-1">
        {props.sidebar}

        <div class="flex-1 flex flex-col h-full">
          <div class="flex-none h-12 relative flex items-center px-2 gap-2">
            <GoBackButton />

            <button class="flex items-center space-x-2 text-neutral-400 hover:text-white px-2 h-12">
              <div class="text-xs  font-semibold">SSA MARINE MIT SW Cam</div>
              <BsChevronDown class="w-4 h-4" />
            </button>

            <div class="flex-1" />
            <SearchBar />

            <button class="rounded-full p-2  hover:bg-neutral-800 hover:text-white text-neutral-400">
              <BsBellFill class="w-4 h-4 " />
            </button>

            <button class="rounded-full p-2  hover:bg-neutral-800 hover:text-white text-neutral-400">
              <BsGearFill class="w-4 h-4 " />
            </button>

            <button class="rounded-full p-2  hover:bg-neutral-800 hover:text-white text-neutral-400">
              <BsInfoCircleFill class="w-4 h-4 " />
            </button>
          </div>
          <videoPlayer.component />
        </div>
      </div>
      {/* <EventBar /> */}
    </div>
  );
}
