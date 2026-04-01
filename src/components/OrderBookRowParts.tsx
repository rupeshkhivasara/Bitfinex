import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { DETAIL_COLORS, OB_COLORS } from "../constants/colors";
import { FontSize, FontWeight, LetterSpacing } from "../constants/layout";
import { Strings } from "../constants/strings";
import type { BookSideEntry } from "../store/orderBookReducer";

export { DETAIL_COLORS, OB_COLORS };

export function getSortedBookSides(
  bids: Record<string, BookSideEntry>,
  asks: Record<string, BookSideEntry>,
) {
  const bidRows = Object.values(bids).sort((a, b) => b.price - a.price);
  const askRows = Object.values(asks).sort((a, b) => a.price - b.price);
  return { bidRows, askRows };
}

export const ROW_HEIGHT = 26;

export type BookRowModel = {
  bid?: BookSideEntry;
  ask?: BookSideEntry;
  bidCum: number;
  askCum: number;
};

export function formatTotal(n: number): string {
  if (!Number.isFinite(n)) return "—";
  const a = Math.abs(n);
  if (a >= 1000) return a.toFixed(3);
  if (a >= 1) return a.toFixed(4);
  return a.toFixed(5);
}

export function formatPrice(n: number, precisionIndex: number): string {
  if (!Number.isFinite(n)) return "—";
  const decimals = Math.min(5, 1 + precisionIndex);
  return n.toLocaleString("en-US", {
    minimumFractionDigits: Math.min(decimals, 2),
    maximumFractionDigits: decimals,
  });
}

// Detail screen: fixed 4 decimal places like Bitfinex full book */
export function formatPriceDetail(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  });
}

export function formatTotalDetail(n: number): string {
  if (!Number.isFinite(n)) return "—";
  const a = Math.abs(n);
  if (a >= 1) return a.toFixed(6);
  if (a >= 0.0001) return a.toFixed(6);
  return a.toFixed(8);
}

export function buildRowModels(
  bids: BookSideEntry[],
  asks: BookSideEntry[],
  rowCap?: number,
): BookRowModel[] {
  const br = rowCap != null ? bids.slice(0, rowCap) : bids;
  const ar = rowCap != null ? asks.slice(0, rowCap) : asks;
  let bs = 0;
  const bidCums = br.map((r) => {
    bs += Math.abs(r.amount);
    return bs;
  });
  let os = 0;
  const askCums = ar.map((r) => {
    os += Math.abs(r.amount);
    return os;
  });
  const n = Math.max(br.length, ar.length);
  const out: BookRowModel[] = [];
  for (let i = 0; i < n; i++) {
    out.push({
      bid: br[i],
      ask: ar[i],
      bidCum: bidCums[i] ?? 0,
      askCum: askCums[i] ?? 0,
    });
  }
  return out;
}

type HeaderProps = { useAmountLabel?: boolean };

export function OrderBookColumnHeaders({ useAmountLabel }: HeaderProps) {
  const side = useAmountLabel ? Strings.columns.amount : Strings.columns.total;
  return (
    <View style={styles.headerRow}>
      <View style={styles.headerHalf}>
        <Text style={[styles.hCell, styles.hTotal]}>{side}</Text>
        <Text style={[styles.hCell, styles.hPriceBid]}>
          {Strings.columns.price}
        </Text>
      </View>
      <View style={styles.midRule} />
      <View style={styles.headerHalf}>
        <Text style={[styles.hCell, styles.hPriceAsk]}>
          {Strings.columns.price}
        </Text>
        <Text style={[styles.hCell, styles.hTotal]}>{side}</Text>
      </View>
    </View>
  );
}

export function OrderBookColumnHeadersDetail() {
  return (
    <View style={detailStyles.headerRow}>
      <View style={detailStyles.headerHalf}>
        <Text style={[detailStyles.hCell, detailStyles.hTotal]}>
          {Strings.columns.total}
        </Text>
        <Text style={[detailStyles.hCell, detailStyles.hPriceBid]}>
          {Strings.columns.price}
        </Text>
      </View>
      <View style={detailStyles.midRule} />
      <View style={detailStyles.headerHalf}>
        <Text style={[detailStyles.hCell, detailStyles.hPriceAsk]}>
          {Strings.columns.price}
        </Text>
        <Text style={[detailStyles.hCell, detailStyles.hTotal]}>
          {Strings.columns.total}
        </Text>
      </View>
    </View>
  );
}

