import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import cors from 'cors';
import type { RunAgentInput } from '@ag-ui/core';
import { AgUiStream } from './ag-ui-runtime.js';
import { runAnthropic } from './providers/anthropic.js';
import { runLocal } from './providers/local.js';
import { runOpenAi } from './providers/openai.js';
import { runUnimplemented } from './providers/unimplemented.js';

const PORT = Number(process.env['PORT'] || 8000);

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

type Handler = (input: RunAgentInput, stream: AgUiStream) => Promise<void>;

const providers: Record<string, Handler> = {
  anthropic: runAnthropic,
  openai: runOpenAi,
  gemini: (input, stream) => runUnimplemented('gemini', input, stream),
  local: runLocal,
};

function registerProvider(path: string, handler: Handler): void {
  app.post(path, async (req: Request, res: Response) => {
    const input = req.body as RunAgentInput;
    const stream = new AgUiStream(res, input.threadId, input.runId);

    try {
      stream.runStarted();
      await handler(input, stream);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      stream.runError(message);
    }
  });
}

for (const [id, handler] of Object.entries(providers)) {
  registerProvider(`/${id}`, handler);
}

app.listen(PORT, () => {
  console.log(`agent-server listening on http://localhost:${PORT}`);
  console.log(`Routes: ${Object.keys(providers).map((id) => `/${id}`).join(', ')}`);
});
