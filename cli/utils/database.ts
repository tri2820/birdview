import { DuckDBConnection, DuckDBInstance, uuidValue } from '@duckdb/node-api';
import fs from 'fs/promises';

/**
 * Initializes the database and creates the table schema.
 */
export async function initializeDatabase(path: string, overwrite = false): Promise<DuckDBConnection> {
    console.log(`Initializing database at ${path}...`);
    // check exists
    const exists = await fs.stat(path).then(() => true).catch(() => false);

    if (exists && overwrite) {
        try {
            await fs.unlink(path);
        } catch (err) {
            // Ignore if file does not exist
        }
    }

    const instance = await DuckDBInstance.create(path);
    const connection = await instance.connect();

    if (overwrite || !exists) {
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
    try {
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
    } catch (error) {
        console.error("Error inserting frame:", error);
    }
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
        ORDER BY score DESC
        LIMIT 50;
    `;
    const results = await connection.runAndReadAll(querySql, { query: query });
    return results;
}

