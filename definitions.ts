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
  } | {
    type: "search_result";
    query: string;
    result: {
      items: any[];
    };
  } | {
    type: 'get_image_result';
    path: string;
  }



// Relative to this file
export const DATABASE_PATH = '/home/tri/app.db';