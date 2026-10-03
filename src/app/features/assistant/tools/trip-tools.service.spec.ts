import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { TripToolsService } from './trip-tools.service';
import { REQUEST_TAXI_ESTIMATE, SEARCH_FLIGHTS, SEARCH_STAYS } from './trip-tools.schema';

describe('TripToolsService', () => {
  it('recognizes supported tools and rejects unknown tools', () => {
    const service = TestBed.configureTestingModule({}).inject(TripToolsService);

    expect(service.canHandle(SEARCH_FLIGHTS)).toBe(true);
    expect(service.canHandle('not-a-tool')).toBe(false);
  });

  it('executes a flight search with normalized arguments', async () => {
    const service = TestBed.configureTestingModule({}).inject(TripToolsService);

    const result = JSON.parse(
      await service.execute(
        SEARCH_FLIGHTS,
        JSON.stringify({
          origin: 'Bucharest',
          destination: 'Lisbon',
          departureDate: '2026-06-12',
          passengers: '2',
        }),
      ),
    );

    expect(result).toHaveLength(5);
    expect(result[0].passengers).toBe(2);
  });

  it('preserves a zero nightly budget when executing a stay search', async () => {
    const service = TestBed.configureTestingModule({}).inject(TripToolsService);

    const result = JSON.parse(
      await service.execute(
        SEARCH_STAYS,
        JSON.stringify({
          city: 'Porto',
          checkIn: '2026-06-12',
          checkOut: '2026-06-15',
          maxNightlyPrice: 0,
        }),
      ),
    );

    expect(result).toEqual([]);
  });

  it('returns explicit errors for invalid JSON and unknown tools', async () => {
    const service = TestBed.configureTestingModule({}).inject(TripToolsService);

    expect(JSON.parse(await service.execute(SEARCH_STAYS, '{bad')).error).toContain(
      'not valid JSON',
    );
    expect(JSON.parse(await service.execute('unknown', '{}')).error).toContain('Unknown tool');
  });

  it('adds a non-binding note to taxi estimates', async () => {
    const service = TestBed.configureTestingModule({}).inject(TripToolsService);

    const result = JSON.parse(
      await service.execute(
        REQUEST_TAXI_ESTIMATE,
        JSON.stringify({ airport: 'LIS', dropOffAddress: 'Hotel', pickUpTime: '2026-06-12T14:00' }),
      ),
    );

    expect(result.status).toBe('demo_estimate');
    expect(result.note).toContain('non-binding');
  });
});
