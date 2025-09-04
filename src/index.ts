#!/usr/bin/env node

import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import { parse } from 'node:url';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
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

// Store active SSE transports by session ID
const activeTransports = new Map<string, SSEServerTransport>();

async function handleRequest(req: IncomingMessage, res: ServerResponse) {
  const url = parse(req.url || '', true);
  const path = url.pathname;
  const sessionId = url.query.sessionId as string;

  // Enable CORS for development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (path === '/sse' && req.method === 'GET') {
    // Handle SSE connection
    const transport = new SSEServerTransport('/message', res);
    activeTransports.set(transport.sessionId, transport);
    
    // Clean up transport when connection closes
    transport.onclose = () => {
      activeTransports.delete(transport.sessionId);
    };

    await server.connect(transport);
    console.error(`New SSE connection established with session ID: ${transport.sessionId}`);
  } else if (path === '/message' && req.method === 'POST') {
    // Handle incoming messages
    if (!sessionId) {
      res.writeHead(400).end('Missing sessionId parameter');
      return;
    }

    const transport = activeTransports.get(sessionId);
    if (!transport) {
      res.writeHead(404).end('Session not found');
      return;
    }

    await transport.handlePostMessage(req, res);
  } else {
    res.writeHead(404).end('Not found');
  }
}

async function main() {
  const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
  const host = process.env.HOST || 'localhost';

  const httpServer = createServer(handleRequest);
  
  httpServer.listen(port, host, () => {
    console.error(`CT Flight MCP Server running on http://${host}:${port}`);
    console.error(`SSE endpoint: http://${host}:${port}/sse`);
    console.error(`Message endpoint: http://${host}:${port}/message`);
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.error('Shutting down server...');
    httpServer.close(() => {
      process.exit(0);
    });
  });
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
