import { FlightOffer } from '../../shared/data-access/booking/flights.model';

export interface TaxiAirport {
  code: string;
  name: string;
}

export interface TaxiAirportCity {
  id: string;
  name: string;
  aliases: string[];
  airports: TaxiAirport[];
}

export const TAXI_AIRPORT_CITIES: TaxiAirportCity[] = [
  {
    id: 'amsterdam',
    name: 'Amsterdam',
    aliases: ['AMS'],
    airports: [{ code: 'AMS', name: 'Amsterdam Airport Schiphol' }],
  },
  {
    id: 'berlin',
    name: 'Berlin',
    aliases: ['BER'],
    airports: [{ code: 'BER', name: 'Berlin Brandenburg Airport' }],
  },
  {
    id: 'bucharest',
    name: 'Bucharest',
    aliases: ['Bucuresti', 'OTP', 'BBU'],
    airports: [
      { code: 'OTP', name: 'Henri Coanda International Airport' },
      { code: 'BBU', name: 'Aurel Vlaicu International Airport' },
    ],
  },
  {
    id: 'lisbon',
    name: 'Lisbon',
    aliases: ['Lisboa', 'LIS'],
    airports: [{ code: 'LIS', name: 'Humberto Delgado Airport' }],
  },
  {
    id: 'london',
    name: 'London',
    aliases: ['LHR', 'LGW', 'STN', 'LTN', 'LCY'],
    airports: [
      { code: 'LHR', name: 'Heathrow Airport' },
      { code: 'LGW', name: 'Gatwick Airport' },
      { code: 'STN', name: 'Stansted Airport' },
      { code: 'LTN', name: 'Luton Airport' },
      { code: 'LCY', name: 'London City Airport' },
    ],
  },
  {
    id: 'madrid',
    name: 'Madrid',
    aliases: ['MAD'],
    airports: [{ code: 'MAD', name: 'Adolfo Suarez Madrid-Barajas Airport' }],
  },
  {
    id: 'paris',
    name: 'Paris',
    aliases: ['PAR', 'CDG', 'ORY', 'BVA', 'XCR'],
    airports: [
      { code: 'CDG', name: 'Charles de Gaulle Airport' },
      { code: 'ORY', name: 'Paris-Orly Airport' },
      { code: 'BVA', name: 'Beauvais-Tille Airport' },
      { code: 'XCR', name: 'Chalons Vatry Airport' },
    ],
  },
  {
    id: 'prague',
    name: 'Prague',
    aliases: ['Praha', 'PRG'],
    airports: [{ code: 'PRG', name: 'Vaclav Havel Airport Prague' }],
  },
  {
    id: 'rome',
    name: 'Rome',
    aliases: ['Roma', 'FCO', 'CIA'],
    airports: [
      { code: 'FCO', name: 'Leonardo da Vinci-Fiumicino Airport' },
      { code: 'CIA', name: 'Ciampino-G. B. Pastine International Airport' },
    ],
  },
  {
    id: 'vienna',
    name: 'Vienna',
    aliases: ['Wien', 'VIE'],
    airports: [{ code: 'VIE', name: 'Vienna International Airport' }],
  },
];

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

export function findArrivalCity(flight: FlightOffer | null): TaxiAirportCity | undefined {
  if (!flight) return undefined;

  const destination = normalize(flight.destination);
  return TAXI_AIRPORT_CITIES.find((city) =>
    [city.name, ...city.aliases].some((name) => destination.includes(normalize(name))),
  );
}
