import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpAgent } from '@ag-ui/client';
import { AssistantMessage, Message } from '@ag-ui/core';
import { AG_UI_CONFIG } from './ag-ui.config';
import { AgentStatus, LlmProvider } from './ag-ui.model';
import { TRIP_TOOLS } from '../../features/assistant/tools/trip-tools.schema';
import { TripToolsService } from '../../features/assistant/tools/trip-tools.service';

const MAX_TOOL_ROUNDTRIPS = 5;
const createId = (): string =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;

/**
 * Bridges Angular to any LLM that speaks the AG-UI protocol.
 *
 * A dedicated HttpAgent is kept per configured provider, so the user can switch
 * models mid-conversation while the transcript is carried over.
 */
@Injectable({ providedIn: 'root' })
export class AgUiService {
  private readonly config = inject(AG_UI_CONFIG);
  private readonly tools = inject(TripToolsService);

  private readonly agents = new Map<string, HttpAgent>();
  private threadId = createId();

  readonly providers: readonly LlmProvider[] = this.config.providers;
  readonly providerId = signal(this.config.defaultProviderId);
  readonly provider = computed(
    () => this.providers.find((p) => p.id === this.providerId()) ?? this.providers[0],
  );

  readonly messages = signal<Message[]>([]);
  readonly status = signal<AgentStatus>('idle');
  readonly error = signal<string | null>(null);
  readonly activeTool = signal<string | null>(null);

  readonly isRunning = computed(() => this.status() === 'running');
  readonly visibleMessages = computed(() =>
    this.messages().filter((m) => m.role === 'user' || m.role === 'assistant'),
  );

  selectProvider(id: string): void {
    if (id === this.providerId() || !this.providers.some((p) => p.id === id)) return;
    this.providerId.set(id);
    this.agent().setMessages([...this.messages()]);
  }

  reset(): void {
    this.threadId = createId();
    this.agents.clear();
    this.messages.set([]);
    this.error.set(null);
    this.activeTool.set(null);
    this.status.set('idle');
  }

  async send(text: string): Promise<void> {
    const content = text.trim();
    if (!content || this.isRunning()) return;

    const agent = this.agent();
    agent.addMessage({ id: createId(), role: 'user', content });
    this.messages.set([...agent.messages]);
    await this.runLoop(agent);
  }

  abort(): void {
    this.agent().abortRun();
    this.status.set('idle');
    this.activeTool.set(null);
  }

  private async runLoop(agent: HttpAgent): Promise<void> {
    this.status.set('running');
    this.error.set(null);

    try {
      for (let round = 0; round <= MAX_TOOL_ROUNDTRIPS; round++) {
        await agent.runAgent({
          tools: TRIP_TOOLS,
          context: [
            {
              description: 'application',
              value:
                'TripPilot is a travel-planning demo. It can search and compare demo flight and ' +
                'accommodation offers, and create non-binding airport-transfer estimates. It ' +
                'never completes reservations, processes payments, or contacts suppliers.',
            },
            { description: 'currentDate', value: new Date().toISOString().slice(0, 10) },
          ],
        });

        const executed = await this.resolvePendingToolCalls(agent);
        this.messages.set([...agent.messages]);
        if (!executed) break;
      }
      this.status.set('idle');
    } catch (error) {
      this.error.set(this.describe(error));
      this.status.set('error');
    } finally {
      this.activeTool.set(null);
    }
  }

  /** Runs any front-end tool the model asked for. Returns true if the agent must run again. */
  private async resolvePendingToolCalls(agent: HttpAgent): Promise<boolean> {
    const answered = new Set(
      agent.messages.filter((m) => m.role === 'tool').map((m) => (m as any).toolCallId as string),
    );

    const pending = agent.messages
      .filter((m): m is AssistantMessage => m.role === 'assistant')
      .flatMap((m) => m.toolCalls ?? [])
      .filter((call) => !answered.has(call.id) && this.tools.canHandle(call.function.name));

    if (!pending.length) return false;

    for (const call of pending) {
      this.activeTool.set(call.function.name);
      const content = await this.tools.execute(call.function.name, call.function.arguments);
      agent.addMessage({
        id: createId(),
        role: 'tool',
        content,
        toolCallId: call.id,
      });
    }
    this.activeTool.set(null);
    return true;
  }

  private agent(): HttpAgent {
    const provider = this.provider();
    let agent = this.agents.get(provider.id);

    if (!agent) {
      agent = new HttpAgent({
        agentId: provider.id,
        description: `${provider.vendor} ${provider.model}`,
        url: provider.url,
        headers: { 'Content-Type': 'application/json', ...(provider.headers ?? {}) },
        threadId: this.threadId,
        initialMessages: [...this.messages()],
      });
      agent.subscribe({
        onMessagesChanged: ({ messages }) => this.messages.set([...messages]),
        onRunFailed: ({ error }) => {
          this.error.set(this.describe(error));
          this.status.set('error');
        },
      });
      this.agents.set(provider.id, agent);
    }

    return agent;
  }

  private describe(error: unknown): string {
    const message = error instanceof Error ? error.message : String(error);
    return `${this.provider().label} is unreachable: ${message}. Check the AG-UI endpoint configured for this provider.`;
  }
}
