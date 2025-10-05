import * as path from 'path';

// Relative to this file
export const APP_DIR = '/home/tri/birdview';
export const DATABASE_PATH = path.join(APP_DIR, 'database');
export const DATABASE_EMBEDDING_DIMENSION = 2048; // Must match the dimension used in the embedding model