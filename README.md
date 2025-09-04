# CT Flight MCP Server

A Model Context Protocol (MCP) server for flight search functionality powered by the **Amadeus API**. This server provides resources, tools, and prompts for searching real flights, getting airport/airline information, and generating flight search queries.

The server supports both stdio and remote HTTP/SSE transport modes for flexible deployment options.

## Features

### Resources
- **Airport List**: Complete list of available airports with details (code, name, city, country, timezone, coordinates)
- **Airline List**: Complete list of available airlines with details (code, name, country)

### Tools
- **search_flights**: Search for direct and connecting flights between two airports on a specific date
- **search_flights_range**: Search for flights within a date range and optional time range
- **get_airport_info**: Get detailed information about a specific airport by code
- **get_airline_info**: Get detailed information about a specific airline by code

### Prompts
- **flight_search_query**: Generate natural language flight search queries
- **flight_comparison**: Generate prompts for comparing multiple flights

## Project Structure

The codebase is organized into modular files for better maintainability:

```
src/
├── index.ts          # Main server entry point and initialization
├── resources.ts      # Resource handlers (airports, airlines lists)
├── tools.ts          # Tool handlers (flight search, info lookup)
├── prompts.ts        # Prompt handlers (query generation, comparison)
├── types.ts          # TypeScript type definitions
├── amadeus-service.ts # Amadeus API integration and data conversion
├── amadeus.d.ts      # TypeScript type declarations for Amadeus SDK
└── mock-data.ts      # Fallback mock data for development/testing
```

### Architecture Benefits

- **Separation of Concerns**: Each file handles a specific aspect of the MCP server
- **Maintainability**: Easy to locate and modify specific functionality
- **Reusability**: Helper functions and types are shared across modules
- **Testability**: Individual modules can be tested independently
- **Scalability**: New resources, tools, or prompts can be easily added

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your Amadeus API credentials:
   ```env
   AMADEUS_API_KEY=your_amadeus_api_key_here
   AMADEUS_API_SECRET=your_amadeus_api_secret_here
   AMADEUS_ENVIRONMENT=test
   ```
   
   **Getting Amadeus API Credentials:**
   - Sign up at [Amadeus for Developers](https://developers.amadeus.com/)
   - Create a new application
   - Copy your API Key and API Secret
   - Use `test` environment for development, `production` for live data

4. Build the project:
   ```bash
   npm run build
   ```

## Usage

The server can be run in two modes:

### Remote Server Mode (HTTP/SSE)
The server runs as an HTTP server using Server-Sent Events (SSE) for real-time communication.

#### Development
```bash
npm run dev:remote
```

#### Production
```bash
npm run build
npm run start:remote
```

The server will be available at:
- **SSE Endpoint**: `http://localhost:3000/sse` - Connect here to establish the SSE stream
- **Message Endpoint**: `http://localhost:3000/message` - POST messages here with `sessionId` parameter

#### Environment Variables
- `HOST`: Server host (default: `localhost`)
- `PORT`: Server port (default: `3000`)

#### Example Connection
1. Connect to the SSE endpoint: `GET http://localhost:3000/sse`
2. The server will respond with an `endpoint` event containing the message URL with session ID
3. Send MCP messages via POST to the provided message endpoint

#### Testing the Remote Server
A test script is provided to demonstrate the remote server functionality:

```bash
# Start the server in one terminal
npm run dev:remote

# In another terminal, run the test script
npm run test:remote
```

The test script will:
1. Connect to the SSE endpoint
2. Receive the session ID and message endpoint
3. Test various MCP calls (list resources, get airport info, search flights)
4. Display responses in real-time

### Stdio Mode (Legacy)
For backward compatibility, the server can still run in stdio mode:

#### Development
```bash
npm run dev
```

#### Production
```bash
npm run build
npm start
```

## Real Flight Data

The server now uses the **Amadeus API** to provide real flight data, including:
- **Live Flight Search**: Real-time flight availability and pricing from airlines
- **Airport Database**: Comprehensive airport information from Amadeus
- **Airline Database**: Up-to-date airline information and details
- **Real Pricing**: Actual flight prices in various currencies
- **Live Schedules**: Current flight schedules and availability

### Fallback Support
For development and testing purposes, the server includes fallback mock data when API calls fail or during initial setup.

### Testing the API Integration
After setting up your environment variables, you can test the Amadeus API integration:

```bash
npm run build
npm run test:amadeus
```

This will verify that your API credentials are working and that the server can successfully connect to Amadeus.

## API Examples

### Remote Server Usage

When using the remote server mode, first establish an SSE connection and then send messages via POST:

```bash
# 1. Connect to SSE endpoint to get session ID
curl -N http://localhost:3000/sse

# The server responds with:
# event: endpoint
# data: /message?sessionId=<uuid>

# 2. Send MCP messages to the message endpoint
curl -X POST http://localhost:3000/message?sessionId=<uuid> \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "search_flights",
      "arguments": {
        "from": "JFK",
        "to": "LHR",
        "date": "2024-03-15",
        "include_connecting": true
      }
    }
  }'
```

### MCP Message Examples

#### Search Flights
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "search_flights",
    "arguments": {
      "from": "JFK",
      "to": "LHR",
      "date": "2024-03-15",
      "include_connecting": true
    }
  }
}
```

#### Get Airport Information
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "get_airport_info",
    "arguments": {
      "code": "JFK"
    }
  }
}
```

#### Search Flights in Date Range
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "search_flights_range",
    "arguments": {
      "from": "LAX",
      "to": "NRT",
      "start_date": "2024-03-15",
      "end_date": "2024-03-20",
      "start_time": "06:00",
      "end_time": "18:00"
    }
  }
}
```

## Flight Search Features

- **Direct Flights**: Find non-stop flights between airports
- **Connecting Flights**: Find flights with layovers through hub airports
- **Date Range Search**: Search across multiple dates
- **Time Filtering**: Filter flights by departure time
- **Realistic Data**: Mock flights with realistic schedules, aircraft types, and pricing
- **Layover Management**: Connecting flights include reasonable layover times (1-6 hours)

## Data Structure

### Airport
- Code, name, city, country
- Timezone information
- Geographic coordinates

### Airline
- Code, name, country
- Optional logo URL

### Flight
- Flight details (airline, flight number, aircraft)
- Departure and arrival information (airport, time, terminal, gate)
- Duration and pricing
- Realistic scheduling

### Flight Connections
- Multiple flight segments
- Layover information
- Total duration and pricing

## License

MIT
