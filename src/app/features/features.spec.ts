import { TestBed } from '@angular/core/testing';
import { Type } from '@angular/core';
import { describe, expect, it } from 'vitest';
import { appConfig } from '../app.config';
import { Home } from './home/home';
import { Flights } from './flights/flights';
import { Stays } from './stays/stays';
import { Taxi } from './taxi/taxi';
import { provideRouter } from '@angular/router';
import { routes } from '../app.routes';

describe('feature pages', () => {
  const cases = [
    { name: 'Home', component: Home, expected: 'Plan it once.' },
    { name: 'Flights', component: Flights, expected: 'Flights' },
    { name: 'Stays', component: Stays, expected: 'Stays' },
    { name: 'Taxi', component: Taxi, expected: 'Airport pick-up' },
  ] as { name: string; component: Type<unknown>; expected: string }[];

  for (const { name, component, expected } of cases) {
    it(`${name} renders`, async () => {
      await TestBed.configureTestingModule({
        imports: [component],
        providers: [...appConfig.providers, provideRouter(routes)],
      }).compileComponents();

      const fixture = TestBed.createComponent(component);
      fixture.detectChanges();

      expect((fixture.nativeElement as HTMLElement).textContent).toContain(expected);
    });
  }
});
