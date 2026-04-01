import {
  BOOK_PREC_MAX_INDEX,
  BOOK_PREC_MIN_INDEX,
} from "../constants/orderBook";
import { Strings } from "../constants/strings";

export type BookSideEntry = {
  price: number;
  count: number;
  amount: number;
};

export type OrderBookState = {
  bids: Record<string, BookSideEntry>;
  asks: Record<string, BookSideEntry>;
  connectionStatus: "disconnected" | "connecting" | "connected";
  error: string | null;
  // First book payload is a full snapshot; later array-of-rows messages are deltas.
  hasSnapshot: boolean;
  // Bitfinex book channel id (for unsubscribe when changing precision).
  bookChanId: number | null;
  // Bitfinex P0–P4 — drives live subscription and price grouping in the UI.
  bookPrecIndex: number;
};

export const initialOrderBookState: OrderBookState = {
  bids: {},
  asks: {},
  connectionStatus: "disconnected",
  error: null,
  hasSnapshot: false,
  bookChanId: null,
  bookPrecIndex: 0,
};

type BookTuple = [number, number, number];

function applySnapshot(
  entries: BookTuple[],
): Pick<OrderBookState, "bids" | "asks"> {
  const bids: Record<string, BookSideEntry> = {};
  const asks: Record<string, BookSideEntry> = {};
  for (const row of entries) {
    const [price, count, amount] = row;
    if (count === 0) continue;
    const key = String(price);
    if (amount > 0) bids[key] = { price, count, amount };
    else if (amount < 0) asks[key] = { price, count, amount };
  }
  return { bids, asks };
}

function applyUpdates(
  bids: Record<string, BookSideEntry>,
  asks: Record<string, BookSideEntry>,
  updates: BookTuple[],
): {
  bids: Record<string, BookSideEntry>;
  asks: Record<string, BookSideEntry>;
} {
  const nextBids = { ...bids };
  const nextAsks = { ...asks };
  for (const row of updates) {
    const [price, count, amount] = row;
    const key = String(price);
    if (count === 0) {
      delete nextBids[key];
      delete nextAsks[key];
      continue;
    }
    if (amount > 0) {
      delete nextAsks[key];
      nextBids[key] = { price, count, amount };
    } else if (amount < 0) {
      delete nextBids[key];
      nextAsks[key] = { price, count, amount };
    }
  }
  return { bids: nextBids, asks: nextAsks };
}

function handleChannelPayload(
  state: OrderBookState,
  payload: unknown[],
): OrderBookState {
  const chanId = payload[0];
  if (
    typeof chanId === "number" &&
    state.bookChanId != null &&
    chanId !== state.bookChanId
  ) {
    return state;
  }

  const [, body] = payload;
  if (body === "hb") return state;

  if (!Array.isArray(body) || body.length === 0) return state;

  const first = body[0];
  if (Array.isArray(first)) {
    const rows = body as unknown as BookTuple[];
    if (!state.hasSnapshot) {
      const { bids, asks } = applySnapshot(rows);
      return { ...state, bids, asks, error: null, hasSnapshot: true };
    }
    const { bids, asks } = applyUpdates(state.bids, state.asks, rows);
    return { ...state, bids, asks, error: null };
  }

  if (typeof first === "number") {
    const { bids, asks } = applyUpdates(state.bids, state.asks, [
      body as BookTuple,
    ]);
    return { ...state, bids, asks, error: null, hasSnapshot: true };
  }

  return state;
}

function handleEventObject(
  state: OrderBookState,
  payload: Record<string, unknown>,
): OrderBookState {
  const ev = payload.event;
  if (ev === "error") {
    const msg = payload.msg;
    const text =
      typeof msg === "string"
        ? msg
        : typeof msg === "number"
          ? String(msg)
          : JSON.stringify(payload);
    return { ...state, error: text };
  }
  if (ev === "subscribed" && payload.channel === "book") {
    const chanId = payload.chanId;
    return {
      ...state,
      error: null,
      bookChanId: typeof chanId === "number" ? chanId : state.bookChanId,
    };
  }
  return state;
}

export type OrderBookAction =
  | { type: "WS_CONNECTING" }
  | { type: "WS_CONNECTED" }
  | { type: "WS_DISCONNECTED" }
  | { type: "WS_STREAM_LOST" }
  | { type: "WS_STREAM_RECONNECTING" }
  | { type: "CLEAR_BOOK_FOR_PREC" }
  | { type: "SET_BOOK_PREC_INDEX"; payload: number }
  | { type: "WS_MESSAGE"; payload: unknown };

export function orderBookReducer(
  state: OrderBookState = initialOrderBookState,
  action: OrderBookAction,
): OrderBookState {
  switch (action.type) {
    case "WS_CONNECTING":
      return {
        ...initialOrderBookState,
        connectionStatus: "connecting",
        hasSnapshot: false,
        bookPrecIndex: state.bookPrecIndex,
        bookChanId: null,
      };
    case "WS_CONNECTED":
      return { ...state, connectionStatus: "connected", error: null };
    case "WS_DISCONNECTED":
      return {
        ...initialOrderBookState,
        connectionStatus: "disconnected",
        bookPrecIndex: state.bookPrecIndex,
      };
    case "WS_STREAM_LOST":
      return {
        ...state,
        connectionStatus: "connecting",
        error: Strings.errors.streamLostReconnecting,
        hasSnapshot: false,
        bookChanId: null,
      };
    case "WS_STREAM_RECONNECTING":
      return {
        ...state,
        connectionStatus: "connecting",
        error: null,
        hasSnapshot: false,
        bookChanId: null,
      };
    case "CLEAR_BOOK_FOR_PREC":
      return {
        ...state,
        bids: {},
        asks: {},
        hasSnapshot: false,
        bookChanId: null,
      };
    case "SET_BOOK_PREC_INDEX":
      return {
        ...state,
        bookPrecIndex: Math.max(
          BOOK_PREC_MIN_INDEX,
          Math.min(BOOK_PREC_MAX_INDEX, action.payload),
        ),
      };
    case "WS_MESSAGE": {
      const payload = action.payload;
      if (Array.isArray(payload)) {
        return handleChannelPayload(state, payload);
      }
      if (payload && typeof payload === "object" && !Array.isArray(payload)) {
        return handleEventObject(state, payload as Record<string, unknown>);
      }
      return state;
    }
    default:
      return state;
  }
}
