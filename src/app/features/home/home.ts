import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'tp-home',
  imports: [RouterLink, MatButtonModule, MatIconModule, MatCardModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  protected readonly features = [
    {
      icon: 'flight_takeoff',
      title: 'Book a flight',
      text: 'Compare fares across airlines and let the assistant pick the smartest connection.',
      link: '/flights',
      cta: 'Search flights',
      available: true,
    },
    {
      icon: 'hotel',
      title: 'Find a place to stay',
      text: 'Hotels, apartments and villas in any city, filtered by budget and rating.',
      link: '/stays',
      cta: 'Search stays',
      available: true,
    },
    {
      icon: 'local_taxi',
      title: 'Airport pick-up',
      text: 'A taxi waiting at arrivals, matched to your landing time. Coming soon.',
      link: '/taxi',
      cta: 'Join the waitlist',
      available: false,
    },
  ];

  protected readonly steps = [
    { icon: 'chat', title: 'Describe the trip', text: 'Plain language — "Vienna, first weekend of June, two people".' },
    { icon: 'hub', title: 'AG-UI streams it', text: 'The agent streams events, state and tool calls straight into the UI.' },
    { icon: 'verified', title: 'You confirm', text: 'Nothing is booked until you approve the final itinerary.' },
  ];
}
