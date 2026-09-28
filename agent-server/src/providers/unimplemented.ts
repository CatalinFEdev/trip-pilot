import type { RunAgentInput } from '@ag-ui/core';
import type { AgUiStream } from '../ag-ui-runtime.js';

/**
 * Placeholder for providers not wired up yet. Emits a valid AG-UI error
 * event (instead of a raw HTTP 500) so the UI shows a clear message telling
 * you which file to implement, e.g. `src/providers/openai.ts` modeled after
 * `src/providers/anthropic.ts`.
 */
export async function runUnimplemented(
  providerId: string,
  _input: RunAgentInput,
  stream: AgUiStream,
): Promise<void> {
  stream.runError(
    `The "${providerId}" provider isn't implemented in agent-server yet. ` +
      `Add agent-server/src/providers/${providerId}.ts modeled after anthropic.ts and wire it up in src/index.ts.`,
  );
}
