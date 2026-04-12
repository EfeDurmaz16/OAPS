import {
  ActorRef,
  ApprovalDecision,
  ApprovalRequest,
  Challenge,
  ErrorObject,
  EvidenceEvent,
  InteractionTransition,
  OAPS_MAX_SUPPORTED_VERSION,
  OAPS_MIN_SUPPORTED_VERSION,
  OAPS_SPEC_VERSION,
  OapsError,
  generateId,
  negotiateVersion,
} from '@oaps/core';
import { EvidenceChain, appendEvidenceEvent, createEvidenceChain, verifyEvidenceChain } from '@oaps/evidence';

export const WS_MESSAGE_TYPES = [
  'handshake',
  'message',
  'transition',
  'approval_request',
  'approval_decision',
  'evidence',
  'challenge',
  'replay',
  'error',
  'ping',
  'pong',
] as const;

export type WsMessageType = (typeof WS_MESSAGE_TYPES)[number];

export interface WsFrame {
  type: WsMessageType;
  interaction_id: string;
  message_id: string;
  actor_ref: ActorRef;
  payload: unknown;
  timestamp: string;
}

export interface HandshakePayload {
  spec_version: string;
  min_supported_version: string;
  max_supported_version: string;
  role: 'server' | 'client';
}

export interface ReplayPayload {
  after?: string;
  limit?: number;
}

export interface WsTransport {
  send(data: string): void;
  onMessage(handler: (data: string) => void): void;
  close(code?: number, reason?: string): void;
  onClose(handler: (code: number, reason: string) => void): void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function validateWsFrame(raw: unknown): WsFrame {
  if (!isRecord(raw)) {
    throw new OapsError({
      code: 'INVALID_FRAME',
      category: 'validation',
      message: 'WebSocket frame must be a JSON object',
      retryable: false,
    });
  }

  if (typeof raw.type !== 'string' || !WS_MESSAGE_TYPES.includes(raw.type as WsMessageType)) {
    throw new OapsError({
      code: 'INVALID_MESSAGE_TYPE',
      category: 'validation',
      message: `WebSocket frame type must be one of: ${WS_MESSAGE_TYPES.join(', ')}`,
      retryable: false,
    });
  }

  if (typeof raw.interaction_id !== 'string' || raw.interaction_id === '') {
    throw new OapsError({
      code: 'VALIDATION_FAILED',
      category: 'validation',
      message: 'WebSocket frame must include a non-empty interaction_id',
      retryable: false,
    });
  }

  if (typeof raw.message_id !== 'string' || raw.message_id === '') {
    throw new OapsError({
      code: 'VALIDATION_FAILED',
      category: 'validation',
      message: 'WebSocket frame must include a non-empty message_id',
      retryable: false,
    });
  }

  if (!isRecord(raw.actor_ref) || typeof (raw.actor_ref as Record<string, unknown>).actor_id !== 'string') {
    throw new OapsError({
      code: 'VALIDATION_FAILED',
      category: 'validation',
      message: 'WebSocket frame must include actor_ref with a non-empty actor_id',
      retryable: false,
    });
  }

  if (typeof raw.timestamp !== 'string' || raw.timestamp === '') {
    throw new OapsError({
      code: 'VALIDATION_FAILED',
      category: 'validation',
      message: 'WebSocket frame must include a non-empty timestamp',
      retryable: false,
    });
  }

  return raw as unknown as WsFrame;
}

export function serializeFrame(frame: WsFrame): string {
  return JSON.stringify(frame);
}

export function deserializeFrame(data: string): WsFrame {
  let parsed: unknown;
  try {
    parsed = JSON.parse(data);
  } catch {
    throw new OapsError({
      code: 'INVALID_FRAME',
      category: 'validation',
      message: 'WebSocket frame is not valid JSON',
      retryable: false,
    });
  }
  return validateWsFrame(parsed);
}

export function createErrorFrame(
  interactionId: string,
  actorRef: ActorRef,
  error: ErrorObject,
): WsFrame {
  return {
    type: 'error',
    interaction_id: interactionId,
    message_id: generateId('wsmsg'),
    actor_ref: actorRef,
    payload: error,
    timestamp: new Date().toISOString(),
  };
}

export function createPingFrame(interactionId: string, actorRef: ActorRef, token?: string): WsFrame {
  return {
    type: 'ping',
    interaction_id: interactionId,
    message_id: generateId('wsmsg'),
    actor_ref: actorRef,
    payload: token !== undefined ? { token } : {},
    timestamp: new Date().toISOString(),
  };
}

export function createPongFrame(interactionId: string, actorRef: ActorRef, token?: string): WsFrame {
  return {
    type: 'pong',
    interaction_id: interactionId,
    message_id: generateId('wsmsg'),
    actor_ref: actorRef,
    payload: token !== undefined ? { token } : {},
    timestamp: new Date().toISOString(),
  };
}

interface ConnectionState {
  interactionId: string;
  actorRef: ActorRef;
  evidenceChain: EvidenceChain;
  negotiatedVersion: string | null;
  handshakeComplete: boolean;
}

function emitEvidence(
  state: ConnectionState,
  eventType: string,
  metadata?: Record<string, unknown>,
): EvidenceEvent {
  return appendEvidenceEvent(state.evidenceChain, {
    interaction_id: state.interactionId,
    event_type: eventType,
    actor: state.actorRef.actor_id,
    metadata,
  });
}

export type FrameHandler = (frame: WsFrame) => void;

export class AicpWebSocketServer {
  private connections = new Map<string, { transport: WsTransport; state: ConnectionState }>();
  private frameHandlers: FrameHandler[] = [];
  private serverActorRef: ActorRef;

