import { describe, expect, it } from 'vitest';
import { FlightOffer } from '../../shared/data-access/booking/flights.model';
import { findArrivalCity } from './taxi.model';

function flightTo(destination: string): FlightOffer {
  return {
    id: 'flight-1',
    airline: 'Air France',
    flightNumber: 'AF123',
    origin: 'Bucharest',
    destination,
    departure: '2026-09-28T10:00:00.000Z',
    arrival: '2026-09-28T13:00:00.000Z',
    durationMinutes: 180,
    stops: 0,
    cabin: 'economy',
    priceEur: 100,
    passengers: 1,
  };
}

describe('findArrivalCity', () => {
  it('matches Paris from a selected flight destination', () => {
    expect(findArrivalCity(flightTo('Paris'))?.id).toBe('paris');
  });

  it('matches an airport code in the selected flight destination', () => {
    expect(findArrivalCity(flightTo('CDG'))?.id).toBe('paris');
  });
});
