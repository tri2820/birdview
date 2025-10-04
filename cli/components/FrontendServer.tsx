import { Box, Text } from "ink";
import useProdServer from "./useProdServer";
import React from "react";

export default function FrontendServer() {
  const frontend = useProdServer();

  return (
    <Box
      borderStyle="single"
      borderColor="gray"
      flexDirection="column"
      paddingX={1}
    >
      <Text color="cyan">
        <Text bold>Frontend:</Text> {frontend.status}
      </Text>
      <Text color="gray">{frontend.output}</Text>
    </Box>
  );
}
