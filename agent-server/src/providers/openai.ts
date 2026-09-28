import type { RunAgentInput, Tool } from '@ag-ui/core';
import OpenAI from 'openai';
import type { AgUiStream } from '../ag-ui-runtime.js';

const MODEL = process.env['OPENAI_MODEL'] || 'gpt-4.1';
const MAX_TOKENS = Number(process.env['OPENAI_MAX_TOKENS'] || 4096);

let client: OpenAI | null = null;
function getClient(): OpenAI {
  const apiKey = process.env['OPENAI_API_KEY'];
  if (!apiKey) {
    throw new Error(
      'OPENAI_API_KEY is not set on the agent-server. Add it to agent-server/.env and restart.',
    );
  }
  client ??= new OpenAI({ apiKey });
  return client;
}

/** AG-UI Tool -> OpenAI tool definition. */
function toOpenAiTools(tools: Tool[] | undefined): OpenAI.Chat.ChatCompletionTool[] | undefined {
  if (!tools?.length) return undefined;
  return tools.map((tool) => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: (tool.parameters as Record<string, unknown>) ?? { type: 'object' },
    },
  }));
}

/** AG-UI message history -> OpenAI chat messages array. */
function toOpenAiMessages(input: RunAgentInput): OpenAI.Chat.ChatCompletionMessageParam[] {
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

  for (const message of input.messages) {
    switch (message.role) {
      case 'system':
      case 'developer':
        messages.push({ role: 'system', content: message.content ?? '' });
        break;
      case 'user':
        messages.push({ role: 'user', content: String(message.content ?? '') });
        break;
      case 'assistant': {
        const toolCalls = (message.toolCalls ?? []).map((call) => ({
          id: call.id,
          type: 'function' as const,
          function: {
            name: call.function.name,
            arguments: call.function.arguments,
          },
        }));
        messages.push({
          role: 'assistant',
          content: message.content ?? null,
          ...(toolCalls.length ? { tool_calls: toolCalls } : {}),
        });
        break;
      }
      case 'tool':
        messages.push({
          role: 'tool',
          tool_call_id: message.toolCallId,
          content: String(message.content ?? ''),
        });
        break;
    }
  }

  return messages;
}

function safeJsonParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

/** Runs one AG-UI turn against GPT and streams the result as AG-UI events. */
export async function runOpenAi(input: RunAgentInput, stream: AgUiStream): Promise<void> {
  const openai = getClient();
  const messages = toOpenAiMessages(input);
  const tools = toOpenAiTools(input.tools);

  const response = await openai.chat.completions.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    messages,
    tools,
  });

  const choice = response.choices[0];
  if (!choice) {
    stream.runError('OpenAI returned no choices.');
    return;
  }

  if (choice.message.content) {
    stream.textMessage(choice.message.content);
  }
  for (const call of choice.message.tool_calls ?? []) {
    if (call.type === 'function') {
      stream.toolCall(call.id, call.function.name, safeJsonParse(call.function.arguments));
    }
  }

  stream.runFinished();
}
