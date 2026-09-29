import { TestBed } from '@angular/core/testing';
import { HttpAgent } from '@ag-ui/client';
import { AssistantMessage, Message } from '@ag-ui/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AgUiService } from './ag-ui.service';
import { AG_UI_APP_CONFIG, provideAgUi } from './ag-ui.config';
import { TripToolsService } from '../../features/assistant/tools/trip-tools.service';
import { BookingService } from '../../shared/data-access/booking/booking.service';

const agentMocks: Array<{
  runAgent: ReturnType<typeof vi.fn>;
  addMessage: ReturnType<typeof vi.fn>;
  setMessages: ReturnType<typeof vi.fn>;
  abortRun: ReturnType<typeof vi.fn>;
  subscribe: ReturnType<typeof vi.fn>;
  messages: Message[];
}> = [];

vi.mock('@ag-ui/client', () => ({
  HttpAgent: vi.fn(
    class {
      messages: Message[] = [];
      runAgent = vi.fn(async () => undefined);
      addMessage = vi.fn((message: Message) => this.messages.push(message));
      setMessages = vi.fn((messages: Message[]) => {
        this.messages = [...messages];
      });
      abortRun = vi.fn();
      subscribe = vi.fn();

      constructor() {
        agentMocks.push(this);
      }
    },
  ),
}));

