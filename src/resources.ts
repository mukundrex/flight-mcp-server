import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { AIRPORTS, MOCK_AIRLINES, findAirportByCode } from './mock-data.js';

export function setupResourceHandlers(server: Server) {
  // Resources
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
      resources: [
        {
          uri: 'airport://list',
          name: 'Airport List',
          description: 'List of all available airports with their details (loaded from airport_code.csv)',
          mimeType: 'application/json',
        },
        {
          uri: 'airport://{code}',
          name: 'Individual Airport',
          description: 'Get details for a specific airport by its IATA/ICAO code (e.g., airport://JFK)',
          mimeType: 'application/json',
        },
        {
          uri: 'airline://list',
          name: 'Airline List',
          description: 'List of all available airlines with their details',
          mimeType: 'application/json',
        },
      ],
    };
  });

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;
    
    if (uri === 'airport://list') {
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(AIRPORTS, null, 2),
          },
        ],
      };
    }
    
    if (uri.startsWith('airport://') && uri !== 'airport://list') {
      // Extract airport code from URI (e.g., airport://JFK -> JFK)
      const airportCode = uri.replace('airport://', '');
      const airport = findAirportByCode(airportCode);
      
      if (!airport) {
        throw new Error(`Airport not found: ${airportCode}`);
      }
      
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(airport, null, 2),
          },
        ],
      };
    }
    
    if (uri === 'airline://list') {
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(MOCK_AIRLINES, null, 2),
          },
        ],
      };
    }
    
    throw new Error(`Unknown resource: ${uri}`);
  });
}
