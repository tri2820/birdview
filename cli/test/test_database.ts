import { DuckDBConnection } from "@duckdb/node-api";
import {
    addMediaUnit,
    closeConnection,
    initializeDatabase,
    rebuildFtsIndex,
    rebuildHnswIndex,
    searchMediaUnitsByDescription,
    searchMediaUnitsByEmbedding,
    updateMediaUnit, // Import for VSS

} from "../utils/database";
import { DATABASE_EMBEDDING_DIMENSION } from "../../definitions";



let connection: DuckDBConnection | null = null;
try {
    connection = await initializeDatabase('app.db', true); // Overwrite existing database for demo

    // --- Data Seeding with Embeddings ---
    console.log("Adding sample frames...");

    // #1: Full data
    const personEmbedding1 = Array.from({ length: DATABASE_EMBEDDING_DIMENSION }, (_, i) => 1 + i);
    await addMediaUnit(connection, {
        id: crypto.randomUUID(),
        at_time: new Date().toISOString(),
        description: 'A person is working on a computer',
        path: '/media/frames/001.jpg',
        media_id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
        embedding: personEmbedding1
    });

    // #2: Full data
    const dogFrameId = crypto.randomUUID();
    const dogEmbedding = Array.from({ length: DATABASE_EMBEDDING_DIMENSION }, (_, i) => 10 + i);
    await addMediaUnit(connection, {
        description: 'A dog is chasing a ball in the park',
        path: '/media/frames/002.jpg',
        media_id: 'b2c3d4e5-f6a7-8901-2345-67890abcdef1',
        id: dogFrameId,
        at_time: new Date().toISOString(),
        embedding: dogEmbedding
    });

    // #3: Full data
    const personEmbedding2 = Array.from({ length: DATABASE_EMBEDDING_DIMENSION }, (_, i) => 1.1 + i);
    await addMediaUnit(connection, {
        id: crypto.randomUUID(),
        at_time: new Date().toISOString(),
        description: 'A person is walking on the street',
        path: '/media/frames/003.jpg',
        media_id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
        embedding: personEmbedding2
    });

    // --- Add frames with missing data ---
    console.log("Adding frames with missing description or embedding...");

    // #4: Has description, no embedding
    await addMediaUnit(connection, {
        id: crypto.randomUUID(),
        at_time: new Date().toISOString(),
        description: 'A cat is sleeping on a couch',
        path: '/media/frames/004.jpg',
        media_id: 'c3d4e5f6-a7b8-9012-3456-7890abcdef12'
        // embedding is omitted
    });

    // #5: Has embedding, no description
    const dogEmbedding2 = Array.from({ length: DATABASE_EMBEDDING_DIMENSION }, (_, i) => 10.2 + i);
    await addMediaUnit(connection, {
        id: crypto.randomUUID(),
        at_time: new Date().toISOString(),
        path: '/media/frames/005.jpg',
        media_id: 'd4e5f6a7-b8c9-0123-4567-890abcdef123',
        embedding: dogEmbedding2
        // description is omitted
    });

    // #6: Has neither description nor embedding
    await addMediaUnit(connection, {
        id: crypto.randomUUID(),
        at_time: new Date().toISOString(),
        path: '/media/frames/006.jpg',
        media_id: 'e5f6a7b8-c9d0-1234-5678-90abcdef1234'
    });


    // --- FTS (Full-Text Search) Test ---
    console.log("\n--- TESTING FULL-TEXT SEARCH (FTS) ---");
    console.log("\nRebuilding FTS index to include new data...");
    rebuildFtsIndex(connection, true); // Force immediate rebuild

    console.log("\nSearching FTS for 'person':");
    const personResults = await searchMediaUnitsByDescription(connection, 'person');
    console.log(personResults.getRowObjectsJson());

    console.log("\nSearching FTS for 'dog park':");
    const dogResults = await searchMediaUnitsByDescription(connection, 'dog park');
    console.log(dogResults.getRowObjectsJson());

    // This search should only find the new "cat" frame
    console.log("\nSearching FTS for 'cat':");
    const catResults = await searchMediaUnitsByDescription(connection, 'cat');
    console.log(catResults.getRowObjectsJson());

    console.log("\nUpdating dog media unit description...");
    await updateMediaUnit(connection, {
        id: dogFrameId,
        description: 'A happy dog is chasing a red ball in the park'
    });

    console.log("\nRebuilding FTS index after update...");
    rebuildFtsIndex(connection, true); // Force immediate rebuild

    console.log("\nSearching FTS for 'happy dog':");
    const happyDogResults = await searchMediaUnitsByDescription(connection, 'happy dog');
    console.log(happyDogResults.getRowObjectsJson());


    // --- VSS (Vector Similarity Search) Test ---
    console.log("\n--- TESTING VECTOR SIMILARITY SEARCH (VSS) ---");
    console.log("\nRebuilding HNSW index for vector search...");
    await rebuildHnswIndex(connection); // Build the vector index

    // Create a query embedding that is very close to the "person" vectors
    const queryEmbedding = Array.from({ length: DATABASE_EMBEDDING_DIMENSION }, (_, i) => 1.05 + i);
    console.log(`\nSearching VSS for frames similar to embedding: [${queryEmbedding.slice(0, 4).join(', ')}, ...]`);

    const similarFrames = await searchMediaUnitsByEmbedding(connection, queryEmbedding);
    console.log("Found similar frames (lower distance is better):");
    console.log(similarFrames.getRowObjectsJson());

} catch (error) {
    console.error("\nAn error occurred:", error);
} finally {
    if (connection) await closeConnection(connection);
}