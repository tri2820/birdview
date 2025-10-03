import path from 'path';
import { fileURLToPath } from 'url';
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
  }


// These two lines give you the equivalent of __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Relative to this file
export const DATABASE_PATH = path.join(__dirname, 'app.db');