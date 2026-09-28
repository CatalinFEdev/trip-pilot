import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { AssistantPanel } from './features/assistant/assistant-panel';
import { TripPlan } from './features/trip-plan/trip-plan';
import { I18nService } from './core/i18n/i18n.service';
import { AppLanguage } from './shared/models/app.model';
import { NavItem } from './module';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatSelectModule,
    AssistantPanel,
    TripPlan,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly i18n = inject(I18nService);
  protected readonly year = new Date().getFullYear();
  protected readonly assistantOpen = signal(true);

  protected readonly nav = computed<NavItem[]>(() => [
    { path: '/', label: this.i18n.t('nav.home'), icon: 'explore' },
    { path: '/flights', label: this.i18n.t('nav.flights'), icon: 'flight_takeoff' },
    { path: '/stays', label: this.i18n.t('nav.stays'), icon: 'hotel' },
    {
      path: '/taxi',
      label: this.i18n.t('nav.taxi'),
      icon: 'local_taxi',
      badge: this.i18n.t('common.soon'),
    },
  ]);

  protected toggleAssistant(): void {
    this.assistantOpen.update((open) => !open);
  }

  protected setLanguage(language: AppLanguage): void {
    this.i18n.setLanguage(language);
  }
}
