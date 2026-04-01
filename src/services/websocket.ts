import {
  BOOK_PREC_MAX_INDEX,
  BOOK_PREC_MIN_INDEX,
  BOOK_WS_LEN,
  DEFAULT_BOOK_SYMBOL,
} from "../constants/orderBook";
import { Strings } from "../constants/strings";
import { store } from "../store/store";

const BITFINEX_WS = "wss://api-pub.bitfinex.com/ws/2";

export { DEFAULT_BOOK_SYMBOL };

const RECONNECT_MS = 2200;

export type WsHandlers = {
  onConnecting?: () => void;
  onMessage: (data: unknown) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onStreamLost?: () => void;
  onStreamReconnecting?: () => void;
  onError?: (message: string) => void;
};

let socket: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let manualClosePending = false;
let lastHandlers: WsHandlers | null = null;

function clearReconnectTimer() {
  if (reconnectTimer != null) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

function readBookPrecIndex(): number {
  return store.getState().bookPrecIndex;
}

function subscribeBook(ws: WebSocket, symbol: string) {
  const precIndex = readBookPrecIndex();
  ws.send(
    JSON.stringify({
      event: "subscribe",
      channel: "book",
      symbol,
      prec: `P${precIndex}`,
      freq: "F0",
      len: BOOK_WS_LEN,
    }),
  );
}

export function changeBookPrecision(nextIndex: number) {
  const clamped = Math.max(
    BOOK_PREC_MIN_INDEX,
    Math.min(BOOK_PREC_MAX_INDEX, nextIndex),
  );
  const ws = socket;
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    store.dispatch({ type: "SET_BOOK_PREC_INDEX", payload: clamped });
    return;
  }
  const { bookChanId } = store.getState();
  if (bookChanId != null) {
    try {
      ws.send(JSON.stringify({ event: "unsubscribe", chanId: bookChanId }));
    } catch {
      /* ignore */
    }
  }
  store.dispatch({ type: "CLEAR_BOOK_FOR_PREC" });
  store.dispatch({ type: "SET_BOOK_PREC_INDEX", payload: clamped });
  subscribeBook(ws, DEFAULT_BOOK_SYMBOL);
}

function teardownSocketSilently() {
  clearReconnectTimer();
  if (!socket) return;
  const ws = socket;
  socket = null;
  ws.onmessage = null;
  ws.onerror = null;
  ws.onclose = null;
  try {
    ws.close(1000, "replaced");
  } catch {
    /* ignore */
  }
}

function attachSocket(ws: WebSocket, handlers: WsHandlers, symbol: string) {
  ws.onmessage = (event) => {
    const raw = event.data;
    if (typeof raw !== "string") return;
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      handlers.onError?.(Strings.errors.invalidWebSocketMessage);
      return;
    }
    if (
      parsed &&
      typeof parsed === "object" &&
      !Array.isArray(parsed) &&
      (parsed as { event?: string }).event === "ping"
    ) {
      ws.send(JSON.stringify({ event: "pong" }));
      return;
    }
    handlers.onMessage(parsed);
  };

  ws.onerror = () => {
    handlers.onError?.(Strings.errors.webSocketError);
  };

  ws.onclose = () => {
    socket = null;
    if (manualClosePending) {
      manualClosePending = false;
      handlers.onClose?.();
      return;
    }
    handlers.onStreamLost?.();
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connectWS(handlers, symbol, { isAutoReconnect: true });
    }, RECONNECT_MS);
  };
}

export type ConnectOptions = {
  isAutoReconnect?: boolean;
};

export function connectWS(
  handlers: WsHandlers,
  symbol: string = DEFAULT_BOOK_SYMBOL,
  options?: ConnectOptions,
) {
  lastHandlers = handlers;
  teardownSocketSilently();

  const isAuto = options?.isAutoReconnect === true;
  if (isAuto) {
    handlers.onStreamReconnecting?.();
  } else {
    manualClosePending = false;
    handlers.onConnecting?.();
  }

  const ws = new WebSocket(BITFINEX_WS);
  socket = ws;

  ws.onopen = () => {
    subscribeBook(ws, symbol);
    handlers.onOpen?.();
  };

  attachSocket(ws, handlers, symbol);
}

export function disconnectWS() {
  clearReconnectTimer();
  manualClosePending = true;

  if (!socket) {
    lastHandlers?.onClose?.();
    lastHandlers = null;
    manualClosePending = false;
    return;
  }

  const ws = socket;
  socket = null;
  ws.onmessage = null;
  ws.onerror = null;
  ws.onclose = null;
  try {
    ws.close(1000, "client");
  } catch {}

  lastHandlers?.onClose?.();
  lastHandlers = null;
  manualClosePending = false;
}

export function isConnected(): boolean {
  return socket !== null && socket.readyState === WebSocket.OPEN;
}
