import { END, eventChannel } from "redux-saga";
import {
  all,
  call,
  delay,
  put,
  select,
  take,
  takeEvery,
  takeLeading,
} from "redux-saga/effects";
import type { MarketState } from "../types";

const WS_URL = "wss://api-pub.bitfinex.com/ws/2";
export const DEFAULT_SYMBOL = "tBTCUSD";

type WsRef = { current: WebSocket | null };

const wsRef: WsRef = { current: null };

function openWebSocket(): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WS_URL);
    ws.onopen = () => resolve(ws);
    ws.onerror = () => reject(new Error("WebSocket failed"));
  });
}

function subscribeMessages(ws: WebSocket) {
  return eventChannel((emit) => {
    ws.onmessage = (ev) => {
      const raw = ev.data;
      if (typeof raw !== "string") return;
      try {
        const parsed: unknown = JSON.parse(raw);
        if (
          parsed &&
          typeof parsed === "object" &&
          !Array.isArray(parsed) &&
          (parsed as { event?: string }).event === "ping"
        ) {
          ws.send(JSON.stringify({ event: "pong" }));
          return;
        }
        emit(parsed as object);
      } catch {
        emit({ event: "error", msg: "Invalid message" });
      }
    };
    ws.onerror = () => {
      emit({ event: "error", msg: "Transport error" });
    };
    ws.onclose = () => {
      emit(END);
    };
    return () => {
      ws.onmessage = null;
      ws.onerror = null;
      ws.onclose = null;
    };
  });
}

function sendBookSubscribe(ws: WebSocket, precIndex: number) {
  ws.send(
    JSON.stringify({
      event: "subscribe",
      channel: "book",
      symbol: DEFAULT_SYMBOL,
      prec: `P${precIndex}`,
      freq: "F0",
      len: "25",
    }),
  );
}

function sendTradesSubscribe(ws: WebSocket) {
  ws.send(
    JSON.stringify({
      event: "subscribe",
      channel: "trades",
      symbol: DEFAULT_SYMBOL,
    }),
  );
}

function* socketSession() {
  let ch: ReturnType<typeof subscribeMessages> | null = null;
  try {
    const ws: WebSocket = yield call(openWebSocket);
    wsRef.current = ws;
    yield put({ type: "WS_CONNECTED" });

    const market: MarketState = yield select(
      (s: { market: MarketState }) => s.market,
    );
    sendBookSubscribe(ws, market.ui.precisionIndex);
    sendTradesSubscribe(ws);

    const messageChannel: ReturnType<typeof subscribeMessages> = yield call(
      subscribeMessages,
      ws,
    );
    ch = messageChannel;
    while (true) {
      const msg: unknown = yield take(messageChannel);
      if (msg === END) break;
      yield put({ type: "WS_MESSAGE", payload: msg });
    }
  } catch {
    yield put({
      type: "WS_MESSAGE",
      payload: { event: "error", msg: "Connection failed" },
    });
  } finally {
    if (ch) {
      ch.close();
    }
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {
        /* ignore */
      }
      wsRef.current = null;
    }
    yield put({ type: "WS_DISCONNECTED" });
  }
}

function* connectFlow() {
  yield put({ type: "WS_CONNECTING" });
  yield call(socketSession);
}

function* onDisconnectRequest() {
  yield put({ type: "SET_INTENTIONAL_DISCONNECT", payload: true });
  if (wsRef.current) {
    try {
      wsRef.current.close();
    } catch {
      /* ignore */
    }
    wsRef.current = null;
  }
}

function* onBookPrecisionChange() {
  const ws = wsRef.current;
  if (!ws || ws.readyState !== WebSocket.OPEN) return;

  const bookChanId = (yield select(
    (s: { market: MarketState }) => s.market.connection.bookChanId,
  )) as number | null;
  if (bookChanId == null) return;

  ws.send(JSON.stringify({ event: "unsubscribe", chanId: bookChanId }));
  yield put({ type: "CLEAR_BOOK" });

  const prec = (yield select(
    (s: { market: MarketState }) => s.market.ui.precisionIndex,
  )) as number;
  sendBookSubscribe(ws, prec);
}

function* reconnectLoop() {
  yield takeLeading("WS_CONNECT_REQUEST", function* () {
    yield put({ type: "SET_INTENTIONAL_DISCONNECT", payload: false });
    yield call(connectFlow);

    const intentional = (yield select(
      (s: { market: MarketState }) => s.market.connection.intentionalDisconnect,
    )) as boolean;

    if (!intentional) {
      yield delay(2800);
      yield put({ type: "WS_CONNECT_REQUEST" });
    }
  });
}

export function* rootSaga() {
  yield all([
    call(reconnectLoop),
    takeEvery("WS_DISCONNECT_REQUEST", onDisconnectRequest),
    takeEvery("SET_BOOK_PRECISION", onBookPrecisionChange),
  ]);
}