  constructor(actorRef: ActorRef) {
    this.serverActorRef = actorRef;
  }

  onFrame(handler: FrameHandler): void {
    this.frameHandlers.push(handler);
  }

  getEvidenceChain(interactionId: string): EvidenceChain | undefined {
    for (const conn of this.connections.values()) {
      if (conn.state.interactionId === interactionId) {
        return conn.state.evidenceChain;
      }
    }
    return undefined;
  }

  acceptConnection(
    connectionId: string,
    transport: WsTransport,
    interactionId: string,
    clientActorId: string,
    verifyAuth: (actorId: string) => boolean = () => true,
  ): boolean {
    if (!verifyAuth(clientActorId)) {
      const errorFrame = createErrorFrame(interactionId, this.serverActorRef, {
        code: 'AUTHENTICATION_REQUIRED',
        category: 'authentication',
        message: 'Authentication verification failed',
        retryable: false,
      });
      transport.send(serializeFrame(errorFrame));
      transport.close(1008, 'Authentication failed');
      return false;
    }

    const state: ConnectionState = {
      interactionId,
      actorRef: { actor_id: clientActorId },
      evidenceChain: createEvidenceChain(),
      negotiatedVersion: null,
      handshakeComplete: false,
    };

    this.connections.set(connectionId, { transport, state });

    emitEvidence(state, 'ws.connection.opened', {
      connection_id: connectionId,
      client_actor_id: clientActorId,
    });

    const handshakeFrame: WsFrame = {
      type: 'handshake',
      interaction_id: interactionId,
      message_id: generateId('wsmsg'),
      actor_ref: this.serverActorRef,
      payload: {
        spec_version: OAPS_SPEC_VERSION,
        min_supported_version: OAPS_MIN_SUPPORTED_VERSION,
        max_supported_version: OAPS_MAX_SUPPORTED_VERSION,
        role: 'server',
      } satisfies HandshakePayload,
      timestamp: new Date().toISOString(),
    };
    transport.send(serializeFrame(handshakeFrame));

    transport.onMessage((data) => {
      this.handleIncomingFrame(connectionId, data);
    });

    transport.onClose((code, reason) => {
      const conn = this.connections.get(connectionId);
      if (conn) {
        emitEvidence(conn.state, 'ws.connection.closed', {
          connection_id: connectionId,
          close_code: code,
          close_reason: reason,
        });
        this.connections.delete(connectionId);
      }
    });

    return true;
  }

  private handleIncomingFrame(connectionId: string, data: string): void {
    const conn = this.connections.get(connectionId);
    if (!conn) return;

    let frame: WsFrame;
    try {
      frame = deserializeFrame(data);
    } catch (err) {
      const error = err instanceof OapsError ? err.error : {
        code: 'INVALID_FRAME',
        category: 'validation' as const,
        message: 'Failed to parse WebSocket frame',
        retryable: false,
      };
      conn.transport.send(serializeFrame(createErrorFrame(conn.state.interactionId, this.serverActorRef, error)));
      return;
    }

    if (frame.interaction_id !== conn.state.interactionId) {
      conn.transport.send(serializeFrame(createErrorFrame(conn.state.interactionId, this.serverActorRef, {
        code: 'INTERACTION_ID_MISMATCH',
        category: 'validation',
        message: 'Frame interaction_id does not match the connection-bound interaction',
        retryable: false,
      })));
      return;
    }

    if (frame.type === 'handshake') {
      const payload = frame.payload as HandshakePayload;
      const result = negotiateVersion({
        spec_version: payload.spec_version,
        min_supported_version: payload.min_supported_version,
        max_supported_version: payload.max_supported_version,
      });

      if (!result.ok) {
        conn.transport.send(serializeFrame(createErrorFrame(conn.state.interactionId, this.serverActorRef, result.error!)));
        conn.transport.close(1008, 'Version negotiation failed');
        return;
      }

      conn.state.negotiatedVersion = result.selected!;
      conn.state.handshakeComplete = true;
      emitEvidence(conn.state, 'ws.handshake', { negotiated_version: result.selected });
      return;
    }

    if (frame.type === 'ping') {
      const pingPayload = frame.payload as Record<string, unknown> | undefined;
      const pongFrame = createPongFrame(
        conn.state.interactionId,
        this.serverActorRef,
        pingPayload?.token as string | undefined,
      );
      conn.transport.send(serializeFrame(pongFrame));
      return;
    }

    if (frame.type === 'replay') {
      const replayPayload = frame.payload as ReplayPayload;
      this.handleReplay(connectionId, replayPayload);
      return;
    }

    emitEvidence(conn.state, `ws.${frame.type}`, {
      message_id: frame.message_id,
    });

    for (const handler of this.frameHandlers) {
      handler(frame);
    }
  }

