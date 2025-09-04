#!/usr/bin/env node

// Simple test script to demonstrate MCP server capabilities
// This would typically be used with an MCP client, but here's a basic example

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Testing CT Flight MCP Server');
console.log('================================\n');

// Test server startup
console.log('1. Testing server startup...');
const serverProcess = spawn('node', [join(__dirname, 'build/index.js')], {
  stdio: ['pipe', 'pipe', 'inherit']
});

// Send a simple MCP message to list resources
const testMessage = JSON.stringify({
  jsonrpc: '2.0',
  id: 1,
  method: 'resources/list',
  params: {}
}) + '\n';

serverProcess.stdin.write(testMessage);

let responseData = '';
serverProcess.stdout.on('data', (data) => {
  responseData += data.toString();
  
  try {
    const response = JSON.parse(responseData);
    if (response.id === 1) {
      console.log('✅ Server responded successfully!');
      console.log('📋 Available resources:');
      response.result.resources.forEach(resource => {
        console.log(`   - ${resource.name}: ${resource.description}`);
      });
      
      // Test tool listing
      const toolsMessage = JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list',
        params: {}
      }) + '\n';
      
      serverProcess.stdin.write(toolsMessage);
      responseData = '';
    } else if (response.id === 2) {
      console.log('\n🔧 Available tools:');
      response.result.tools.forEach(tool => {
        console.log(`   - ${tool.name}: ${tool.description}`);
      });
      
      // Test prompt listing
      const promptsMessage = JSON.stringify({
        jsonrpc: '2.0',
        id: 3,
        method: 'prompts/list',
        params: {}
      }) + '\n';
      
      serverProcess.stdin.write(promptsMessage);
      responseData = '';
    } else if (response.id === 3) {
      console.log('\n💬 Available prompts:');
      response.result.prompts.forEach(prompt => {
        console.log(`   - ${prompt.name}: ${prompt.description}`);
      });
      
      console.log('\n✅ All tests passed! MCP server is working correctly.');
      console.log('\n🎯 Example usage:');
      console.log('   - Search flights: search_flights with from="JFK", to="LHR", date="2024-03-15"');
      console.log('   - Get airport info: get_airport_info with code="JFK"');
      console.log('   - Flight search prompt: flight_search_query with from_city="New York", to_city="London"');
      
      serverProcess.kill();
      process.exit(0);
    }
  } catch (e) {
    // Response might be incomplete, wait for more data
  }
});

serverProcess.on('error', (error) => {
  console.error('❌ Server error:', error);
  process.exit(1);
});

// Timeout after 10 seconds
setTimeout(() => {
  console.log('⏰ Test timeout');
  serverProcess.kill();
  process.exit(1);
}, 10000);
