#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { setupResourceHandlers } from './resources.js';
import { setupToolHandlers } from './tools.js';
import { setupPromptHandlers } from './prompts.js';

const server = new Server(
  {
    name: 'ct-flight-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      resources: {},
      tools: {},
      prompts: {},
    },
  }
);

// Setup handlers
setupResourceHandlers(server);
setupToolHandlers(server);
setupPromptHandlers(server);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('CT Flight MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
