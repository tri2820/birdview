import { DuckDBConnection, DuckDBInstance, uuidValue } from '@duckdb/node-api';
import fs from 'fs/promises';
import { DATABASE_EMBEDDING_DIMENSION } from '../../definitions';

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
        await connection.run('INSTALL vss;');
        await connection.run('LOAD vss;');
        await connection.run('SET GLOBAL hnsw_enable_experimental_persistence = true;');

        // **MODIFIED:** Renamed table to media_units and stream_id to media_id
        await connection.run(`
      CREATE TABLE IF NOT EXISTS media_units (
        id UUID,
        description VARCHAR NULL,
        at_time TIMESTAMPTZ,
        path VARCHAR,
        media_id VARCHAR,
        embedding FLOAT[${DATABASE_EMBEDDING_DIMENSION}] NULL
      );
    `);
    }
    return connection;
}


/**
 * Inserts a new media unit record into the database.
 * Description and embedding are now optional.
 */
export async function addMediaUnit(connection: DuckDBConnection, mediaUnit: {
    id: string;
    at_time: string;
    path: string;
    media_id: string;
    description?: string;
    embedding?: number[];
}): Promise<void> {
    try {
        // **MODIFIED:** Changed table and column names
        await connection.run(
            `INSERT INTO media_units (id, description, at_time, path, media_id, embedding) VALUES ($id, $description, $at_time, $path, $media_id, CAST($embedding AS FLOAT[${DATABASE_EMBEDDING_DIMENSION}]));`,
            {
                id: mediaUnit.id,
                description: mediaUnit.description ?? null,
                at_time: mediaUnit.at_time,
                path: mediaUnit.path,
                media_id: mediaUnit.media_id,
                embedding: mediaUnit.embedding ? JSON.stringify(mediaUnit.embedding) : null,
            }
        );
        rebuildFtsIndex(connection);
    } catch (error) {
        console.error("Error inserting media unit:", error);
    }
}

/**
 * Updates a media unit record in the database.
 */
export async function updateMediaUnit(connection: DuckDBConnection, mediaUnit: {
    id: string;
    description?: string;
    at_time?: string;
    path?: string;
    media_id?: string;
    embedding?: number[];
}): Promise<void> {
    const updates = [];
    const params: any = { id: mediaUnit.id };

    if (mediaUnit.description) {
        updates.push('description = $description');
        params.description = mediaUnit.description;
    }
    if (mediaUnit.at_time) {
        updates.push('at_time = $at_time');
        params.at_time = mediaUnit.at_time;
    }
    if (mediaUnit.path) {
        updates.push('path = $path');
        params.path = mediaUnit.path;
    }
    // **MODIFIED:** Changed to media_id
    if (mediaUnit.media_id) {
        updates.push('media_id = $media_id');
        params.media_id = mediaUnit.media_id;
    }
    if (mediaUnit.embedding) {
        updates.push(`embedding = CAST($embedding AS FLOAT[${DATABASE_EMBEDDING_DIMENSION}])`);
        params.embedding = JSON.stringify(mediaUnit.embedding);
    }

    if (updates.length > 0) {
        // **MODIFIED:** Changed table name
        const sql = `UPDATE media_units SET ${updates.join(', ')} WHERE id = CAST($id AS UUID);`;
        await connection.run(sql, params);
        rebuildFtsIndex(connection);
    }
}


let rebuildFTSTimeout: NodeJS.Timeout | null = null;
/**
 * Recreates the FTS index on the media_units table.
 */
export function rebuildFtsIndex(connection: DuckDBConnection, forced = false) {
    if (forced) {
        // **MODIFIED:** Changed table name
        connection.run(`PRAGMA create_fts_index('media_units', 'id', 'description', overwrite = 1);`);
    } else {
        if (rebuildFTSTimeout) {
            clearTimeout(rebuildFTSTimeout);
        }
        rebuildFTSTimeout = setTimeout(async () => {
            // **MODIFIED:** Changed table name
            await connection.run(`PRAGMA create_fts_index('media_units', 'id', 'description', overwrite = 1);`);
            rebuildFTSTimeout = null;
        }, 2000);
    }
}

/**
 * Recreates the HNSW index on the media_units table for vector search.
 */
export async function rebuildHnswIndex(connection: DuckDBConnection) {
    console.log("Rebuilding HNSW index...");
    // **MODIFIED:** Changed table name
    await connection.run(`CREATE INDEX hnsw_idx ON media_units USING HNSW (embedding) WITH (metric = 'cosine');`);
    console.log("HNSW index rebuilt.");
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
 * Searches the media_units table by description.
 */
export async function searchMediaUnitsByDescription(connection: DuckDBConnection, query: string) {
    const querySql = `
        SELECT *, fts_main_media_units.match_bm25(id, $query) AS score
        FROM media_units
        WHERE score IS NOT NULL
        ORDER BY score DESC
        LIMIT 50;
    `;
    const results = await connection.runAndReadAll(querySql, { query: query });
    return results;
}

/**
 * Searches for media units by embedding similarity. Assumes the HNSW index has been built.
 * Returns results with a 'distance' (0-2, lower is better) and a 'score' (0-1, higher is better).
 */
export async function searchMediaUnitsByEmbedding(connection: DuckDBConnection, queryEmbedding: number[]) {
    const querySql = `
        WITH distances AS (
            SELECT 
                *, 
                array_cosine_distance(embedding, CAST($embedding AS FLOAT[${DATABASE_EMBEDDING_DIMENSION}])) AS distance
            FROM media_units
            WHERE embedding IS NOT NULL
        )
        SELECT 
            *,
            (1 - (distance / 2)) AS score
        FROM distances
        ORDER BY distance ASC
        LIMIT 50;
    `;
    const results = await connection.runAndReadAll(querySql, { embedding: JSON.stringify(queryEmbedding) });
    return results;
}