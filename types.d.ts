
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


export type MediaUnit = {
    id: string;
    description: string | null;
    at_time: Date;
    embedding: number[] | null;
    media_id: string;
    path: string;
}
