import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { I18nService } from '../../core/i18n/i18n.service';
import { createHomeFeatures, createHomeSteps } from './home.model';

@Component({
  selector: 'tp-home',
  imports: [RouterLink, MatButtonModule, MatIconModule, MatCardModule],
  templateUrl: './home.html',
  styleUrls: ['./home.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  protected readonly i18n = inject(I18nService);

  protected readonly features = computed(() => createHomeFeatures((key) => this.i18n.t(key)));

  protected readonly steps = computed(() => createHomeSteps((key) => this.i18n.t(key)));
}
