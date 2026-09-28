import type { RunAgentInput } from '@ag-ui/core';
import type { AgUiStream } from '../ag-ui-runtime.js';

function latestUserMessage(input: RunAgentInput): string {
  const message = [...input.messages].reverse().find((entry) => entry.role === 'user');
  return typeof message?.content === 'string' ? message.content.trim().toLowerCase() : '';
}

function createReply(message: string): string {
  const intro = "I'm TripPilot's offline demo assistant, so no API key is needed. ";

  if (/\b(flight|fly|airline|airport to airport)\b/.test(message)) {
    return `${intro}I can help compare demo flights. What are your origin, destination, travel dates, and number of passengers?`;
  }
  if (/\b(hotel|stay|accommodation|lodging)\b/.test(message)) {
    return `${intro}I can help find demo stays. Which city, check-in and check-out dates, and number of guests should I use?`;
  }
  if (/\b(taxi|transfer|pickup|pick-up)\b/.test(message)) {
    return `${intro}I can prepare a non-binding airport-transfer estimate. Which airport, drop-off address, arrival time, and passenger count should I use?`;
  }
  if (/\b(plan|itinerary|trip|travel|vacation|holiday)\b/.test(message)) {
    return `${intro}I can help shape a trip plan. Tell me your origin, destination, travel dates, number of travelers, and budget or interests.`;
  }

  return `${intro}I can help plan a trip, compare demo flights and stays, or prepare a non-binding airport-transfer estimate. What destination and dates are you considering?`;
}

/** Provides a useful no-credentials response for local development and demos. */
export async function runLocal(input: RunAgentInput, stream: AgUiStream): Promise<void> {
  const message = latestUserMessage(input);
  if (!message) {
    stream.runError('Send a message to start a conversation.');
    return;
  }

  stream.textMessage(createReply(message));
  stream.runFinished();
}
