import { memo, useCallback } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { OB_COLORS, SemanticColors } from "../constants/colors";
import {
  FontSize,
  FontWeight,
  LetterSpacing,
  Opacity,
} from "../constants/layout";
import {
  BOOK_PREC_MAX_INDEX,
  BOOK_PREC_MIN_INDEX,
} from "../constants/orderBook";
import { Strings } from "../constants/strings";

export type OrderBookMainTab = "book" | "depth";

type Props = {
  mainTab: OrderBookMainTab;
  onTabChange: (tab: OrderBookMainTab) => void;
  bookPrecIndex: number;
  // Bitfinex P0–P4: decrease = finer grouping
  onDecreasePrec: () => void;
  onIncreasePrec: () => void;
  minPrec?: number;
  maxPrec?: number;
};

const DEFAULT_MIN = BOOK_PREC_MIN_INDEX;
const DEFAULT_MAX = BOOK_PREC_MAX_INDEX;

function OrderBookToolbarInner({
  mainTab,
  onTabChange,
  bookPrecIndex,
  onDecreasePrec,
  onIncreasePrec,
  minPrec = DEFAULT_MIN,
  maxPrec = DEFAULT_MAX,
}: Props) {
  const selectBook = useCallback(() => onTabChange("book"), [onTabChange]);
  const selectDepth = useCallback(() => onTabChange("depth"), [onTabChange]);

  const atMinPrec = bookPrecIndex <= minPrec;
  const atMaxPrec = bookPrecIndex >= maxPrec;

  return (
    <View style={styles.toolbarWrap}>
      <View style={styles.titleTabsRow}>
        <View style={styles.titleLeft}>
          <Text style={styles.chevron}>{Strings.orderBook.sectionChevron}</Text>
          <Text style={styles.sectionTitle}>
            {Strings.orderBook.sectionTitle}
          </Text>
        </View>
        <View style={styles.tabsRow}>
          <TouchableOpacity
            onPress={selectBook}
            activeOpacity={0.65}
            hitSlop={{ top: 6, bottom: 6, left: 4, right: 8 }}
            accessibilityRole="tab"
            accessibilityState={{ selected: mainTab === "book" }}
          >
            <Text
              style={mainTab === "book" ? styles.tabActive : styles.tabMuted}
            >
              {Strings.orderBook.tabBook}
            </Text>
            {mainTab === "book" ? (
              <View style={styles.tabUnderline} />
            ) : (
              <View style={styles.tabUnderlinePlaceholder} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={selectDepth}
            activeOpacity={0.65}
            style={styles.tabDepthWrap}
            hitSlop={{ top: 6, bottom: 6, left: 8, right: 4 }}
            accessibilityRole="tab"
            accessibilityState={{ selected: mainTab === "depth" }}
          >
            <Text
              style={mainTab === "depth" ? styles.tabActive : styles.tabMuted}
            >
              {Strings.orderBook.tabDepth}
            </Text>
            {mainTab === "depth" ? (
              <View style={styles.tabUnderline} />
            ) : (
              <View style={styles.tabUnderlinePlaceholder} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.precRow}>
        <Text style={styles.precCaption} numberOfLines={1}>
          {Strings.orderBook.priceGroupingCaption}
        </Text>
        <View
          style={styles.precControls}
          accessible
          accessibilityRole="text"
          accessibilityLabel={Strings.a11y.priceGroupingRegion(
            bookPrecIndex,
            maxPrec,
          )}
        >
          <TouchableOpacity
            onPress={onDecreasePrec}
            disabled={atMinPrec}
            activeOpacity={0.5}
            style={styles.precTouch}
            hitSlop={{ top: 10, bottom: 10, left: 14, right: 14 }}
            accessibilityRole="button"
            accessibilityLabel={Strings.a11y.finerPriceGrouping(
              bookPrecIndex,
              maxPrec,
            )}
          >
            <Text style={[styles.precSym, atMinPrec && styles.disabledTxt]}>
              {Strings.glyphs.minus}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onIncreasePrec}
            disabled={atMaxPrec}
            activeOpacity={0.5}
            style={styles.precTouch}
            hitSlop={{ top: 10, bottom: 10, left: 14, right: 14 }}
            accessibilityRole="button"
            accessibilityLabel={Strings.a11y.widerPriceGrouping(
              bookPrecIndex,
              maxPrec,
            )}
          >
            <Text style={[styles.precSym, atMaxPrec && styles.disabledTxt]}>
              {Strings.glyphs.plus}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export const OrderBookToolbar = memo(OrderBookToolbarInner);

const styles = StyleSheet.create({
  toolbarWrap: {
    borderBottomWidth: 1,
    borderBottomColor: OB_COLORS.border,
  },
  titleTabsRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 4,
    gap: 12,
  },
  titleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 1,
  },
  chevron: {
    color: OB_COLORS.headerMuted,
    fontSize: FontSize.sm2,
    marginTop: 2,
  },
  sectionTitle: {
    color: OB_COLORS.text,
    fontSize: FontSize.body,
    fontWeight: FontWeight.w700,
    letterSpacing: LetterSpacing.sectionTitle,
  },
  tabsRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 18,
    flexShrink: 0,
  },
  tabDepthWrap: {
    marginLeft: 2,
  },
  tabMuted: {
    color: OB_COLORS.headerMuted,
    fontSize: FontSize.subtitle,
    fontWeight: FontWeight.w500,
  },
  tabActive: {
    color: OB_COLORS.text,
    fontSize: FontSize.subtitle,
    fontWeight: FontWeight.w600,
  },
  tabUnderline: {
    marginTop: 6,
    height: 2,
    backgroundColor: OB_COLORS.text,
    borderRadius: 1,
  },
  tabUnderlinePlaceholder: {
    marginTop: 6,
    height: 2,
    backgroundColor: SemanticColors.transparent,
    borderRadius: 1,
  },
  precRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 8,
    gap: 8,
  },
  precCaption: {
    flex: 1,
    color: OB_COLORS.headerMuted,
    fontSize: FontSize.xs,
    marginRight: 8,
  },
  precControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexShrink: 0,
  },
  precTouch: {
    minWidth: 40,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  precSym: {
    color: OB_COLORS.text,
    fontSize: FontSize.precStepper,
    fontWeight: FontWeight.w300,
    lineHeight: 28,
  },
  disabledTxt: {
    opacity: Opacity.disabled,
  },
});
