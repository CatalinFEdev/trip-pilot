import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BookingService } from '../../core/booking.service';

@Component({
  selector: 'tp-taxi',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
  ],
  templateUrl: './taxi.html',
  styleUrl: './taxi.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Taxi {
  private readonly booking = inject(BookingService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly waitlist = this.booking.taxiWaitlist;

  protected readonly roadmap = [
    { icon: 'flight_land', text: 'Pick-up time synced with your real landing time.' },
    { icon: 'payments', text: 'Fixed fare agreed up front — no meter surprises.' },
    { icon: 'group', text: 'Vehicle sized to your party and luggage.' },
  ];

  protected readonly form = this.fb.nonNullable.group({
    airport: ['', Validators.required],
    dropOffAddress: ['', Validators.required],
    pickUpTime: ['', Validators.required],
    passengers: [1, [Validators.required, Validators.min(1)]],
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const quote = this.booking.requestTaxi(value);
    this.snackBar.open(
      `You are on the waitlist — estimated fare €${quote.estimatedPriceEur}.`,
      'Close',
      { duration: 4000 },
    );
    this.form.reset({ airport: '', dropOffAddress: '', pickUpTime: '', passengers: 1 });
  }
}
