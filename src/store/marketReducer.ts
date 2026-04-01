import {
  DEPTH_SCALE_STEPS,
  initialMarketState,
  PRECISION_MAX,
  type BookSideEntry,
  type MarketState,
  type TradeRow,
} from "./types";

type BookTuple = [number, number, number];
type TradeTuple = [number, number, number, number];

function applySnapshot(entries: BookTuple[]): Pick<MarketState["book"], "bids" | "asks"> {
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

function applyBookUpdates(
  bids: Record<string, BookSideEntry>,
  asks: Record<string, BookSideEntry>,
  updates: BookTuple[],
): { bids: Record<string, BookSideEntry>; asks: Record<string, BookSideEntry> } {
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

function mapTradeTuple(t: TradeTuple): TradeRow {
  const [id, ts, amount, price] = t;
  return { id, ts, amount, price };
}

function handleBookChannel(
  book: MarketState["book"],
  conn: MarketState["connection"],
  payload: unknown[],
): MarketState["book"] {
  const chanId = payload[0];
  if (typeof chanId !== "number" || chanId !== conn.bookChanId) return book;

  const [, body] = payload;
  if (body === "hb") return book;
  if (!Array.isArray(body) || body.length === 0) return book;

  const first = body[0];
  if (Array.isArray(first)) {
    const rows = body as unknown as BookTuple[];
    if (!book.hasSnapshot) {
      const { bids, asks } = applySnapshot(rows);
      return { bids, asks, hasSnapshot: true };
    }
    const { bids, asks } = applyBookUpdates(book.bids, book.asks, rows);
    return { ...book, bids, asks };
  }

  if (typeof first === "number") {
    const { bids, asks } = applyBookUpdates(book.bids, book.asks, [body as BookTuple]);
    return { ...book, bids, asks, hasSnapshot: true };
  }

  return book;
}

function handleTradesChannel(
  trades: MarketState["trades"],
  conn: MarketState["connection"],
  payload: unknown[],
): MarketState["trades"] {
  const chanId = payload[0];
  if (typeof chanId !== "number" || chanId !== conn.tradesChanId) return trades;

  const [, body] = payload;
  if (body === "hb") return trades;
  if (!Array.isArray(body) || body.length === 0) return trades;

  const first = body[0];
  if (Array.isArray(first)) {
    const rows = body as unknown as TradeTuple[];
    const items = rows.map(mapTradeTuple).sort((a, b) => b.ts - a.ts);
    return { items, hasSnapshot: true };
  }

  if (typeof first === "number") {
    const row = mapTradeTuple(body as TradeTuple);
    const next = [row, ...trades.items.filter((t) => t.id !== row.id)].sort((a, b) => b.ts - a.ts);
    return { items: next.slice(0, 80), hasSnapshot: true };
  }

  return trades;
}

function handleEventObject(
  state: MarketState,
  payload: Record<string, unknown>,
): MarketState {
  const ev = payload.event;
  if (ev === "error") {
    const msg = payload.msg;
    const text =
      typeof msg === "string"
        ? msg
        : typeof msg === "number"
          ? String(msg)
          : JSON.stringify(payload);
    return {
      ...state,
      connection: { ...state.connection, error: text },
    };
  }
  if (ev === "subscribed") {
    const channel = payload.channel;
    const chanId = payload.chanId;
    if (typeof chanId !== "number") return state;
    if (channel === "book") {
      return {
        ...state,
        connection: { ...state.connection, bookChanId: chanId, error: null },
      };
    }
    if (channel === "trades") {
      return {
        ...state,
        connection: { ...state.connection, tradesChanId: chanId, error: null },
      };
    }
  }
  return state;
}

export type MarketAction =
  | { type: "WS_CONNECTING" }
  | { type: "WS_CONNECTED" }
  | { type: "WS_DISCONNECTED" }
  | { type: "WS_MESSAGE"; payload: unknown }
  | { type: "CLEAR_BOOK" }
  | { type: "SET_INTENTIONAL_DISCONNECT"; payload: boolean }
  | { type: "SET_BOOK_PRECISION"; payload: number }
  | { type: "SET_DEPTH_SCALE"; payload: number };

export function marketReducer(state: MarketState = initialMarketState, action: MarketAction): MarketState {
  switch (action.type) {
    case "WS_CONNECTING":
      return {
        ...state,
        connection: {
          ...initialMarketState.connection,
          status: "connecting",
          intentionalDisconnect: false,
        },
        book: { ...initialMarketState.book },
        trades: { ...initialMarketState.trades },
      };
    case "WS_CONNECTED":
      return {
        ...state,
        connection: {
          ...state.connection,
          status: "connected",
          error: null,
        },
      };
    case "WS_DISCONNECTED":
      return {
        ...initialMarketState,
        ui: state.ui,
        connection: {
          ...initialMarketState.connection,
          intentionalDisconnect: state.connection.intentionalDisconnect,
          status: "disconnected",
        },
      };
    case "SET_INTENTIONAL_DISCONNECT":
      return {
        ...state,
        connection: { ...state.connection, intentionalDisconnect: action.payload },
      };
    case "CLEAR_BOOK":
      return {
        ...state,
        book: { bids: {}, asks: {}, hasSnapshot: false },
        connection: { ...state.connection, bookChanId: null },
      };
    case "SET_BOOK_PRECISION":
      return {
        ...state,
        ui: {
          ...state.ui,
          precisionIndex: Math.max(0, Math.min(PRECISION_MAX, action.payload)),
        },
      };
    case "SET_DEPTH_SCALE":
      return {
        ...state,
        ui: {
          ...state.ui,
          depthScaleIndex: Math.max(0, Math.min(DEPTH_SCALE_STEPS.length - 1, action.payload)),
        },
      };
    case "WS_MESSAGE": {
      const payload = action.payload;
      if (Array.isArray(payload)) {
        const book = handleBookChannel(state.book, state.connection, payload);
        const trades = handleTradesChannel(state.trades, state.connection, payload);
        return { ...state, book, trades };
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
