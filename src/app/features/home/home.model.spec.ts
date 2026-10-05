import { describe, expect, it } from 'vitest';
import { createHomeFeatures, createHomeSteps } from './home.model';

describe('createHomeFeatures', () => {
  it('returns translated flight, stay, and taxi features with their availability', () => {
    const features = createHomeFeatures((key) => `translated:${key}`);

    expect(features).toEqual([
      {
        icon: 'flight_takeoff',
        title: 'translated:home.flight.title',
        text: 'translated:home.flight.text',
        link: '/flights',
        cta: 'translated:home.searchFlights',
        available: true,
      },
      {
        icon: 'hotel',
        title: 'translated:home.stay.title',
        text: 'translated:home.stay.text',
        link: '/stays',
        cta: 'translated:home.findStay',
        available: true,
      },
      {
        icon: 'local_taxi',
        title: 'translated:home.taxi.title',
        text: 'translated:home.taxi.text',
        link: '/taxi',
        cta: 'translated:home.taxi.cta',
        available: false,
      },
    ]);
  });
});

describe('createHomeSteps', () => {
  it('returns all trip-planning steps with translated titles and descriptions', () => {
    const steps = createHomeSteps((key) => `translated:${key}`);

    expect(steps).toEqual([
      {
        icon: 'chat',
        title: 'translated:home.step.describe.title',
        text: 'translated:home.step.describe.text',
      },
      {
        icon: 'hub',
        title: 'translated:home.step.stream.title',
        text: 'translated:home.step.stream.text',
      },
      {
        icon: 'verified',
        title: 'translated:home.step.confirm.title',
        text: 'translated:home.step.confirm.text',
      },
    ]);
  });
});
