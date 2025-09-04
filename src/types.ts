export interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
  timezone: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

export interface Airline {
  code: string;
  name: string;
  country: string;
  logo?: string;
}

export interface Flight {
  id: string;
  airline: Airline;
  flightNumber: string;
  departure: {
    airport: Airport;
    time: string;
    terminal?: string;
    gate?: string;
  };
  arrival: {
    airport: Airport;
    time: string;
    terminal?: string;
    gate?: string;
  };
  duration: number; // in minutes
  aircraft: string;
  price: {
    amount: number;
    currency: string;
  };
}

export interface FlightConnection {
  flights: Flight[];
  totalDuration: number; // in minutes
  totalPrice: {
    amount: number;
    currency: string;
  };
  layovers: Array<{
    airport: Airport;
    duration: number; // in minutes
  }>;
}

export interface FlightSearchResult {
  direct: Flight[];
  connecting: FlightConnection[];
  searchParams: {
    from: string;
    to: string;
    date: string;
    returnDate?: string;
    passengers: number;
  };
}
