import { Show } from "solid-js";
import { appConfig } from "../../utils";
import { format } from "date-fns";

export default function DetailedItemView(props: { item: () => any, setItem: (item: any) => void }) {
    return <Show when={props.item()}>
        {(item) => {
            const name = () =>
                appConfig()?.streams[item().media_id]?.label || item().media_id;

            const imgUrl = () => `/api/v1/storage?id=${encodeURIComponent(item().id)}&raw=1`;

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
                            onClick={() => props.setItem(null)}
                        >
                            Close
                        </button>
                    </div>
                </div>
            );
        }}
    </Show>

}