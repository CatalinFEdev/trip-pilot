import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
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
import { I18nService } from '../../core/i18n/i18n.service';
import { findArrivalCity, TAXI_AIRPORT_CITIES } from './taxi.model';

@Component({
  selector: 'tp-taxi',
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
  templateUrl: './taxi.html',
  styleUrl: './taxi.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Taxi {
  private readonly booking = inject(BookingService);
  private readonly tripPlan = inject(TripPlanService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  protected readonly i18n = inject(I18nService);

  protected readonly waitlist = this.booking.taxiWaitlist;
  protected readonly airportCities = TAXI_AIRPORT_CITIES;
  private readonly initialArrivalCity = findArrivalCity(this.tripPlan.flight());
  private readonly selectedStay = this.tripPlan.stay();
  private readonly initialDropOffAddress = this.selectedStay
    ? `${this.selectedStay.name}, ${this.selectedStay.city}`
    : '';
  protected readonly arrivalCityId = signal(this.initialArrivalCity?.id ?? '');
  protected readonly nearbyAirports = computed(
    () => this.airportCities.find((city) => city.id === this.arrivalCityId())?.airports ?? [],
  );
  protected readonly hours = Array.from({ length: 24 }, (_, hour) =>
    String(hour).padStart(2, '0'),
  );
  protected readonly minutes = Array.from({ length: 60 }, (_, minute) =>
    String(minute).padStart(2, '0'),
  );

  protected readonly roadmap = [
    { icon: 'flight_land', key: 'taxi.roadmap.landing' },
    { icon: 'payments', key: 'taxi.roadmap.fare' },
    { icon: 'group', key: 'taxi.roadmap.vehicle' },
  ];

  protected readonly form = this.fb.nonNullable.group({
    arrivalCity: [this.initialArrivalCity?.id ?? '', Validators.required],
    airport: [this.initialArrivalCity?.airports[0]?.code ?? '', Validators.required],
    dropOffAddress: [this.initialDropOffAddress, Validators.required],
    pickUpDate: [null as Date | null, Validators.required],
    pickUpHour: ['', Validators.required],
    pickUpMinute: ['', Validators.required],
    passengers: [
      this.tripPlan.flight()?.passengers ?? 1,
      [Validators.required, Validators.min(1)],
    ],
  });

  protected changeArrivalCity(cityId: string): void {
    this.arrivalCityId.set(cityId);
    const city = this.airportCities.find((option) => option.id === cityId);
    this.form.controls.airport.setValue(city?.airports[0]?.code ?? '');
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const {
      arrivalCity,
      airport: airportCode,
      pickUpDate,
      pickUpHour,
      pickUpMinute,
      ...request
    } = value;
    const city = this.airportCities.find((option) => option.id === arrivalCity);
    const airport = city?.airports.find((option) => option.code === airportCode);
    if (!city || !airport || !pickUpDate) {
      this.form.controls.airport.setErrors({ invalidAirport: true });
      this.form.markAllAsTouched();
      return;
    }

    const pickUpTime = `${pickUpDate.getFullYear()}-${String(pickUpDate.getMonth() + 1).padStart(2, '0')}-${String(pickUpDate.getDate()).padStart(2, '0')}T${pickUpHour}:${pickUpMinute}`;
    const quote = this.booking.requestTaxi({
      ...request,
      airport: `${airport.name} (${airport.code})`,
      pickUpTime,
    });
    this.tripPlan.selectTaxi(quote);
    this.snackBar.open(
      this.i18n.t('taxi.estimate', { price: this.i18n.formatCurrency(quote.estimatedPriceEur) }),
      this.i18n.t('common.close'),
      { duration: 4000 },
    );
    this.form.reset({
      arrivalCity: this.initialArrivalCity?.id ?? '',
      airport: this.initialArrivalCity?.airports[0]?.code ?? '',
      dropOffAddress: this.initialDropOffAddress,
      pickUpDate,
      pickUpHour,
      pickUpMinute,
      passengers: this.tripPlan.flight()?.passengers ?? 1,
    });
    this.arrivalCityId.set(this.initialArrivalCity?.id ?? '');
  }
}