  private handleReplay(connectionId: string, payload: ReplayPayload): void {
    const conn = this.connections.get(connectionId);
    if (!conn) return;

    let events = conn.state.evidenceChain.events;
    if (payload.after) {
      const afterIndex = events.findIndex((e) => e.event_id === payload.after);
      if (afterIndex === -1) {
        conn.transport.send(serializeFrame(createErrorFrame(conn.state.interactionId, this.serverActorRef, {
          code: 'REPLAY_CURSOR_NOT_FOUND',
          category: 'validation',
          message: 'Replay cursor does not match any event',
          retryable: false,
        })));
        return;
      }
      events = events.slice(afterIndex + 1);
    }

    if (payload.limit !== undefined) {
      events = events.slice(0, payload.limit);
    }

    for (const event of events) {
      const evidenceFrame: WsFrame = {
        type: 'evidence',
        interaction_id: conn.state.interactionId,
        message_id: generateId('wsmsg'),
        actor_ref: this.serverActorRef,
        payload: event,
        timestamp: new Date().toISOString(),
      };
      conn.transport.send(serializeFrame(evidenceFrame));
    }

    const completeFrame: WsFrame = {
      type: 'evidence',
      interaction_id: conn.state.interactionId,
      message_id: generateId('wsmsg'),
      actor_ref: this.serverActorRef,
      payload: { replay_complete: true, returned: events.length },
      timestamp: new Date().toISOString(),
    };
    conn.transport.send(serializeFrame(completeFrame));
  }

  send(connectionId: string, frame: WsFrame): void {
    const conn = this.connections.get(connectionId);
    if (!conn) return;

    emitEvidence(conn.state, `ws.${frame.type}`, { message_id: frame.message_id });
    conn.transport.send(serializeFrame(frame));
  }

  broadcast(interactionId: string, frame: WsFrame): void {
    for (const [connId, conn] of this.connections) {
      if (conn.state.interactionId === interactionId) {
        this.send(connId, frame);
      }
    }
  }

  closeConnection(connectionId: string, code = 1000, reason = 'Normal Closure'): void {
    const conn = this.connections.get(connectionId);
    if (!conn) return;
    conn.transport.close(code, reason);
  }
}

export class AicpWebSocketClient {
  private transport: WsTransport | null = null;
  private state: ConnectionState;
  private frameHandlers: FrameHandler[] = [];
  private handshakeResolve: ((version: string) => void) | null = null;
  private handshakeReject: ((err: Error) => void) | null = null;

  constructor(
    private interactionId: string,
    private actorRef: ActorRef,
  ) {
    this.state = {
      interactionId,
      actorRef,
      evidenceChain: createEvidenceChain(),
      negotiatedVersion: null,
      handshakeComplete: false,
    };
  }

  onFrame(handler: FrameHandler): void {
    this.frameHandlers.push(handler);
  }

  getEvidenceChain(): EvidenceChain {
    return this.state.evidenceChain;
  }

  connect(transport: WsTransport): Promise<string> {
    this.transport = transport;

    emitEvidence(this.state, 'ws.connection.opened', {
      interaction_id: this.interactionId,
    });

    transport.onMessage((data) => {
      this.handleIncomingFrame(data);
    });

    transport.onClose((_code, _reason) => {
      emitEvidence(this.state, 'ws.connection.closed', {
        interaction_id: this.interactionId,
      });
    });

    return new Promise<string>((resolve, reject) => {
      this.handshakeResolve = resolve;
      this.handshakeReject = reject;
    });
  }

