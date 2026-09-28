import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TripPlanService } from '../../shared/data-access/trip-plan/trip-plan.service';
import { I18nService } from '../../core/i18n/i18n.service';

@Component({
  selector: 'tp-trip-plan',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './trip-plan.html',
  styleUrl: './trip-plan.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TripPlan {
  protected readonly plan = inject(TripPlanService);
  protected readonly i18n = inject(I18nService);
  private readonly snackBar = inject(MatSnackBar);

  protected save(): void {
    this.plan.save();
    this.snackBar.open(this.i18n.t('plan.saved'), this.i18n.t('common.gotIt'), { duration: 4000 });
  }
}
