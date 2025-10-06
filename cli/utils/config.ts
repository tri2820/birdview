import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import Conf from 'conf';
import { hideBin } from "yargs/helpers";
import yargs from 'yargs';

// 1. Define the schema for a single stream item
const streamItemSchema = z.object({
  uri: z.string(),
  label: z.string().optional(),
});

// 2. Define the main application schema using Zod
const appSchema = z.object({
  port: z.number().default(6700),
  rest_server: z.object({
    port: z.number(),
  }).default({
    port: 6710,
  }),
  media_server: z.object({
    port: z.number(),
  }).default({
    port: 6720,
  }),
  auth_token: z.string().nullable().default(null),
  streams: z.record(z.string(), streamItemSchema).default({}),
  views: z.array(z.object({
    label: z.string(),
    streams: z.array(z.string()),
  })).default([]),
});

// 3. Infer the TypeScript type
export type AppConfig = z.infer<typeof appSchema>;

// 4. Generate the JSON Schema
const jsonSchema = zodToJsonSchema(appSchema, 'appSchema');

if (jsonSchema.definitions === undefined) {
  throw new Error("Failed to generate JSON schema definitions");
}

const schemaDefinition = jsonSchema.definitions.appSchema;
const schema = (schemaDefinition as any).properties
export const appConfig = new Conf<AppConfig>({
  projectName: 'birdview',
  schema
});

export const argv_options = yargs(hideBin(process.argv))
  .version(process.env.APP_VERSION as string) // Use the injected version
  .option('dev', {
    type: 'boolean',
    description: 'Run the application in development mode (starts Vite)',
    default: false, // Default to production
  })
  .option('show-config-path', {
    type: 'boolean',
    description: 'Show the path to the config file',
    default: false,
  })  // Enable the help option, which is --help by default
  // Define 'h' and 'help' as boolean options without a special function
  .option('h', {
    alias: 'help',
    describe: 'Show help message',
    type: 'boolean'
  })



export function getArgv() {
  const argv = argv_options.parseSync();
  return argv;
}
