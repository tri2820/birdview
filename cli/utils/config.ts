import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import fs from "fs";
import path from "path";

export type ConfigViewItem = {
  label: string;
  streams: string[];
};

export type AppConfig = {
  port: number;
  rest_server: {
    port: number;
  };
  media_server: {
    port: number;
  };
  auth_token: string;
  streams: {
    [id: string]: {
      label?: string;
      uri: string;
    };
  };
  views?: ConfigViewItem[];
};


export function getArgv() {
  const argv = yargs(hideBin(process.argv))
    .version(process.env.APP_VERSION as string) // Use the injected version
    .option("config", {
      alias: "c",
      type: "string",
      description: "Path to config file",
    })
    .option('dev', {
      type: 'boolean',
      description: 'Run the application in development mode (starts Vite)',
      default: false, // Default to production
    })
    .parseSync();
  return argv;
}

function readConfigFile(configPath: string) {
  try {
    const configFile = fs.readFileSync(configPath, "utf-8");
    return JSON.parse(configFile);
  } catch (error) {
    console.error(`Error reading config file at ${configPath}:`, error);
    process.exit(1);
  }
}

export function writeConfigFile(configPath: string, config: AppConfig) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
  } catch (error) {
    console.error(`Error writing config file at ${configPath}:`, error);
  }
}

export async function getConfig() {
  const argv = getArgv();
  const configPath = argv.config;
  const config: AppConfig = configPath ? readConfigFile(configPath) : {};

  if (!config.port) config.port = 6820;
  // @ts-ignore
  if (!config.media_server) config.media_server = {};
  if (!config.media_server.port) config.media_server.port = 5820;
  // @ts-ignore
  if (!config.rest_server) config.rest_server = {};
  if (!config.rest_server.port) config.rest_server.port = 5820;

  if (!config.auth_token) {
    console.log('Config file does not contain "auth_token", server will create a new *guest* tenant for you.');
    // tenant creation will be handled by first connection to backend
  }

  if (!config.streams) config.streams = {};
  return config;
}

export const mediaConfig = await getConfig();