describe('AgUiService', () => {
  beforeEach(() => {
    agentMocks.length = 0;
  });

  const service = () =>
    TestBed.configureTestingModule({
      providers: [
        provideAgUi(AG_UI_APP_CONFIG),
        AgUiService,
        TripToolsService,
        BookingService,
      ],
    }).inject(AgUiService);

  it('uses Claude by default and sends its first message to the Anthropic endpoint', async () => {
    const agui = service();

    expect(agui.providerId()).toBe('anthropic');
    await agui.send('hello');

    expect(HttpAgent).toHaveBeenCalledWith(
      expect.objectContaining({ agentId: 'anthropic', url: '/api/agui/anthropic' }),
    );
    expect(agentMocks[0]!.runAgent).toHaveBeenCalledOnce();
  });

  it('selects enabled providers, reuses agents, and rejects disabled or invalid selections', () => {
    const agui = service();

    agui.selectProvider('local');
    const localAgent = agentMocks[0]!;
    expect(localAgent.setMessages).toHaveBeenCalledWith([]);
    agui.selectProvider('anthropic');
    const claudeAgent = agentMocks[1]!;
    agui.selectProvider('local');
    expect(localAgent.setMessages).toHaveBeenCalledTimes(2);
    agui.selectProvider('anthropic');
    expect(claudeAgent.setMessages).toHaveBeenCalledWith([]);
    expect(agentMocks).toHaveLength(2);

    agui.selectProvider('openai');
    agui.selectProvider('gemini');
    agui.selectProvider('unknown');
    expect(agui.providerId()).toBe('anthropic');
    expect(agentMocks).toHaveLength(2);
  });

  it('exposes only user and assistant messages', () => {
    const agui = service();
    const visible: Message[] = [
      { id: 'user', role: 'user', content: 'hello' },
      { id: 'assistant', role: 'assistant', content: 'hi' },
    ];
    agui.messages.set([
      ...visible,
      { id: 'tool', role: 'tool', toolCallId: 'call', content: 'result' },
    ]);

    expect(agui.visibleMessages()).toEqual(visible);
    expect(agui.isRunning()).toBe(false);
  });

  it('sends a trimmed message and processes a supported tool call before replying', async () => {
    const agui = service();
    const tool = TestBed.inject(TripToolsService);
    const execute = vi.spyOn(tool, 'execute').mockResolvedValue('flight results');
    const agent = (agui.selectProvider('local'), agentMocks[0])!;
    agent.runAgent.mockImplementationOnce(async () => {
      const reply: AssistantMessage = {
        id: 'assistant',
        role: 'assistant',
        toolCalls: [
          {
            id: 'call-1',
            type: 'function',
            function: { name: 'search_flights', arguments: '{"origin":"Vienna"}' },
          },
        ],
      };
      agent.messages.push(reply);
    });

    await agui.send('  find me a flight  ');

    expect(agent.messages[0]).toMatchObject({ role: 'user', content: 'find me a flight' });
    expect(execute).toHaveBeenCalledWith('search_flights', '{"origin":"Vienna"}');
    expect(agent.messages.some((message) => message.role === 'tool')).toBe(true);
    expect(agent.runAgent).toHaveBeenCalledTimes(2);
    expect(agui.status()).toBe('idle');
    expect(agui.activeTool()).toBeNull();
  });

  it('ignores blank or concurrent sends and handles a failed run', async () => {
    const agui = service();
    const agent = (agui.selectProvider('local'), agentMocks[0])!;
    await agui.send('   ');
    expect(agent.runAgent).not.toHaveBeenCalled();

    agent.runAgent.mockRejectedValueOnce(new Error('connection refused'));
    await agui.send('hello');
    expect(agui.status()).toBe('error');
    expect(agui.error()).toContain('Demo is unreachable: connection refused');
    expect(agui.activeTool()).toBeNull();
  });

  it('ignores unanswered tool calls that are not supported', async () => {
    const agui = service();
    const agent = (agui.selectProvider('local'), agentMocks[0])!;
    agent.runAgent.mockImplementationOnce(async () => {
      agent.messages.push({
        id: 'assistant',
        role: 'assistant',
        toolCalls: [
          {
            id: 'unknown',
            type: 'function',
            function: { name: 'unknown_tool', arguments: '{}' },
          },
        ],
      });
    });

    await agui.send('try a tool');

    expect(agent.runAgent).toHaveBeenCalledTimes(1);
    expect(agent.messages.some((message) => message.role === 'tool')).toBe(false);
  });

  it('aborts the active agent and resets the conversation', async () => {
    const agui = service();
    agui.selectProvider('local');
    const agent = agentMocks[0]!;
    await agui.send('hello');
    agui.status.set('running');

    agui.abort();
    expect(agent.abortRun).toHaveBeenCalled();
    expect(agui.status()).toBe('idle');

    agui.error.set('failed');
    agui.activeTool.set('search_flights');
    agui.reset();

    expect(agui.messages()).toEqual([]);
    expect(agui.error()).toBeNull();
    expect(agui.activeTool()).toBeNull();
    expect(agui.status()).toBe('idle');
  });

  it('reports run failures received through the agent subscription', () => {
    const agui = service();
    agui.selectProvider('local');
    const subscriber = agentMocks[0]!.subscribe.mock.calls[0][0] as {
      onRunFailed: (params: { error: Error }) => void;
    };

    subscriber.onRunFailed({ error: new Error('server error') });

    expect(agui.error()).toContain('Demo is unreachable: server error');
    expect(agui.status()).toBe('error');
  });

  it('keeps a server RUN_ERROR visible after a rejected Claude request', async () => {
    const agui = service();
    const message =
      'Claude is unavailable: Anthropic rejected the request because this API account has insufficient credits. No Claude answer was generated.';

    agui.selectProvider('local');
    agui.selectProvider('anthropic');
    const agent = agentMocks[1]!;
    const subscriber = agent.subscribe.mock.calls[0][0] as {
      onRunErrorEvent: (params: { event: { message: string; code: string } }) => void;
    };
    agent.runAgent.mockImplementationOnce(async () => {
      subscriber.onRunErrorEvent({
        event: { message, code: 'insufficient_credits' },
      });
    });

    await agui.send('plan a trip');

    expect(agui.error()).toBe(message);
    expect(agui.status()).toBe('error');
    expect(agui.visibleMessages().map((entry) => entry.role)).toEqual(['user']);
    expect(agui.visibleMessages().filter((entry) => entry.role === 'assistant')).toHaveLength(0);
    expect(agent.runAgent).toHaveBeenCalledOnce();
  });
});
