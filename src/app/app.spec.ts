import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { App } from './app';
import { appConfig } from './app.config';
import { routes } from './app.routes';

describe('App shell', () => {
  it('renders the brand and the navigation', async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [...appConfig.providers, provideRouter(routes)],
    }).compileComponents();

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('TripPilot');
    expect(text).toContain('Flights');
    expect(text).toContain('Airport taxi');
  });
});
