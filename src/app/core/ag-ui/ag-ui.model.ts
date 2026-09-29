/**
 * One selectable LLM behind an AG-UI compatible endpoint.
 * Each provider points at its own agent server implementing the
 * AG-UI protocol (SSE stream of AG-UI events over HTTP POST).
 */
export interface LlmProvider {
  id: string;
  label: string;
  vendor: string;
  model: string;
  /** URL of the AG-UI agent endpoint serving this model. */
  url: string;
  disabled?: boolean;
  headers?: Record<string, string>;
  description?: string;
}

export interface AgUiConfig {
  providers: LlmProvider[];
  defaultProviderId: string;
}

export type AgentStatus = 'idle' | 'running' | 'error';

export type ToolArgs = Record<string, unknown>;
export type ToolHandler = (args: ToolArgs) => unknown | Promise<unknown>;
