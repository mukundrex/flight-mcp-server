import Amadeus from 'amadeus';
import dotenv from 'dotenv';
import { Airport, Airline, Flight, FlightConnection, FlightSearchResult } from './types.js';

// Load environment variables
dotenv.config();

// Initialize Amadeus client
const amadeus = new Amadeus({
  clientId: process.env.AMADEUS_API_KEY!,
  clientSecret: process.env.AMADEUS_API_SECRET!,
  hostname: process.env.AMADEUS_ENVIRONMENT === 'production' ? 'production' : 'test'
});

// Cache for airports and airlines to reduce API calls
const airportCache = new Map<string, Airport>();
const airlineCache = new Map<string, Airline>();

// Currency conversion rate from EUR to INR
const EUR_TO_INR_RATE = 102.57;

/**
 * Convert EUR price to INR
 */
function convertEurToInr(amount: number): number {
  return Math.round(amount * EUR_TO_INR_RATE * 100) / 100; // Round to 2 decimal places
}

/**
 * Convert Amadeus airport data to our Airport interface
 */
function convertAmadeusAirport(amadeusAirport: any): Airport {
  return {
    code: amadeusAirport.iataCode || amadeusAirport.code,
    name: amadeusAirport.name || `${amadeusAirport.address?.cityName} Airport`,
    city: amadeusAirport.address?.cityName || amadeusAirport.city || '',
    country: amadeusAirport.address?.countryName || amadeusAirport.country || '',
    timezone: amadeusAirport.timeZoneOffset || 'UTC',
    coordinates: {
      latitude: parseFloat(amadeusAirport.geoCode?.latitude || '0'),
      longitude: parseFloat(amadeusAirport.geoCode?.longitude || '0')
    }
  };
}

/**
 * Convert Amadeus airline data to our Airline interface
 */
function convertAmadeusAirline(amadeusAirline: any): Airline {
  return {
    code: amadeusAirline.iataCode || amadeusAirline.code,
    name: amadeusAirline.businessName || amadeusAirline.name || '',
    country: amadeusAirline.address?.countryName || ''
  };
}

/**
 * Convert Amadeus flight offer to our Flight interface
 */
function convertAmadeusFlight(offer: any, airports: Map<string, Airport>, airlines: Map<string, Airline>): Flight {
  const segment = offer.itineraries[0].segments[0];
  const departureAirport = airports.get(segment.departure.iataCode) || {
    code: segment.departure.iataCode,
    name: `${segment.departure.iataCode} Airport`,
    city: segment.departure.iataCode,
    country: 'Unknown',
    timezone: 'UTC',
    coordinates: { latitude: 0, longitude: 0 }
  };
  
  const arrivalAirport = airports.get(segment.arrival.iataCode) || {
    code: segment.arrival.iataCode,
    name: `${segment.arrival.iataCode} Airport`,
    city: segment.arrival.iataCode,
    country: 'Unknown',
    timezone: 'UTC',
    coordinates: { latitude: 0, longitude: 0 }
  };

  const airline = airlines.get(segment.carrierCode) || {
    code: segment.carrierCode,
    name: segment.carrierCode,
    country: 'Unknown'
  };

  const duration = parseDuration(offer.itineraries[0].duration);
  
  // Convert price from EUR to INR if currency is EUR
  const originalAmount = parseFloat(offer.price.total);
  const convertedAmount = offer.price.currency === 'EUR' ? convertEurToInr(originalAmount) : originalAmount;
  const currency = offer.price.currency === 'EUR' ? 'INR' : offer.price.currency;
  
  return {
    id: offer.id,
    airline,
    flightNumber: `${segment.carrierCode}${segment.number}`,
    departure: {
      airport: departureAirport,
      time: segment.departure.at,
      terminal: segment.departure.terminal
    },
    arrival: {
      airport: arrivalAirport,
      time: segment.arrival.at,
      terminal: segment.arrival.terminal
    },
    duration,
    aircraft: segment.aircraft?.code || 'Unknown',
    price: {
      amount: convertedAmount,
      currency: currency
    }
  };
}

/**
 * Parse ISO 8601 duration to minutes
 */
function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return 0;
  
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  return hours * 60 + minutes;
}

/**
 * Search for airports by city or code
 */
export async function searchAirports(keyword: string): Promise<Airport[]> {
  try {
    const response = await amadeus.referenceData.locations.get({
      keyword,
      subType: 'AIRPORT,CITY'
    });
    
    return response.data.map(convertAmadeusAirport);
  } catch (error) {
    console.error('Error searching airports:', error);
    return [];
  }
}

/**
 * Get airport information by code
 */
export async function getAirportByCode(code: string): Promise<Airport | null> {
  // Check cache first
  if (airportCache.has(code)) {
    return airportCache.get(code)!;
  }

  try {
    const response = await amadeus.referenceData.locations.get({
      keyword: code,
      subType: 'AIRPORT'
    });
    
    if (response.data.length > 0) {
      const airport = convertAmadeusAirport(response.data[0]);
      airportCache.set(code, airport);
      return airport;
    }
  } catch (error) {
    console.error(`Error getting airport ${code}:`, error);
  }
  
  return null;
}

/**
 * Get airline information by code
 */
