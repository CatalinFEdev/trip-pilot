import { TestBed } from '@angular/core/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { describe, expect, it, vi } from 'vitest';
import { Stays } from './stays';
import { I18nService } from '../../core/i18n/i18n.service';
import { BookingService } from '../../shared/data-access/booking/booking.service';
import { TripPlanService } from '../../shared/data-access/trip-plan/trip-plan.service';
import { StayOffer } from '../../shared/data-access/booking/flights.model';

describe('Stays', () => {
  it('searches stays and applies the nightly budget', async () => {
    await TestBed.configureTestingModule({
      imports: [Stays],
      providers: [
        provideNativeDateAdapter(),
        BookingService,
        TripPlanService,
        I18nService,
        { provide: MatSnackBar, useValue: { open: vi.fn() } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(Stays);
    const component = fixture.componentInstance as unknown as {
      form: { controls: { maxNightlyPrice: { setValue: (value: number) => void } } };
      search: () => void;
      select: (offer: StayOffer) => void;
      results: () => { nightlyPriceEur: number }[];
      searched: () => boolean;
    };
    const booking = TestBed.inject(BookingService);
    const tripPlan = TestBed.inject(TripPlanService);

    component.search();
    const prices = component.results()
      .map((offer) => offer.nightlyPriceEur)
      .sort((left, right) => left - right);
    const maxNightlyPrice = prices[Math.floor(prices.length / 2)];
    component.form.controls.maxNightlyPrice.setValue(maxNightlyPrice);
    component.search();
    fixture.detectChanges();

    expect(component.searched()).toBe(true);
    expect(component.results().length).toBeGreaterThan(0);
    expect(component.results().every((offer) => offer.nightlyPriceEur <= maxNightlyPrice)).toBe(true);
    expect(component.results().length).toBeLessThan(prices.length);
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('.stay')).toHaveLength(
      component.results().length,
    );

    const offer = booking.lastStayResults()[0];
    component.select(offer);
    expect(tripPlan.stay()).toEqual(offer);
    expect(TestBed.inject(MatSnackBar).open).toHaveBeenCalled();
  });

  it('marks invalid search criteria and renders an empty search result', async () => {
    await TestBed.configureTestingModule({
      imports: [Stays],
      providers: [
        provideNativeDateAdapter(),
        BookingService,
        TripPlanService,
        I18nService,
        { provide: MatSnackBar, useValue: { open: vi.fn() } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(Stays);
    const component = fixture.componentInstance as unknown as {
      form: { controls: { city: { setValue: (value: string) => void } } };
      search: () => void;
      searched: () => boolean;
    };
    component.form.controls.city.setValue('');
    component.search();
    expect(component.searched()).toBe(false);

    const booking = TestBed.inject(BookingService);
    vi.spyOn(booking, 'searchStays').mockReturnValue([]);
    component.form.controls.city.setValue('Lisbon');
    component.search();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Nothing matched that budget',
    );
  });
});
