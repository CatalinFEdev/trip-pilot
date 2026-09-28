import { test, expect } from '../fixtures';
import { TripPilotPage } from '../pages/trip-pilot.page';

test('plans a flight and stay and saves the trip', async ({ page }) => {
  const app = new TripPilotPage(page);
  await app.visit();
  await page.getByRole('link', { name: 'Search flights' }).first().click();
  await expect(page).toHaveURL(/\/flights$/);

  await app.search();
  await expect(page.getByRole('heading', { name: '5 flights found' })).toBeVisible();
  await page.getByRole('button', { name: 'Select' }).first().click();
  await expect(page.getByText(/selected for your trip plan/)).toBeVisible();

  await app.navigate('Stays');
  await app.search();
  await expect(page.getByRole('heading', { name: '6 places to stay' })).toBeVisible();
  await page.getByRole('button', { name: 'Add to trip plan' }).first().click();
  await page.getByRole('button', { name: 'Save trip' }).click();
  await expect(page.getByText('Trip plan saved on this device.')).toBeVisible();
});

test('restores and clears a saved trip after a reload', async ({ page }) => {
  const app = new TripPilotPage(page);
  await app.visit('/flights');
  await app.search();
  await page.getByRole('button', { name: 'Select' }).first().click();
  await page.getByRole('button', { name: 'Save trip' }).click();
  await page.reload();
  await expect(page.getByText('Saved on', { exact: false }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Remove from trip plan' }).click();
  await expect(page.getByRole('button', { name: 'Save trip' })).toBeDisabled();
  await app.navigate('Flights');
  await app.search();
  await page.getByRole('button', { name: 'Select' }).first().click();
  await page.getByRole('button', { name: 'Clear the trip plan' }).click();
  await expect(
    page.getByText('Select a flight, a stay or a taxi and your picks will appear here.'),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save trip' })).toBeDisabled();
});

test('filters stays by budget and switches between languages', async ({ page }) => {
  const app = new TripPilotPage(page);
  await app.visit('/stays');
  await page.getByRole('spinbutton', { name: 'Max. price / night' }).fill('1');
  await app.search();
  await expect(page.getByText('Nothing matched that budget.')).toBeVisible();
  await page.getByRole('spinbutton', { name: 'Max. price / night' }).fill('300');
  await app.choose('City', 'Paris');
  await app.search();
  await expect(page.getByRole('heading', { name: '6 places to stay' })).toBeVisible();

  await app.choose('English / Deutsch', 'Deutsch');
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
});

test('creates a demo airport transfer estimate and removes it', async ({ page }) => {
  const app = new TripPilotPage(page);
  await app.visit('/taxi');
  await app.choose('Arrival city', 'Paris');
  await app.choose('Arrival airport', 'Paris-Orly Airport (ORY)');
  await page.getByRole('textbox', { name: 'Drop-off address' }).fill('Central Hotel');
  await page.getByRole('textbox', { name: 'Pick-up date' }).fill('10/15/2026');
  await app.choose('Hour', '14');
  await app.choose('Minute', '30');
  await page.getByRole('button', { name: 'Show estimate' }).click();
  await expect(page.getByRole('heading', { name: 'Your demo requests' })).toBeVisible();
  await expect(
    page.getByText(/Paris-Orly Airport \(ORY\) → Central Hotel/).first(),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Remove from trip plan' }).click();
  await expect(page.getByRole('button', { name: 'Save trip' })).toBeDisabled();
});

test('navigates from home and handles an unreachable assistant endpoint', async ({ page }) => {
  const app = new TripPilotPage(page);
  await page.route('**/api/agui/**', (route) => route.abort());
  await app.visit();
  await page.getByRole('link', { name: 'Find a stay' }).first().click();
  await expect(page).toHaveURL(/\/stays$/);
  await app.openAssistant();
  await page.getByRole('textbox', { name: 'Message the assistant' }).fill('Find a trip');
  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(page.getByText(/is unreachable/)).toBeVisible();
  await page.getByRole('button', { name: 'Start a new conversation' }).click();
  await expect(page.getByText(/Ask about your trip/)).toBeVisible();
  await page.getByRole('button', { name: 'Assistant' }).click();
  await page.getByRole('button', { name: 'Assistant' }).click();
  await expect(page.getByRole('textbox', { name: 'Message the assistant' })).toBeVisible();
});

test('streams a tool-assisted flight search into the flight page', async ({ page }) => {
  const app = new TripPilotPage(page);
  let runs = 0;
  await page.route('**/api/agui/local', async (route) => {
    const input = route.request().postDataJSON();
    runs++;
    const events = [
      { type: 'RUN_STARTED', threadId: input.threadId, runId: `run-${runs}` },
      ...(runs === 1 ? [
        { type: 'TOOL_CALL_START', toolCallId: 'flight-search', toolCallName: 'search_flights' },
        {
          type: 'TOOL_CALL_ARGS',
          toolCallId: 'flight-search',
          delta: JSON.stringify({
            origin: 'Vienna',
            destination: 'Paris',
            departureDate: '2026-10-15',
            passengers: 2,
          }),
        },
        { type: 'TOOL_CALL_END', toolCallId: 'flight-search' },
      ] : [
        { type: 'TEXT_MESSAGE_START', messageId: 'reply', role: 'assistant' },
        { type: 'TEXT_MESSAGE_CONTENT', messageId: 'reply', delta: 'Here are your flight options.' },
        { type: 'TEXT_MESSAGE_END', messageId: 'reply' },
      ]),
      { type: 'RUN_FINISHED', threadId: input.threadId, runId: `run-${runs}` },
    ];
    await route.fulfill({
      contentType: 'text/event-stream',
      body: events.map((event) => `data: ${JSON.stringify(event)}\n\n`).join(''),
    });
  });

  await app.visit();
  await page.getByRole('textbox', { name: 'Message the assistant' }).fill('Find Vienna flights');
  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(page.getByText('Here are your flight options.')).toBeVisible();
  await app.navigate('Flights');
  await expect(page.getByRole('heading', { name: '5 flights found' })).toBeVisible();
  await page.getByRole('button', { name: 'Start a new conversation' }).click();
  await expect(page.getByText(/Ask about your trip/)).toBeVisible();
});