export async function getAirlineByCode(code: string): Promise<Airline | null> {
  // Check cache first
  if (airlineCache.has(code)) {
    return airlineCache.get(code)!;
  }

  try {
    const response = await amadeus.referenceData.airlines.get({
      airlineCodes: code
    });
    
    if (response.data.length > 0) {
      const airline = convertAmadeusAirline(response.data[0]);
      airlineCache.set(code, airline);
      return airline;
    }
  } catch (error) {
    console.error(`Error getting airline ${code}:`, error);
  }
  
  return null;
}

/**
 * Search for flights between two airports
 */
export async function searchFlights(
  originCode: string,
  destinationCode: string,
  departureDate: string,
  adults: number = 1
): Promise<FlightSearchResult> {
  try {
    // Get airport and airline information
    const [originAirport, destinationAirport] = await Promise.all([
      getAirportByCode(originCode),
      getAirportByCode(destinationCode)
    ]);

    if (!originAirport) {
      throw new Error(`Origin airport not found: ${originCode}`);
    }
    if (!destinationAirport) {
      throw new Error(`Destination airport not found: ${destinationCode}`);
    }

    // Search for flight offers
    const response = await amadeus.shopping.flightOffersSearch.get({
      originLocationCode: originCode,
      destinationLocationCode: destinationCode,
      departureDate,
      adults,
      max: 10
    });

    // Create maps for airports and airlines
    const airports = new Map<string, Airport>();
    const airlines = new Map<string, Airline>();
    
    airports.set(originCode, originAirport);
    airports.set(destinationCode, destinationAirport);

    // Collect unique airline codes
    const airlineCodes = new Set<string>();
    response.data.forEach((offer: any) => {
      offer.itineraries.forEach((itinerary: any) => {
        itinerary.segments.forEach((segment: any) => {
          airlineCodes.add(segment.carrierCode);
        });
      });
    });

    // Fetch airline information
    for (const code of airlineCodes) {
      const airline = await getAirlineByCode(code);
      if (airline) {
        airlines.set(code, airline);
      }
    }

    // Convert offers to our format
    const directFlights: Flight[] = [];
    const connectingFlights: FlightConnection[] = [];

    response.data.forEach((offer: any) => {
      if (offer.itineraries[0].segments.length === 1) {
        // Direct flight
        directFlights.push(convertAmadeusFlight(offer, airports, airlines));
      } else {
        // Connecting flight
        const flights = offer.itineraries[0].segments.map((segment: any, index: number) => {
          // Create a mock offer for each segment
          const segmentPrice = parseFloat(offer.price.total) / offer.itineraries[0].segments.length;
          const segmentOffer = {
            id: `${offer.id}-${index}`,
            itineraries: [{
              segments: [segment],
              duration: segment.duration || 'PT2H'
            }],
            price: {
              total: segmentPrice.toFixed(2),
              currency: offer.price.currency
            }
          };
          return convertAmadeusFlight(segmentOffer, airports, airlines);
        });

        const layovers = offer.itineraries[0].segments.slice(0, -1).map((segment: any, index: number) => {
          const nextSegment = offer.itineraries[0].segments[index + 1];
          const layoverAirport = airports.get(segment.arrival.iataCode) || {
            code: segment.arrival.iataCode,
            name: `${segment.arrival.iataCode} Airport`,
            city: segment.arrival.iataCode,
            country: 'Unknown',
            timezone: 'UTC',
            coordinates: { latitude: 0, longitude: 0 }
          };
          
          const arrivalTime = new Date(segment.arrival.at);
          const departureTime = new Date(nextSegment.departure.at);
          const duration = Math.floor((departureTime.getTime() - arrivalTime.getTime()) / (1000 * 60));
          
          return {
            airport: layoverAirport,
            duration
          };
        });

        const totalDuration = parseDuration(offer.itineraries[0].duration);
        
        // Convert total price from EUR to INR if currency is EUR
        const originalTotalAmount = parseFloat(offer.price.total);
        const convertedTotalAmount = offer.price.currency === 'EUR' ? convertEurToInr(originalTotalAmount) : originalTotalAmount;
        const totalCurrency = offer.price.currency === 'EUR' ? 'INR' : offer.price.currency;
        
        connectingFlights.push({
          flights,
          totalDuration,
          totalPrice: {
            amount: convertedTotalAmount,
            currency: totalCurrency
          },
          layovers
        });
      }
    });

    return {
      direct: directFlights,
      connecting: connectingFlights,
      searchParams: {
        from: originCode,
        to: destinationCode,
        date: departureDate,
        passengers: adults
      }
    };

  } catch (error) {
    console.error('Error searching flights:', error);
    throw error;
  }
}

/**
 * Search for flights within a date range
 */
export async function searchFlightsRange(
  originCode: string,
  destinationCode: string,
  startDate: string,
  endDate: string,
  adults: number = 1
): Promise<FlightSearchResult[]> {
  const results: FlightSearchResult[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    try {
      const result = await searchFlights(originCode, destinationCode, dateStr, adults);
      if (result.direct.length > 0 || result.connecting.length > 0) {
        results.push(result);
      }
    } catch (error) {
      console.error(`Error searching flights for ${dateStr}:`, error);
      // Continue with next date
    }
  }
  
  return results;
}
