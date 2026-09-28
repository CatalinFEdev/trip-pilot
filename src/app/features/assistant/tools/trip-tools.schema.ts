import { Tool } from '@ag-ui/core';

/**
 * Front-end tools advertised to the LLM on every AG-UI run.
 * The model asks for them, the browser executes them (see TripToolsService)
 * and the result is sent back as a tool message on the next run.
 */
export const SEARCH_FLIGHTS = 'search_flights';
export const SEARCH_STAYS = 'search_stays';
export const REQUEST_TAXI_ESTIMATE = 'request_taxi_estimate';

export const TRIP_TOOLS: Tool[] = [
  {
    name: SEARCH_FLIGHTS,
    description:
      'Search demo flight offers between two cities or airports for a given date. ' +
      'Use whenever the traveller asks about flying somewhere.',
    parameters: {
      type: 'object',
      properties: {
        origin: {
          type: 'string',
          description: 'Origin city name or IATA code, e.g. "Bucharest" or "OTP".',
        },
        destination: { type: 'string', description: 'Destination city name or IATA code.' },
        departureDate: {
          type: 'string',
          description: 'Departure date in ISO format (YYYY-MM-DD).',
        },
        returnDate: {
          type: 'string',
          description: 'Optional return date in ISO format (YYYY-MM-DD).',
        },
        passengers: { type: 'integer', minimum: 1, default: 1 },
        cabin: {
          type: 'string',
          enum: ['economy', 'premium', 'business', 'first'],
          default: 'economy',
        },
      },
      required: ['origin', 'destination', 'departureDate'],
    },
  },
  {
    name: SEARCH_STAYS,
    description:
      'Search hotels, apartments and other accommodation in a city for a date range. ' +
      'Use whenever the traveller asks where to stay.',
    parameters: {
      type: 'object',
      properties: {
        city: { type: 'string', description: 'City to stay in.' },
        checkIn: { type: 'string', description: 'Check-in date (YYYY-MM-DD).' },
        checkOut: { type: 'string', description: 'Check-out date (YYYY-MM-DD).' },
        guests: { type: 'integer', minimum: 1, default: 2 },
        maxNightlyPrice: { type: 'number', description: 'Optional budget cap per night, in EUR.' },
      },
      required: ['city', 'checkIn', 'checkOut'],
    },
  },
  {
    name: REQUEST_TAXI_ESTIMATE,
    description:
      'Create a non-binding airport transfer demo estimate. This never makes a reservation or ' +
      'contacts a transport supplier.',
    parameters: {
      type: 'object',
      properties: {
        airport: { type: 'string', description: 'Pick-up airport name or IATA code.' },
        dropOffAddress: { type: 'string' },
        pickUpTime: { type: 'string', description: 'Pick-up date and time in ISO 8601 format.' },
        passengers: { type: 'integer', minimum: 1, default: 1 },
      },
      required: ['airport', 'dropOffAddress', 'pickUpTime'],
    },
  },
];
