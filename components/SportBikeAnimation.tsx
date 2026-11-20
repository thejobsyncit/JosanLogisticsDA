import React, { useEffect, useState } from "react";
import { Animated, Easing, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import Svg, { Circle, Ellipse, Line, Path, Rect } from "react-native-svg";
import { JOSAN_GOLD, JOSAN_ORANGE } from "./DeliveryBikeAnimation";

const WHEEL_SIZE = 48;

function AnimatedWheel({ style }: { style: StyleProp<ViewStyle> }) {
  const [rotation] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const spin = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 480,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    spin.start();
    return () => spin.stop();
  }, [rotation]);

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View style={[style, { transform: [{ rotate }] }]}>
      <Svg width={WHEEL_SIZE} height={WHEEL_SIZE} viewBox="0 0 48 48">
        <Circle cx="24" cy="24" r="21.5" fill="#111315" stroke="#343638" strokeWidth="1.5" />
        <Circle cx="24" cy="24" r="16.5" fill="#242729" stroke={JOSAN_ORANGE} strokeWidth="1.5" />
        <Circle cx="24" cy="24" r="12.5" fill="#131516" stroke="#9CA3A0" strokeWidth="1" />
        <Line x1="24" y1="12" x2="24" y2="36" stroke="#C9CBC8" strokeWidth="1.5" />
        <Line x1="12" y1="24" x2="36" y2="24" stroke="#C9CBC8" strokeWidth="1.5" />
        <Line x1="15.5" y1="15.5" x2="32.5" y2="32.5" stroke="#C9CBC8" strokeWidth="1.5" />
        <Line x1="32.5" y1="15.5" x2="15.5" y2="32.5" stroke="#C9CBC8" strokeWidth="1.5" />
        <Circle cx="24" cy="24" r="4" fill="#565B5A" stroke={JOSAN_GOLD} strokeWidth="1" />
      </Svg>
    </Animated.View>
  );
}

