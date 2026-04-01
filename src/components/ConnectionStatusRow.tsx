import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { StatusColors } from "../constants/colors";
import { FontSize, FontWeight } from "../constants/layout";
import { Strings, connectionStatusLabel } from "../constants/strings";
import type { ConnectionUiStatus } from "./ConnectionToolbar";

type Props = {
  connectionStatus: ConnectionUiStatus;
  error: string | null;
};

function ConnectionStatusRowInner({ connectionStatus, error }: Props) {
  //One-line summary of socket state on the home screen.
  const displayText = error ?? connectionStatusLabel(connectionStatus);

  return (
    <View style={styles.statusRow}>
      <Text style={styles.statusLabel}>{Strings.connection.statusLabel}</Text>
      <Text
        style={[
          styles.statusValue,
          connectionStatus === "connected" && styles.statusOk,
          connectionStatus === "connecting" && styles.statusPending,
          error ? styles.statusErr : null,
        ]}
        numberOfLines={2}
      >
        {displayText}
      </Text>
    </View>
  );
}

export const ConnectionStatusRow = memo(ConnectionStatusRowInner);

const styles = StyleSheet.create({
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 4,
    gap: 8,
  },
  statusLabel: {
    fontSize: FontSize.bodyMd,
    color: StatusColors.label,
    fontWeight: FontWeight.w600,
  },
  statusValue: {
    fontSize: FontSize.bodyMd,
    color: StatusColors.value,
    fontWeight: FontWeight.w500,
    flex: 1,
  },
  statusOk: {
    color: StatusColors.ok,
  },
  statusPending: {
    color: StatusColors.pending,
  },
  statusErr: {
    color: StatusColors.err,
  },
});
