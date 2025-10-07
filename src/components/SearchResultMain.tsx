import { createEffect, createSignal, For, Show } from "solid-js"
import { goBackTabId, setRecentSearches, tabId } from "../utils"
import SearchBar from "./SearchBar";
import GoBackButton from "./GoBackButton";
import { FaSolidArrowLeft } from "solid-icons/fa";
import { MediaUnit } from "../../types";
import LoadingSkeleton from "./search/LoadingSkeleton";
import ItemRow from "./search/ItemRow";

export default function SearchResultMain() {
    const [searchState, setSearchState] = createSignal<{
        type: "idle"
    } | {
        type: "searching"
        query: string,
    } | {
        type: "error",
    } | {
        type: "result",
        query: string,
        results: (MediaUnit & { _distance: number })[],
    }>({
        type: "idle",
    });

    const q = () => {
        const t = tabId();
        if (t.type === "search-result") {
            return t.query;
        }
        return null;
    }
    createEffect(async () => {
        const query = q();
        if (!query) return;

        setRecentSearches((old) => {
            const newSearches = [query, ...old.filter((s) => s !== query)];
            return newSearches.slice(0, 5);
        });

        setSearchState({ type: "searching", query });
        try {
            const response = await fetch(`/api/v1/search`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ query }),
            });
            if (!response.ok) throw new Error("Search request failed");
            const data = await response.json();
            console.log("Suggestion results:", data);

            setSearchState({
                type: "result",
                query,
                results: data.items || [],
            });
        } catch (error) {
            console.error("Failed to fetch search results:", error);
            setSearchState({ type: "error" }); // Show empty result on error
        }

    })

    const resultState = () => {
        const s = searchState();
        if (s.type === "result") {
            return s
        }
        return null;
    }

    return <div class="h-screen flex flex-col border-l border-neutral-800 bg-neutral-900 overflow-hidden ">
        <div class="overflow-auto h-full flex flex-col">
            <div class="px-4 py-8 mx-auto w-[42vw] flex flex-col ">
                <div class="flex items-center space-x-4 mb-4 flex-none">
                    <button
                        onClick={() => {
                            goBackTabId();
                        }}
                        class="btn-tertiary"
                    >
                        <FaSolidArrowLeft class="w-4 h-4" />
                        <div class="font-bold text-sm">Back</div>
                    </button>
                </div>

                <div class="relative h-20 flex-none">
                    <SearchBar variant="lg" placeholder={q} scheme="lighter" />
                </div>

                <div class="text-neutral-400 flex-1 ">
                    <Show when={searchState().type === "searching"}>
                        <LoadingSkeleton />
                    </Show>

                    <Show when={searchState().type === "error"}>
                        <div class="text-red-500">Error occurred while searching. Please try again.</div>
                    </Show>

                    <Show when={resultState()} >
                        {s => <Show when={s().results.length === 0} fallback={
                            <div >
                                <For each={s().results}>
                                    {r => <ItemRow item={r} selectItem={() => {
                                        console.log("Select item", r);
                                    }} />}
                                </For>

                            </div>
                        }>
                            <div>No results found for "{s().query}".</div>
                        </Show>}
                    </Show>


                </div>
            </div>
        </div>
    </div>
}