import { For, Show } from "solid-js";
import LoadingSkeleton from "./LoadingSkeleton";

import { state } from "./utils";
import AutocompleteRow from "./AutocompleteRow";
export default function SearchDropdown(props: {
  query: () => string;
  selectItem: (item: any) => void;
}) {

  const autocompleteItems = () => state().autocomplete?.items || [];
  return (
    <Show
      when={state().type == "autocompleting"}
      fallback={
        <Show when={autocompleteItems().length > 0} >
          <div class="flex-1 h-full flex flex-col">
            <div class="overflow-x-hidden overflow-y-auto flex-1">
              <For each={autocompleteItems()}>
                {(item) => <AutocompleteRow item={item} selectItem={props.selectItem} />}
              </For>
            </div>
          </div></Show>
      }
    >
      <LoadingSkeleton />
    </Show>
  );
}
