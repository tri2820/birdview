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
  rest_server: z
    .object({
      port: z.number(),
    })
    .default({
      port: 6710,
    }),
  media_server: z
    .object({
      port: z.number(),
    })
    .default({
      port: 6720,
    }),
  auth_token: z.string().nullable().default(null),
  streams: z
    .record(z.string(), streamItemSchema)
    .default({
      "camera-1": {
        label: "University Lab Pendulum",
        uri: "http://pendelcam.kip.uni-heidelberg.de/mjpg/video.mjpg",
      },
      "camera-2": {
        label: "Panama Port",
        uri: "http://200.46.196.243/axis-cgi/media.cgi?camera=1&videoframeskipmode=empty&videozprofile=classic&resolution=1280x720&audiodeviceid=0&audioinputid=0&audiocodec=aac&audiosamplerate=16000&audiobitrate=32000&timestamp=0&videocodec=h264&container=mp4",
      },
      "camera-3": {
        label: "Port",
        uri: "http://77.110.245.165/axis-cgi/mjpg/video.cgi",
      },
      "camera-4": {
        label: "Parking Lot",
        uri: "http://83.48.75.113:8320/axis-cgi/mjpg/video.cgi",
      },
      "camera-5": {
        label: "Riverbank",
        uri: "http://109.247.15.178:6001/mjpg/video.mjpg",
      },
      "camera-6": {
        label: "Dock",
        uri: "http://eyc.synology.me:10001/mjpg/video.mjpg",
      },
      "camera-7": {
        label: "Airport",
        uri: "http://mmb.aa1.netvolante.jp:1025/mjpg/video.mjpg?resolution=640x360",
      },
    }),
  views: z
    .array(
      z.object({
        label: z.string(),
        streams: z.array(z.string()),
      })
    )
    .default([
      {
        label: "Inside",
        streams: ["camera-1", "camera-2"],
      },
      {
        label: "Outside",
        streams: ["camera-3", "camera-4", "camera-5", "camera-6", "camera-7"],
      },
    ]),
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

export function saveConfig(newConfig: any): { success: boolean; error?: any } {
  try {
    const validatedConfig = appSchema.parse(newConfig);
    appConfig.set(validatedConfig);
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.format() };
    }
    return { success: false, error: 'An unknown error occurred.' };
  }
}

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

export function maskedConfig() {
  const masked = appConfig.store;
  if (masked.auth_token) {
    masked.auth_token = '***';
  }
  return masked;
}