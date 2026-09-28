import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach } from 'vitest';
import { TripPlanService } from './trip-plan.service';
import { FlightOffer, StayOffer, TaxiQuote } from '../booking/flights.model';

const flight: FlightOffer = {
  id: 'flight-1',
  airline: 'Demo Air',
  flightNumber: 'DA123',
  origin: 'Bucharest',
  destination: 'Lisbon',
  departure: '2026-06-12T10:00:00.000Z',
  arrival: '2026-06-12T13:00:00.000Z',
  durationMinutes: 180,
  stops: 0,
  cabin: 'economy',
  priceEur: 120,
  passengers: 1,
};
const stay: StayOffer = {
  id: 'stay-1',
  name: 'Demo Hotel',
  city: 'Lisbon',
  kind: 'hotel',
  rating: 8.5,
  reviews: 100,
  nightlyPriceEur: 80,
  nights: 2,
  totalPriceEur: 160,
  amenities: ['Free WiFi'],
};
const taxi: TaxiQuote = {
  id: 'taxi-1',
  airport: 'LIS',
  dropOffAddress: 'Demo Hotel',
  pickUpTime: '2026-06-12T14:00',
  passengers: 1,
  estimatedPriceEur: 25,
  status: 'demo_estimate',
};

describe('TripPlanService', () => {
  beforeEach(() => localStorage.removeItem('trip-pilot-plan'));

  it('tracks selections and calculates the total', () => {
    const service = TestBed.configureTestingModule({}).inject(TripPlanService);

    service.selectFlight(flight);
    service.selectStay(stay);
    service.selectTaxi(taxi);

    expect(service.isEmpty()).toBe(false);
    expect(service.totalEur()).toBe(305);
  });

  it('persists and restores the selected plan', () => {
    const first = TestBed.configureTestingModule({}).inject(TripPlanService);
    first.selectFlight(flight);
    first.selectStay(stay);
    first.save();

    TestBed.resetTestingModule();
    const restored = TestBed.configureTestingModule({}).inject(TripPlanService);

    expect(restored.flight()).toEqual(flight);
    expect(restored.stay()).toEqual(stay);
    expect(restored.savedAt()).toBeTruthy();
  });

  it('clears selections and persisted data', () => {
    const service = TestBed.configureTestingModule({}).inject(TripPlanService);
    service.selectTaxi(taxi);
    service.save();

    service.clear();

    expect(service.isEmpty()).toBe(true);
    expect(localStorage.getItem('trip-pilot-plan')).toBeNull();
  });
});
