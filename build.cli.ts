// build.cli.ts

import { build } from "bun";
// 1. Add these imports
import fs from "fs";
import path from "path";

// 2. Read the package.json file at build time
// Use import.meta.dir to get the current directory of the build script
const packageJsonPath = path.resolve(import.meta.dir, "package.json");
const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

// Using Bun's built-in bundler API
await Bun.build({
    entrypoints: ['./cli/entry.tsx'],
    outdir: './cli/dist',
    target: 'node',
    // 3. IMPORTANT: Add 'vite' to your external array
    external: ['ink', 'react', "@duckdb/node-api", "lightningcss", "vite"],
    banner: '#!/usr/bin/env node',
    // 4. Add the 'define' option here
    // This will find all instances of `process.env.APP_VERSION` in your code
    // and replace them with the actual version string (e.g., "0.0.4")
    define: {
        "process.env.APP_VERSION": JSON.stringify(pkg.version),
    },
});

console.log('CLI build complete!');

export { };