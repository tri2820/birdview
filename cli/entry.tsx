import { Box, render } from "ink";
import AppServer from "./components/AppServer";
import MediaServer from "./components/MediaServer";
import React from "react";

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
