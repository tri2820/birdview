import {
  createEffect,
  createSignal,
  onCleanup,
  onMount,
  Show,
  untrack
} from "solid-js";
import {
  setRecentSearches
} from "../utils";
import Backdrop from "./search/Backdrop";
import DetailedItemView from "./search/DetailedItemView";
import NoResultFound from "./search/NoResultFound";
import SearchDropdown from "./search/SearchDropdown";
import SearchInput from "./search/SearchInput";
import { usePlaceholder } from "./search/usePlaceholder";



export default function SearchBar(props?: { variant?: "md" | "lg" }) {
  const [selectedItem, setSelectedItem] = createSignal<any>();


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
        const response = await fetch(`/api/v1/search`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query: q }),
        });
        if (!response.ok) {
          setState({ type: "result", query: q, result: { items: [] } }); // Show empty result on error
          throw new Error("Search request failed");
        }
        const data = await response.json();
        console.log("Search results:", data);

        setRecentSearches((old) => {
          const newSearches = [q, ...old.filter((s) => s !== q)];
          return newSearches.slice(0, 5);
        });

        setState({
          type: "result",
          query: q,
          result: { items: data.items || [] },
        });
      } catch (error) {
        console.error("Failed to fetch search results:", error);
        setState({ type: "result", query: q, result: { items: [] } }); // Show empty result on error
      }
    }, 500);
  });

  createEffect(() => {
    const open = isOpen();
    if (!open) {
      setState({ type: "idle" });
    }
  });

  const uiState = () => {
    if (state().type === "idle") return 'no-result'
    if (state().type === "result" && (state().result?.items.length ?? 0) == 0) return 'no-result'
    return "has-result";
  }



  return (
    <div>
      <Backdrop isOpen={isOpen} barRef={barRef} setIsOpen={setIsOpen} />
      <DetailedItemView item={selectedItem} setItem={setSelectedItem} />

      <div
        ref={setBarRef}
        data-variant={variant()}
        data-open={isOpen()}
        class="z-[200] absolute top-1 left-1/2 -translate-x-1/2 w-[24rem] data-[variant=lg]:w-[40vw] data-[open=true]:top-10 transition-[top,width,box-shadow] duration-300 ease-in-out data-[open=true]:w-[50vw] data-[variant=lg]:data-[open=true]:w-[50vw] data-[open=true]:drop-shadow-lg  data-[open=true]:border border-neutral-800  data-[open=false]:rounded-full  data-[open=true]:rounded-2xl overflow-hidden bg-neutral-900 data-[open=true]:bg-neutral-900 "
      >
        <SearchInput
          query={query}
          setQuery={setQuery}
          isOpen={isOpen}
          variant={variant}
          placeholder={placeholder}
        />

        <Show when={isOpen()}>
          <div
            data-empty={uiState() === 'no-result'}
            class="h-[50vh] data-empty:h-80 w-full border-t border-neutral-800 flex flex-col"
          >
            <Show
              when={uiState() === 'no-result'}
              fallback={
                <SearchDropdown state={state} query={query} selectItem={setSelectedItem} />
              }
            >
              <NoResultFound />
            </Show>
          </div>
        </Show>
      </div>
    </div>
  );
}
