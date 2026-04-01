import { memo } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ConnectionColors } from "../constants/colors";
import { FontSize, FontWeight, Opacity, Radius } from "../constants/layout";
import { Strings } from "../constants/strings";

export type ConnectionUiStatus = "disconnected" | "connecting" | "connected";

type Props = {
  connectionStatus: ConnectionUiStatus;
  onConnect: () => void;
  onDisconnect: () => void;
};

// Primary actions for the WebSocket: start feed (Connect) or stop it (Disconnect).
function ConnectionToolbarInner({
  connectionStatus,
  onConnect,
  onDisconnect,
}: Props) {
  const isBusyOrLive =
    connectionStatus === "connected" || connectionStatus === "connecting";
  const isDisconnected = connectionStatus === "disconnected";

  return (
    <View style={styles.toolbar}>
      <TouchableOpacity
        style={[
          styles.btn,
          styles.btnPrimary,
          isBusyOrLive && styles.btnDisabled,
        ]}
        onPress={onConnect}
        disabled={isBusyOrLive}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel={Strings.a11y.connectWebSocket}
      >
        {connectionStatus === "connecting" ? (
          <ActivityIndicator color={ConnectionColors.primaryText} />
        ) : (
          <Text style={styles.btnPrimaryText}>
            {Strings.connection.connect}
          </Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.btn,
          styles.btnSecondary,
          isDisconnected && styles.btnDisabled,
        ]}
        onPress={onDisconnect}
        disabled={isDisconnected}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel={Strings.a11y.disconnectWebSocket}
      >
        <Text style={styles.btnSecondaryText}>
          {Strings.connection.disconnect}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export const ConnectionToolbar = memo(ConnectionToolbarInner);

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: Radius.button,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  btnPrimary: {
    backgroundColor: ConnectionColors.primary,
  },
  btnPrimaryText: {
    color: ConnectionColors.primaryText,
    fontWeight: FontWeight.w700,
    fontSize: FontSize.titleSm,
  },
  btnSecondary: {
    backgroundColor: ConnectionColors.secondaryBackground,
    borderWidth: 1,
    borderColor: ConnectionColors.secondaryBorder,
  },
  btnSecondaryText: {
    color: ConnectionColors.secondaryText,
    fontWeight: FontWeight.w700,
    fontSize: FontSize.titleSm,
  },
  btnDisabled: {
    opacity: Opacity.buttonDisabled,
  },
});