type RowProps = {
  row: BookRowModel;
  index: number;
  precisionIndex: number;
  depthFactor: number;
  maxBidCum: number;
  maxAskCum: number;
  /** Reference UI: white numbers, green/red bars only */
  monochromePrices?: boolean;
};

function OrderBookRowViewInner({
  row,
  index,
  precisionIndex,
  depthFactor,
  maxBidCum,
  maxAskCum,
  monochromePrices,
}: RowProps) {
  const bidPct = row.bid
    ? Math.min(100, (row.bidCum / maxBidCum) * 100 * depthFactor)
    : 0;
  const askPct = row.ask
    ? Math.min(100, (row.askCum / maxAskCum) * 100 * depthFactor)
    : 0;

  const priceStyleBid = monochromePrices
    ? styles.priceMonoBid
    : styles.priceBid;
  const priceStyleAsk = monochromePrices
    ? styles.priceMonoAsk
    : styles.priceAsk;

  return (
    <View style={[styles.dataRow, index % 2 === 1 && styles.dataRowAlt]}>
      <View style={styles.bidSide}>
        {row.bid ? (
          <>
            <View
              pointerEvents="none"
              style={[styles.depthBid, { width: `${bidPct}%` }]}
            />
            <Text style={[styles.cell, styles.totalCell]}>
              {formatTotal(row.bidCum)}
            </Text>
            <Text style={[styles.cell, priceStyleBid]}>
              {formatPrice(row.bid.price, precisionIndex)}
            </Text>
          </>
        ) : (
          <>
            <Text style={[styles.cell, styles.totalCell]}> </Text>
            <Text style={[styles.cell, priceStyleBid]}> </Text>
          </>
        )}
      </View>

      <View style={styles.midRule} />

      <View style={styles.askSide}>
        {row.ask ? (
          <>
            <View
              pointerEvents="none"
              style={[styles.depthAsk, { width: `${askPct}%` }]}
            />
            <Text style={[styles.cell, priceStyleAsk]}>
              {formatPrice(row.ask.price, precisionIndex)}
            </Text>
            <Text style={[styles.cell, styles.totalCell]}>
              {formatTotal(row.askCum)}
            </Text>
          </>
        ) : (
          <>
            <Text style={[styles.cell, priceStyleAsk]}> </Text>
            <Text style={[styles.cell, styles.totalCell]}> </Text>
          </>
        )}
      </View>
    </View>
  );
}

export const OrderBookRowView = memo(OrderBookRowViewInner);

type DetailRowProps = {
  row: BookRowModel;
  index: number;
};

// Full book: no colored prices, no depth bars — reference “detail” screen */
function OrderBookDetailRowViewInner({ row, index }: DetailRowProps) {
  return (
    <View
      style={[detailStyles.dataRow, index % 2 === 1 && detailStyles.dataRowAlt]}
    >
      <View style={detailStyles.half}>
        {row.bid ? (
          <>
            <Text style={[detailStyles.cell, detailStyles.totalCell]}>
              {formatTotalDetail(row.bidCum)}
            </Text>
            <Text style={[detailStyles.cell, detailStyles.priceCellBid]}>
              {formatPriceDetail(row.bid.price)}
            </Text>
          </>
        ) : (
          <>
            <Text style={[detailStyles.cell, detailStyles.totalCell]}> </Text>
            <Text style={[detailStyles.cell, detailStyles.priceCellBid]}>
              {" "}
            </Text>
          </>
        )}
      </View>
      <View style={detailStyles.midRule} />
      <View style={detailStyles.half}>
        {row.ask ? (
          <>
            <Text style={[detailStyles.cell, detailStyles.priceCellAsk]}>
              {formatPriceDetail(row.ask.price)}
            </Text>
            <Text style={[detailStyles.cell, detailStyles.totalCell]}>
              {formatTotalDetail(row.askCum)}
            </Text>
          </>
        ) : (
          <>
            <Text style={[detailStyles.cell, detailStyles.priceCellAsk]}>
              {" "}
            </Text>
            <Text style={[detailStyles.cell, detailStyles.totalCell]}> </Text>
          </>
        )}
      </View>
    </View>
  );
}

