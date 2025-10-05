import * as lancedb from "@lancedb/lancedb";
import * as arrow from "apache-arrow";

const uri = "data/sample-lancedb"
const db = await lancedb.connect(uri);
console.log("Connected to database at", uri, db);

import { EmbeddingFunction, register } from "@lancedb/lancedb/embedding";
import { type Float, Float32 } from "apache-arrow";


const schema = new arrow.Schema([
    new arrow.Field("item", new arrow.Utf8()),
    new arrow.Field("isAvailable", new arrow.Bool(), true),
    new arrow.Field(
        "vector",
        new arrow.FixedSizeList(
            384,
            new arrow.Field("item", new arrow.Float32(), true),
        ),
        true
    ),
]);

const tbl = await db.createEmptyTable("test_table", schema, { mode: "overwrite", });

// This is case 3.3, would throw error `Found field not in schema: vector at row 0`
const data = [
    {
        item: "fizz",
        // Can comment this out to test "missing key" case
        isAvailable: false,
        vector: null
    },
    {
        item: "buzz",
        isAvailable: false,
        vector: null
    },
];

await tbl.add(data);

console.log('Added data to table');