import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  type ListRenderItemInfo,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSelector } from "react-redux";
import { OB_COLORS, SemanticColors } from "../constants/colors";
import { FontSize, FontWeight, Radius, Spacing } from "../constants/layout";
import {
  COMPACT_ORDER_BOOK_ROWS,
  DEFAULT_DEPTH_BAR_SCALE_INDEX,
  DEPTH_BAR_SCALES,
} from "../constants/orderBook";
import { Strings } from "../constants/strings";
import { changeBookPrecision } from "../services/websocket";
import type { RootState } from "../store/store";
import { OrderBookFooter } from "./OrderBookFooter";
import {
  type BookRowModel,
  buildRowModels,
  getSortedBookSides,
  OrderBookColumnHeaders,
  OrderBookRowView,
  ROW_HEIGHT,
} from "./OrderBookRowParts";
import type { OrderBookMainTab } from "./OrderBookToolbar";
import { OrderBookToolbar } from "./OrderBookToolbar";

export default function OrderBook() {
  const router = useRouter();
  const { bids, asks, connectionStatus, error, bookPrecIndex } = useSelector(
    (s: RootState) => s,
  );
  const [mainTab, setMainTab] = useState<OrderBookMainTab>("book");

  const { bidRows: allBids, askRows: allAsks } = useMemo(
    () => getSortedBookSides(bids, asks),
    [bids, asks],
  );

  const compactBidRows = useMemo(
    () => allBids.slice(0, COMPACT_ORDER_BOOK_ROWS),
    [allBids],
  );
  const compactAskRows = useMemo(
    () => allAsks.slice(0, COMPACT_ORDER_BOOK_ROWS),
    [allAsks],
  );

  const tableRows = useMemo(
    () => buildRowModels(compactBidRows, compactAskRows),
    [compactBidRows, compactAskRows],
  );

  const maxBidCum = useMemo(
    () => Math.max(1, ...tableRows.map((r) => r.bidCum)),
    [tableRows],
  );
  const maxAskCum = useMemo(
    () => Math.max(1, ...tableRows.map((r) => r.askCum)),
    [tableRows],
  );

  const depthFactor = DEPTH_BAR_SCALES[DEFAULT_DEPTH_BAR_SCALE_INDEX];

  // When `tableRows` is referentially stable, this forces row cells to update; includes connection/error for `ListEmptyComponent`.
  const listExtraData = useMemo(
    () => ({
      bookPrecIndex,
      depthFactor,
      maxBidCum,
      maxAskCum,
      connectionStatus,
      error,
    }),
    [bookPrecIndex, depthFactor, maxBidCum, maxAskCum, connectionStatus, error],
  );

  const renderBookRow = useCallback(
    ({ item, index }: ListRenderItemInfo<BookRowModel>) => (
      <OrderBookRowView
        row={item}
        index={index}
        precisionIndex={bookPrecIndex}
        depthFactor={depthFactor}
        maxBidCum={maxBidCum}
        maxAskCum={maxAskCum}
        monochromePrices
      />
    ),
    [bookPrecIndex, depthFactor, maxBidCum, maxAskCum],
  );

  const keyExtractor = useCallback(
    (item: BookRowModel, index: number) =>
      `c-${index}-${item.bid?.price ?? "x"}-${item.ask?.price ?? "y"}`,
    [],
  );

  const getItemLayout = useCallback(
    (_data: ArrayLike<BookRowModel> | null | undefined, index: number) => ({
      length: ROW_HEIGHT,
      offset: ROW_HEIGHT * index,
      index,
    }),
    [],
  );

  const listContentStyle = useMemo(() => ({ flexGrow: 1 }), []);

  /** Column headers are part of the list; `getItemLayout` applies to row items only. */
  const listHeader = useMemo(
    () => <OrderBookColumnHeaders useAmountLabel />,
    [],
  );

  /** Shown via `ListEmptyComponent` while connected/connecting but no rows yet; hidden once `data` has items. */
  const renderListEmpty = useCallback(() => {
    const message =
      connectionStatus === "connecting"
        ? (error ?? Strings.orderBook.subscribing)
        : (error ?? Strings.orderBook.refreshing);
    return (
      <View style={styles.listEmptyWrap}>
        <ActivityIndicator
          color={OB_COLORS.bidText}
          style={{ marginBottom: Spacing.activityIndicatorBottom }}
        />
        <Text style={styles.listEmptyText}>{message}</Text>
      </View>
    );
  }, [connectionStatus, error]);

  const handleTabChange = useCallback((tab: OrderBookMainTab) => {
    setMainTab(tab);
  }, []);

  // Finer grouping → lower P index (clamped in `changeBookPrecision`).
  const handleDecPrec = useCallback(() => {
    changeBookPrecision(bookPrecIndex - 1);
  }, [bookPrecIndex]);

  // Wider grouping → higher P index (clamped in `changeBookPrecision`).
  const handleIncPrec = useCallback(() => {
    changeBookPrecision(bookPrecIndex + 1);
  }, [bookPrecIndex]);

  const openFullBook = useCallback(() => {
    router.push(Strings.routes.fullBook);
  }, [router]);

  // Footer inside `FlatList` on Book tab; Depth tab renders the same strip below the placeholder. */
  const listFooter = useMemo(
    () => <OrderBookFooter onOpenFullBook={openFullBook} />,
    [openFullBook],
  );

  const bookEmpty = useMemo(
    () => Object.keys(bids).length === 0 && Object.keys(asks).length === 0,
    [bids, asks],
  );

  if (connectionStatus === "disconnected" && Object.keys(bids).length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.placeholderText}>
          {Strings.orderBook.connectToLoad}
        </Text>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>
    );
  }

  return (
    <View style={styles.card}>
      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      ) : null}

      {connectionStatus === "connecting" && !bookEmpty ? (
        <View style={styles.reconnectBanner}>
          <ActivityIndicator
            color={OB_COLORS.bidText}
            size="small"
            style={{ marginRight: Spacing.sm }}
          />
          <Text style={styles.reconnectText}>
            {error ?? Strings.orderBook.refreshing}
          </Text>
        </View>
      ) : null}

      <OrderBookToolbar
        mainTab={mainTab}
        onTabChange={handleTabChange}
        bookPrecIndex={bookPrecIndex}
        onDecreasePrec={handleDecPrec}
        onIncreasePrec={handleIncPrec}
      />

      {mainTab === "book" ? (
        <>
          <FlatList
            data={tableRows}
            ListHeaderComponent={listHeader}
            ListFooterComponent={listFooter}
            ListEmptyComponent={renderListEmpty}
            extraData={listExtraData}
            renderItem={renderBookRow}
            keyExtractor={keyExtractor}
            getItemLayout={getItemLayout}
            style={styles.list}
            contentContainerStyle={listContentStyle}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            bounces={false}
            initialNumToRender={COMPACT_ORDER_BOOK_ROWS}
            maxToRenderPerBatch={COMPACT_ORDER_BOOK_ROWS}
            windowSize={5}
            removeClippedSubviews={false}
          />
        </>
      ) : (
        <View style={styles.depthPlaceholderWrap}>
          <Text style={styles.depthPlaceholderTitle}>
            {Strings.orderBook.depthPlaceholderTitle}
          </Text>
          <Text style={styles.depthPlaceholderSub}>
            {Strings.orderBook.depthPlaceholderBody}
          </Text>
        </View>
      )}

      {mainTab === "depth" ? (
        <OrderBookFooter onOpenFullBook={openFullBook} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: OB_COLORS.bg,
    borderRadius: Radius.card,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: OB_COLORS.border,
  },
  depthPlaceholderWrap: {
    flex: 1,
    minHeight: 200,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  depthPlaceholderTitle: {
    color: OB_COLORS.text,
    fontSize: FontSize.titleSm,
    fontWeight: FontWeight.w700,
    marginBottom: 8,
  },
  depthPlaceholderSub: {
    color: OB_COLORS.headerMuted,
    fontSize: FontSize.bodyMd,
    textAlign: "center",
    lineHeight: 20,
  },
  list: { flex: 1 },
  listEmptyWrap: {
    flexGrow: 1,
    minHeight: 140,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  listEmptyText: {
    textAlign: "center",
    color: OB_COLORS.headerMuted,
    fontSize: FontSize.subtitle,
  },
  placeholderText: {
    textAlign: "center",
    color: OB_COLORS.headerMuted,
    fontSize: FontSize.subtitle,
    padding: 24,
  },
  errorText: {
    textAlign: "center",
    color: OB_COLORS.askText,
    marginTop: 8,
    fontSize: FontSize.bodyMd,
    paddingHorizontal: 16,
  },
  errorBanner: {
    backgroundColor: SemanticColors.orderBookErrorBanner,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  errorBannerText: {
    color: OB_COLORS.askText,
    fontSize: FontSize.body,
    textAlign: "center",
  },
  reconnectBanner: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: SemanticColors.orderBookReconnectBanner,
    borderBottomWidth: 1,
    borderBottomColor: OB_COLORS.border,
  },
  reconnectText: {
    flex: 1,
    color: OB_COLORS.bidText,
    fontSize: FontSize.body,
  },
});
