import { Accessor, createEffect, onMount, untrack } from "solid-js";
import { WsHeader } from "../../types";
import { globalState, latestWsMessage, setGlobalState } from "../utils";
import useVideoPlayer from "./useVideoPlayer";

export default function useWsVideo(props: {
  id: Accessor<string>;
  videoPlayer: ReturnType<typeof useVideoPlayer>;
}) {
  function onMessage({
    header,
    imageBuffer,
  }: {
    header: WsHeader;
    imageBuffer?: ArrayBuffer;
  }) {
    const sid = untrack(props.id);

    if (header.type === "frame") {
      if (header.stream_id !== sid) return;

      props.videoPlayer.setImageBuffer(imageBuffer);
    }

    if (header.type === "codecpar") {
      if (header.stream_id !== sid) return;
      props.videoPlayer.setCodecpar(header.data);
      setGlobalState("streams", sid, "codecpar", header.data);
    }
  }

  createEffect(() => {
    const msg = latestWsMessage();
    if (!msg) return;
    onMessage(msg);
  });

  onMount(() => {
    const codecpar = untrack(() => {
      const sid = props.id();
      return globalState.streams[sid]?.codecpar;
    });
    if (!codecpar) return;
    props.videoPlayer.setCodecpar(codecpar);
  });
}
