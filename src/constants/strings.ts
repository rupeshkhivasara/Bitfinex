// All user-visible copy and accessibility strings (avoid hardcoding in JSX).

export const Strings = {
  home: {
    title: "Bitfinex order book",
    subtitle: (symbol: string) => `${symbol} · live WebSocket feed`,
    hint: "If the network drops, the app reconnects automatically and refreshes the book. Use Disconnect to stop the feed and cancel a pending reconnect.",
  },

  connection: {
    connect: "Connect",
    disconnect: "Disconnect",
    statusLabel: "Status",
    status: {
      disconnected: "disconnected",
      connecting: "connecting",
      connected: "connected",
    } as const,
  },

  fullBook: {
    navTitle: "BTC/USDt Order Book",
    liveMeta: "Live · full depth",
    emptyPrompt: "Connect on the home screen to load market data.",
    goBack: "Go back",
    levelsCount: (n: number) => `${n} levels`,
  },

  orderBook: {
    sectionTitle: "ORDER BOOK",
    sectionChevron: "▼",
    tabBook: "Book",
    tabDepth: "Depth Chart",
    priceGroupingCaption: "Price grouping (live)",
    subscribing: "Subscribing to the book channel…",
    connectToLoad: "Connect to load the order book.",
    refreshing: "Refreshing order book…",
    depthPlaceholderTitle: "Depth chart",
    depthPlaceholderBody: "Visual depth will appear here.",
    fullBookLink: "FULL BOOK",
    throttleLabel: "THROTTLED 5S",
    footerSeparator: "|",
  },

  columns: {
    amount: "AMOUNT",
    total: "TOTAL",
    price: "PRICE",
  },

  glyphs: {
    minus: "−",
    plus: "+",
    liveDot: "●",
    backChevron: "‹",
  },

  routes: {
    fullBook: "/full-book" as const,
  },

  a11y: {
    connectWebSocket: "Connect WebSocket",
    disconnectWebSocket: "Disconnect WebSocket",
    back: "Back",
    finerPriceGrouping: (currentLevel: number, maxIndex: number) =>
      `Finer price grouping, from P${currentLevel} toward P0 (max P${maxIndex})`,
    widerPriceGrouping: (currentLevel: number, maxIndex: number) =>
      `Wider price grouping, from P${currentLevel} toward P${maxIndex}`,
    priceGroupingRegion: (currentLevel: number, maxIndex: number) =>
      `Price grouping P${currentLevel}, range P0 through P${maxIndex}. Minus for finer prices, plus for wider steps.`,
    narrowerDepthBars: "Narrower depth bars",
    widerDepthBars: "Wider depth bars",
  },

  errors: {
    streamLostReconnecting: "Connection lost. Reconnecting…",
    invalidWebSocketMessage: "Invalid WebSocket message",
    webSocketError: "WebSocket error",
  },
} as const;

// Maps Redux `connectionStatus` to the same labels we show in the UI */
export function connectionStatusLabel(
  status: keyof typeof Strings.connection.status,
): string {
  return Strings.connection.status[status];
}
