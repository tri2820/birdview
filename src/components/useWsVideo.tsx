import { Accessor, createEffect, onMount, untrack } from "solid-js";
import { WsHeader } from "../../types";
import { globalState, latestWsMessage, setGlobalState } from "../utils";
import useVideoPlayer from "./useVideoPlayer";

export default function useWsVideo(props: {
  id: Accessor<string>;
  videoPlayer: ReturnType<typeof useVideoPlayer>;
}) {
  createEffect(() => {
    const msg = latestWsMessage();
    if (!msg) return;

    const sid = untrack(props.id);

    if (msg.header.type === "frame") {
      if (msg.header.stream_id !== sid) return;
      props.videoPlayer.setEmpty(false);
      props.videoPlayer.setImageBuffer(msg.imageBuffer);
    }
  });

  const codecpar = () => globalState.streams[props.id()]?.codecpar;
  createEffect(() => {
    const c = codecpar();
    if (!c) return;
    props.videoPlayer.setCodecpar(c);
  });

  createEffect(() => {
    const sid = props.id();
    props.videoPlayer.setEmpty(true);
  })

  onMount(() => {
    const codecpar = untrack(() => {
      const sid = props.id();
      return globalState.streams[sid]?.codecpar;
    });
    if (!codecpar) return;
    props.videoPlayer.setCodecpar(codecpar);
  });
}
