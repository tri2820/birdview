// Using Bun's built-in bundler API
await Bun.build({
    entrypoints: ['./cli/entry.tsx'],
    outdir: './cli/dist',
    target: 'node',
    external: ['ink', 'react', "@duckdb/node-api"],
    banner: '#!/usr/bin/env node'
});

console.log('CLI build complete!');

export { };