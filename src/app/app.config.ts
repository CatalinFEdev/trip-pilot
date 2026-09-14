import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideNativeDateAdapter } from '@angular/material/core';

import { routes } from './app.routes';
import { provideAgUi } from './core/ag-ui/ag-ui.config';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'enabled' })),
    provideHttpClient(withFetch()),
    provideNativeDateAdapter(),
    provideAgUi({
      defaultProviderId: 'openai',
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
          label: 'Local',
          vendor: 'Ollama',
          model: 'llama3.1',
          url: '/api/agui/local',
          description: 'Self-hosted model, no data leaves the network.',
        },
      ],
    }),
  ],
};
