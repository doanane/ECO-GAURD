import { Platform } from 'react-native';
import { WebSocketMessage } from '../types/reading';

type EventType = 'sensor_reading' | 'alert' | 'heartbeat' | 'connection_change';
type Listener = (data: any) => void;

function resolveWsUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_WS_URL;
  if (fromEnv) return fromEnv;

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'ws://localhost:8000';
    }
    if (protocol === 'https:') {
      return 'wss://localhost:8000';
    }
  }

  return 'ws://localhost:8000';
}

const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 16000, 30000];

export class WebSocketClient {
  private _ws: WebSocket | null = null;
  private _listeners: Map<EventType, Set<Listener>> = new Map();
  private _reconnectAttempt = 0;
  private _reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private _pingTimer:      ReturnType<typeof setInterval> | null = null;
  private _active = false;
  private _connectionState: 'connecting' | 'connected' | 'disconnected' | 'reconnecting' = 'disconnected';

  get connectionState() { return this._connectionState; }

  connect() {
    if (this._ws?.readyState === WebSocket.OPEN) return;
    this._active = true;
    this._setConnectionState('connecting');

    try {
      this._ws = new WebSocket(`${resolveWsUrl()}/ws/pipeline`);

      this._ws.onopen = () => {
        this._reconnectAttempt = 0;
        this._setConnectionState('connected');
        this._startPing();
        console.log('[WS] Connected to pipeline feed.');
      };

      this._ws.onmessage = (e) => {
        try {
          const msg: WebSocketMessage = JSON.parse(e.data);
          this._emit(msg.type as EventType, msg.payload);
        } catch { /* ignore parse errors */ }
      };

      this._ws.onerror = (e) => { console.warn('[WS] Error:', e); };

      this._ws.onclose = () => {
        this._stopPing();
        if (this._active) {
          this._scheduleReconnect();
        } else {
          this._setConnectionState('disconnected');
        }
      };
    } catch (err) {
      console.error('[WS] Failed to open:', err);
      this._scheduleReconnect();
    }
  }

  disconnect() {
    this._active = false;
    this._stopReconnect();
    this._stopPing();
    if (this._ws) { this._ws.close(); this._ws = null; }
    this._setConnectionState('disconnected');
  }

  on(event: EventType, listener: Listener) {
    if (!this._listeners.has(event)) this._listeners.set(event, new Set());
    this._listeners.get(event)!.add(listener);
  }

  off(event: EventType, listener: Listener) {
    this._listeners.get(event)?.delete(listener);
  }

  private _emit(event: EventType, data: any) {
    this._listeners.get(event)?.forEach((l) => { try { l(data); } catch {} });
  }

  private _setConnectionState(state: typeof this._connectionState) {
    this._connectionState = state;
    this._emit('connection_change', state);
  }

  private _scheduleReconnect() {
    this._setConnectionState('reconnecting');
    const delay = RECONNECT_DELAYS[Math.min(this._reconnectAttempt, RECONNECT_DELAYS.length - 1)];
    this._reconnectAttempt += 1;
    console.log(`[WS] Reconnecting in ${delay}ms (attempt ${this._reconnectAttempt})...`);
    this._reconnectTimer = setTimeout(() => this.connect(), delay);
  }

  private _stopReconnect() {
    if (this._reconnectTimer) { clearTimeout(this._reconnectTimer); this._reconnectTimer = null; }
  }

  private _startPing() {
    this._pingTimer = setInterval(() => {
      if (this._ws?.readyState === WebSocket.OPEN) {
        this._ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 25000);
  }

  private _stopPing() {
    if (this._pingTimer) { clearInterval(this._pingTimer); this._pingTimer = null; }
  }
}

export const wsClient = new WebSocketClient();
