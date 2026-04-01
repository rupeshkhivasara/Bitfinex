import { memo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { DETAIL_COLORS } from "../constants/colors";
import { FontSize, FontWeight } from "../constants/layout";
import { Strings } from "../constants/strings";

type Props = {
  title: string;
  onBackPress: () => void;
};

//  Simple top bar: back affordance, centered title, balanced right spacer.

function ScreenNavBarInner({ title, onBackPress }: Props) {
  return (
    <View style={styles.navBar}>
      <TouchableOpacity
        onPress={onBackPress}
        style={styles.backHit}
        activeOpacity={0.65}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityRole="button"
        accessibilityLabel={Strings.a11y.back}
      >
        <Text style={styles.backArrow}>{Strings.glyphs.backChevron}</Text>
      </TouchableOpacity>
      <Text style={styles.navTitle} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.navSpacer} />
    </View>
  );
}

export const ScreenNavBar = memo(ScreenNavBarInner);

const styles = StyleSheet.create({
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingBottom: 10,
  },
  backHit: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  backArrow: {
    color: DETAIL_COLORS.text,
    fontSize: FontSize.backChevron,
    fontWeight: FontWeight.w200,
    marginTop: -8,
    lineHeight: 44,
  },
  navTitle: {
    flex: 1,
    textAlign: "center",
    color: DETAIL_COLORS.text,
    fontSize: FontSize.navTitle,
    fontWeight: FontWeight.w700,
  },
  navSpacer: {
    width: 48,
  },
});
