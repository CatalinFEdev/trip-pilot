import { Injectable, computed, signal } from '@angular/core';
import { FlightOffer, StayOffer, TaxiQuote } from '../booking/flights.model';
import { StoredTripPlan } from '../../models/app.model';

const PLAN_STORAGE_KEY = 'trip-pilot-plan';

/** Holds the traveller's current selections (flight, stay, taxi) for the trip plan. */
@Injectable({ providedIn: 'root' })
export class TripPlanService {
  private readonly selectedFlight = signal<FlightOffer | null>(null);
  private readonly selectedStay = signal<StayOffer | null>(null);
  private readonly selectedTaxi = signal<TaxiQuote | null>(null);
  private readonly savedAtValue = signal<string | null>(null);

  readonly flight = this.selectedFlight.asReadonly();
  readonly stay = this.selectedStay.asReadonly();
  readonly taxi = this.selectedTaxi.asReadonly();
  readonly savedAt = this.savedAtValue.asReadonly();

  readonly isEmpty = computed(() => !this.flight() && !this.stay() && !this.taxi());

  readonly totalEur = computed(
    () =>
      (this.flight()?.priceEur ?? 0) +
      (this.stay()?.totalPriceEur ?? 0) +
      (this.taxi()?.estimatedPriceEur ?? 0),
  );

  constructor() {
    this.restore();
  }

  selectFlight(offer: FlightOffer): void {
    this.selectedFlight.set(offer);
    this.savedAtValue.set(null);
  }

  selectStay(offer: StayOffer): void {
    this.selectedStay.set(offer);
    this.savedAtValue.set(null);
  }

  selectTaxi(quote: TaxiQuote): void {
    this.selectedTaxi.set(quote);
    this.savedAtValue.set(null);
  }

  removeFlight(): void {
    this.selectedFlight.set(null);
    this.savedAtValue.set(null);
  }

  removeStay(): void {
    this.selectedStay.set(null);
    this.savedAtValue.set(null);
  }

  removeTaxi(): void {
    this.selectedTaxi.set(null);
    this.savedAtValue.set(null);
  }

  clear(): void {
    this.selectedFlight.set(null);
    this.selectedStay.set(null);
    this.selectedTaxi.set(null);
    this.savedAtValue.set(null);
    localStorage.removeItem(PLAN_STORAGE_KEY);
  }

  /** Persists the current plan on this device. */
  save(): void {
    const savedAt = new Date().toISOString();
    const plan: StoredTripPlan = {
      flight: this.flight(),
      stay: this.stay(),
      taxi: this.taxi(),
      savedAt,
    };
    localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(plan));
    this.savedAtValue.set(savedAt);
  }

  private restore(): void {
    const raw = localStorage.getItem(PLAN_STORAGE_KEY);
    if (!raw) return;
    try {
      const plan = JSON.parse(raw) as StoredTripPlan;
      this.selectedFlight.set(plan.flight ?? null);
      this.selectedStay.set(plan.stay ?? null);
      this.selectedTaxi.set(plan.taxi ?? null);
      this.savedAtValue.set(plan.savedAt ?? null);
    } catch {
      localStorage.removeItem(PLAN_STORAGE_KEY);
    }
  }
}
