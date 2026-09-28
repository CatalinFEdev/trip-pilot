export interface HomeFeature {
  icon: string;
  title: string;
  text: string;
  link: string;
  cta: string;
  available: boolean;
}

export interface HomeStep {
  icon: string;
  title: string;
  text: string;
}

export function createHomeFeatures(translate: (key: string) => string): HomeFeature[] {
  return [
    {
      icon: 'flight_takeoff',
      title: translate('home.flight.title'),
      text: translate('home.flight.text'),
      link: '/flights',
      cta: translate('home.searchFlights'),
      available: true,
    },
    {
      icon: 'hotel',
      title: translate('home.stay.title'),
      text: translate('home.stay.text'),
      link: '/stays',
      cta: translate('home.findStay'),
      available: true,
    },
    {
      icon: 'local_taxi',
      title: translate('home.taxi.title'),
      text: translate('home.taxi.text'),
      link: '/taxi',
      cta: translate('home.taxi.cta'),
      available: false,
    },
  ];
}

export function createHomeSteps(translate: (key: string) => string): HomeStep[] {
  return [
    {
      icon: 'chat',
      title: translate('home.step.describe.title'),
      text: translate('home.step.describe.text'),
    },
    {
      icon: 'hub',
      title: translate('home.step.stream.title'),
      text: translate('home.step.stream.text'),
    },
    {
      icon: 'verified',
      title: translate('home.step.confirm.title'),
      text: translate('home.step.confirm.text'),
    },
  ];
}
