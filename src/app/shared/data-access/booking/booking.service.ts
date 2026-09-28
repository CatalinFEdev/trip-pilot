import { Injectable, signal } from '@angular/core';
import {
  FlightOffer,
  FlightSearchCriteria,
  StayOffer,
  StaySearchCriteria,
  TaxiQuote,
  TaxiRequest,
} from './flights.model';

const AIRLINES = [
  ['Wizz Air', 'W6'],
  ['Lufthansa', 'LH'],
  ['KLM', 'KL'],
  ['Air France', 'AF'],
  ['Ryanair', 'FR'],
  ['Tarom', 'RO'],
];

const STAY_KINDS: StayOffer['kind'][] = ['hotel', 'apartment', 'hostel', 'villa'];

const AMENITIES = [
  'Free WiFi',
  'Breakfast included',
  'Airport shuttle',
  'Air conditioning',
  'Parking',
  'Pool',
  'Gym',
  'Pet friendly',
];

/** Deterministic pseudo-random so the same query always yields the same demo data. */
function seedFrom(value: string): () => number {
  let h = 2166136261;
  for (const ch of value) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function nightsBetween(checkIn: string, checkOut: string): number {
  const ms = Date.parse(checkOut) - Date.parse(checkIn);
  if (!Number.isFinite(ms)) return 1;
  return Math.max(1, Math.round(ms / 86_400_000));
}

/**
 * Demo search backend. Replace the bodies with real supplier APIs
 * (Amadeus / Duffel / Booking.com …) without touching the AG-UI layer.
 */
@Injectable({ providedIn: 'root' })
export class BookingService {
  readonly lastFlightResults = signal<FlightOffer[]>([]);
  readonly lastStayResults = signal<StayOffer[]>([]);
  readonly taxiWaitlist = signal<TaxiQuote[]>([]);

  searchFlights(criteria: FlightSearchCriteria): FlightOffer[] {
    const rand = seedFrom(
      `${criteria.origin}|${criteria.destination}|${criteria.departureDate}|${criteria.returnDate ?? ''}|${criteria.cabin ?? 'economy'}`,
    );
    const passengers = criteria.passengers ?? 1;
    const offers: FlightOffer[] = Array.from({ length: 5 }, (_, i) => {
      const [airline, code] = AIRLINES[Math.floor(rand() * AIRLINES.length)];
      const departHour = 6 + Math.floor(rand() * 14);
      const departMinute = Math.floor(rand() * 4) * 15;
      const durationMinutes = 70 + Math.floor(rand() * 260);
      const departure = new Date(`${criteria.departureDate}T00:00:00Z`);
      departure.setUTCHours(departHour, departMinute, 0, 0);
      const arrival = new Date(departure.getTime() + durationMinutes * 60_000);
      const stops = durationMinutes > 240 ? 1 : 0;
      let base = 39 + Math.round(rand() * 260) + stops * 20;

      let returnLeg: FlightOffer['returnLeg'];
      if (criteria.returnDate) {
        const returnDurationMinutes = 70 + Math.floor(rand() * 260);
        const returnDeparture = new Date(`${criteria.returnDate}T00:00:00Z`);
        returnDeparture.setUTCHours(6 + Math.floor(rand() * 14), Math.floor(rand() * 4) * 15, 0, 0);
        const returnStops = returnDurationMinutes > 240 ? 1 : 0;
        base += 39 + Math.round(rand() * 260) + returnStops * 20;

        returnLeg = {
          flightNumber: `${code}${100 + Math.floor(rand() * 899)}`,
          origin: criteria.destination,
          destination: criteria.origin,
          departure: returnDeparture.toISOString(),
          arrival: new Date(returnDeparture.getTime() + returnDurationMinutes * 60_000).toISOString(),
          durationMinutes: returnDurationMinutes,
          stops: returnStops,
        };
      }

      return {
        id: `${code}-${criteria.departureDate}-${i}`,
        airline,
        flightNumber: `${code}${100 + Math.floor(rand() * 899)}`,
        origin: criteria.origin,
        destination: criteria.destination,
        departure: departure.toISOString(),
        arrival: arrival.toISOString(),
        durationMinutes,
        stops,
        cabin: criteria.cabin ?? 'economy',
        priceEur: base * passengers,
        passengers,
        returnLeg,
      };
    }).sort((a, b) => a.priceEur - b.priceEur);

    this.lastFlightResults.set(offers);
    return offers;
  }

  searchStays(criteria: StaySearchCriteria): StayOffer[] {
    const rand = seedFrom(`${criteria.city}|${criteria.checkIn}|${criteria.checkOut}`);
    const nights = nightsBetween(criteria.checkIn, criteria.checkOut);

    let offers: StayOffer[] = Array.from({ length: 6 }, (_, i) => {
      const kind = STAY_KINDS[Math.floor(rand() * STAY_KINDS.length)];
      const nightlyPriceEur = 45 + Math.round(rand() * 210);
      const amenities = AMENITIES.filter(() => rand() > 0.55).slice(0, 4);

      return {
        id: `${criteria.city.toLowerCase().replace(/\s+/g, '-')}-${i}`,
        name: `${['Aurora', 'Central', 'Blue Harbour', 'Old Town', 'Riverside', 'Sunrise'][i % 6]} ${
          kind === 'hotel'
            ? 'Hotel'
            : kind === 'apartment'
              ? 'Residence'
              : kind === 'villa'
                ? 'Villa'
                : 'Hostel'
        }`,
        city: criteria.city,
        kind,
        rating: Math.round((7 + rand() * 3) * 10) / 10,
        reviews: 40 + Math.floor(rand() * 1800),
        nightlyPriceEur,
        nights,
        totalPriceEur: nightlyPriceEur * nights,
        amenities: amenities.length ? amenities : ['Free WiFi'],
      };
    });

    if (criteria.maxNightlyPrice) {
      offers = offers.filter((o) => o.nightlyPriceEur <= criteria.maxNightlyPrice!);
    }
    offers.sort((a, b) => b.rating - a.rating);

    this.lastStayResults.set(offers);
    return offers;
  }

  /** Roadmap feature — records a transient demo request and returns an estimate. */
  requestTaxi(request: TaxiRequest): TaxiQuote {
    const rand = seedFrom(`${request.airport}|${request.dropOffAddress}|${request.pickUpTime}`);
    const quote: TaxiQuote = {
      id: `taxi-${Date.now()}`,
      airport: request.airport,
      dropOffAddress: request.dropOffAddress,
      pickUpTime: request.pickUpTime,
      passengers: request.passengers ?? 1,
      estimatedPriceEur: 18 + Math.round(rand() * 45),
      status: 'demo_estimate',
    };
    this.taxiWaitlist.update((list) => [quote, ...list]);
    return quote;
  }
}
