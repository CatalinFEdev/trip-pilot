import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideNativeDateAdapter } from '@angular/material/core';
import { describe, expect, it, vi } from 'vitest';
import { TripPlan } from './trip-plan';
import { I18nService } from '../../core/i18n/i18n.service';
import { TripPlanService } from '../../shared/data-access/trip-plan/trip-plan.service';
import { FlightOffer, StayOffer, TaxiQuote } from '../../shared/data-access/booking/flights.model';

const flight: FlightOffer = {
  id: 'flight',
  airline: 'Demo Air',
  flightNumber: 'DA123',
  origin: 'Vienna',
  destination: 'Paris',
  departure: '2026-10-01T10:00:00.000Z',
  arrival: '2026-10-01T12:00:00.000Z',
  durationMinutes: 120,
  stops: 0,
  cabin: 'economy',
  priceEur: 100,
  passengers: 1,
};
const stay: StayOffer = {
  id: 'stay',
  name: 'Demo Hotel',
  city: 'Paris',
  kind: 'hotel',
  rating: 9,
  reviews: 42,
  nightlyPriceEur: 80,
  nights: 2,
  totalPriceEur: 160,
  amenities: ['Free WiFi'],
};
const taxi: TaxiQuote = {
  id: 'taxi',
  airport: 'Paris-Orly Airport (ORY)',
  dropOffAddress: 'Demo Hotel, Paris',
  pickUpTime: '2026-10-01T14:00',
  passengers: 1,
  estimatedPriceEur: 25,
  status: 'demo_estimate',
};

describe('TripPlan', () => {
  it('saves the plan and shows confirmation feedback', async () => {
    await TestBed.configureTestingModule({
      imports: [TripPlan],
      providers: [
        TripPlanService,
        I18nService,
        provideNativeDateAdapter(),
        { provide: MatSnackBar, useValue: { open: vi.fn() } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(TripPlan);
    fixture.detectChanges();
    const save = (fixture.componentInstance as unknown as { save: () => void }).save;
    const plan = TestBed.inject(TripPlanService);
    const snackBar = TestBed.inject(MatSnackBar);
    vi.spyOn(plan, 'save');

    save.call(fixture.componentInstance);

    expect(plan.save).toHaveBeenCalled();
    expect(snackBar.open).toHaveBeenCalled();
  });

  it('renders the empty state and the selected trip items', async () => {
    await TestBed.configureTestingModule({
      imports: [TripPlan],
      providers: [
        TripPlanService,
        I18nService,
        provideNativeDateAdapter(),
        { provide: MatSnackBar, useValue: { open: vi.fn() } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(TripPlan);
    const plan = TestBed.inject(TripPlanService);
    plan.clear();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Select a flight, a stay or a taxi',
    );

    plan.selectFlight(flight);
    plan.selectStay(stay);
    plan.selectTaxi(taxi);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Demo Air DA123');
    expect(text).toContain('Demo Hotel · Paris');
    expect(text).toContain('Paris-Orly Airport (ORY)');
    expect(fixture.nativeElement.querySelectorAll('.plan__item')).toHaveLength(3);
  });
});
