import { Airport, Airline, Flight } from './types.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load and parse airport data from CSV
function loadAirportsFromCSV(): Airport[] {
  try {
    const csvPath = path.join(__dirname, 'airport_code.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n');
    
    // Skip header and parse each line
    const airports: Airport[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Parse CSV line (handle quoted values)
      const matches = line.match(/^([^,]+),(.*)$/);
      if (!matches) continue;
      
      const code = matches[1].trim();
      let cityName = matches[2].trim();
      
      // Remove quotes if present
      if (cityName.startsWith('"') && cityName.endsWith('"')) {
        cityName = cityName.slice(1, -1);
      }
      
      // Skip empty city names
      if (!cityName || cityName === '""' || cityName === '') continue;
      
      // Create airport object with basic information
      // Since CSV only has code and city, we'll use defaults for other fields
      airports.push({
        code: code,
        name: `${cityName} Airport`,
        city: cityName,
        country: 'Unknown', // CSV doesn't have country data
        timezone: 'UTC', // Default timezone
        coordinates: { latitude: 0, longitude: 0 } // Default coordinates
      });
    }
    
    return airports;
  } catch (error) {
    console.error('Error loading airports from CSV:', error);
    // Fallback to a few sample airports if CSV loading fails
    return [
      {
        code: 'JFK',
        name: 'John F. Kennedy International Airport',
        city: 'New York',
        country: 'United States',
        timezone: 'America/New_York',
        coordinates: { latitude: 40.6413, longitude: -73.7781 }
      },
      {
        code: 'LAX',
        name: 'Los Angeles International Airport',
        city: 'Los Angeles',
        country: 'United States',
        timezone: 'America/Los_Angeles',
        coordinates: { latitude: 34.0522, longitude: -118.2437 }
      }
    ];
  }
}

export const AIRPORTS: Airport[] = loadAirportsFromCSV();

// Function to find airport by code
export function findAirportByCode(code: string): Airport | undefined {
  return AIRPORTS.find(airport => airport.code.toLowerCase() === code.toLowerCase());
}

// Function to get all airports (for backward compatibility)
export const MOCK_AIRPORTS: Airport[] = AIRPORTS;

export const MOCK_AIRLINES: Airline[] = [
  {
    code: 'AA',
    name: 'American Airlines',
    country: 'United States'
  },
  {
    code: 'BA',
    name: 'British Airways',
    country: 'United Kingdom'
  },
  {
    code: 'AF',
    name: 'Air France',
    country: 'France'
  },
  {
    code: 'LH',
    name: 'Lufthansa',
    country: 'Germany'
  },
  {
    code: 'JL',
    name: 'Japan Airlines',
    country: 'Japan'
  },
  {
    code: 'SQ',
    name: 'Singapore Airlines',
    country: 'Singapore'
  },
  {
    code: 'EK',
    name: 'Emirates',
    country: 'United Arab Emirates'
  },
  {
    code: 'QF',
    name: 'Qantas',
    country: 'Australia'
  },
  {
    code: 'AC',
    name: 'Air Canada',
    country: 'Canada'
  },
  {
    code: 'DL',
    name: 'Delta Air Lines',
    country: 'United States'
  }
];

// Helper function to generate mock flights
export function generateMockFlights(
  fromAirport: Airport,
  toAirport: Airport,
  date: string,
  count: number = 5
): Flight[] {
  const flights: Flight[] = [];
  const airlines = MOCK_AIRLINES.slice(0, Math.min(count, MOCK_AIRLINES.length));
  
  for (let i = 0; i < count; i++) {
    const airline = airlines[i % airlines.length];
    const departureHour = 6 + (i * 3) % 18; // Spread flights throughout the day
    const duration = 120 + Math.floor(Math.random() * 480); // 2-10 hours
    const arrivalTime = new Date(`${date}T${departureHour.toString().padStart(2, '0')}:00:00`);
    arrivalTime.setMinutes(arrivalTime.getMinutes() + duration);
    
    flights.push({
      id: `${airline.code}${(100 + i).toString()}`,
      airline,
      flightNumber: `${airline.code}${(100 + i).toString()}`,
      departure: {
        airport: fromAirport,
        time: `${date}T${departureHour.toString().padStart(2, '0')}:${(Math.floor(Math.random() * 60)).toString().padStart(2, '0')}:00`,
        terminal: `T${Math.floor(Math.random() * 3) + 1}`,
        gate: `${String.fromCharCode(65 + Math.floor(Math.random() * 10))}${Math.floor(Math.random() * 50) + 1}`
      },
      arrival: {
        airport: toAirport,
        time: arrivalTime.toISOString().split('.')[0],
        terminal: `T${Math.floor(Math.random() * 3) + 1}`,
        gate: `${String.fromCharCode(65 + Math.floor(Math.random() * 10))}${Math.floor(Math.random() * 50) + 1}`
      },
      duration,
      aircraft: ['Boeing 737', 'Airbus A320', 'Boeing 777', 'Airbus A350'][Math.floor(Math.random() * 4)],
      price: {
        amount: 200 + Math.floor(Math.random() * 1000),
        currency: 'USD'
      }
    });
  }
  
  return flights;
}
