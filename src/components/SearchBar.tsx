import {
  createEffect,
  createSignal,
  Show
} from "solid-js";
import Backdrop from "./search/Backdrop";
import DetailedItemView from "./search/DetailedItemView";
import SearchDropdown from "./search/SearchDropdown";
import SearchInput from "./search/SearchInput";
import { usePlaceholder } from "./search/usePlaceholder";
import { setState } from "./search/utils";



export default function SearchBar(props?: { variant?: "md" | "lg" }) {


  const variant = () => props?.variant || "md";
  const { placeholder } = usePlaceholder({
    no_animation: variant() === "md",
  });
  const [isOpen, setIsOpen] = createSignal(false);
  const [barRef, setBarRef] = createSignal<HTMLDivElement>();


  const [query, setQuery] = createSignal("");

  let searchTimeout: any = null;
  // REFACTORED: Use fetch for search instead of WebSocket
  createEffect(() => {
    const q = query().trim();
    if (searchTimeout) clearTimeout(searchTimeout);

    if (q === "") {
      setState({ type: "idle", result: { items: [] } });
      return;
    }

    setState({ type: "autocompleting", query: q });

    searchTimeout = setTimeout(async () => {
      try {
        // setRecentSearches((old) => {
        //   const newSearches = [q, ...old.filter((s) => s !== q)];
        //   return newSearches.slice(0, 5);
        // });

        const response = await fetch(`/api/v1/autocomplete`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: q }),
        });
        if (!response.ok) {
          setState({ type: "idle", query: q, autocomplete: { items: [] } }); // Show empty result on error
          throw new Error("Search request failed");
        }
        const data = await response.json();
        console.log("Suggestion results:", data);

        setState({
          type: "idle",
          query: q,
          autocomplete: { items: data.items || [] },
        });
      } catch (error) {
        console.error("Failed to fetch search results:", error);
        setState({ type: "idle", query: q, autocomplete: { items: [] } }); // Show empty result on error
      }
    }, 500);
  });

  createEffect(() => {
    const open = isOpen();
    if (!open) {
      setState({ type: "idle" });
    }
  });

  function doSubmit(query: string) {
    setIsOpen(false);
    console.log('query', query)
  }

  return (
    <div>
      <Backdrop isOpen={isOpen} barRef={barRef} setIsOpen={setIsOpen} />
      {/* <DetailedItemView item={selectedItem} setItem={setSelectedItem} /> */}

      <div
        ref={setBarRef}
        data-variant={variant()}
        data-open={isOpen()}
        class="z-[200] absolute top-1 left-1/2 -translate-x-1/2 w-[24rem] data-[variant=lg]:w-[40vw] data-[open=true]:top-10 transition-[top,width,box-shadow] duration-300 ease-in-out data-[open=true]:w-[50vw] data-[variant=lg]:data-[open=true]:w-[50vw] data-[open=true]:drop-shadow-lg  data-[open=true]:border border-neutral-800  data-[open=false]:rounded-full  data-[open=true]:rounded-2xl overflow-hidden bg-neutral-900 data-[open=true]:bg-neutral-900 "
      >
        <SearchInput
          onSubmit={doSubmit}
          query={query}
          setQuery={setQuery}
          isOpen={isOpen}
          variant={variant}
          placeholder={placeholder}
        />

        <Show when={isOpen()}>

          <SearchDropdown query={query} selectItem={(item) => {
            doSubmit(item.text);
          }} />

        </Show>
      </div>
    </div>
  );
}
