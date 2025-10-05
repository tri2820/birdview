import * as lancedb from "@lancedb/lancedb";
import * as arrow from "apache-arrow";


(async () => {
    const conn = await lancedb.connect("memory://");
    const schema = new arrow.Schema([
        new arrow.Field("id", new arrow.Utf8(), false),
        new arrow.Field(
            "vector",
            new arrow.FixedSizeList(
                32,
                new arrow.Field("item", new arrow.Float32(), true),
            ),
            true
        )
    ]);
    const table = await conn.createEmptyTable("test_table", schema);
    await table.add([{ vector: undefined }]);
    // table.mergeInsert("id")
    // .whenMatchedUpdateAll()
    // .execute([
    //     { id: "ac9487d7-90d5-4d35-b22d-d56241600d31", description: "Updated description for test1" }
    // ])

})();

