import { IconTypes } from "solid-icons";
import * as allBsIcons from "solid-icons/bs";
import * as allFaIcons from "solid-icons/fa";
import { batch, Component, createSignal } from "solid-js";
import { WsHeader } from "../types";
import { createStore } from "solid-js/store";


export function notEmpty<TValue>(
  value: TValue | null | undefined
): value is TValue {
  return value !== null && value !== undefined;
}

export function getDynamicIcon(iconKey: string): IconTypes {
  // 1. Construct the key for the icon object.
  // Icon names in the `solid-icons` library are exported in PascalCase, prefixed with "Bs".
  // e.g., "cloud" becomes "BsCloud", "arrowLeft" becomes "BsArrowLeft".
  // const iconKey = `Bs${name.charAt(0).toUpperCase() + name.slice(1)}`;

  // 2. Look up the icon component in the imported object of all icons.
  // We cast the imported module to a record of string keys and Component values for type safety.
  const IconComponent = iconKey.startsWith("Bs")
    ? (allBsIcons as Record<string, Component>)[iconKey]
    : (allFaIcons as Record<string, Component>)[iconKey];

  // 3. Return the found component, or the fallback icon if the key does not exist.
  return IconComponent || allBsIcons.BsCloudFill;
}

export type TimeRange = {
  from_ms: number;
  to_ms: number;
};

export type CameraEvent = {
  from_ms: number;
  to_ms?: number;
  type: "motion" | "detection" | "threat" | "dangerous" | "threat_mitigated";
  label: string;
  icon: string;
};

export type Mark = {
  is_minor?: boolean;
  at_ms: number;
};

export const COLORS: Record<
  CameraEvent["type"],
  { border: string; bg: string; text: string }
> = {
  motion: {
    border: "border-neutral-600",
    bg: "bg-neutral-500/30",
    text: "text-neutral-500",
  },
  threat: {
    border: "border-yellow-600",
    bg: "bg-yellow-500/30",
    text: "text-yellow-500",
  },
  threat_mitigated: {
    border: "border-green-600",
    bg: "bg-green-500/30",
    text: "text-green-500",
  },
  dangerous: {
    border: "border-red-600",
    bg: "bg-red-500/30",
    text: "text-red-500",
  },
  detection: {
    border: "border-blue-600",
    bg: "bg-blue-500/30",
    text: "text-blue-500",
  },
};

export const buildMarks = (range: TimeRange) => {
  const numMarks = 10;
  const interval = (range.to_ms - range.from_ms) / numMarks;
  const result: Mark[] = [];
  for (let i = 0; i <= numMarks; i++) {
    const at_ms = range.from_ms + i * interval;
    result.push({
      at_ms,
    });
  }

  const minorMarks: Mark[] = [];
  const numMinorMarks = 5;
  for (let i = 0; i < result.length; i++) {
    const mark = result[i];
    const nextMark = result[i + 1];
    if (!nextMark) break;

    const minorInterval = (nextMark.at_ms - mark.at_ms) / numMinorMarks;
    for (let j = 1; j < numMinorMarks; j++) {
      const at_ms = mark.at_ms + j * minorInterval;
      minorMarks.push({ at_ms, is_minor: true });
    }
  }

  return [...result, ...minorMarks];
};

export const [appConfig, setAppConfig] = createSignal<Record<string, any>>();

export type TabId =
  | {
    type: "stream";
    stream_id: string;
  }
  | {
    type: "home" | "statistics" | "moments";
  }
  | {
    type: "multiview";
    stream_ids: string[];
  } | {
    type: "events"
  } | {
    type: "settings"
  } | {
    type: "search-result",
    query: string,
  }

export const [tabId, _setTabId] = createSignal<TabId>({
  type: "home",
});

let historyTabIds: TabId[] = [];
export const setTabId = (id: TabId) => {
  _setTabId((p) => {
    historyTabIds.push(p);
    return id;
  });
};
export const goBackTabId = () => {
  const last = historyTabIds.pop();
  if (last) {
    _setTabId(last);
  }
};

