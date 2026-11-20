import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  View,
} from "react-native";
import Svg, { Circle, Line, Path, Rect } from "react-native-svg";

export const JOSAN_ORANGE = "#F77F28";
export const JOSAN_GOLD = "#D4AF5A";
export const DARK_CHARCOAL = "#1F1F1F";

interface DeliveryBikeAnimationProps {
  scale?: number; // 1.2 for splash, 0.9 for compact login loader
  showRoad?: boolean;
  showSpeedLines?: boolean;
}

/**
 * Shared Logistics Delivery Motorcycle Animation.
 * Used consistently across:
 * 1. App Animated Splash Screen (hero size, cinematic entrance)
 * 2. Login Loading Area (compact size, active status)
 */
export function DeliveryBikeAnimation({
  scale = 1.0,
  showRoad = true,
  showSpeedLines = true,
}: DeliveryBikeAnimationProps) {
  // 1. Wheel rotation animation (0deg -> 360deg loop)
  const wheelSpinAnim = useRef(new Animated.Value(0)).current;

  // 2. Chassis suspension bobbing (0 -> -3 -> 0 loop)
  const chassisBobAnim = useRef(new Animated.Value(0)).current;

  // 3. Motion speed lines behind motorcycle
  const speedLinesAnim = useRef(new Animated.Value(0)).current;

  // 4. Moving road dashes beneath the tires
  const roadAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Wheel Spin: fast continuous 360 rotation
    const wheelLoop = Animated.loop(
      Animated.timing(wheelSpinAnim, {
        toValue: 1,
        duration: 450,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    // Suspension Bobbing: organic road travel vibration
    const bobLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(chassisBobAnim, {
          toValue: -3.5,
          duration: 170,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(chassisBobAnim, {
          toValue: 0,
          duration: 170,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    // Trailing Speed Lines
    const speedLoop = Animated.loop(
      Animated.timing(speedLinesAnim, {
        toValue: 1,
        duration: 380,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    // Moving Road Dashes
    const roadLoop = Animated.loop(
      Animated.timing(roadAnim, {
        toValue: 1,
        duration: 320,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    wheelLoop.start();
    bobLoop.start();
    if (showSpeedLines) speedLoop.start();
    if (showRoad) roadLoop.start();

    return () => {
      wheelLoop.stop();
      bobLoop.stop();
      speedLoop.stop();
      roadLoop.stop();
    };
  }, [chassisBobAnim, roadAnim, showRoad, showSpeedLines, speedLinesAnim, wheelSpinAnim]);

  const wheelRotation = wheelSpinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const speedLineTranslateX = speedLinesAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -32],
  });

  const speedLineOpacity = speedLinesAnim.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [0.9, 0.5, 0],
  });

  const roadTranslateX = roadAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -40],
  });

  return (
    <View style={[styles.container, { transform: [{ scale }] }]}>
      <View style={styles.scene}>
        {/* Trailing Speed / Motion Lines */}
        {showSpeedLines ? (
          <Animated.View
            style={[
              styles.speedLinesWrap,
              {
                transform: [{ translateX: speedLineTranslateX }],
                opacity: speedLineOpacity,
              },
            ]}
          >
            <Svg width={42} height={50} viewBox="0 0 42 50">
              <Line x1="12" y1="12" x2="40" y2="12" stroke={JOSAN_ORANGE} strokeWidth="2.5" strokeLinecap="round" />
              <Line x1="0" y1="23" x2="32" y2="23" stroke={JOSAN_GOLD} strokeWidth="2" strokeLinecap="round" />
              <Line x1="16" y1="35" x2="38" y2="35" stroke={JOSAN_ORANGE} strokeWidth="2" strokeLinecap="round" />
            </Svg>
          </Animated.View>
        ) : null}

        {/* Motorcycle Chassis & Rider (Vertical Bobbing Layer) */}
        <Animated.View
          style={[
            styles.chassisLayer,
            {
              transform: [{ translateY: chassisBobAnim }],
            },
          ]}
        >
          <Svg width={180} height={95} viewBox="0 0 180 95">
            {/* Delivery Cargo Box on Rear Rack */}
            <Rect x="42" y="24" width="30" height="26" rx="4" fill={JOSAN_ORANGE} stroke={JOSAN_GOLD} strokeWidth="1.5" />
            {/* Box Accent Handle / Brand Strip */}
            <Rect x="46" y="35" width="22" height="4" rx="1.5" fill={JOSAN_GOLD} />

            {/* Rear Frame Support */}
            <Line x1="57" y1="50" x2="57" y2="68" stroke={DARK_CHARCOAL} strokeWidth="3" strokeLinecap="round" />
            <Line x1="57" y1="68" x2="80" y2="52" stroke={DARK_CHARCOAL} strokeWidth="3" />

            {/* Motorcycle Main Frame & Engine Block */}
            <Path d="M72 52 L95 50 L115 36 L128 58 L85 62 Z" fill={DARK_CHARCOAL} />
            {/* Fuel Tank (Josan Orange) */}
            <Path d="M92 46 C95 38 108 34 116 36 L118 46 Z" fill={JOSAN_ORANGE} />
            {/* Chrome Exhaust Pipe */}
            <Path d="M85 62 L60 66 L42 63" stroke="#9CA3AF" strokeWidth="2.5" fill="none" strokeLinecap="round" />

            {/* Front Fork & Handlebars */}
            <Line x1="116" y1="34" x2="135" y2="70" stroke={DARK_CHARCOAL} strokeWidth="3.5" strokeLinecap="round" />
            <Line x1="112" y1="32" x2="120" y2="36" stroke={JOSAN_GOLD} strokeWidth="2.5" strokeLinecap="round" />
            {/* Front Headlight Accent */}
            <Circle cx="126" cy="40" r="3" fill={JOSAN_GOLD} />

            {/* Courier Figure */}
            {/* Jacket (Leaning Forward) */}
            <Path d="M82 48 L92 28 L104 28 L114 36 L100 46 Z" fill={JOSAN_ORANGE} />
            {/* Helmet */}
            <Circle cx="96" cy="20" r="8.5" fill={DARK_CHARCOAL} />
            {/* Visor (Gold Accent) */}
            <Path d="M98 17 C103 17 104 22 101 24 L97 22 Z" fill={JOSAN_GOLD} />
            {/* Arms holding handlebar */}
            <Line x1="98" y1="32" x2="114" y2="36" stroke={DARK_CHARCOAL} strokeWidth="3" strokeLinecap="round" />
          </Svg>
        </Animated.View>

        {/* Rear Wheel (Spinning Layer) */}
        <Animated.View
          style={[
            styles.rearWheelWrap,
            {
              transform: [{ rotate: wheelRotation }],
            },
          ]}
        >
          <Svg width={30} height={30} viewBox="0 0 30 30">
            {/* Outer Tire */}
            <Circle cx="15" cy="15" r="13" stroke={DARK_CHARCOAL} strokeWidth="3.5" fill="none" />
            {/* Inner Gold Rim */}
            <Circle cx="15" cy="15" r="10" stroke={JOSAN_GOLD} strokeWidth="1" fill="none" />
            {/* Spokes (High-speed rotation effect) */}
            <Line x1="15" y1="5" x2="15" y2="25" stroke={JOSAN_GOLD} strokeWidth="1.2" />
            <Line x1="5" y1="15" x2="25" y2="15" stroke={JOSAN_GOLD} strokeWidth="1.2" />
            <Line x1="8" y1="8" x2="22" y2="22" stroke={JOSAN_GOLD} strokeWidth="1.2" />
            <Line x1="8" y1="22" x2="22" y2="8" stroke={JOSAN_GOLD} strokeWidth="1.2" />
            {/* Center Hub */}
            <Circle cx="15" cy="15" r="3.5" fill={DARK_CHARCOAL} />
            <Circle cx="15" cy="15" r="1.5" fill={JOSAN_GOLD} />
          </Svg>
        </Animated.View>

        {/* Front Wheel (Spinning Layer) */}
        <Animated.View
          style={[
            styles.frontWheelWrap,
            {
              transform: [{ rotate: wheelRotation }],
            },
          ]}
        >
          <Svg width={30} height={30} viewBox="0 0 30 30">
            {/* Outer Tire */}
            <Circle cx="15" cy="15" r="13" stroke={DARK_CHARCOAL} strokeWidth="3.5" fill="none" />
            {/* Inner Gold Rim */}
            <Circle cx="15" cy="15" r="10" stroke={JOSAN_GOLD} strokeWidth="1" fill="none" />
            {/* Spokes */}
            <Line x1="15" y1="5" x2="15" y2="25" stroke={JOSAN_GOLD} strokeWidth="1.2" />
            <Line x1="5" y1="15" x2="25" y2="15" stroke={JOSAN_GOLD} strokeWidth="1.2" />
            <Line x1="8" y1="8" x2="22" y2="22" stroke={JOSAN_GOLD} strokeWidth="1.2" />
            <Line x1="8" y1="22" x2="22" y2="8" stroke={JOSAN_GOLD} strokeWidth="1.2" />
            {/* Center Hub */}
            <Circle cx="15" cy="15" r="3.5" fill={DARK_CHARCOAL} />
            <Circle cx="15" cy="15" r="1.5" fill={JOSAN_GOLD} />
          </Svg>
        </Animated.View>

        {/* Road & Moving Dashes */}
        {showRoad ? (
          <View style={styles.roadContainer}>
            <Line x1="0" y1="0" x2="240" y2="0" stroke="rgba(31, 31, 31, 0.15)" strokeWidth="1.5" />
            <Animated.View
              style={[
                styles.movingDashes,
                {
                  transform: [{ translateX: roadTranslateX }],
                },
              ]}
            >
              <Svg width={280} height={6} viewBox="0 0 280 6">
                <Line x1="0" y1="3" x2="20" y2="3" stroke={JOSAN_ORANGE} strokeWidth="2.5" strokeLinecap="round" />
                <Line x1="35" y1="3" x2="55" y2="3" stroke={JOSAN_GOLD} strokeWidth="2.5" strokeLinecap="round" />
                <Line x1="70" y1="3" x2="90" y2="3" stroke={JOSAN_ORANGE} strokeWidth="2.5" strokeLinecap="round" />
                <Line x1="105" y1="3" x2="125" y2="3" stroke={JOSAN_GOLD} strokeWidth="2.5" strokeLinecap="round" />
                <Line x1="140" y1="3" x2="160" y2="3" stroke={JOSAN_ORANGE} strokeWidth="2.5" strokeLinecap="round" />
                <Line x1="175" y1="3" x2="195" y2="3" stroke={JOSAN_GOLD} strokeWidth="2.5" strokeLinecap="round" />
                <Line x1="210" y1="3" x2="230" y2="3" stroke={JOSAN_ORANGE} strokeWidth="2.5" strokeLinecap="round" />
                <Line x1="245" y1="3" x2="265" y2="3" stroke={JOSAN_GOLD} strokeWidth="2.5" strokeLinecap="round" />
              </Svg>
            </Animated.View>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  scene: {
    width: 220,
    height: 100,
    position: "relative",
    alignItems: "center",
    justifyContent: "flex-start",
    overflow: "hidden",
  },
  chassisLayer: {
    position: "absolute",
    top: 0,
    left: 20,
    width: 180,
    height: 95,
  },
  speedLinesWrap: {
    position: "absolute",
    top: 20,
    left: 14,
    zIndex: 1,
  },
  rearWheelWrap: {
    position: "absolute",
    top: 55,
    left: 62,
    width: 30,
    height: 30,
    zIndex: 2,
  },
  frontWheelWrap: {
    position: "absolute",
    top: 55,
    left: 140,
    width: 30,
    height: 30,
    zIndex: 2,
  },
  roadContainer: {
    position: "absolute",
    bottom: 8,
    width: 220,
    height: 6,
    overflow: "hidden",
  },
  movingDashes: {
    width: 280,
    height: 6,
    flexDirection: "row",
  },
});

export default DeliveryBikeAnimation;

