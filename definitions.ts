import { AppConfig } from "./config";
export type WsHeader =
  | {
    type: "frame";
    stream_id: string;
    id: string;
  }
  | {
    type: "codecpar";
    stream_id: string;
    data: {
      width: number;
      height: number;
    };
  }
  | {
    type: "config";
    data: AppConfig;
  };
