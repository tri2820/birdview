import { BiSolidCctv } from "solid-icons/bi";
import { MediaUnit } from "../../../types";
import { appConfig } from "../../utils";
import { format } from "date-fns";
import { Show } from "solid-js";

export default function ItemRow(props: {
    item: MediaUnit & { _distance: number };
    selectItem: (item: MediaUnit & { _distance: number }) => void;
}) {

    const name = () =>
        appConfig()?.streams[props.item.media_id]?.label ?? props.item.media_id;

    const imgUrl = () =>
        `/api/v1/storage?id=${encodeURIComponent(props.item.id)}&raw=1`;

    const desc = () => {
        const removePrefixes = [
            "This image depicts",
            "The image depicts",
            "The image shows",
            "This image shows",
            "The image captures",
            "This image captures",
        ];
        let d = props.item.description?.trim();
        if (!d || d.length === 0) return;
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

    const score = () => 1 - props.item._distance / 2 + 0.5;

    return (
        <div
            class="p-4 hover:bg-neutral-800 cursor-pointer flex items-start space-x-4 rounded-lg group text-neutral-400 hover:text-white"
            onClick={() => {
                // setIsOpen(false);
                props.selectItem(props.item);
            }}
        >
            <div class="flex-1">
                <div class="flex items-center space-x-2 py-2 ">
                    <BiSolidCctv class="w-4 h-4 " />
                    <div>{name()}</div>
                    <div>•</div>
                    <div class="text-sm">
                        {format(
                            props.item.at_time,
                            "eeee, MMMM do, yyyy 'at' h:mm a"
                        )}
                    </div>
                </div>

                <div class="text-xs line-clamp-2">{desc()}</div>

                <div class="pt-4 flex items-center">
                    <div class="text-xs text-[#a3eeef] border border-[#4c6f73] rounded-full bg-[#28393e] px-2 py-1">
                        {/* Rounded to 2 decimal places */}
                        relevant: {score().toFixed(2)}
                    </div>
                </div>
            </div>

            <div class="flex-none h-full">
                <div class="h-24 w-32 object-cover rounded-lg bg-neutral-800 overflow-hidden">
                    <Show when={imgUrl()}>
                        {(u) => (
                            <img src={u()} class="w-full h-full object-cover" />
                        )}
                    </Show>
                </div>
            </div>
        </div>
    );

}