import { format, set } from "date-fns";
import { BiSolidCctv } from "solid-icons/bi";
import { BsSearch } from "solid-icons/bs";
import { FaRegularCircleQuestion, FaSolidCloud, FaSolidRobot, FaSolidSpinner } from "solid-icons/fa";
import { HiSolidSparkles } from "solid-icons/hi";
import {
  createEffect,
  createSignal,
  For,
  onCleanup,
  onMount,
  Show,
  untrack,
} from "solid-js";
import {
  config,
  setRecentSearches
} from "../utils";

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
  const [showPopup, setShowPopup] = createSignal<any>();
  const [answerState, setAnswerState] = createSignal<{
    type: "idle" | "loading" | "answer";
    answer?: string;
    sources?: any[];
  }>({
    type: "idle",
  });

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
  }>({
    type: "idle",
  });

  const [query, setQuery] = createSignal("");

  let searchTimeout: any = null;
  // REFACTORED: Use fetch for search instead of WebSocket
  createEffect(() => {
    const q = query().trim();
    if (searchTimeout) clearTimeout(searchTimeout);

    if (q === "") {
      setState({ type: "result", result: { items: [] } });
      return;
    }

    setState({ type: "searching", query: q });

    searchTimeout = setTimeout(async () => {
      try {
        const response = await fetch(`/api/v1/search?q=${encodeURIComponent(q)}`);
        if (!response.ok) {
          setState({ type: "result", query: q, result: { items: [] } }); // Show empty result on error
          throw new Error("Search request failed");
        }
        const data = await response.json();

        setRecentSearches((old) => {
          const newSearches = [q, ...old.filter((s) => s !== q)];
          return newSearches.slice(0, 5);
        });

        setState({
          type: "result",
          query: q,
          result: data,
        });
      } catch (error) {
        console.error("Failed to fetch search results:", error);
        setState({ type: "result", query: q, result: { items: [] } }); // Show empty result on error
      }
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

  createEffect(() => {
    const open = isOpen();
    if (!open) {
      setState({ type: "idle" });
      setAnswerState({ type: "idle" });
    }
  });

  const showNotFound = () => state().type === "idle" || (state().type === "result" && (state().result?.items.length ?? 0) == 0)

  return (
    <div>
      <Show when={isOpen()}>
        <div class="fixed h-[100vh] w-[100vw] top-0 left-0 bg-black/80 z-[100]" />
      </Show>

      <Show when={showPopup()}>
        {(item) => {
          const name = () =>
            config()?.streams[item().media_id]?.label || item().media_id;

          // SIMPLIFIED: Image URL is now a direct link to the REST endpoint
          const imgUrl = () => `/api/v1/image?path=${encodeURIComponent(item().path)}`;

          return (
            <div class="fixed h-[100vh] w-[100vw] top-0 left-0  z-[500]">
              <div class="absolute top-0 left-0 w-full h-full bg-black p-4">
                <img src={imgUrl()!} class="h-[70vh] aspect-video" />
                <div class="text-2xl font-bold mt-4">{name()}</div>
                <div class="text-sm text-neutral-400">
                  {format(item().at_time, "eeee, MMMM do, yyyy 'at' h:mm a")}
                </div>
                <div class="mt-4">{item().description}</div>
                <button
                  class="absolute top-4 right-4 text-white text-3xl"
                  onClick={() => setShowPopup(null)}
                >
                  Close
                </button>
              </div>
            </div>
          );
        }}
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
            data-empty={showNotFound()}
            class="h-[50vh] data-empty:h-80 w-full border-t border-neutral-800 flex flex-col"
          >
            <Show
              when={showNotFound()}
              fallback={
                <Show when={state().type == "searching"} fallback={

                  <div class="flex-1 h-full flex flex-col">
                    <div class="flex-none px-4 border-b border-neutral-800 py-2">
                      <button
                        onClick={async () => {
                          setAnswerState({ type: "loading" });
                          try {
                            const resp = await fetch(`/api/v1/summarize?q=${encodeURIComponent(query().trim())}`);
                            const data = await resp.json();
                            setAnswerState({ type: "answer", answer: data.answer, sources: data.sources });
                          } catch (e) {
                            setAnswerState({ type: "idle" });
                          }
                        }}
                        class="btn-secondary"
                      >
                        <Show when={answerState().type === 'loading'} fallback={<HiSolidSparkles class="w-4 h-4" />}>
                          <div class="animate-spin">
                            <FaSolidSpinner class="w-4 h-4" />
                          </div>
                        </Show>
                        <div class="font-bold text-sm">Summarize</div>
                      </button>
                    </div>

                    <Show when={answerState().type === 'idle'} fallback={
                      <Show when={answerState().type === 'answer'} fallback={
                        <div class="w-full p-4">
                          <div class="flex animate-pulse space-x-4">
                            <div class="flex-1 space-y-6 py-1">
                              <div class="h-4 rounded bg-neutral-800"></div>
                              <div class="space-y-3">
                                <div class="grid grid-cols-3 gap-4">
                                  <div class="col-span-2 h-4 rounded bg-neutral-800"></div>
                                  <div class="col-span-1 h-4 rounded bg-neutral-800"></div>
                                </div>
                                <div class="h-4 rounded bg-neutral-800"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      }>
                        <div class="p-4 space-y-4">
                          <div class="flex items-center space-x-2 text-neutral-400">
                            <FaSolidRobot class="w-6 h-6 " />
                            <div class="font-bold">AI Summary</div>
                          </div>
                          <div>{answerState().answer}</div>

                          <div class="text-sm text-neutral-400 flex items-center space-x-2">
                            <div>Answer from {answerState().sources?.length} sources</div>
                            <FaRegularCircleQuestion class="w-4 h-4" />
                          </div>
                        </div>
                      </Show>

                    }>
                      <div class="overflow-x-hidden overflow-y-auto flex-1">
                        <For each={state().result?.items}>
                          {(item) => {
                            const name = () =>
                              config()?.streams[item.media_id]?.label ??
                              item.media_id;


                            const imgUrl = () => `/api/v1/image?path=${encodeURIComponent(item.path)}`;


                            const desc = () => {
                              const removePrefixes = [
                                "This image depicts",
                                "The image depicts",
                                "The image shows",
                                "This image shows",
                                "The image captures",
                                "This image captures",
                              ];

                              let d = item.description.trim();
                              for (const prefix of removePrefixes) {
                                if (d.startsWith(prefix)) {
                                  d = d.slice(prefix.length).trim();
                                  // capitalize first letter
                                  if (d.length > 0) {
                                    d = d.charAt(0).toUpperCase() + d.slice(1);
                                  }
                                }
                              }

                              return d;
                            };

                            return (
                              <div
                                class="p-4 hover:bg-neutral-800 cursor-pointer flex items-start space-x-4"
                                onClick={() => {
                                  // setIsOpen(false);
                                  setShowPopup(item);
                                }}
                              >
                                <div class="flex-1">
                                  <div class="flex items-center space-x-2 py-2">
                                    <BiSolidCctv class="w-4 h-4 text-neutral-400" />
                                    <div>{name()}</div>
                                    <div>•</div>
                                    <div class="text-sm">
                                      {format(
                                        item.at_time,
                                        "eeee, MMMM do, yyyy 'at' h:mm a"
                                      )}
                                    </div>
                                  </div>

                                  <div class="text-xs line-clamp-2">{desc()}</div>

                                  <div class="pt-4 flex items-center">
                                    <div class="text-xs text-[#a3eeef] border border-[#4c6f73] rounded-full bg-[#28393e] px-2 py-1">
                                      {/* Rounded to 2 decimal places */}
                                      relevant: {item.score.toFixed(2)}
                                    </div>
                                  </div>
                                </div>

                                <div class="flex-none h-full">
                                  <div class="h-24 w-32 object-cover rounded-lg bg-neutral-800 overflow-hidden">
                                    <Show when={imgUrl()}>
                                      {(u) => (
                                        <img
                                          src={u()}
                                          class="w-full h-full object-cover"
                                        />
                                      )}
                                    </Show>
                                  </div>
                                </div>
                              </div>
                            );
                          }}
                        </For>
                      </div>
                    </Show>
                  </div>
                }>
                  <div class="flex items-center h-full justify-center">
                    <FaSolidSpinner class="w-10 h-10 text-neutral-500 animate-spin" />
                  </div>
                </Show>
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
