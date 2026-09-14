import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'TripPilot — plan, fly, stay',
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
  },
  {
    path: 'flights',
    title: 'Flights — TripPilot',
    loadComponent: () => import('./features/flights/flights').then((m) => m.Flights),
  },
  {
    path: 'stays',
    title: 'Stays — TripPilot',
    loadComponent: () => import('./features/stays/stays').then((m) => m.Stays),
  },
  {
    path: 'taxi',
    title: 'Airport taxi — TripPilot',
    loadComponent: () => import('./features/taxi/taxi').then((m) => m.Taxi),
  },
  { path: '**', redirectTo: '' },
];
