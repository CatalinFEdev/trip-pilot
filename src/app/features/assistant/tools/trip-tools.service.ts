import { inject, Injectable } from '@angular/core';
import { BookingService } from '../../../shared/data-access/booking/booking.service';
import { REQUEST_TAXI_ESTIMATE, SEARCH_FLIGHTS, SEARCH_STAYS } from './trip-tools.schema';
import { ToolArgs, ToolHandler } from '../../../core/ag-ui/ag-ui.model';

const readString = (value: unknown, fallback = ''): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return fallback;
};

const readNumber = (value: unknown, fallback = 0): number => {
  const number = Number(value ?? fallback);
  return Number.isFinite(number) ? number : fallback;
};

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
        origin: readString(args['origin']),
        destination: readString(args['destination']),
        departureDate: readString(args['departureDate']),
        returnDate: args['returnDate'] ? readString(args['returnDate']) : undefined,
        passengers: readNumber(args['passengers'], 1),
        cabin: readString(args['cabin'], 'economy'),
      }),
    [SEARCH_STAYS]: (args) =>
      this.booking.searchStays({
        city: readString(args['city']),
        checkIn: readString(args['checkIn']),
        checkOut: readString(args['checkOut']),
        guests: readNumber(args['guests'], 2),
        maxNightlyPrice: args['maxNightlyPrice'] ? readNumber(args['maxNightlyPrice']) : undefined,
      }),
    [REQUEST_TAXI_ESTIMATE]: (args) => ({
      ...this.booking.requestTaxi({
        airport: readString(args['airport']),
        dropOffAddress: readString(args['dropOffAddress']),
        pickUpTime: readString(args['pickUpTime']),
        passengers: readNumber(args['passengers'], 1),
      }),
      note: 'This is a non-binding demo estimate. No transfer has been reserved.',
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

    let args: ToolArgs = {};
    try {
      args = rawArgs ? (JSON.parse(rawArgs) as ToolArgs) : {};
    } catch {
      return JSON.stringify({ error: `Arguments for "${name}" were not valid JSON.` });
    }

    try {
      return JSON.stringify(await handler(args));
    } catch (error) {
      return JSON.stringify({ error: error instanceof Error ? error.message : String(error) });
    }
  }
}
