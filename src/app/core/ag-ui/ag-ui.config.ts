import { InjectionToken, Provider } from '@angular/core';
import { AgUiConfig } from './ag-ui.model';

/** LLM providers exposed in the assistant panel via the AG-UI protocol. */
export const AG_UI_APP_CONFIG: AgUiConfig = {
  defaultProviderId: 'local',
  providers: [
    {
      id: 'openai',
      label: 'GPT',
      vendor: 'OpenAI',
      model: 'gpt-4.1',
      url: '/api/agui/openai',
      description: 'Balanced reasoning, strong tool use.',
    },
    {
      id: 'anthropic',
      label: 'Claude',
      vendor: 'Anthropic',
      model: 'claude-sonnet-4',
      url: '/api/agui/anthropic',
      description: 'Long itineraries and careful planning.',
    },
    {
      id: 'gemini',
      label: 'Gemini',
      vendor: 'Google',
      model: 'gemini-2.5-pro',
      url: '/api/agui/gemini',
      description: 'Fast, multimodal, great with maps.',
    },
    {
      id: 'local',
      label: 'Demo',
      vendor: 'TripPilot',
      model: 'offline assistant',
      url: '/api/agui/local',
      description: 'Offline demo replies, no API key required.',
    },
  ],
};

export const AG_UI_CONFIG = new InjectionToken<AgUiConfig>('AG_UI_CONFIG');

export function provideAgUi(config: AgUiConfig): Provider {
  return { provide: AG_UI_CONFIG, useValue: config };
}
