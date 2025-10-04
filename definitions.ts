
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
    data: any;
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
export const DATABASE_EMBEDDING_DIMENSION = 2048; // Must match the dimension used in the embedding model