  private handleIncomingFrame(data: string): void {
    let frame: WsFrame;
    try {
      frame = deserializeFrame(data);
    } catch {
      return;
    }

    if (frame.type === 'handshake') {
      const serverPayload = frame.payload as HandshakePayload;
      const result = negotiateVersion({
        spec_version: serverPayload.spec_version,
        min_supported_version: serverPayload.min_supported_version,
        max_supported_version: serverPayload.max_supported_version,
      });

      if (!result.ok) {
        this.handshakeReject?.(new Error(result.error!.message));
        this.transport?.close(1008, 'Version negotiation failed');
        return;
      }

      this.state.negotiatedVersion = result.selected!;
      this.state.handshakeComplete = true;

      const clientHandshake: WsFrame = {
        type: 'handshake',
        interaction_id: this.interactionId,
        message_id: generateId('wsmsg'),
        actor_ref: this.actorRef,
        payload: {
          spec_version: OAPS_SPEC_VERSION,
          min_supported_version: OAPS_MIN_SUPPORTED_VERSION,
          max_supported_version: OAPS_MAX_SUPPORTED_VERSION,
          role: 'client',
        } satisfies HandshakePayload,
        timestamp: new Date().toISOString(),
      };
      this.transport!.send(serializeFrame(clientHandshake));

      emitEvidence(this.state, 'ws.handshake', { negotiated_version: result.selected });
      this.handshakeResolve?.(result.selected!);
      return;
    }

    if (frame.type === 'pong') {
      return;
    }

    if (frame.type === 'ping') {
      const pingPayload = frame.payload as Record<string, unknown> | undefined;
      const pongFrame = createPongFrame(
        this.interactionId,
        this.actorRef,
        pingPayload?.token as string | undefined,
      );
      this.transport!.send(serializeFrame(pongFrame));
      return;
    }

    emitEvidence(this.state, `ws.${frame.type}`, { message_id: frame.message_id });

    for (const handler of this.frameHandlers) {
      handler(frame);
    }
  }

  send(frame: WsFrame): void {
    if (!this.transport) {
      throw new OapsError({
        code: 'CONNECTION_NOT_ESTABLISHED',
        category: 'transport',
        message: 'WebSocket connection is not established',
        retryable: false,
      });
    }

    if (frame.interaction_id !== this.interactionId) {
      throw new OapsError({
        code: 'INTERACTION_ID_MISMATCH',
        category: 'validation',
        message: 'Frame interaction_id does not match the connection-bound interaction',
        retryable: false,
      });
    }

    emitEvidence(this.state, `ws.${frame.type}`, { message_id: frame.message_id });
    this.transport.send(serializeFrame(frame));
  }

  sendMessage(payload: unknown): WsFrame {
    const frame: WsFrame = {
      type: 'message',
      interaction_id: this.interactionId,
      message_id: generateId('wsmsg'),
      actor_ref: this.actorRef,
      payload,
      timestamp: new Date().toISOString(),
    };
    this.send(frame);
    return frame;
  }

  requestReplay(after?: string, limit?: number): void {
    const frame: WsFrame = {
      type: 'replay',
      interaction_id: this.interactionId,
      message_id: generateId('wsmsg'),
      actor_ref: this.actorRef,
      payload: { after, limit } satisfies ReplayPayload,
      timestamp: new Date().toISOString(),
    };
    this.send(frame);
  }

  close(code = 1000, reason = 'Normal Closure'): void {
    this.transport?.close(code, reason);
  }
}

export function createMockTransportPair(): { client: WsTransport; server: WsTransport } {
  const clientHandlers: { message: ((data: string) => void)[]; close: ((code: number, reason: string) => void)[] } = {
    message: [],
    close: [],
  };
  const serverHandlers: { message: ((data: string) => void)[]; close: ((code: number, reason: string) => void)[] } = {
    message: [],
    close: [],
  };

  const client: WsTransport = {
    send(data: string) {
      for (const h of serverHandlers.message) h(data);
    },
    onMessage(handler) {
      clientHandlers.message.push(handler);
    },
    close(code = 1000, reason = '') {
      for (const h of serverHandlers.close) h(code, reason);
      for (const h of clientHandlers.close) h(code, reason);
    },
    onClose(handler) {
      clientHandlers.close.push(handler);
    },
  };

  const server: WsTransport = {
    send(data: string) {
      for (const h of clientHandlers.message) h(data);
    },
    onMessage(handler) {
      serverHandlers.message.push(handler);
    },
    close(code = 1000, reason = '') {
      for (const h of clientHandlers.close) h(code, reason);
      for (const h of serverHandlers.close) h(code, reason);
    },
    onClose(handler) {
      serverHandlers.close.push(handler);
    },
  };

  return { client, server };
}
