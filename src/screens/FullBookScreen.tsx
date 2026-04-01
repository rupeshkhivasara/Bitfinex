import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo } from "react";
import {
  ActivityIndicator,
  BackHandler,
  FlatList,
  type ListRenderItemInfo,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import {
  type BookRowModel,
  buildRowModels,
  getSortedBookSides,
  OrderBookColumnHeadersDetail,
  OrderBookDetailRowView,
  ROW_HEIGHT,
} from "../components/OrderBookRowParts";
import { ScreenNavBar } from "../components/ScreenNavBar";
import { DETAIL_COLORS, SemanticColors } from "../constants/colors";
import { FontSize, FontWeight, Spacing } from "../constants/layout";
import { connectionStatusLabel, Strings } from "../constants/strings";
import type { RootState } from "../store/store";

export default function FullBookScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { bids, asks, connectionStatus, error } = useSelector(
    (s: RootState) => s,
  );

  const goHome = useCallback(() => {
    router.replace("/");
  }, [router]);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      goHome();
      return true;
    });
    return () => sub.remove();
  }, [goHome]);

  const { bidRows, askRows } = useMemo(
    () => getSortedBookSides(bids, asks),
    [bids, asks],
  );
  const allRows = useMemo(
    () => buildRowModels(bidRows, askRows),
    [bidRows, askRows],
  );

  const bookEmpty = useMemo(
    () => Object.keys(bids).length === 0 && Object.keys(asks).length === 0,
    [bids, asks],
  );

  const topPad = Math.max(insets.top, 8);
  const bottomPad = Math.max(insets.bottom, 8);

  const metaLine =
    connectionStatus === "connected"
      ? Strings.fullBook.liveMeta
      : connectionStatusLabel(connectionStatus);

  const renderDetailRow = useCallback(
    ({ item, index }: ListRenderItemInfo<BookRowModel>) => (
      <OrderBookDetailRowView row={item} index={index} />
    ),
    [],
  );

  const keyExtractor = useCallback(
    (item: BookRowModel, index: number) =>
      `fb-${index}-${item.bid?.price ?? "x"}-${item.ask?.price ?? "y"}`,
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

  const listExtraData = useMemo(
    () => ({ connectionStatus, error }),
    [connectionStatus, error],
  );

  // Shown via `ListEmptyComponent` while connected/connecting but no rows yet; hidden once `data` has items.
  const renderListEmpty = useCallback(() => {
    const message =
      connectionStatus === "connecting"
        ? (error ?? Strings.orderBook.subscribing)
        : (error ?? Strings.orderBook.refreshing);
    return (
      <View style={styles.listEmptyWrap}>
        <ActivityIndicator
          color={SemanticColors.link}
          style={{ marginBottom: Spacing.activityIndicatorBottom }}
        />
        <Text style={styles.listEmptyText}>{message}</Text>
      </View>
    );
  }, [connectionStatus, error]);

  // Column headers scroll with the list; `getItemLayout` still applies to row items only (not header/footer).
  const listHeader = useMemo(() => <OrderBookColumnHeadersDetail />, []);

  // Bottom inset inside the scroll surface (replaces `contentContainerStyle.paddingBottom`).
  const listFooter = useMemo(
    () => <View style={styles.listFooterSpacer} />,
    [],
  );

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <View style={[styles.topInset, { paddingTop: topPad }]}>
        <ScreenNavBar title={Strings.fullBook.navTitle} onBackPress={goHome} />
      </View>

      <View style={[styles.body, { paddingBottom: bottomPad }]}>
        {bookEmpty && connectionStatus === "disconnected" ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>{Strings.fullBook.emptyPrompt}</Text>
            <TouchableOpacity
              onPress={goHome}
              style={styles.emptyBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.emptyBtnTxt}>{Strings.fullBook.goBack}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.tableWrap}>
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>{metaLine}</Text>
              <Text style={styles.metaCount}>
                {Strings.fullBook.levelsCount(allRows.length)}
              </Text>
            </View>
            <View style={styles.card}>
              <FlatList
                data={allRows}
                ListHeaderComponent={listHeader}
                ListFooterComponent={listFooter}
                ListEmptyComponent={renderListEmpty}
                extraData={listExtraData}
                renderItem={renderDetailRow}
                keyExtractor={keyExtractor}
                getItemLayout={getItemLayout}
                style={styles.list}
                contentContainerStyle={listContentStyle}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
                bounces
                initialNumToRender={24}
                maxToRenderPerBatch={16}
                windowSize={10}
                removeClippedSubviews={Platform.OS === "android"}
              />
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: DETAIL_COLORS.bg,
  },
  topInset: {
    backgroundColor: DETAIL_COLORS.bg,
    borderBottomWidth: 1,
    borderBottomColor: DETAIL_COLORS.border,
  },
  body: {
    flex: 1,
    minHeight: 0,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  metaText: {
    color: DETAIL_COLORS.headerMuted,
    fontSize: FontSize.body,
  },
  metaCount: {
    color: DETAIL_COLORS.headerMuted,
    fontSize: FontSize.body,
    fontWeight: FontWeight.w600,
  },
  tableWrap: {
    flex: 1,
    minHeight: 0,
  },
  card: {
    flex: 1,
    marginHorizontal: 8,
    marginBottom: 0,
    backgroundColor: DETAIL_COLORS.bg,
    minHeight: 0,
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
    color: DETAIL_COLORS.headerMuted,
    fontSize: FontSize.subtitle,
  },
  listFooterSpacer: {
    height: 24,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    gap: 16,
  },
  emptyText: {
    color: DETAIL_COLORS.headerMuted,
    fontSize: FontSize.subtitle,
    textAlign: "center",
    lineHeight: 22,
  },
  emptyBtn: {
    alignSelf: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  emptyBtnTxt: {
    color: SemanticColors.link,
    fontSize: FontSize.titleSm,
    fontWeight: FontWeight.w600,
  },
});
