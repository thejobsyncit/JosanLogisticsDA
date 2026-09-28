import React from "react";
import { StyleSheet, View } from "react-native";
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Path,
  Rect,
  Circle,
  G,
} from "react-native-svg";

interface SingaporeHeaderGraphicProps {
  height?: number;
}

export function SingaporeHeaderGraphic({ height = 150 }: SingaporeHeaderGraphicProps) {
  return (
    <View style={[styles.container, { height }]}>
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 390 150"
        preserveAspectRatio="xMidYMid slice"
      >
        <Defs>
          {/* Header background warm gradient */}
          <LinearGradient id="headerBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FFE8CB" stopOpacity={0.9} />
            <Stop offset="40%" stopColor="#FDEFD8" stopOpacity={0.7} />
            <Stop offset="100%" stopColor="#FAF8F3" stopOpacity={1} />
          </LinearGradient>

          {/* Sun / Warm glow gradient */}
          <LinearGradient id="sunGlow" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#F59E0B" stopOpacity={0.4} />
            <Stop offset="100%" stopColor="#D4AF5A" stopOpacity={0} />
          </LinearGradient>

          {/* Road gradient */}
          <LinearGradient id="roadGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#C96A32" stopOpacity={0.15} />
            <Stop offset="50%" stopColor="#D4AF5A" stopOpacity={0.3} />
            <Stop offset="100%" stopColor="#C96A32" stopOpacity={0.5} />
          </LinearGradient>

          {/* Truck gradient */}
          <LinearGradient id="truckGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#A94F22" stopOpacity={0.8} />
            <Stop offset="100%" stopColor="#C96A32" stopOpacity={0.9} />
          </LinearGradient>
        </Defs>

        {/* Background base */}
        <Rect width="390" height="150" fill="url(#headerBg)" />

        {/* Sun Glow */}
        <Circle cx="320" cy="50" r="45" fill="url(#sunGlow)" />

        {/* Singapore Skyline Silhouettes (Marina Bay Sands + Singapore Flyer) */}
        <G opacity={0.35}>
          {/* MBS Tower 1 */}
          <Path d="M 240 75 L 246 38 L 253 38 L 250 75 Z" fill="#D4AF5A" />
          {/* MBS Tower 2 */}
          <Path d="M 252 75 L 257 37 L 264 37 L 262 75 Z" fill="#D4AF5A" />
          {/* MBS Tower 3 */}
          <Path d="M 264 75 L 268 39 L 275 39 L 274 75 Z" fill="#D4AF5A" />
          {/* MBS SkyPark Boat */}
          <Path d="M 236 38 C 245 35, 275 35, 282 36 L 277 41 C 270 40, 245 40, 238 41 Z" fill="#C96A32" />

          {/* Singapore Flyer Wheel */}
          <Circle cx="215" cy="55" r="16" stroke="#D4AF5A" strokeWidth="1.5" fill="none" opacity={0.8} />
          <Circle cx="215" cy="55" r="3" fill="#D4AF5A" />
          <Path d="M 215 55 L 208 75 M 215 55 L 222 75" stroke="#D4AF5A" strokeWidth="1.2" />

          {/* Port Crane Silhouette */}
          <Path d="M 180 75 L 180 50 L 195 50 M 180 58 L 192 50" stroke="#C96A32" strokeWidth="1.2" opacity={0.6} />
        </G>

        {/* Expressway / Road Curve */}
        <Path
          d="M -10 115 C 100 110, 200 95, 400 80 L 400 135 C 250 140, 100 145, -10 140 Z"
          fill="url(#roadGrad)"
        />
        {/* Road Lane Lines */}
        <Path
          d="M -10 126 C 100 120, 200 106, 400 90"
          stroke="#D4AF5A"
          strokeWidth="1.5"
          strokeDasharray="8 6"
          opacity={0.6}
        />

        {/* Express Logistics Freight Truck on expressway */}
        <G transform="translate(295, 68) scale(0.65)">
          {/* Cargo Body */}
          <Rect x="0" y="0" width="46" height="22" rx="3" fill="url(#truckGrad)" />
          {/* Gold Accent stripe on trailer */}
          <Rect x="4" y="10" width="38" height="2.5" fill="#E8D39A" opacity={0.9} />
          {/* Cabin */}
          <Path d="M 46 8 L 56 8 L 62 14 L 62 22 L 46 22 Z" fill="#A94F22" />
          {/* Cabin Window */}
          <Path d="M 48 10 L 54 10 L 58 14 L 48 14 Z" fill="#FFFDF7" opacity={0.85} />
          {/* Wheels */}
          <Circle cx="10" cy="22" r="4" fill="#1F1F1F" />
          <Circle cx="10" cy="22" r="1.8" fill="#E8D39A" />
          <Circle cx="36" cy="22" r="4" fill="#1F1F1F" />
          <Circle cx="36" cy="22" r="1.8" fill="#E8D39A" />
          <Circle cx="54" cy="22" r="4" fill="#1F1F1F" />
          <Circle cx="54" cy="22" r="1.8" fill="#E8D39A" />
        </G>

        {/* Bottom smooth background wave curve */}
        <Path
          d="M 0 132 Q 195 152 390 132 L 390 150 L 0 150 Z"
          fill="#FAF8F3"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 0,
  },
});

export default SingaporeHeaderGraphic;