export function parseWsMessage(buffer: ArrayBuffer | string): {
  header: WsHeader;
  imageBuffer?: ArrayBuffer;
} {
  if (typeof buffer === "string") {
    const header = JSON.parse(buffer) as WsHeader;
    return { header };
  }

  // Use a DataView to safely read numbers from the buffer
  const view = new DataView(buffer);

  // 1. Read the header length from the first 4 bytes (at offset 0)
  // The 'false' argument specifies Big-Endian, matching our server.
  const headerLength = view.getUint32(0, false);

  // 2. Define the byte offsets for the different parts
  const headerStart = 4; // Header starts after the 4-byte length prefix
  const imageStart = headerStart + headerLength;

  // 3. Decode the header string (from bytes to a string)
  // Use TextDecoder for proper UTF-8 handling.
  const headerSlice = buffer.slice(headerStart, imageStart);
  const headerString = new TextDecoder().decode(headerSlice);
  const header = JSON.parse(headerString);

  // 4. Extract the image data
  // The image is the rest of the buffer after the header.
  if (imageStart >= buffer.byteLength) {
    return { header };
  }

  const imageBuffer = buffer.slice(imageStart);
  return { header, imageBuffer };
}

export const [latestWsMessage, setLatestWsMessage] = createSignal<{
  header: WsHeader;
  imageBuffer?: ArrayBuffer;
}>();

export const [globalState, _setGlobalState] = createStore<{
  streams: Record<
    string,
    {
      codecpar?: {
        width: number;
        height: number;
      };
    }
  >;
}>({
  streams: {},
});

/**
 * A generalized setter for the global state.
 * It ensures that nested objects are created if they don't exist before setting a value.
 *
 * @param {...any} args - The path to the value to set, followed by the value itself.
 *                         For example: setGlobalState("users", "user1", "profile", "name", "John Doe");
 */
export const setGlobalState = (...args: any[]) => {
  batch(() => {
    // Path to the property to be set, excluding the final value.
    const path = args.slice(0, -1);

    if (path.length > 0) {
      // Create nested objects if they don't exist.
      // We only need to iterate up to the second to last element of the path,
      // as the last element is the key for the value being set.
      for (let i = 1; i < path.length; i++) {
        const subPath = path.slice(0, i);

        // To check for existence, we need to traverse the globalState.
        let current = globalState;
        for (const key of subPath) {
          // @ts-ignore
          current = current?.[key];
        }

        if (
          current === undefined ||
          typeof current !== "object" ||
          current === null
        ) {
          // If at any point the path doesn't exist or is not an object, create it.
          // @ts-ignore
          _setGlobalState(...subPath, {});
        }
      }
    }

    // @ts-ignore
    _setGlobalState(...args);
  });
};


// So that we can queue messages if the client is not ready
export class WsClientWrapper {
  queue: (Buffer | string)[] = [];
  constructor(public ws: WebSocket) {
    this.ws.addEventListener("open", () => {
      this.flush();
    });
  }

  send(message: Buffer | string) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(message);
    } else {
      this.queue.push(message);
    }
  }

  flush() {
    while (this.queue.length > 0) {
      const message = this.queue.shift();
      if (message) {
        this.ws.send(message);
      }
    }
  }
}

export let wsClient: WsClientWrapper | null = null;
export function setupWs() {
  // Connect to websocket server
  const _socket = new WebSocket("/ws");

  // IMPORTANT: Set the binaryType to 'arraybuffer'
  // This tells the WebSocket to provide the data as an ArrayBuffer, not a Blob.
  _socket.binaryType = "arraybuffer";

  console.log("Connecting to WebSocket server...");
  _socket.addEventListener("open", () => {
    console.log("Connected to WebSocket server");
  });

  _socket.addEventListener("message", (event) => {
    const message = parseWsMessage(event.data);
    setLatestWsMessage(message);

    if (message.header.type === "config") {
      setAppConfig(message.header.data);
    }

    if (message.header.type === "codecpar") {
      setGlobalState("streams", message.header.stream_id, "codecpar", message.header.data);
    }
  });

  _socket.addEventListener("close", () => {
    console.log("Disconnected from WebSocket server");
  });

  _socket.addEventListener("error", (error) => {
    console.error("WebSocket error: ", error);
  });

  wsClient = new WsClientWrapper(_socket);
}

export const shortenText = (text: string, maxLength = 100) => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
};


export const [localStorage$, _setLocalStorage$] = createStore<{
  recent_searches: string[]
}>({
  recent_searches: []
});

export const setLocalStorage$: typeof _setLocalStorage$ = (...args: any[]) => {
  // @ts-ignore
  _setLocalStorage$(...args);

  // Persist to localStorage
  const toStore = { ...localStorage$ };

  window.localStorage.setItem("localStorage$", JSON.stringify(toStore));
}