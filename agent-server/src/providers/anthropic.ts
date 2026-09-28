import type { RunAgentInput, Tool } from '@ag-ui/core';
import Anthropic from '@anthropic-ai/sdk';
import type { AgUiStream } from '../ag-ui-runtime.js';

const MODEL = process.env['ANTHROPIC_MODEL'] || 'claude-sonnet-4-5';
const MAX_TOKENS = Number(process.env['ANTHROPIC_MAX_TOKENS'] || 4096);

let client: Anthropic | null = null;
function getClient(): Anthropic {
  const apiKey = process.env['ANTHROPIC_API_KEY'];
  if (!apiKey) {
    throw new Error(
      'ANTHROPIC_API_KEY is not set on the agent-server. Add it to agent-server/.env and restart.',
    );
  }
  client ??= new Anthropic({ apiKey });
  return client;
}

/** AG-UI Tool -> Anthropic tool definition. */
function toAnthropicTools(tools: Tool[] | undefined): Anthropic.Tool[] | undefined {
  if (!tools?.length) return undefined;
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: (tool.parameters as Anthropic.Tool.InputSchema) ?? { type: 'object' },
  }));
}

/** AG-UI message history -> Anthropic system prompt + messages array. */
function toAnthropicMessages(input: RunAgentInput): {
  system: string | undefined;
  messages: Anthropic.MessageParam[];
} {
  const systemParts: string[] = [];
  const messages: Anthropic.MessageParam[] = [];

  for (const message of input.messages) {
    switch (message.role) {
      case 'system':
      case 'developer':
        systemParts.push(message.content ?? '');
        break;
      case 'user':
        messages.push({ role: 'user', content: String(message.content ?? '') });
        break;
      case 'assistant': {
        const blocks: Anthropic.ContentBlockParam[] = [];
        if (message.content) blocks.push({ type: 'text', text: message.content });
        for (const call of message.toolCalls ?? []) {
          blocks.push({
            type: 'tool_use',
            id: call.id,
            name: call.function.name,
            input: safeJsonParse(call.function.arguments),
          });
        }
        if (blocks.length) messages.push({ role: 'assistant', content: blocks });
        break;
      }
      case 'tool':
        messages.push({
          role: 'user',
          content: [
            {
              type: 'tool_result',
              tool_use_id: message.toolCallId,
              content: String(message.content ?? ''),
            },
          ],
        });
        break;
    }
  }

  return { system: systemParts.length ? systemParts.join('\n\n') : undefined, messages };
}

function safeJsonParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

/** Runs one AG-UI turn against Claude and streams the result as AG-UI events. */
export async function runAnthropic(input: RunAgentInput, stream: AgUiStream): Promise<void> {
  const anthropic = getClient();
  const { system, messages } = toAnthropicMessages(input);
  const tools = toAnthropicTools(input.tools);

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system,
    messages,
    tools,
  });

  for (const block of response.content) {
    if (block.type === 'text' && block.text) {
      stream.textMessage(block.text);
    } else if (block.type === 'tool_use') {
      stream.toolCall(block.id, block.name, block.input);
    }
  }

  stream.runFinished();
}
