import { TestBed } from '@angular/core/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { describe, expect, it, vi } from 'vitest';
import { AssistantPanel } from './assistant-panel';
import { AgUiService } from '../../core/ag-ui/ag-ui.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { provideAgUi, AG_UI_APP_CONFIG } from '../../core/ag-ui/ag-ui.config';
import { TripToolsService } from './tools/trip-tools.service';

describe('AssistantPanel', () => {
  it('renders suggestions and sends a submitted draft', async () => {
    await TestBed.configureTestingModule({
      imports: [AssistantPanel],
      providers: [
        provideAgUi(AG_UI_APP_CONFIG),
        AgUiService,
        TripToolsService,
        I18nService,
        provideNativeDateAdapter(),
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AssistantPanel);
    const component = fixture.componentInstance as unknown as {
      draft: { set: (value: string) => void };
      submit: () => Promise<void>;
      textOf: (message: unknown) => string;
    };
    const agui = TestBed.inject(AgUiService);
    vi.spyOn(agui, 'send').mockResolvedValue();
    component.draft.set('  Plan my trip  ');

    await component.submit();

    expect(agui.send).toHaveBeenCalledWith('Plan my trip');
    expect(component.textOf({ content: [{ text: 'Hello' }, ' world'] })).toBe('Hello world');
  });
});
