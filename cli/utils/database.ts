import * as lancedb from "@lancedb/lancedb";
import * as arrow from "apache-arrow";
import fs from 'fs/promises';
import { DATABASE_EMBEDDING_DIMENSION } from '../definitions';

type MediaUnit = {
    id: string;
    description: string | null;
    at_time: Date;
    embedding: number[] | null;
    media_id: string;
    path: string;
}

/**
 * Initializes the database and creates the table schema.
 */
export async function initializeDatabase(path: string, overwrite = false): Promise<lancedb.Connection> {
    console.log(`Initializing database at ${path}...`);
    await fs.mkdir(path, { recursive: true });
    const db = await lancedb.connect(path);

    const tableNames = await db.tableNames();
    const tableExists = tableNames.includes('media_units');

    if (overwrite || !tableExists) {
        const schema = new arrow.Schema([
            new arrow.Field('id', new arrow.Utf8(), false),
            new arrow.Field('description', new arrow.Utf8(), true),
            new arrow.Field('at_time', new arrow.Timestamp(arrow.TimeUnit.MILLISECOND), false),
            new arrow.Field('path', new arrow.Utf8(), false),
            new arrow.Field('media_id', new arrow.Utf8(), false),
            new arrow.Field('embedding', new arrow.FixedSizeList(DATABASE_EMBEDDING_DIMENSION, new arrow.Field('item', new arrow.Float32(), true)), true)
        ]);
        await db.createTable({ name: 'media_units', data: [], schema, mode: 'overwrite' });
        console.log("Table 'media_units' created.");
    }

    try {
        // No harm in trying to create the index again
        const table = await db.openTable('media_units');
        await table.createIndex("embedding");
    } catch (e) {
        // Ignore if cannot create index
        // Might be due to empty table https://github.com/lancedb/lance/issues/3940
    }

    return db;
}


/**
 * Inserts a new media unit record into the database.
 */
export async function addMediaUnit(connection: lancedb.Connection, mediaUnit: {
    id: string;
    at_time: string;
    path: string;
    media_id: string;
    description?: string;
    embedding?: number[];
}): Promise<void> {
    try {
        const table = await connection.openTable('media_units');
        await table.add([{
            ...mediaUnit,
            at_time: new Date(mediaUnit.at_time),
            description: mediaUnit.description ?? null,
            embedding: mediaUnit.embedding ? mediaUnit.embedding : null,
        }]);
    } catch (error) {
        console.error("Error inserting media unit:", error);
    }
}

/**
 * Updates a media unit record in the database using the native update method.
 */
export async function updateMediaUnit(connection: lancedb.Connection, mediaUnit: Partial<MediaUnit> & { id: string }): Promise<void> {
    try {
        const table = await connection.openTable('media_units');

        const values: Record<string, any> = {};

        // Dynamically build the values object from the provided mediaUnit
        if (mediaUnit.description !== undefined) {
            values.description = mediaUnit.description;
        }
        if (mediaUnit.at_time !== undefined) {
            values.at_time = new Date(mediaUnit.at_time);
        }
        if (mediaUnit.path !== undefined) {
            values.path = mediaUnit.path;
        }
        if (mediaUnit.media_id !== undefined) {
            values.media_id = mediaUnit.media_id;
        }
        if (mediaUnit.embedding !== undefined) {
            values.embedding = mediaUnit.embedding;
        }

        if (Object.keys(values).length > 0) {
            await table.update({
                where: `id = '${mediaUnit.id}'`,
                values: values
            });
        }

    } catch (error) {
        console.error("Error updating media unit:", error);
    }
}


/**
 * Searches for media units by embedding similarity.
 */
export async function searchMediaUnitsByEmbedding(connection: lancedb.Connection, queryEmbedding: number[]): Promise<MediaUnit[] | null> {
    try {
        const table = await connection.openTable('media_units');
        const results = table.search(queryEmbedding).limit(50);
        const resultArray = await results.toArray();
        return resultArray;
    } catch (error) {
        console.error("Error searching media units by embedding:", error);
        return null;
    }
}