import { memo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { OB_COLORS, SemanticColors } from "../constants/colors";
import { FontSize, FontWeight, LetterSpacing } from "../constants/layout";
import { Strings } from "../constants/strings";

type Props = {
  onOpenFullBook: () => void;
};

function OrderBookFooterInner({ onOpenFullBook }: Props) {
  return (
    <View style={styles.footer}>
      <View style={styles.trailingGroup}>
        <TouchableOpacity
          onPress={onOpenFullBook}
          activeOpacity={0.65}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={Strings.orderBook.fullBookLink}
        >
          <Text style={styles.fullBookLink}>
            {Strings.orderBook.fullBookLink}
          </Text>
        </TouchableOpacity>
        <Text style={styles.footerSep}>
          {Strings.orderBook.footerSeparator}
        </Text>
        <Text style={styles.throttleDot}>{Strings.glyphs.liveDot}</Text>
        <Text style={styles.throttleText}>
          {Strings.orderBook.throttleLabel}
        </Text>
      </View>
    </View>
  );
}

export const OrderBookFooter = memo(OrderBookFooterInner);

const styles = StyleSheet.create({
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: OB_COLORS.border,
  },
  trailingGroup: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    flexWrap: "wrap",
    gap: 6,
    maxWidth: "100%",
  },
  footerSep: { color: OB_COLORS.border, fontSize: FontSize.sm },
  fullBookLink: {
    color: SemanticColors.link,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.w800,
    letterSpacing: LetterSpacing.footerLink,
    paddingVertical: 4,
  },
  throttleDot: { color: SemanticColors.liveIndicator, fontSize: FontSize.xs },
  throttleText: {
    color: SemanticColors.link,
    fontSize: FontSize.sm2,
    fontWeight: FontWeight.w600,
    textDecorationLine: "underline",
  },
});
