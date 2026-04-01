//  Default Bitfinex trading pair for the book channel (ticker format, e.g. `tBTCUSD`).
export const DEFAULT_BOOK_SYMBOL = "tBTCUSD" as const;

/**
 * Bitfinex book precision indices on subscribe: `prec: "P0"` … `"P4"`.
 * P0 = finest price steps (more levels); P4 = wider buckets (fewer merged levels).
 */
export const BOOK_PREC_MIN_INDEX = 0;
export const BOOK_PREC_MAX_INDEX = 4;

export const COMPACT_ORDER_BOOK_ROWS = 10;

export const BOOK_WS_LEN = "250" as const;

export const DEPTH_BAR_SCALES = [0.65, 0.85, 1, 1.25, 1.6] as const;

// Index into `DEPTH_BAR_SCALES` for fixed bar scale when no user control is shown (1 → 100%).
export const DEFAULT_DEPTH_BAR_SCALE_INDEX = 2 as const;
