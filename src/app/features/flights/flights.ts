import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BookingService } from '../../shared/data-access/booking/booking.service';
import { TripPlanService } from '../../shared/data-access/trip-plan/trip-plan.service';
import { FlightOffer } from '../../shared/data-access/booking/flights.model';
import { toIsoDate } from '../../shared/utils/date.utils';
import { I18nService } from '../../core/i18n/i18n.service';
import { TAXI_AIRPORT_CITIES } from '../taxi/taxi.model';
import { FLIGHT_CABINS } from './flights.model';

@Component({
  selector: 'tp-flights',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './flights.html',
  styleUrl: './flights.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Flights {
  private readonly booking = inject(BookingService);
  private readonly tripPlan = inject(TripPlanService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  protected readonly i18n = inject(I18nService);

  protected readonly cabins = FLIGHT_CABINS;
  protected readonly towns = TAXI_AIRPORT_CITIES.map((city) => city.name).sort((a, b) =>
    a.localeCompare(b),
  );
  protected readonly results = this.booking.lastFlightResults;
  protected readonly searched = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    origin: ['Vienna', Validators.required],
    destination: ['Paris', Validators.required],
    departureDate: [new Date(), Validators.required],
    returnDate: [null as Date | null],
    passengers: [1, [Validators.required, Validators.min(1)]],
    cabin: ['economy', Validators.required],
  });

  protected search(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.booking.searchFlights({
      origin: value.origin,
      destination: value.destination,
      departureDate: toIsoDate(value.departureDate),
      returnDate: value.returnDate ? toIsoDate(value.returnDate) : undefined,
      passengers: value.passengers,
      cabin: value.cabin,
    });
    this.searched.set(true);
  }

  protected select(offer: FlightOffer): void {
    this.tripPlan.selectFlight(offer);
    this.snackBar.open(
      this.i18n.t('flights.selected', {
        flight: `${offer.airline} ${offer.flightNumber}`,
        price: this.i18n.formatCurrency(offer.priceEur),
      }),
      this.i18n.t('common.gotIt'),
      { duration: 4000 },
    );
  }

  protected duration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = String(minutes % 60).padStart(2, '0');
    return `${hours}h ${remainingMinutes}m`;
  }
}
