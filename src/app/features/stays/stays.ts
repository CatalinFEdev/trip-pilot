import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DecimalPipe, TitleCasePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BookingService } from '../../core/booking.service';
import { StayOffer } from '../../core/models/booking.models';

@Component({
  selector: 'tp-stays',
  imports: [
    DecimalPipe,
    TitleCasePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
  ],
  templateUrl: './stays.html',
  styleUrl: './stays.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Stays {
  private readonly booking = inject(BookingService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly results = this.booking.lastStayResults;
  protected readonly searched = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    city: ['Porto', Validators.required],
    checkIn: [new Date(), Validators.required],
    checkOut: [new Date(Date.now() + 3 * 86_400_000), Validators.required],
    guests: [2, [Validators.required, Validators.min(1)]],
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
      checkIn: this.toIsoDate(value.checkIn),
      checkOut: this.toIsoDate(value.checkOut),
      guests: value.guests,
      maxNightlyPrice: value.maxNightlyPrice ?? undefined,
    });
    this.searched.set(true);
  }

  protected select(offer: StayOffer): void {
    this.snackBar.open(`${offer.name} reserved — €${offer.totalPriceEur} total`, 'Got it', {
      duration: 4000,
    });
  }

  private toIsoDate(date: Date): string {
    const offset = date.getTimezoneOffset() * 60_000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 10);
  }
}
