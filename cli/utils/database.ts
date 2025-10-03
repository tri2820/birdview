import { DuckDBConnection, DuckDBInstance, uuidValue } from '@duckdb/node-api';
import fs from 'fs/promises';
import { DATABASE_PATH } from '../../definitions';

/**
 * Initializes the database and creates the table schema.
 */
export async function initializeDatabase(overwrite = false): Promise<DuckDBConnection> {
    if (overwrite) {
        try {
            await fs.unlink(DATABASE_PATH);
        } catch (err) {
            // Ignore if file does not exist
        }
    }

    const instance = await DuckDBInstance.create(DATABASE_PATH);
    const connection = await instance.connect();

    if (overwrite) {
        await connection.run('INSTALL fts;');
        await connection.run('LOAD fts;');

        await connection.run(`
      CREATE TABLE IF NOT EXISTS frames (
        id UUID,
        description VARCHAR,
        at_time TIMESTAMPTZ,
        path VARCHAR,
        stream_id VARCHAR
      );
    `);
    }
    return connection;
}


/**
 * Inserts a new frame record into the database.
 * You can optionally provide an 'id' and 'at_time'.
 * If they are not provided, they will default to uuid() and now() respectively.
 */
export async function addFrame(connection: DuckDBConnection, frame: {
    id: string;
    description: string;
    at_time: string;
    path: string;
    stream_id: string;
}): Promise<void> {
    await connection.run(
        'INSERT INTO frames (id, description, at_time, path, stream_id) VALUES ($id, $description, $at_time, $path, $stream_id);',
        {
            id: frame.id,
            description: frame.description,
            at_time: frame.at_time,
            path: frame.path,
            stream_id: frame.stream_id,
        }
    );
    rebuildFtsIndex(connection);
}

export async function updateFrame(connection: DuckDBConnection, frame: {
    id: string;
    description?: string;
    at_time?: string;
    path?: string;
    stream_id?: string;
}): Promise<void> {
    const updates = [];
    // The params object will now just contain the raw string values.
    const params: any = { id: frame.id };

    if (frame.description) {
        updates.push('description = $description');
        params.description = frame.description;
    }
    if (frame.at_time) {
        updates.push('at_time = $at_time');
        params.at_time = frame.at_time;
    }
    if (frame.path) {
        updates.push('path = $path');
        params.path = frame.path;
    }
    if (frame.stream_id) {
        updates.push('stream_id = $stream_id');
        params.stream_id = frame.stream_id;
    }

    if (updates.length > 0) {
        // **THE FIX IS HERE**: Use CAST($id AS UUID) in the WHERE clause.
        const sql = `UPDATE frames SET ${updates.join(', ')} WHERE id = CAST($id AS UUID);`;

        // The `run` command sends the plain `params` object.
        await connection.run(sql, params);
        rebuildFtsIndex(connection);
    }
}


let rebuildFTSTimeout: NodeJS.Timeout | null = null;
/**
 * Recreates the FTS index on the frames table.
 * This MUST be called after adding new data and before searching.
 */
export function rebuildFtsIndex(connection: DuckDBConnection, forced = false) {

    if (forced) {
        connection.run(`PRAGMA create_fts_index('frames', 'id', 'description', overwrite = 1);`);
    } else {
        if (rebuildFTSTimeout) {
            clearTimeout(rebuildFTSTimeout);
        }
        rebuildFTSTimeout = setTimeout(async () => {
            // *** CORRECTED SYNTAX ***
            // 'overwrite = 1' is a named argument to the PRAGMA function, not a string literal.
            await connection.run(`PRAGMA create_fts_index('frames', 'id', 'description', overwrite = 1);`);

            rebuildFTSTimeout = null;
        }, 2000);
    }


}

export async function closeConnection(connection: DuckDBConnection) {
    while (true) {
        if (!rebuildFTSTimeout) break;
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    connection.closeSync();
    console.log("\nDatabase connection closed.");
}

/**
 * Searches the frames table by description. Assumes the index has been recently rebuilt.
 */
export async function searchFramesByDescription(connection: DuckDBConnection, query: string) {
    const querySql = `
        SELECT *, score
        FROM (
            SELECT *, fts_main_frames.match_bm25(id, $query) AS score
            FROM frames
        ) sq
        WHERE score IS NOT NULL
        ORDER BY score DESC;
    `;
    const results = await connection.runAndReadAll(querySql, { query: query });
    return results.getRowObjects();
}

export const connection = await initializeDatabase();

// If this file is run directly, execute the code block to demonstrate the correct workflow
if (require.main === module) {
    let connection: DuckDBConnection | null = null;

    (async () => {
        try {
            connection = await initializeDatabase(true); // Overwrite existing database for demo purposes

            // console.log("Adding sample frames...");
            // await addFrame(connection, {
            //     id: crypto.randomUUID(),
            //     at_time: new Date().toISOString(),
            //     description: 'A person is working on a computer',
            //     path: '/media/frames/001.jpg',
            //     stream_id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef'
            // });
            // const dogFrameId = crypto.randomUUID()
            // await addFrame(connection, {
            //     description: 'A dog is chasing a ball in the park',
            //     path: '/media/frames/002.jpg',
            //     stream_id: 'b2c3d4e5-f6a7-8901-2345-67890abcdef1',
            //     id: dogFrameId,
            //     at_time: new Date().toISOString(),
            // });
            // await addFrame(connection, {
            //     id: crypto.randomUUID(),
            //     at_time: new Date().toISOString(),
            //     description: 'A person is walking on the street',
            //     path: '/media/frames/003.jpg',
            //     stream_id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef'
            // });

            // console.log("\nRebuilding FTS index to include new data...")
            // rebuildFtsIndex(connection, true); // Force immediate rebuild

            // console.log("\nSearching for 'person':");
            // const personResults = await searchFramesByDescription(connection, 'person');
            // console.log(personResults);

            // console.log("\nSearching for 'dog park':");
            // const dogResults = await searchFramesByDescription(connection, 'dog park');
            // console.log(dogResults);

            // console.log("\nUpdating dog frame description...");
            // await updateFrame(connection, {
            //     id: dogFrameId,
            //     description: 'A happy dog is chasing a red ball in the park'
            // });

            // console.log("\nRebuilding FTS index after update...")
            // rebuildFtsIndex(connection, true); // Force immediate rebuild

            // console.log("\nSearching for 'happy dog':");
            // const happyDogResults = await searchFramesByDescription(connection, 'happy dog');
            // console.log(happyDogResults);


        } catch (error) {
            console.error("\nAn error occurred:", error);
        } finally {
            await closeConnection(connection!);
        }
    })();
}