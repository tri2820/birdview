import { BsSearch } from "solid-icons/bs";
import { FaSolidCloud } from "solid-icons/fa";
import { VsSearch } from "solid-icons/vs";
import { createMessage, parseMessage } from "../../message";
import {
  createEffect,
  createSignal,
  For,
  onCleanup,
  onMount,
  Show,
  untrack,
} from "solid-js";
import { socket } from "../utils";

function NoResultIcon() {
  return (
    <div class=" flex items-center -space-x-4">
      <FaSolidCloud class="w-14 h-14 text-neutral-700" />
      <BsSearch class="w-7 h-7 text-white translate-y-1" />
    </div>
  );
}

const PLACEHOLDERS = [
  "current occupancy of the loading dock",
  "potential equipment failures in the warehouse",
  "back door access last night",
  "a car parking in spot 42",
  "total number of guests today",
  "unattended packages",
  "delivery truck arriving",
];

export function usePlaceholder(props: { no_animation: boolean }) {
  const [placeholder, setPlaceholder] = createSignal("Search");

  const longestCommonPrefix = (a: string, b: string) => {
    let i = 0;
    while (i < a.length && i < b.length && a[i] === b[i]) {
      i++;
    }
    return i;
  };

  onMount(async () => {
    if (props.no_animation) return;
    let index = 0;
    while (true) {
      let current = untrack(placeholder);

      const lcpLength = longestCommonPrefix(current, PLACEHOLDERS[index]);
      while (current.length > lcpLength) {
        setPlaceholder(current.slice(0, -1));
        current = untrack(placeholder);
        await new Promise((r) => setTimeout(r, 30));
      }

      while (current.length < PLACEHOLDERS[index].length) {
        setPlaceholder(PLACEHOLDERS[index].slice(0, current.length + 1));
        current = untrack(placeholder);
        await new Promise((r) => setTimeout(r, 50));
      }

      await new Promise((r) => setTimeout(r, 2000));

      index = (index + 1) % PLACEHOLDERS.length;
    }
  });

  return {
    placeholder,
  };
}

export default function SearchBar(props?: { variant?: "md" | "lg" }) {
  const variant = () => props?.variant || "md";
  const { placeholder } = usePlaceholder({
    no_animation: variant() === "md",
  });
  const [isOpen, setIsOpen] = createSignal(false);
  const [barRef, setBarRef] = createSignal<HTMLDivElement>();
  const [state, setState] = createSignal<{
    type: "idle" | "searching" | "result";
    query?: string;
    result?: {
      items: any[];
    };
  }>({ type: "result" });

  const [query, setQuery] = createSignal("");

  let searchTimeout: any = null;

  createEffect(() => {
    const q = query().trim();
    if (searchTimeout) clearTimeout(searchTimeout);
    if (q === "") {
      setState({ type: "result", result: { items: [] } });
      return;
    }
    setState({ type: "searching", query: q });
    searchTimeout = setTimeout(() => {
      const msg = createMessage({ type: "search", query: q });
      console.log("Sending search message", msg);
      socket?.send(msg);
    }, 500);
  });

  onMount(() => {
    const listener = (e: MouseEvent) => {
      const bar = untrack(barRef);
      if (!bar) return;
      const isInside = bar === e.target || bar.contains(e.target as any);
      setIsOpen(isInside);
    };
    onCleanup(() => {
      document.removeEventListener("click", listener);
    });

    document.addEventListener("click", listener);
  });

  const isEmptyResult = () =>
    state().type === "result" && (state().result?.items.length ?? 0) == 0;

  return (
    <div>
      <Show when={isOpen()}>
        <div class="fixed h-[100vh] w-[100vw] top-0 left-0  z-[100]" />
      </Show>
      <div
        ref={setBarRef}
        data-variant={variant()}
        data-open={isOpen()}
        class="z-[200] absolute top-1 left-1/2 -translate-x-1/2 w-[24rem] data-[variant=lg]:w-[40vw] data-[open=true]:top-10 transition-[top,width,box-shadow] duration-300 ease-in-out data-[open=true]:w-[50vw] data-[variant=lg]:data-[open=true]:w-[50vw] data-[open=true]:drop-shadow-lg  data-[open=true]:border border-neutral-800  data-[open=false]:rounded-full  data-[open=true]:rounded-2xl overflow-hidden bg-neutral-900 data-[open=true]:bg-neutral-900 "
      >
        <div
          data-variant={variant()}
          data-open={isOpen()}
          class="relative  h-10 data-[variant=lg]:h-16 data-[open=true]:text-xl data-[open=true]:h-12 data-[open=true]:data-[variant=lg]:h-20   group "
        >
          <div
            data-open={isOpen()}
            class="absolute top-1/2 -translate-y-1/2 left-0 h-full flex items-center pl-4 data-[open=true]:pl-4 "
          >
            <BsSearch
              data-open={isOpen()}
              class="w-5 h-5 data-[open=true]:w-6 data-[open=true]:h-6 text-neutral-400 group-hover:text-white  transition-all duration-100 "
            />
          </div>

          <div
            data-open={isOpen()}
            class="h-full flex items-center justify-center data-[open=true]:justify-end"
          >
            <input
              value={query()}
              onInput={(e) => {
                setQuery(e.currentTarget.value);
              }}
              data-open={isOpen()}
              data-variant={variant()}
              class="w-[calc(100%-3rem)] 
              data-[variant=lg]:text-xl
              h-full  placeholder:text-neutral-400  transition-all duration-100  px-2 focus:outline-none text-center data-[open=true]:text-left min-w-0"
              placeholder={isOpen() ? "" : placeholder()}
            />
          </div>
        </div>

        <Show when={isOpen()}>
          <div
            data-empty={isEmptyResult()}
            class="h-[50vh] data-empty:h-80 w-full border-t border-neutral-800"
          >
            <Show
              when={isEmptyResult()}
              fallback={
                <div>
                  <For each={state().result?.items}>
                    {(item) => <div>{JSON.stringify(item)}</div>}
                  </For>
                </div>
              }
            >
              <div class="flex items-center h-full justify-center">
                <div class="flex flex-col items-center ">
                  <NoResultIcon />
                  <div class="font-medium mt-2">No results found</div>
                  <div class="text-center text-neutral-500 mt-1">
                    We couldn't find any results.
                    <br />
                    Try adjusting your search or use different keywords.
                  </div>
                  <button class="mt-6 border border-neutral-800 rounded-lg hover:bg-neutral-800 transition-all duration-100 px-4 py-2 drop-shadow-2xl bg-neutral-900">
                    Clear search
                  </button>
                </div>
              </div>
            </Show>
          </div>
        </Show>
      </div>
    </div>
  );
}
