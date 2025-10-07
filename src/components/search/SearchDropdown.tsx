import { For, Show } from "solid-js";
import ItemRow from "./ItemRow";
import LoadingSkeleton from "./LoadingSkeleton";
export default function SearchDropdown(props: {
  state: () => {
    type: "idle" | "searching" | "result";
    query?: string;
    result?: {
      items: any[];
    };
  };
  query: () => string;
  selectItem: (item: any) => void;
}) {
  return (
    <Show
      when={props.state().type == "searching"}
      fallback={
        <div class="flex-1 h-full flex flex-col">
          <div class="overflow-x-hidden overflow-y-auto flex-1">
            <For each={props.state().result?.items}>
              {(item) => <ItemRow item={item} selectItem={props.selectItem} />}
            </For>
          </div>
        </div>
      }
    >
      <LoadingSkeleton />
    </Show>
  );
}
