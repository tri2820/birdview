import { IconTypes } from "solid-icons";
import {
  FaSolidChevronDown,
  FaSolidDisplay,
  FaSolidExpand,
  FaSolidPlus,
} from "solid-icons/fa";
import {
  FiActivity,
  FiBarChart,
  FiFilm,
  FiGrid,
  FiLayout,
  FiMessageCircle,
} from "solid-icons/fi";
import { createSignal, For, onMount, Show } from "solid-js";
import { appConfig, setTabId, tabId, TabId } from "../utils";
import { BsGearFill } from "solid-icons/bs";


function SideBarViewItem(props: { view: any }) {
  // TODO: persist open state
  const [isOpen, setIsOpen] = createSignal(true);

  return (
    <div class="mx-2 ">
      <div
        onClick={() => setIsOpen((o) => !o)}
        class="cursor-pointer flex items-center px-1  rounded-lg  py-2 hover:text-white hover:bg-neutral-800  text-neutral-500 group"
      >
        <div class="ml-2 mr-2">
          <FaSolidChevronDown
            data-open={isOpen()}
            class="w-4 h-4 data-[open=true]:rotate-180 transition-transform"
          />
        </div>

        <div class="font-semibold ml-1">{props.view.label}</div>
        <div class="flex-1" />

        <button
          onClick={(e) => {
            e.stopPropagation();
            setTabId({ type: "multiview", stream_ids: props.view.streams });
          }}
          class="p-1 rounded hover:text-white hover:bg-neutral-700  text-neutral-600 group-hover:opacity-100 opacity-0 transition-all"
        >
          <FaSolidDisplay class="w-4 h-4" />
        </button>
      </div>
      <div
        data-open={isOpen()}
        class=" mt-1 pl-0.5 ml-5 data-[open=false]:max-h-0 overflow-hidden transition-all duration-200 max-h-[1000px]"
      >
        <For each={props.view.streams}>
          {(stream_id) => {
            const label = appConfig()?.streams?.[stream_id].label || stream_id;
            return (
              <div
                data-active={stream_id === (tabId() as any).stream_id}
                onClick={() => {
                  setTabId({
                    type: "stream",
                    stream_id,
                  });
                }}
                class="cursor-pointer px-3 py-2 mx-2 space-x-3  rounded-lg hover:bg-neutral-800 flex items-center text-neutral-400 hover:text-white data-[active=true]:bg-neutral-800 data-[active=true]:text-white"
              >
                <div class="text-sm line-clamp-1 break-all">{label}</div>
              </div>
            );
          }}
        </For>
      </div>
    </div>
  );
}

export default function SideBar() {
  const views = () => {
    const cf = appConfig();
    return cf?.views || [];
  };

  const items: Partial<
    Record<TabId["type"], { label: string; icon: IconTypes }>
  > = {
    home: {
      label: "Home",
      icon: FiGrid,
    },
    // statistics: {
    //   label: "Stats",
    //   icon: FiBarChart,
    // },
    // moments: {
    //   label: "Moments",
    //   icon: FiFilm,
    // },
    // events: {
    //   label: "Events",
    //   icon: FiActivity,
    // },
  };

  return (
    <div class="w-60 flex-none h-full bg-neutral-900 space-y-4 flex flex-col select-none">
      <div class="mx-4 mt-4 flex items-center space-x-3">
        <img src="/logo.svg" class="w-10 h-10" />
        <div class="flex-1 font-montserrat font-bold text-white text-xl">
          Zapdos Labs
        </div>
      </div>

      <div class="space-y-2 mt-6">
        <div class="mx-4 text-xs font-semibold text-neutral-400">DASHBOARD</div>
        <div>
          <For each={Object.entries(items)}>
            {([key, item]) => {
              const Icon = item.icon;
              return (
                <div
                  data-active={key === tabId().type}
                  onClick={() => {
                    setTabId({ type: key } as any);
                  }}
                  class="cursor-pointer px-3 py-2 mx-2 space-x-3  rounded-lg hover:bg-neutral-800 flex items-center text-neutral-300 hover:text-white data-[active=true]:bg-neutral-800 data-[active=true]:text-white"
                >
                  <Icon class="w-4 h-4" />
                  <div>{item.label}</div>
                </div>
              );
            }}
          </For>
        </div>
      </div>

      <div class="space-y-2 mt-6">
        <div class="flex items-center mx-4 space-x-1">
          <div class="text-xs font-semibold text-neutral-400">VIEWS</div>

          {/* <button class="p-1 rounded hover:text-white hover:bg-neutral-800 mr-2 text-neutral-500">
            <FaSolidPlus class="w-4 h-4" />
          </button> */}
        </div>
        <div class="space-y-1">
          <For each={views()}>{(view) => <SideBarViewItem view={view} />}</For>
        </div>
      </div>

      <div class="flex-1" />

      <div class="flex-none ">
        <button
          onClick={() => setTabId({ type: "settings" })}
          class="w-full flex items-center space-x-2 px-4 py-3 hover:bg-neutral-800 text-neutral-400 hover:text-white">
          <BsGearFill class="w-5 h-5" />
          <div class="font-semibold">Settings</div>
        </button>
      </div>
    </div>
  );
}