export function SportBikeAnimation() {
  const [suspension] = useState(() => new Animated.Value(0));
  const [roadMotion] = useState(() => new Animated.Value(0));
  const [trailMotion] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const suspensionLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(suspension, {
          toValue: -1.5,
          duration: 230,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(suspension, {
          toValue: 0,
          duration: 230,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    const roadLoop = Animated.loop(
      Animated.timing(roadMotion, {
        toValue: 1,
        duration: 500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    const trailLoop = Animated.loop(
      Animated.timing(trailMotion, {
        toValue: 1,
        duration: 430,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    suspensionLoop.start();
    roadLoop.start();
    trailLoop.start();
    return () => {
      suspensionLoop.stop();
      roadLoop.stop();
      trailLoop.stop();
    };
  }, [roadMotion, suspension, trailMotion]);

  const roadShift = roadMotion.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -36],
  });
  const trailShift = trailMotion.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20],
  });
  const trailOpacity = trailMotion.interpolate({
    inputRange: [0, 0.65, 1],
    outputRange: [0.85, 0.45, 0],
  });

  return (
    <View style={styles.scene} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Animated.View
        style={[
          styles.trails,
          { opacity: trailOpacity, transform: [{ translateX: trailShift }] },
        ]}
      >
        <Svg width="60" height="46" viewBox="0 0 60 46">
          <Line x1="4" y1="12" x2="35" y2="12" stroke={JOSAN_ORANGE} strokeWidth="2.5" strokeLinecap="round" />
          <Line x1="0" y1="23" x2="27" y2="23" stroke={JOSAN_GOLD} strokeWidth="2" strokeLinecap="round" />
          <Line x1="10" y1="34" x2="39" y2="34" stroke={JOSAN_ORANGE} strokeWidth="2.5" strokeLinecap="round" />
        </Svg>
      </Animated.View>

      <Animated.View style={[styles.rearWheel, { transform: [{ translateY: suspension }] }]}>
        <AnimatedWheel style={StyleSheet.absoluteFill} />
      </Animated.View>
      <Animated.View style={[styles.frontWheel, { transform: [{ translateY: suspension }] }]}>
        <AnimatedWheel style={StyleSheet.absoluteFill} />
      </Animated.View>

      <Animated.View style={[styles.body, { transform: [{ translateY: suspension }] }]}>
        <Svg width="250" height="108" viewBox="0 0 250 108">
          <Ellipse cx="127" cy="101" rx="83" ry="3" fill="rgba(31,31,31,0.10)" />

          {/* Rear swingarm, frame, engine and exhaust */}
          <Path d="M66 79 L129 61 L167 80 L162 85 L112 72 L73 86 Z" fill="#303436" stroke="#111315" strokeWidth="2" />
          <Path d="M91 59 L134 56 L159 76 L126 82 L103 75 Z" fill="#202426" stroke="#111315" strokeWidth="2" />
          <Path d="M98 76 L73 84 L54 79" fill="none" stroke="#A8AAA6" strokeWidth="4" strokeLinecap="round" />
          <Path d="M99 77 L63 84 L52 81" fill="none" stroke="#3B3E3F" strokeWidth="2" />

          {/* Tail fairing and raised black seat */}
          <Path d="M57 48 L72 32 Q78 27 91 30 L112 39 L99 52 L77 59 L65 68 Z" fill={JOSAN_ORANGE} stroke="#151718" strokeWidth="2.5" strokeLinejoin="round" />
          <Path d="M77 34 Q91 30 106 39 L125 43 L115 49 L92 45 L77 48 Z" fill="#202325" stroke="#111315" strokeWidth="2" />
          <Path d="M63 48 L78 36 L86 38 L73 56 Z" fill="#FFC078" opacity="0.8" />
          <Path d="M57 49 L70 43 L66 57 L58 60 Z" fill="#F9F5E9" stroke="#25292A" strokeWidth="1.5" />

          {/* Tank, rider-free sport-bike body and angular orange fairings */}
          <Path d="M98 46 Q108 36 126 36 L147 40 Q160 43 171 53 L184 62 L171 76 L151 78 L132 69 L111 71 L94 62 Z" fill={JOSAN_ORANGE} stroke="#151718" strokeWidth="2.8" strokeLinejoin="round" />
          <Path d="M109 43 Q119 35 135 38 L150 43 L145 52 L121 51 Z" fill="#FF9A48" stroke="#242728" strokeWidth="1.5" />
          <Path d="M101 52 L117 50 L106 63 L91 64 Z" fill="#F7F1DE" stroke="#25292A" strokeWidth="1.5" />
          <Path d="M116 59 L148 55 L162 63 L149 68 L128 65 Z" fill="#222628" />
          <Path d="M122 70 L147 69 L158 76 L138 78 L124 75 Z" fill="#E96F20" />
          <Path d="M139 76 L160 69 L169 78 L158 84 L138 82 Z" fill="#24282A" stroke="#111315" strokeWidth="1.5" />
          <Path d="M143 79 L160 75 L164 78 L151 82 Z" fill={JOSAN_GOLD} />

          {/* Front nose and fork; the pointed fairing follows the reference's sport-bike profile */}
          <Path d="M157 43 Q173 39 187 46 L207 56 L201 65 L188 70 L179 81 L166 75 L171 62 L154 57 Z" fill={JOSAN_ORANGE} stroke="#151718" strokeWidth="2.5" strokeLinejoin="round" />
          <Path d="M179 48 L201 57 L193 60 L177 57 Z" fill="#F9F3E2" stroke="#242728" strokeWidth="1.4" />
          <Path d="M174 63 L190 65 L181 72 L169 70 Z" fill="#202426" />
          <Path d="M181 54 L194 58" stroke="#FFF0D7" strokeWidth="2" strokeLinecap="round" />
          <Line x1="171" y1="54" x2="190" y2="84" stroke="#313638" strokeWidth="4" strokeLinecap="round" />
          <Line x1="174" y1="58" x2="188" y2="81" stroke={JOSAN_GOLD} strokeWidth="1.5" strokeLinecap="round" />

          {/* Handlebars and side mirrors */}
          <Path d="M155 40 L169 34 L180 37" fill="none" stroke="#171A1B" strokeWidth="3" strokeLinecap="round" />
          <Line x1="167" y1="37" x2="173" y2="20" stroke="#171A1B" strokeWidth="2.5" />
          <Path d="M169 18 Q173 8 182 9 Q187 10 184 16 L175 22 Z" fill="#24282A" stroke="#111315" strokeWidth="2" />
          <Line x1="154" y1="40" x2="143" y2="27" stroke="#171A1B" strokeWidth="2.5" />
          <Path d="M132 20 Q137 15 143 20 L148 27 L139 29 Z" fill="#24282A" stroke="#111315" strokeWidth="2" />
          <Path d="M160 45 L168 43" stroke="#1B1E1F" strokeWidth="3" strokeLinecap="round" />

          {/* Small fairing vents and body highlights */}
          <Path d="M114 64 L126 62 L119 68 Z" fill="#171A1B" />
          <Path d="M97 57 L108 54" stroke="#FFC078" strokeWidth="1.5" strokeLinecap="round" />
          <Path d="M75 58 L88 51" stroke="#FFB567" strokeWidth="1.5" strokeLinecap="round" />
        </Svg>
      </Animated.View>

      <View style={styles.roadBase}>
        <Svg width="250" height="6" viewBox="0 0 250 6">
          <Line x1="0" y1="3" x2="250" y2="3" stroke="rgba(31,31,31,0.14)" strokeWidth="1.5" />
        </Svg>
        <Animated.View style={[styles.roadDashes, { transform: [{ translateX: roadShift }] }]}>
          <Svg width="286" height="6" viewBox="0 0 286 6">
            {[8, 52, 96, 140, 184, 228, 272].map((x, index) => (
              <Rect
                key={x}
                x={x}
                y="2"
                width="18"
                height="2"
                rx="1"
                fill={index % 2 === 0 ? JOSAN_ORANGE : JOSAN_GOLD}
              />
            ))}
          </Svg>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scene: {
    width: 250,
    height: 112,
    overflow: "hidden",
    position: "relative",
  },
  trails: {
    position: "absolute",
    left: 0,
    top: 20,
    zIndex: 1,
  },
  rearWheel: {
    position: "absolute",
    left: 39,
    top: 58,
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    zIndex: 2,
  },
  frontWheel: {
    position: "absolute",
    left: 166,
    top: 58,
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    zIndex: 2,
  },
  body: {
    position: "absolute",
    left: 0,
    top: 0,
    width: 250,
    height: 108,
    zIndex: 3,
  },
  roadBase: {
    position: "absolute",
    left: 0,
    bottom: 1,
    width: 250,
    height: 6,
    overflow: "hidden",
    zIndex: 4,
  },
  roadDashes: {
    position: "absolute",
    left: 0,
    top: 0,
    width: 286,
    height: 6,
  },
});

export default SportBikeAnimation;
