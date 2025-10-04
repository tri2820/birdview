import { DuckDBConnection } from "@duckdb/node-api";
import { addFrame, closeConnection, initializeDatabase, rebuildFtsIndex, searchFramesByDescription, updateFrame } from "../utils/database";

let connection: DuckDBConnection | null = null;
try {
    connection = await initializeDatabase('app.db', true); // Overwrite existing database for demo purposes

    console.log("Adding sample frames...");
    await addFrame(connection, {
        id: crypto.randomUUID(),
        at_time: new Date().toISOString(),
        description: 'A person is working on a computer',
        path: '/media/frames/001.jpg',
        stream_id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef'
    });
    const dogFrameId = crypto.randomUUID()
    await addFrame(connection, {
        description: 'A dog is chasing a ball in the park',
        path: '/media/frames/002.jpg',
        stream_id: 'b2c3d4e5-f6a7-8901-2345-67890abcdef1',
        id: dogFrameId,
        at_time: new Date().toISOString(),
    });
    await addFrame(connection, {
        id: crypto.randomUUID(),
        at_time: new Date().toISOString(),
        description: 'A person is walking on the street',
        path: '/media/frames/003.jpg',
        stream_id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef'
    });

    console.log("\nRebuilding FTS index to include new data...")
    rebuildFtsIndex(connection, true); // Force immediate rebuild

    console.log("\nSearching for 'person':");
    const personResults = await searchFramesByDescription(connection, 'person');
    console.log(personResults);

    console.log("\nSearching for 'dog park':");
    const dogResults = await searchFramesByDescription(connection, 'dog park');
    console.log(dogResults);

    console.log("\nUpdating dog frame description...");
    await updateFrame(connection, {
        id: dogFrameId,
        description: 'A happy dog is chasing a red ball in the park'
    });

    console.log("\nRebuilding FTS index after update...")
    rebuildFtsIndex(connection, true); // Force immediate rebuild

    console.log("\nSearching for 'happy dog':");
    const happyDogResults = await searchFramesByDescription(connection, 'happy dog');
    console.log(happyDogResults);
} catch (error) {
    console.error("\nAn error occurred:", error);
} finally {
    if (connection) await closeConnection(connection);
}