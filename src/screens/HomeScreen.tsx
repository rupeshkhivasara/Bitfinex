import { useCallback, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { ConnectionStatusRow } from "../components/ConnectionStatusRow";
import { ConnectionToolbar } from "../components/ConnectionToolbar";
import OrderBook from "../components/OrderBook";
import { AppShellColors } from "../constants/colors";
import { FontSize, FontWeight, Radius, Spacing } from "../constants/layout";
import { DEFAULT_BOOK_SYMBOL } from "../constants/orderBook";
import { Strings } from "../constants/strings";
import { connectWS, disconnectWS } from "../services/websocket";
import type { RootState } from "../store/store";

// Home route: connect/disconnect controls plus the compact order book widget.

export default function HomeScreen() {
  const dispatch = useDispatch();
  const { connectionStatus, error } = useSelector((s: RootState) => s);

  const wsHandlers = useMemo(
    () => ({
      onConnecting: () => dispatch({ type: "WS_CONNECTING" }),
      onMessage: (data: unknown) =>
        dispatch({ type: "WS_MESSAGE", payload: data }),
      onOpen: () => dispatch({ type: "WS_CONNECTED" }),
      onClose: () => dispatch({ type: "WS_DISCONNECTED" }),
      onStreamLost: () => dispatch({ type: "WS_STREAM_LOST" }),
      onStreamReconnecting: () => dispatch({ type: "WS_STREAM_RECONNECTING" }),
      onError: (message: string) =>
        dispatch({
          type: "WS_MESSAGE",
          payload: { event: "error", msg: message },
        }),
    }),
    [dispatch],
  );

  const handleConnect = useCallback(() => {
    connectWS(wsHandlers, DEFAULT_BOOK_SYMBOL);
  }, [wsHandlers]);

  const handleDisconnect = useCallback(() => {
    disconnectWS();
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Text style={styles.title}>{Strings.home.title}</Text>
        <Text style={styles.subtitle}>
          {Strings.home.subtitle(DEFAULT_BOOK_SYMBOL)}
        </Text>
      </View>

      <ConnectionToolbar
        connectionStatus={connectionStatus}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
      />

      <View style={styles.hintBox}>
        <Text style={styles.hintText}>{Strings.home.hint}</Text>
      </View>

      <ConnectionStatusRow connectionStatus={connectionStatus} error={error} />

      <View style={styles.book}>
        <OrderBook />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: AppShellColors.background,
  },
  header: {
    paddingHorizontal: Spacing.screenHorizontal,
    paddingBottom: 8,
  },
  title: {
    fontSize: FontSize.title,
    fontWeight: FontWeight.w800,
    color: AppShellColors.title,
  },
  subtitle: {
    fontSize: FontSize.bodyMd,
    color: AppShellColors.subtitle,
    marginTop: 4,
  },
  hintBox: {
    marginHorizontal: Spacing.screenHorizontal,
    marginBottom: 8,
    padding: 10,
    backgroundColor: AppShellColors.hintBackground,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: AppShellColors.hintBorder,
  },
  hintText: {
    fontSize: FontSize.sm,
    color: AppShellColors.hintText,
    lineHeight: 16,
  },
  book: {
    flex: 1,
    paddingHorizontal: Spacing.bookHorizontal,
    paddingBottom: Spacing.bookBottom,
  },
});
