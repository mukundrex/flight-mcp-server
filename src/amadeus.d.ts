declare module 'amadeus' {
  interface AmadeusConfig {
    clientId: string;
    clientSecret: string;
    hostname?: 'production' | 'test';
  }

  interface AmadeusResponse<T = any> {
    data: T;
    meta?: any;
    warnings?: any[];
  }

  interface AmadeusLocation {
    type: string;
    subType: string;
    name: string;
    detailedName?: string;
    id?: string;
    self?: any;
    timeZoneOffset?: string;
    iataCode: string;
    geoCode?: {
      latitude: string;
      longitude: string;
    };
    address?: {
      cityName: string;
      cityCode?: string;
      countryName: string;
      countryCode: string;
      stateCode?: string;
      regionCode?: string;
    };
    analytics?: any;
  }

  interface AmadeusAirline {
    type: string;
    iataCode: string;
    icaoCode?: string;
    businessName: string;
    commonName?: string;
  }

  interface AmadeusFlightOffer {
    type: string;
    id: string;
    source: string;
    instantTicketingRequired: boolean;
    nonHomogeneous: boolean;
    oneWay: boolean;
    lastTicketingDate: string;
    numberOfBookableSeats: number;
    itineraries: AmadeusItinerary[];
    price: AmadeusPrice;
    pricingOptions: any;
    validatingAirlineCodes: string[];
    travelerPricings: any[];
  }

  interface AmadeusItinerary {
    duration: string;
    segments: AmadeusSegment[];
  }

  interface AmadeusSegment {
    departure: AmadeusEndpoint;
    arrival: AmadeusEndpoint;
    carrierCode: string;
    number: string;
    aircraft: {
      code: string;
    };
    operating?: {
      carrierCode: string;
    };
    duration: string;
    id: string;
    numberOfStops: number;
    blacklistedInEU: boolean;
  }

  interface AmadeusEndpoint {
    iataCode: string;
    terminal?: string;
    at: string;
  }

  interface AmadeusPrice {
    currency: string;
    total: string;
    base: string;
    fees?: AmadeusFee[];
    grandTotal: string;
  }

  interface AmadeusFee {
    amount: string;
    type: string;
  }

  class Amadeus {
    constructor(config: AmadeusConfig);
    
    referenceData: {
      locations: {
        get(params: {
          keyword: string;
          subType: string;
        }): Promise<AmadeusResponse<AmadeusLocation[]>>;
      };
      airlines: {
        get(params: {
          airlineCodes: string;
        }): Promise<AmadeusResponse<AmadeusAirline[]>>;
      };
    };

    shopping: {
      flightOffersSearch: {
        get(params: {
          originLocationCode: string;
          destinationLocationCode: string;
          departureDate: string;
          adults: number;
          max?: number;
        }): Promise<AmadeusResponse<AmadeusFlightOffer[]>>;
      };
    };
  }

  export = Amadeus;
}
