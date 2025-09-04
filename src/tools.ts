import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { z } from 'zod';
import { 
  searchFlights, 
  searchFlightsRange, 
  getAirportByCode, 
  getAirlineByCode,
  searchAirports 
} from './amadeus-service.js';
import { Airport, Airline, FlightConnection, FlightSearchResult } from './types.js';

// Helper functions
function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0];
}

export function setupToolHandlers(server: Server) {
  // Tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'search_flights',
          description: 'Search for available flights between two airports on a specific date',
          inputSchema: {
            type: 'object',
            properties: {
              from: {
                type: 'string',
                description: 'Origin airport code (e.g., JFK, LAX)',
              },
              to: {
                type: 'string',
                description: 'Destination airport code (e.g., LHR, CDG)',
              },
              date: {
                type: 'string',
                description: 'Departure date in YYYY-MM-DD format (optional, defaults to current date)',
              },
              include_connecting: {
                type: 'boolean',
                description: 'Include connecting flights in search results (default: true)',
              },
            },
            required: ['from', 'to'],
          },
        },
        {
          name: 'search_flights_range',
          description: 'Search for available flights between two airports within a date range and time range',
          inputSchema: {
            type: 'object',
            properties: {
              from: {
                type: 'string',
                description: 'Origin airport code (e.g., JFK, LAX)',
              },
              to: {
                type: 'string',
                description: 'Destination airport code (e.g., LHR, CDG)',
              },
              start_date: {
                type: 'string',
                description: 'Start date in YYYY-MM-DD format',
              },
              end_date: {
                type: 'string',
                description: 'End date in YYYY-MM-DD format',
              },
              start_time: {
                type: 'string',
                description: 'Earliest departure time in HH:MM format (optional)',
              },
              end_time: {
                type: 'string',
                description: 'Latest departure time in HH:MM format (optional)',
              },
              include_connecting: {
                type: 'boolean',
                description: 'Include connecting flights in search results (default: true)',
              },
            },
            required: ['from', 'to', 'start_date', 'end_date'],
          },
        },
        {
          name: 'get_airport_info',
          description: 'Get detailed information about a specific airport',
          inputSchema: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description: 'Airport code (e.g., JFK, LAX)',
              },
            },
            required: ['code'],
          },
        },
        {
          name: 'get_airline_info',
          description: 'Get detailed information about a specific airline',
          inputSchema: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description: 'Airline code (e.g., AA, BA)',
              },
            },
            required: ['code'],
          },
        },
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    
    switch (name) {
      case 'search_flights': {
        const schema = z.object({
          from: z.string(),
          to: z.string(),
          date: z.string().optional(),
          include_connecting: z.boolean().default(true),
        });
        
        const { from, to, date = getCurrentDate(), include_connecting } = schema.parse(args);
        
        try {
          const result = await searchFlights(from, to, date, 1);
          
          // Filter connecting flights if not requested
          if (!include_connecting) {
            result.connecting = [];
          }
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        } catch (error) {
          throw new Error(`Flight search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      case 'search_flights_range': {
        const schema = z.object({
          from: z.string(),
          to: z.string(),
          start_date: z.string(),
          end_date: z.string(),
          start_time: z.string().optional(),
          end_time: z.string().optional(),
          include_connecting: z.boolean().default(true),
        });
        
        const { from, to, start_date, end_date, start_time, end_time, include_connecting } = schema.parse(args);
        
        try {
          let results = await searchFlightsRange(from, to, start_date, end_date, 1);
          
          // Filter by time if specified
          if (start_time || end_time) {
            results = results.map(result => ({
              ...result,
              direct: result.direct.filter(flight => {
                const flightTime = flight.departure.time.split('T')[1].substring(0, 5);
                if (start_time && flightTime < start_time) return false;
                if (end_time && flightTime > end_time) return false;
                return true;
              }),
              connecting: include_connecting ? result.connecting : []
            })).filter(result => result.direct.length > 0 || result.connecting.length > 0);
          }
          
          // Filter connecting flights if not requested
          if (!include_connecting) {
            results = results.map(result => ({
              ...result,
              connecting: []
            }));
          }
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(results, null, 2),
              },
            ],
          };
        } catch (error) {
          throw new Error(`Flight range search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      case 'get_airport_info': {
        const schema = z.object({
          code: z.string(),
        });
        
        const { code } = schema.parse(args);
        
        try {
          const airport = await getAirportByCode(code);
          
          if (!airport) {
            throw new Error(`Airport not found: ${code}`);
          }
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(airport, null, 2),
              },
            ],
          };
        } catch (error) {
          throw new Error(`Airport lookup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      case 'get_airline_info': {
        const schema = z.object({
          code: z.string(),
        });
        
        const { code } = schema.parse(args);
        
        try {
          const airline = await getAirlineByCode(code);
          
          if (!airline) {
            throw new Error(`Airline not found: ${code}`);
          }
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(airline, null, 2),
              },
            ],
          };
        } catch (error) {
          throw new Error(`Airline lookup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  });
}
