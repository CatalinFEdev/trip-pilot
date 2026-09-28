import { TestBed } from '@angular/core/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { describe, expect, it, vi } from 'vitest';
import { Flights } from './flights';
import { I18nService } from '../../core/i18n/i18n.service';
import { BookingService } from '../../shared/data-access/booking/booking.service';
import { TripPlanService } from '../../shared/data-access/trip-plan/trip-plan.service';
import { FlightOffer } from '../../shared/data-access/booking/flights.model';

describe('Flights', () => {
  it('searches valid criteria and exposes sorted results', async () => {
    await TestBed.configureTestingModule({
      imports: [Flights],
      providers: [
        provideNativeDateAdapter(),
        BookingService,
        TripPlanService,
        I18nService,
        { provide: MatSnackBar, useValue: { open: vi.fn() } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(Flights);
    const component = fixture.componentInstance as unknown as {
      form: { controls: { origin: { setValue: (value: string) => void }; destination: { setValue: (value: string) => void } }; };
      search: () => void;
      results: () => { priceEur: number }[];
      searched: () => boolean;
      duration: (minutes: number) => string;
    };
    component.form.controls.origin.setValue('Bucharest');
    component.form.controls.destination.setValue('Lisbon');
    component.search();
    fixture.detectChanges();

    expect(component.searched()).toBe(true);
    expect(component.results()).toHaveLength(5);
    expect(component.duration(155)).toBe('2h 35m');
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('.offer')).toHaveLength(5);
  });

  it('shows return-flight details and adds a selected offer to the plan', async () => {
    await TestBed.configureTestingModule({
      imports: [Flights],
      providers: [
        provideNativeDateAdapter(),
        BookingService,
        TripPlanService,
        I18nService,
        { provide: MatSnackBar, useValue: { open: vi.fn() } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(Flights);
    const component = fixture.componentInstance as unknown as {
      form: {
        controls: {
          returnDate: { setValue: (value: Date) => void };
        };
      };
      search: () => void;
      select: (offer: FlightOffer) => void;
    };
    const booking = TestBed.inject(BookingService);
    const tripPlan = TestBed.inject(TripPlanService);
    component.form.controls.returnDate.setValue(new Date('2026-10-01T00:00:00Z'));

    component.search();
    fixture.detectChanges();

    const offer = booking.lastFlightResults()[0];
    expect(offer.returnLeg).toBeDefined();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Return');
    component.select(offer);

    expect(tripPlan.flight()).toEqual(offer);
    expect(TestBed.inject(MatSnackBar).open).toHaveBeenCalled();
  });

  it('marks invalid criteria and displays the no-results message', async () => {
    await TestBed.configureTestingModule({
      imports: [Flights],
      providers: [
        provideNativeDateAdapter(),
        BookingService,
        TripPlanService,
        I18nService,
        { provide: MatSnackBar, useValue: { open: vi.fn() } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(Flights);
    const component = fixture.componentInstance as unknown as {
      form: { controls: { origin: { setValue: (value: string) => void } } };
      search: () => void;
      searched: () => boolean;
    };
    component.form.controls.origin.setValue('');
    component.search();
    expect(component.searched()).toBe(false);

    const booking = TestBed.inject(BookingService);
    vi.spyOn(booking, 'searchFlights').mockReturnValue([]);
    component.form.controls.origin.setValue('Vienna');
    component.search();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'No flights matched that search',
    );
  });
});
