import { Box, render } from "ink";
import AppServer from "./components/AppServer";
import MediaServer from "./components/MediaServer";
import React from "react";
import { appConfig, argv_options, getArgv } from "./utils/config";
import { connectToBackend } from "./utils/backendClient";

const argv = getArgv();

if (argv.h || argv.help) {
  const text = await argv_options.getHelp()
  console.log(text);
  process.exit(0);
}

if (argv["show-config-path"]) {
  console.log("Current Configuration Path:", appConfig.path);
  process.exit(0);
}

connectToBackend();

// The main App component with the new output box
const App = () => {
  return (
    <Box flexDirection="column">
      <MediaServer />
      <AppServer />
    </Box>
  );
};

render(<App />);
