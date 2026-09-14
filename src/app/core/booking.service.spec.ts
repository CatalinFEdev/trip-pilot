import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { BookingService } from './booking.service';

describe('BookingService', () => {
  const service = () => TestBed.configureTestingModule({}).inject(BookingService);

  it('returns deterministic flight offers sorted by price', () => {
    const booking = service();
    const criteria = {
      origin: 'Bucharest',
      destination: 'Lisbon',
      departureDate: '2026-06-12',
      passengers: 2,
    };

    const first = booking.searchFlights(criteria);
    const second = booking.searchFlights(criteria);

    expect(first).toHaveLength(5);
    expect(first.map((o) => o.priceEur)).toEqual([...first.map((o) => o.priceEur)].sort((a, b) => a - b));
    expect(second).toEqual(first);
  });

  it('honours the nightly budget cap for stays', () => {
    const booking = service();
    const offers = booking.searchStays({
      city: 'Porto',
      checkIn: '2026-06-12',
      checkOut: '2026-06-15',
      guests: 2,
      maxNightlyPrice: 90,
    });

    expect(offers.every((o) => o.nightlyPriceEur <= 90)).toBe(true);
    expect(offers.every((o) => o.nights === 3)).toBe(true);
  });

  it('waitlists taxi requests', () => {
    const booking = service();
    const quote = booking.requestTaxi({
      airport: 'OTP',
      dropOffAddress: 'Calea Victoriei 1',
      pickUpTime: '2026-06-12T10:30',
    });

    expect(quote.status).toBe('waitlisted');
    expect(booking.taxiWaitlist()).toContain(quote);
  });
});