export const OrderBookDetailRowView = memo(OrderBookDetailRowViewInner);

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: OB_COLORS.border,
  },
  headerHalf: { flex: 1, flexDirection: "row" },
  hCell: {
    color: OB_COLORS.headerMuted,
    fontSize: FontSize.sm2,
    fontWeight: FontWeight.w600,
    letterSpacing: LetterSpacing.headerCell,
  },
  hTotal: {
    flex: 1,
    textAlign: "center",
  },
  hPriceBid: {
    flex: 1,
    textAlign: "right",
    paddingRight: 4,
  },
  hPriceAsk: {
    flex: 1,
    textAlign: "left",
    paddingLeft: 4,
  },
  dataRow: {
    flexDirection: "row",
    alignItems: "stretch",
    minHeight: ROW_HEIGHT,
    backgroundColor: OB_COLORS.bg,
  },
  dataRowAlt: {
    backgroundColor: OB_COLORS.bgRow,
  },
  bidSide: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
  },
  askSide: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
  },
  depthBid: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: OB_COLORS.bidBar,
  },
  depthAsk: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: OB_COLORS.askBar,
  },
  midRule: {
    width: 1,
    backgroundColor: OB_COLORS.border,
    marginVertical: 2,
  },
  cell: {
    fontSize: FontSize.body,
    fontVariant: ["tabular-nums"],
    zIndex: 1,
  },
  totalCell: {
    flex: 1,
    color: OB_COLORS.textDim,
    textAlign: "center",
  },
  priceBid: {
    flex: 1,
    color: OB_COLORS.bidText,
    textAlign: "right",
    fontWeight: FontWeight.w600,
    paddingRight: 4,
  },
  priceAsk: {
    flex: 1,
    color: OB_COLORS.askText,
    textAlign: "left",
    fontWeight: FontWeight.w600,
    paddingLeft: 4,
  },
  priceMonoBid: {
    flex: 1,
    color: OB_COLORS.text,
    textAlign: "right",
    fontWeight: FontWeight.w500,
    paddingRight: 4,
  },
  priceMonoAsk: {
    flex: 1,
    color: OB_COLORS.text,
    textAlign: "left",
    fontWeight: FontWeight.w500,
    paddingLeft: 4,
  },
});

const detailStyles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: DETAIL_COLORS.border,
    backgroundColor: DETAIL_COLORS.bg,
  },
  headerHalf: {
    flex: 1,
    flexDirection: "row",
  },
  hCell: {
    color: DETAIL_COLORS.headerMuted,
    fontSize: FontSize.sm2,
    fontWeight: FontWeight.w600,
    letterSpacing: LetterSpacing.headerCellDetail,
  },
  hTotal: {
    flex: 1,
    textAlign: "center",
  },
  hPriceBid: {
    flex: 1,
    textAlign: "right",
    paddingRight: 6,
  },
  hPriceAsk: {
    flex: 1,
    textAlign: "left",
    paddingLeft: 6,
  },
  midRule: {
    width: 1,
    backgroundColor: DETAIL_COLORS.border,
    marginVertical: 2,
  },
  dataRow: {
    flexDirection: "row",
    alignItems: "stretch",
    minHeight: ROW_HEIGHT,
    backgroundColor: DETAIL_COLORS.bg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: DETAIL_COLORS.border,
  },
  dataRowAlt: {
    backgroundColor: DETAIL_COLORS.bgRow,
  },
  half: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  cell: {
    fontSize: FontSize.body,
    fontVariant: ["tabular-nums"],
  },
  totalCell: {
    flex: 1,
    color: DETAIL_COLORS.textDim,
    textAlign: "center",
  },
  priceCellBid: {
    flex: 1,
    color: DETAIL_COLORS.text,
    textAlign: "right",
    fontWeight: FontWeight.w500,
    paddingRight: 6,
  },
  priceCellAsk: {
    flex: 1,
    color: DETAIL_COLORS.text,
    textAlign: "left",
    fontWeight: FontWeight.w500,
    paddingLeft: 6,
  },
});
