import { ChangeDetectionStrategy, Component, computed, effect, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Message } from '@ag-ui/core';
import { AgUiService } from '../../core/ag-ui/ag-ui.service';

const SUGGESTIONS = [
  'Find me a flight from Bucharest to Lisbon on 12 June',
  'Where should I stay in Porto for 3 nights under 120 EUR?',
  'Plan a 4-day trip to Vienna: flights and a central hotel',
];

@Component({
  selector: 'tp-assistant-panel',
  imports: [
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatProgressBarModule,
    MatTooltipModule,
  ],
  templateUrl: './assistant-panel.html',
  styleUrl: './assistant-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssistantPanel {
  protected readonly agui = inject(AgUiService);
  protected readonly suggestions = SUGGESTIONS;
  protected readonly draft = signal('');

  private readonly scroller = viewChild<ElementRef<HTMLElement>>('scroller');

  protected readonly hasConversation = computed(() => this.agui.visibleMessages().length > 0);

  constructor() {
    effect(() => {
      this.agui.visibleMessages();
      const el = this.scroller()?.nativeElement;
      if (el) queueMicrotask(() => (el.scrollTop = el.scrollHeight));
    });
  }

  protected textOf(message: Message): string {
    const content = (message as { content?: unknown }).content;
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) {
      return content
        .map((part) => (typeof part === 'string' ? part : ((part as { text?: string }).text ?? '')))
        .join('');
    }
    return '';
  }

  protected toolCallCount(message: Message): number {
    return (message as { toolCalls?: unknown[] }).toolCalls?.length ?? 0;
  }

  protected use(suggestion: string): void {
    this.draft.set(suggestion);
    void this.submit();
  }

  protected async submit(): Promise<void> {
    const text = this.draft().trim();
    if (!text || this.agui.isRunning()) return;
    this.draft.set('');
    await this.agui.send(text);
  }

  protected onEnter(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.shiftKey) return;
    keyboardEvent.preventDefault();
    void this.submit();
  }
}
