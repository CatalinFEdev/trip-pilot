import { inject, Injectable } from '@angular/core';
import { BookingService } from '../booking.service';
import { BOOK_TAXI, SEARCH_FLIGHTS, SEARCH_STAYS } from './trip-tools';

export type ToolHandler = (args: Record<string, any>) => unknown | Promise<unknown>;

/**
 * Executes the front-end tools the LLM asks for through AG-UI.
 * Handlers are keyed by the tool names declared in TRIP_TOOLS.
 */
@Injectable({ providedIn: 'root' })
export class TripToolsService {
  private readonly booking = inject(BookingService);

  private readonly handlers: Record<string, ToolHandler> = {
    [SEARCH_FLIGHTS]: (args) =>
      this.booking.searchFlights({
        origin: String(args['origin'] ?? ''),
        destination: String(args['destination'] ?? ''),
        departureDate: String(args['departureDate'] ?? ''),
        returnDate: args['returnDate'] ? String(args['returnDate']) : undefined,
        passengers: Number(args['passengers'] ?? 1),
        cabin: args['cabin'] ? String(args['cabin']) : 'economy',
      }),
    [SEARCH_STAYS]: (args) =>
      this.booking.searchStays({
        city: String(args['city'] ?? ''),
        checkIn: String(args['checkIn'] ?? ''),
        checkOut: String(args['checkOut'] ?? ''),
        guests: Number(args['guests'] ?? 2),
        maxNightlyPrice: args['maxNightlyPrice'] ? Number(args['maxNightlyPrice']) : undefined,
      }),
    [BOOK_TAXI]: (args) => ({
      ...this.booking.requestTaxi({
        airport: String(args['airport'] ?? ''),
        dropOffAddress: String(args['dropOffAddress'] ?? ''),
        pickUpTime: String(args['pickUpTime'] ?? ''),
        passengers: Number(args['passengers'] ?? 1),
      }),
      note: 'Airport taxi pick-up is not live yet. The request was added to the waitlist.',
    }),
  };

  canHandle(name: string): boolean {
    return name in this.handlers;
  }

  async execute(name: string, rawArgs: string): Promise<string> {
    const handler = this.handlers[name];
    if (!handler) {
      return JSON.stringify({ error: `Unknown tool "${name}".` });
    }

    let args: Record<string, any> = {};
    try {
      args = rawArgs ? JSON.parse(rawArgs) : {};
    } catch {
      return JSON.stringify({ error: `Arguments for "${name}" were not valid JSON.` });
    }

    try {
      return JSON.stringify(await handler(args));
    } catch (error) {
      return JSON.stringify({ error: (error as Error).message });
    }
  }
}
