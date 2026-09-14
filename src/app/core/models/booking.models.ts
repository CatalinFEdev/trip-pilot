export interface FlightOffer {
  id: string;
  airline: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departure: string;
  arrival: string;
  durationMinutes: number;
  stops: number;
  cabin: string;
  priceEur: number;
}

export interface StayOffer {
  id: string;
  name: string;
  city: string;
  kind: 'hotel' | 'apartment' | 'hostel' | 'villa';
  rating: number;
  reviews: number;
  nightlyPriceEur: number;
  nights: number;
  totalPriceEur: number;
  amenities: string[];
}

export interface TaxiQuote {
  id: string;
  airport: string;
  dropOffAddress: string;
  pickUpTime: string;
  passengers: number;
  estimatedPriceEur: number;
  status: 'waitlisted';
}

export interface FlightSearchCriteria {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers?: number;
  cabin?: string;
}

export interface StaySearchCriteria {
  city: string;
  checkIn: string;
  checkOut: string;
  guests?: number;
  maxNightlyPrice?: number;
}

export interface TaxiRequest {
  airport: string;
  dropOffAddress: string;
  pickUpTime: string;
  passengers?: number;
}
