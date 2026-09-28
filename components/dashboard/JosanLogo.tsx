import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { colors, typography } from "@constants/theme";

interface JosanLogoProps {
  size?: number;
}

export function JosanLogo({ size = 28 }: JosanLogoProps) {
  return (
    <View style={styles.container}>
      <Svg width={size * 1.3} height={size} viewBox="0 0 42 32" fill="none">
        {/* Dynamic Speed Wings Logo Mark */}
        <Path
          d="M2 18 L 22 4 L 38 4 L 18 18 Z"
          fill="#C96A32"
        />
        <Path
          d="M8 24 L 25 12 L 36 12 L 19 24 Z"
          fill="#D4AF5A"
        />
        <Path
          d="M14 29 L 27 20 L 34 20 L 21 29 Z"
          fill="#A94F22"
        />
      </Svg>
      <View style={styles.textWrap}>
        <Text style={styles.brandTitle}>JOSAN</Text>
        <Text style={styles.brandSubtitle}>LOGISTICS</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  textWrap: {
    justifyContent: "center",
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#C96A32",
    letterSpacing: 0.8,
    lineHeight: 20,
  },
  brandSubtitle: {
    fontSize: 9,
    fontWeight: "700",
    color: colors.darkCharcoal,
    letterSpacing: 3,
    lineHeight: 11,
    marginTop: -1,
  },
});

export default JosanLogo;
