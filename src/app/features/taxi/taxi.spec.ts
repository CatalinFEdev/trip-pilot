import { TestBed } from '@angular/core/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { describe, expect, it, vi } from 'vitest';
import { Taxi } from './taxi';
import { I18nService } from '../../core/i18n/i18n.service';
import { BookingService } from '../../shared/data-access/booking/booking.service';
import { TripPlanService } from '../../shared/data-access/trip-plan/trip-plan.service';

describe('Taxi', () => {
  it('updates the airport when the arrival city changes', async () => {
    await TestBed.configureTestingModule({
      imports: [Taxi],
      providers: [
        provideNativeDateAdapter(),
        BookingService,
        TripPlanService,
        I18nService,
        { provide: MatSnackBar, useValue: { open: vi.fn() } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(Taxi);
    const component = fixture.componentInstance as unknown as {
      changeArrivalCity: (cityId: string) => void;
      arrivalCityId: () => string;
      nearbyAirports: () => { code: string }[];
    };

    component.changeArrivalCity('london');
    fixture.detectChanges();

    expect(component.arrivalCityId()).toBe('london');
    expect(component.nearbyAirports().map((airport) => airport.code)).toEqual([
      'LHR',
      'LGW',
      'STN',
      'LTN',
      'LCY',
    ]);
  });

  it('validates a transfer request and adds its estimate to the trip plan', async () => {
    await TestBed.configureTestingModule({
      imports: [Taxi],
      providers: [
        provideNativeDateAdapter(),
        BookingService,
        TripPlanService,
        I18nService,
        { provide: MatSnackBar, useValue: { open: vi.fn() } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(Taxi);
    const component = fixture.componentInstance as unknown as {
      form: {
        controls: {
          arrivalCity: { value: string; setValue: (value: string) => void };
          airport: { setValue: (value: string) => void };
          dropOffAddress: { setValue: (value: string) => void };
          pickUpDate: { setValue: (value: Date) => void; value: Date | null };
          pickUpHour: { setValue: (value: string) => void; value: string };
          pickUpMinute: { setValue: (value: string) => void; value: string };
          passengers: { setValue: (value: number) => void };
        };
      };
      submit: () => void;
      arrivalCityId: () => string;
    };
    const booking = TestBed.inject(BookingService);
    const tripPlan = TestBed.inject(TripPlanService);
    const controls = component.form.controls;

    component.submit();
    expect(controls.arrivalCity.value).toBe('');

    controls.arrivalCity.setValue('lisbon');
    controls.airport.setValue('LIS');
    controls.dropOffAddress.setValue('Praça do Comércio');
    controls.pickUpDate.setValue(new Date(2026, 9, 3));
    controls.pickUpHour.setValue('14');
    controls.pickUpMinute.setValue('30');
    controls.passengers.setValue(2);
    component.submit();
    fixture.detectChanges();

    expect(booking.taxiWaitlist()).toHaveLength(1);
    expect(booking.taxiWaitlist()[0].pickUpTime).toBe('2026-10-03T14:30');
    expect(tripPlan.taxi()).toEqual(booking.taxiWaitlist()[0]);
    expect(component.arrivalCityId()).toBe('');
    expect(controls.pickUpDate.value).toEqual(new Date(2026, 9, 3));
    expect(controls.pickUpHour.value).toBe('14');
    expect(controls.pickUpMinute.value).toBe('30');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Praça do Comércio');
    expect(TestBed.inject(MatSnackBar).open).toHaveBeenCalled();
  });
});
