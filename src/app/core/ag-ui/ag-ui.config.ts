import { InjectionToken, Provider } from '@angular/core';

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
  headers?: Record<string, string>;
  description?: string;
}

export interface AgUiConfig {
  providers: LlmProvider[];
  defaultProviderId: string;
}

export const AG_UI_CONFIG = new InjectionToken<AgUiConfig>('AG_UI_CONFIG');

export function provideAgUi(config: AgUiConfig): Provider {
  return { provide: AG_UI_CONFIG, useValue: config };
}
