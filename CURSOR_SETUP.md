# Cursor MCP Integration Guide

This guide explains how to connect the CT Flight MCP Server to Cursor's MCP client.

## Prerequisites

1. Ensure you have Cursor installed with MCP support
2. Build the server: `npm run build`

## Configuration Options

### Option 1: Remote Server (SSE) - Recommended

**Step 1: Start the Server**
```bash
# Start the remote server
npm run start:remote
```
The server will be available at `http://localhost:3000`

**Step 2: Configure in Cursor**
1. Open Cursor Settings
2. Navigate to `Features` > `MCP`
3. Click `+ Add New MCP Server`
4. Fill in the configuration:
   - **Name**: `CT Flight Search`
   - **Type**: `sse`
   - **URL**: `http://localhost:3000/sse`
5. Save the configuration
6. Click the refresh button to populate the tool list

### Option 2: Stdio (Legacy)

**Step 1: Build the Server**
```bash
npm run build
```

**Step 2: Configure in Cursor**
1. Open Cursor Settings
2. Navigate to `Features` > `MCP`
3. Click `+ Add New MCP Server`
4. Fill in the configuration:
   - **Name**: `CT Flight Search`
   - **Type**: `stdio`
   - **Command**: `node /Users/balmukund.kumar/ct-flight-mcp-server/build/stdio-server.js`
5. Save the configuration
6. Click the refresh button to populate the tool list

## Available Tools in Cursor

Once connected, Cursor will have access to these tools:

### Resources
- **Airport List**: Complete list of available airports
- **Airline List**: Complete list of available airlines

### Tools
- **search_flights**: Search for direct and connecting flights
- **search_flights_range**: Search flights within a date range
- **get_airport_info**: Get detailed airport information
- **get_airline_info**: Get detailed airline information

### Prompts
- **flight_search_query**: Generate natural language flight search queries
- **flight_comparison**: Generate flight comparison prompts

## Testing the Integration

After configuration, test the integration by asking Cursor:

```
"Find me flights from JFK to LHR on March 15, 2024"
```

Or:

```
"What airports are available for flight search?"
```

Cursor should automatically use the MCP tools to provide flight information.

## Troubleshooting

### Server Not Connecting
- Ensure the server is running (`npm run start:remote` for SSE mode)
- Check that the URL/command path is correct
- Try refreshing the MCP server list in Cursor settings

### Tools Not Appearing
- Click the refresh button in the MCP server entry
- Restart Cursor after configuration changes
- Check the Cursor console for any error messages

### Permission Issues (Stdio Mode)
- Ensure the build directory exists: `npm run build`
- Check file permissions on the built JavaScript files
- Use absolute paths in the command configuration

## Production Deployment

For production use with remote teams:

1. Deploy the server to a cloud provider
2. Update the SSE URL to your deployed endpoint
3. Consider adding authentication if needed
4. Use environment variables for configuration

Example production URL: `https://your-domain.com/sse`
