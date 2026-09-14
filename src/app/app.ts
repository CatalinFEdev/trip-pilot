import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AssistantPanel } from './shared/assistant/assistant-panel';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  badge?: string;
}

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    MatTooltipModule,
    AssistantPanel,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly year = new Date().getFullYear();
  protected readonly assistantOpen = signal(true);

  protected readonly nav: NavItem[] = [
    { path: '/', label: 'Home', icon: 'explore' },
    { path: '/flights', label: 'Flights', icon: 'flight_takeoff' },
    { path: '/stays', label: 'Stays', icon: 'hotel' },
    { path: '/taxi', label: 'Airport taxi', icon: 'local_taxi', badge: 'Soon' },
  ];

  protected toggleAssistant(): void {
    this.assistantOpen.update((open) => !open);
  }
}
