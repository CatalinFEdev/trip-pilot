import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe, TitleCasePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BookingService } from '../../core/booking.service';
import { FlightOffer } from '../../core/models/booking.models';

@Component({
  selector: 'tp-flights',
  imports: [
    DatePipe,
    DecimalPipe,
    TitleCasePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
  ],
  templateUrl: './flights.html',
  styleUrl: './flights.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Flights {
  private readonly booking = inject(BookingService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly cabins = ['economy', 'premium', 'business', 'first'];
  protected readonly results = this.booking.lastFlightResults;
  protected readonly searched = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    origin: ['Bucharest', Validators.required],
    destination: ['Lisbon', Validators.required],
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
      departureDate: this.toIsoDate(value.departureDate),
      returnDate: value.returnDate ? this.toIsoDate(value.returnDate) : undefined,
      passengers: value.passengers,
      cabin: value.cabin,
    });
    this.searched.set(true);
  }

  protected select(offer: FlightOffer): void {
    this.snackBar.open(
      `${offer.airline} ${offer.flightNumber} held for 20 minutes — €${offer.priceEur}`,
      'Got it',
      { duration: 4000 },
    );
  }

  protected duration(minutes: number): string {
    return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`;
  }

  private toIsoDate(date: Date): string {
    const offset = date.getTimezoneOffset() * 60_000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 10);
  }
}
