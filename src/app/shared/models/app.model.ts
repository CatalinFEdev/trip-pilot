import { FlightOffer, StayOffer, TaxiQuote } from '../data-access/booking/flights.model';

export type AppLanguage = 'en' | 'de';

export type TranslationTree = { [key: string]: string | TranslationTree };

export interface StoredTripPlan {
  flight: FlightOffer | null;
  stay: StayOffer | null;
  taxi: TaxiQuote | null;
  savedAt: string;
}

export interface NavItem {
  path: string;
  label: string;
  icon: string;
  badge?: string;
}
