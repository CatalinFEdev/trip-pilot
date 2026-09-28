import { randomUUID } from 'node:crypto';
import type { Response } from 'express';
import { EventEncoder } from '@ag-ui/encoder';
import { EventType } from '@ag-ui/core';

/**
 * Thin wrapper around an Express response that emits a valid AG-UI event
 * stream (see https://docs.ag-ui.com). Every provider route uses this so the
 * event ordering rules (RUN_STARTED -> ... -> RUN_FINISHED | RUN_ERROR) are
 * enforced in one place instead of being re-implemented per provider.
 */
export class AgUiStream {
  private readonly encoder = new EventEncoder();
  private ended = false;

  constructor(
    private readonly res: Response,
    private readonly threadId: string,
    private readonly runId: string,
  ) {
    res.status(200);
    res.setHeader('Content-Type', this.encoder.getContentType());
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();
  }

  runStarted(): void {
    this.write({ type: EventType.RUN_STARTED, threadId: this.threadId, runId: this.runId });
  }

  /** Emits a complete assistant text message as a start/content/end triplet. */
  textMessage(content: string): void {
    const messageId = randomUUID();
    this.write({ type: EventType.TEXT_MESSAGE_START, messageId, role: 'assistant' });
    this.write({ type: EventType.TEXT_MESSAGE_CONTENT, messageId, delta: content });
    this.write({ type: EventType.TEXT_MESSAGE_END, messageId });
  }

  /** Emits a single tool call as a start/args/end triplet. */
  toolCall(toolCallId: string, toolCallName: string, args: unknown): void {
    this.write({ type: EventType.TOOL_CALL_START, toolCallId, toolCallName });
    this.write({ type: EventType.TOOL_CALL_ARGS, toolCallId, delta: JSON.stringify(args ?? {}) });
    this.write({ type: EventType.TOOL_CALL_END, toolCallId });
  }

  runFinished(result?: unknown): void {
    this.write({ type: EventType.RUN_FINISHED, threadId: this.threadId, runId: this.runId, result });
    this.end();
  }

  /** Emits a protocol-level error. The AG-UI client surfaces `message` to the UI. */
  runError(message: string, code?: string): void {
    this.write({ type: EventType.RUN_ERROR, message, code });
    this.end();
  }

  private write(event: Record<string, unknown>): void {
    if (this.ended) return;
    this.res.write(this.encoder.encodeSSE(event as never));
  }

  private end(): void {
    if (this.ended) return;
    this.ended = true;
    this.res.end();
  }
}
