#!/usr/bin/env node

import { EventSource } from 'eventsource';
import fetch from 'node-fetch';

/**
 * Simple test script to demonstrate the remote MCP server functionality
 */
async function testRemoteServer() {
  const serverUrl = 'http://localhost:3000';
  let sessionId = null;
  let messageEndpoint = null;

  console.log('🚀 Testing CT Flight MCP Remote Server...\n');

  // Step 1: Connect to SSE endpoint
  console.log('1. Connecting to SSE endpoint...');
  
  const eventSource = new EventSource(`${serverUrl}/sse`);
  
  eventSource.onopen = () => {
    console.log('✅ SSE connection established');
  };

  eventSource.addEventListener('endpoint', (event) => {
    messageEndpoint = event.data;
    const url = new URL(messageEndpoint, serverUrl);
    sessionId = url.searchParams.get('sessionId');
    console.log(`✅ Received endpoint: ${messageEndpoint}`);
    console.log(`✅ Session ID: ${sessionId}\n`);
    
    // Step 2: Test MCP functionality
    testMCPCalls();
  });

  eventSource.addEventListener('message', (event) => {
    console.log('📨 Received response:', JSON.parse(event.data));
  });

  eventSource.onerror = (error) => {
    console.error('❌ SSE error:', error);
  };

  async function testMCPCalls() {
    if (!sessionId || !messageEndpoint) {
      console.error('❌ No session established');
      return;
    }

    const messageUrl = `${serverUrl}${messageEndpoint}`;

    // Test 1: List resources
    console.log('2. Testing resources/list...');
    await sendMessage(messageUrl, {
      jsonrpc: '2.0',
      id: 1,
      method: 'resources/list',
      params: {}
    });

    // Test 2: Get airport info
    console.log('\n3. Testing get_airport_info...');
    await sendMessage(messageUrl, {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'get_airport_info',
        arguments: {
          code: 'JFK'
        }
      }
    });

    // Test 3: Search flights
    console.log('\n4. Testing search_flights...');
    await sendMessage(messageUrl, {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'search_flights',
        arguments: {
          from: 'JFK',
          to: 'LHR',
          date: '2024-03-15',
          include_connecting: true
        }
      }
    });

    // Close after tests
    setTimeout(() => {
      console.log('\n✅ Tests completed! Closing connection...');
      eventSource.close();
      process.exit(0);
    }, 5000);
  }

  async function sendMessage(url, message) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message)
      });

      if (response.ok) {
        console.log(`✅ Message sent (ID: ${message.id})`);
      } else {
        console.error(`❌ Failed to send message: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Error sending message:', error.message);
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down test client...');
  process.exit(0);
});

testRemoteServer().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
