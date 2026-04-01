export type BookSideEntry = {
  price: number;
  count: number;
  amount: number;
};

export type TradeRow = {
  id: number;
  ts: number;
  amount: number;
  price: number;
};

export type MarketState = {
  connection: {
    status: "disconnected" | "connecting" | "connected";
    error: string | null;
    bookChanId: number | null;
    tradesChanId: number | null;
    intentionalDisconnect: boolean;
  };
  book: {
    bids: Record<string, BookSideEntry>;
    asks: Record<string, BookSideEntry>;
    hasSnapshot: boolean;
  };
  trades: {
    items: TradeRow[];
    hasSnapshot: boolean;
  };
  ui: {
    precisionIndex: number;
    depthScaleIndex: number;
  };
};

export const PRECISION_MAX = 4;
export const DEPTH_SCALE_STEPS = [0.65, 0.85, 1, 1.25, 1.6] as const;

export const initialMarketState: MarketState = {
  connection: {
    status: "disconnected",
    error: null,
    bookChanId: null,
    tradesChanId: null,
    intentionalDisconnect: false,
  },
  book: {
    bids: {},
    asks: {},
    hasSnapshot: false,
  },
  trades: {
    items: [],
    hasSnapshot: false,
  },
  ui: {
    precisionIndex: 0,
    depthScaleIndex: 2,
  },
};
