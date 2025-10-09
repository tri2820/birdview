
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
    }
    | {
        type: "update";
        data: {
            id: string;
            description: string;
            at_time: string; // ISO string
            media_id: string;
        }
    }


export type MediaUnit = {
    id: string;
    description: string | null;
    at_time: Date;
    embedding: number[] | null;
    media_id: string;
    path: string;
}
