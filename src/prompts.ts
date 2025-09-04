import {
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { z } from 'zod';

export function setupPromptHandlers(server: Server) {
  // Prompts
  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return {
      prompts: [
        {
          name: 'flight_search_query',
          description: 'Generate a natural language flight search query',
          arguments: [
            {
              name: 'from_city',
              description: 'Departure city or airport',
              required: true,
            },
            {
              name: 'to_city',
              description: 'Destination city or airport',
              required: true,
            },
            {
              name: 'travel_date',
              description: 'Travel date (optional)',
              required: false,
            },
            {
              name: 'return_date',
              description: 'Return date for round trip (optional)',
              required: false,
            },
            {
              name: 'passengers',
              description: 'Number of passengers (optional, default: 1)',
              required: false,
            },
            {
              name: 'class',
              description: 'Travel class preference (economy, business, first)',
              required: false,
            },
          ],
        },
        {
          name: 'flight_comparison',
          description: 'Generate a prompt for comparing multiple flights',
          arguments: [
            {
              name: 'flights_data',
              description: 'JSON data of flights to compare',
              required: true,
            },
            {
              name: 'criteria',
              description: 'Comparison criteria (price, duration, convenience, etc.)',
              required: false,
            },
          ],
        },
      ],
    };
  });

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    
    switch (name) {
      case 'flight_search_query': {
        const schema = z.object({
          from_city: z.string(),
          to_city: z.string(),
          travel_date: z.string().optional(),
          return_date: z.string().optional(),
          passengers: z.string().default('1'),
          class: z.string().optional(),
        });
        
        const { from_city, to_city, travel_date, return_date, passengers, class: travelClass } = schema.parse(args);
        
        let prompt = `Find flights from ${from_city} to ${to_city}`;
        
        if (travel_date) {
          prompt += ` on ${travel_date}`;
        }
        
        if (return_date) {
          prompt += ` returning on ${return_date}`;
        }
        
        if (passengers !== '1') {
          prompt += ` for ${passengers} passengers`;
        }
        
        if (travelClass) {
          prompt += ` in ${travelClass} class`;
        }
        
        prompt += '. Please include both direct flights and connecting flights with reasonable layover times. Show me the best options sorted by price and total travel time.';
        
        return {
          description: 'Flight search query for the given parameters',
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: prompt,
              },
            },
          ],
        };
      }
      
      case 'flight_comparison': {
        const schema = z.object({
          flights_data: z.string(),
          criteria: z.string().optional(),
        });
        
        const { flights_data, criteria = 'price, duration, and convenience' } = schema.parse(args);
        
        const prompt = `Please analyze and compare the following flight options based on ${criteria}:

${flights_data}

Provide a detailed comparison highlighting:
1. Price differences and value for money
2. Total travel time including layovers
3. Convenience factors (departure times, number of stops, airports)
4. Airline reputation and service quality
5. Your recommendation with reasoning

Format the response in a clear, easy-to-read manner that helps with decision making.`;
        
        return {
          description: 'Flight comparison analysis prompt',
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: prompt,
              },
            },
          ],
        };
      }
      
      default:
        throw new Error(`Unknown prompt: ${name}`);
    }
  });
}
