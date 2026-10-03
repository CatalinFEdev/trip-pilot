import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BookingService } from '../../shared/data-access/booking/booking.service';
import { TripPlanService } from '../../shared/data-access/trip-plan/trip-plan.service';
import { StayOffer } from '../../shared/data-access/booking/flights.model';
import { toIsoDate } from '../../shared/utils/date.utils';
import { I18nService } from '../../core/i18n/i18n.service';
import { findArrivalCity, TAXI_AIRPORT_CITIES } from '../taxi/taxi.model';

@Component({
  selector: 'tp-stays',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './stays.html',
  styleUrl: './stays.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Stays {
  private readonly booking = inject(BookingService);
  private readonly tripPlan = inject(TripPlanService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  protected readonly i18n = inject(I18nService);

  protected readonly results = this.booking.lastStayResults;
  protected readonly searched = signal(false);
  protected readonly towns = TAXI_AIRPORT_CITIES.map((city) => city.name).sort((a, b) =>
    a.localeCompare(b),
  );

  private readonly arrivalCity = findArrivalCity(this.tripPlan.flight());
  private readonly arrivalDate = this.tripPlan.flight()
    ? new Date(this.tripPlan.flight()!.arrival)
    : new Date();

  protected readonly form = this.fb.nonNullable.group({
    city: [this.arrivalCity?.name ?? this.towns[0], Validators.required],
    checkIn: [this.arrivalDate, Validators.required],
    checkOut: [new Date(this.arrivalDate.getTime() + 3 * 86_400_000), Validators.required],
    guests: [this.tripPlan.flight()?.passengers ?? 2, [Validators.required, Validators.min(1)]],
    maxNightlyPrice: [null as number | null],
  });

  protected search(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.booking.searchStays({
      city: value.city,
      checkIn: toIsoDate(value.checkIn),
      checkOut: toIsoDate(value.checkOut),
      guests: value.guests,
      maxNightlyPrice: value.maxNightlyPrice ?? undefined,
    });
    this.searched.set(true);
  }

  protected select(offer: StayOffer): void {
    this.tripPlan.selectStay(offer);
    this.snackBar.open(
      this.i18n.t('stays.selected', {
        name: offer.name,
        price: this.i18n.formatCurrency(offer.totalPriceEur),
      }),
      this.i18n.t('common.gotIt'),
      { duration: 4000 },
    );
  }
}
