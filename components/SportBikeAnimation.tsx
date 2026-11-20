import React, { useEffect, useState } from "react";
import { Animated, Easing, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Line,
  Path,
  Rect,
  Stop,
} from "react-native-svg";
import { JOSAN_ORANGE } from "./DeliveryBikeAnimation";

const SCENE_WIDTH = 280;
const SCENE_HEIGHT = 136;
const WHEEL_SIZE = 48;

function Wheel({ style }: { style: StyleProp<ViewStyle> }) {
  return (
    <Animated.View style={[styles.wheel, style]}>
      <Svg width={WHEEL_SIZE} height={WHEEL_SIZE} viewBox="0 0 48 48">
        <Circle cx="24" cy="24" r="21.5" fill="#121416" stroke="#090A0B" strokeWidth="1.5" />
        <Circle cx="24" cy="24" r="18.5" fill="none" stroke="#303437" strokeWidth="1" />
        <Circle cx="24" cy="24" r="15.5" fill="#202427" stroke="#777B7C" strokeWidth="1" />
        <G stroke="#B7BABB" strokeWidth="1.15">
          <Line x1="24" y1="9" x2="24" y2="39" />
          <Line x1="9" y1="24" x2="39" y2="24" />
          <Line x1="13.4" y1="13.4" x2="34.6" y2="34.6" />
          <Line x1="34.6" y1="13.4" x2="13.4" y2="34.6" />
        </G>
        <Circle cx="24" cy="24" r="5" fill="#282C2E" stroke="#929697" strokeWidth="1" />
        <Circle cx="24" cy="24" r="2" fill={JOSAN_ORANGE} />
      </Svg>
    </Animated.View>
  );
}

export function SportBikeAnimation() {
  const [wheelRotation] = useState(() => new Animated.Value(0));
  const [roadMotion] = useState(() => new Animated.Value(0));
  const [backgroundMotion] = useState(() => new Animated.Value(0));
  const [suspension] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const loops = [
      Animated.loop(
        Animated.timing(wheelRotation, {
          toValue: 1,
          duration: 1800,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ),
      Animated.loop(
        Animated.timing(roadMotion, {
          toValue: 1,
          duration: 1900,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ),
      Animated.loop(
        Animated.timing(backgroundMotion, {
          toValue: 1,
          duration: 14000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(suspension, {
            toValue: -0.65,
            duration: 950,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(suspension, {
            toValue: 0,
            duration: 950,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      ),
    ];

    loops.forEach((loop) => loop.start());
    return () => loops.forEach((loop) => loop.stop());
  }, [backgroundMotion, roadMotion, suspension, wheelRotation]);

  const wheelRotate = wheelRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });
  const roadShift = roadMotion.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -140],
  });
  const backgroundShift = backgroundMotion.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -SCENE_WIDTH],
  });

  return (
    <View
      style={styles.scene}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Svg width={SCENE_WIDTH} height={SCENE_HEIGHT} viewBox={`0 0 ${SCENE_WIDTH} ${SCENE_HEIGHT}`}>
        <Defs>
          <LinearGradient id="loader-sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FAF8F3" />
            <Stop offset="1" stopColor="#E9E6DF" />
          </LinearGradient>
        </Defs>
        <Rect width={SCENE_WIDTH} height={SCENE_HEIGHT} fill="url(#loader-sky)" />
      </Svg>

      <Animated.View
        pointerEvents="none"
        style={[styles.backgroundLayer, { transform: [{ translateX: backgroundShift }] }]}
      >
        <Svg width={SCENE_WIDTH * 2} height="108" viewBox="0 0 560 108">
          <Path
            d="M0 81 Q35 75 70 81 T140 81 T210 81 T280 81 L280 108 L0 108 Z"
            transform="translate(0 0)"
            fill="#D9D5CC"
          />
          <Path
            d="M0 81 Q35 75 70 81 T140 81 T210 81 T280 81 L280 108 L0 108 Z"
            transform="translate(280 0)"
            fill="#D9D5CC"
          />
          <Path
            d="M0 88 Q35 82 70 88 T140 88 T210 88 T280 88 L280 108 L0 108 Z"
            transform="translate(0 0)"
            fill="#C9C5BC"
            opacity="0.65"
          />
          <Path
            d="M0 88 Q35 82 70 88 T140 88 T210 88 T280 88 L280 108 L0 108 Z"
            transform="translate(280 0)"
            fill="#C9C5BC"
            opacity="0.65"
          />
        </Svg>
      </Animated.View>

      <View style={styles.motionBlur} pointerEvents="none">
        <Svg width={SCENE_WIDTH} height="12" viewBox="0 0 280 12">
          <Path d="M18 5 H44 M229 4 H252 M73 8 H91" stroke="#A6A39D" strokeWidth="1" opacity="0.22" strokeLinecap="round" />
        </Svg>
      </View>

      <View style={styles.road}>
        <Svg width={SCENE_WIDTH} height={SCENE_HEIGHT - 108} viewBox="0 0 280 28">
          <Defs>
            <LinearGradient id="loader-road" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#45484A" />
              <Stop offset="1" stopColor="#292C2E" />
            </LinearGradient>
          </Defs>
          <Rect width="280" height="28" fill="url(#loader-road)" />
          <Rect x="0" y="0" width="280" height="1" fill="#77797A" opacity="0.55" />
          <Line x1="0" y1="4" x2="280" y2="4" stroke="#181A1B" strokeWidth="1" opacity="0.4" />
        </Svg>
        <Animated.View style={[styles.roadMarkings, { transform: [{ translateX: roadShift }] }]}>
          <Svg width="560" height="28" viewBox="0 0 560 28">
            {[12, 152, 292, 432].map((x) => (
              <Rect
                key={x}
                x={x}
                y="18"
                width="28"
                height="1.5"
                rx="0.75"
                fill="#E5E1D8"
                opacity="0.7"
              />
            ))}
          </Svg>
        </Animated.View>
      </View>

      <Animated.View
        style={[styles.bikeAssembly, { transform: [{ translateY: suspension }] }]}
      >
        <Svg
          style={StyleSheet.absoluteFill}
          width={SCENE_WIDTH}
          height={SCENE_HEIGHT}
          viewBox="0 0 280 136"
        >
          <Ellipse cx="140" cy="114" rx="89" ry="3.5" fill="#101214" opacity="0.2" />
        </Svg>

        <Wheel style={[styles.rearWheel, { transform: [{ rotate: wheelRotate }] }]} />
        <Wheel style={[styles.frontWheel, { transform: [{ rotate: wheelRotate }] }]} />

        <Svg
          style={StyleSheet.absoluteFill}
          width={SCENE_WIDTH}
          height={SCENE_HEIGHT}
          viewBox="0 0 280 136"
        >
          <Defs>
            <LinearGradient id="loader-orange" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#FF9B51" />
              <Stop offset="0.48" stopColor={JOSAN_ORANGE} />
              <Stop offset="1" stopColor="#C85A19" />
            </LinearGradient>
            <LinearGradient id="loader-black" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#35393B" />
              <Stop offset="1" stopColor="#151719" />
            </LinearGradient>
            <LinearGradient id="loader-metal" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#777C7E" />
              <Stop offset="0.5" stopColor="#313638" />
              <Stop offset="1" stopColor="#151819" />
            </LinearGradient>
          </Defs>

          {/* Chassis, engine, swingarm and exhaust */}
          <Path d="M68 92 L119 65 L165 69 L205 94 L198 98 L158 78 L121 74 L78 99 Z" fill="url(#loader-metal)" />
          <Path d="M104 72 Q116 63 135 65 L153 73 L148 91 L119 94 L105 85 Z" fill="#25292B" stroke="#111416" strokeWidth="1.2" />
          <Path d="M112 73 L139 70 L146 78 L135 83 L116 82 Z" fill="#414648" />
          <Path d="M112 85 L85 96 L65 92" fill="none" stroke="#8D9293" strokeWidth="3" strokeLinecap="round" />
          <Path d="M107 90 L75 99 L58 95" fill="none" stroke="#282C2E" strokeWidth="2" />
          <Path d="M105 87 L75 93 L59 91" fill="none" stroke="#A8ABAA" strokeWidth="2.2" strokeLinecap="round" />
          <Path d="M77 91 L57 90 L52 93 L69 97 L85 95 Z" fill="#44494B" stroke="#202426" strokeWidth="1" />

          {/* Compact tail and raised sport seat */}
          <Path d="M53 59 L65 47 Q70 42 79 45 L102 52 L111 61 L91 68 L69 72 L59 83 Z" fill="url(#loader-orange)" stroke="#242729" strokeWidth="1.8" strokeLinejoin="round" />
          <Path d="M69 51 Q77 46 86 50 L109 56 L117 62 L98 64 L78 60 L67 64 Z" fill="#191C1E" stroke="#0F1112" strokeWidth="1.5" />
          <Path d="M58 62 L73 51 L78 53 L67 69 L59 72 Z" fill="#F2EEE6" stroke="#333739" strokeWidth="1" />
          <Path d="M57 63 L64 59 L62 70 L57 73 Z" fill="#E7E4DE" />

          {/* Angular tank and side fairings */}
          <Path d="M104 61 Q111 49 127 48 L151 50 Q165 52 176 62 L188 72 L177 87 L159 91 L145 82 L124 84 L105 76 L96 69 Z" fill="url(#loader-orange)" stroke="#242729" strokeWidth="2" strokeLinejoin="round" />
          <Path d="M112 58 Q121 50 135 52 L151 55 L145 64 L122 64 Z" fill="#FFAD6C" opacity="0.82" />
          <Path d="M101 68 L120 65 L109 78 L94 76 Z" fill="#ECE9E2" stroke="#363A3B" strokeWidth="1.2" />
          <Path d="M121 71 L151 65 L168 72 L157 80 L135 78 Z" fill="#202426" />
          <Path d="M130 82 L156 81 L170 89 L151 93 L130 89 Z" fill="#C95D1D" />
          <Path d="M144 89 L166 82 L180 88 L168 97 L145 96 Z" fill="#1B1F20" stroke="#101213" strokeWidth="1.3" />
          <Path d="M151 91 L169 87 L173 90 L158 95 Z" fill="#AEB1AF" />
          <Path d="M114 76 L128 74 L120 81 Z" fill="#111415" />
          <Path d="M98 69 L108 66" stroke="#FFD0A5" strokeWidth="1" strokeLinecap="round" />

          {/* Nose, front brake, fork and handlebar */}
          <Path d="M165 55 Q178 51 191 58 L212 69 L207 79 L194 84 L184 96 L173 90 L178 76 L161 68 Z" fill="url(#loader-orange)" stroke="#242729" strokeWidth="1.8" strokeLinejoin="round" />
          <Path d="M181 59 L202 69 L194 72 L179 68 Z" fill="#F2EEE6" stroke="#303436" strokeWidth="1" />
          <Path d="M179 76 L194 77 L184 85 L174 83 Z" fill="#1B1F21" />
          <Path d="M198 70 L207 73 L201 76 L195 74 Z" fill="#F6F3EB" />
          <Line x1="180" y1="68" x2="204" y2="96" stroke="#292E30" strokeWidth="4" strokeLinecap="round" />
          <Line x1="184" y1="71" x2="204" y2="95" stroke="#A6A9A8" strokeWidth="1" strokeLinecap="round" />
          <Path d="M168 53 L178 48 L189 51" fill="none" stroke="#16191A" strokeWidth="2.4" strokeLinecap="round" />
          <Line x1="178" y1="49" x2="184" y2="37" stroke="#202426" strokeWidth="1.8" />
          <Path d="M181 36 Q186 31 191 34 L194 38 L186 41 Z" fill="#24292B" stroke="#111415" strokeWidth="1" />
          <Line x1="167" y1="53" x2="159" y2="43" stroke="#202426" strokeWidth="1.8" />
          <Path d="M153 40 Q158 37 162 42 L166 47 L158 48 Z" fill="#24292B" stroke="#111415" strokeWidth="1" />

          {/* Rider's boot and folded leg */}
          <Path d="M111 52 Q104 57 112 67 L126 78 L141 75 L133 69 L123 61 L130 53 Z" fill="url(#loader-black)" stroke="#111416" strokeWidth="1.2" />
          <Path d="M126 68 L143 72 L151 80 L145 84 L132 77 L122 76 Z" fill="#202426" />
          <Path d="M137 76 L151 78 L159 82 L153 86 L140 83 Z" fill="#101314" />
          <Path d="M135 82 L153 84" stroke="#777C7E" strokeWidth="1.2" strokeLinecap="round" />

          {/* Black leather jacket, arms and gloves */}
          <Path d="M114 52 Q116 42 126 36 L141 30 L154 34 L164 47 L152 56 L139 62 L123 59 Z" fill="url(#loader-black)" stroke="#111416" strokeWidth="1.5" strokeLinejoin="round" />
          <Path d="M127 40 L139 35 L148 39 L140 53 L129 54 L121 51 Z" fill="#2B3032" />
          <Path d="M145 38 Q154 36 162 43 L179 51 L176 56 L158 50 L148 47 Z" fill="#191D1F" stroke="#101314" strokeWidth="1.1" />
          <Path d="M174 49 L183 48 L187 52 L182 56 L175 54 Z" fill="#101314" />
          <Path d="M129 43 L137 45" stroke="#626769" strokeWidth="1" strokeLinecap="round" />
          <Path d="M136 57 L143 61" stroke="#53585A" strokeWidth="1" strokeLinecap="round" />

          {/* Full-face helmet with dark visor */}
          <Path d="M141 25 Q141 14 150 10 Q161 7 168 15 Q173 22 169 31 L164 36 L153 33 L147 30 Z" fill="#171B1D" stroke="#080A0B" strokeWidth="1.5" />
          <Path d="M157 18 Q165 17 170 22 L168 27 L158 27 L153 23 Z" fill="#566064" stroke="#252A2C" strokeWidth="1" />
          <Path d="M145 20 Q148 12 156 11" fill="none" stroke="#686E70" strokeWidth="1.2" strokeLinecap="round" />
          <Path d="M161 29 L166 30" stroke={JOSAN_ORANGE} strokeWidth="1.4" strokeLinecap="round" />
        </Svg>
      </Animated.View>

    </View>
  );
}

const styles = StyleSheet.create({
  scene: {
    width: SCENE_WIDTH,
    height: SCENE_HEIGHT,
    overflow: "hidden",
    position: "relative",
    alignSelf: "center",
  },
  backgroundLayer: {
    position: "absolute",
    left: 0,
    top: 0,
    width: SCENE_WIDTH * 2,
    height: 108,
  },
  road: {
    position: "absolute",
    top: 108,
    left: 0,
    width: SCENE_WIDTH,
    height: 28,
    overflow: "hidden",
  },
  roadMarkings: {
    position: "absolute",
    left: 0,
    top: 0,
    width: SCENE_WIDTH * 2,
    height: 28,
  },
  bikeAssembly: {
    position: "absolute",
    left: 0,
    top: 0,
    width: SCENE_WIDTH,
    height: SCENE_HEIGHT,
  },
  wheel: {
    position: "absolute",
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    top: 69,
    zIndex: 1,
  },
  rearWheel: {
    left: 44,
  },
  frontWheel: {
    left: 181,
  },
  motionBlur: {
    position: "absolute",
    left: 0,
    top: 85,
    width: SCENE_WIDTH,
    height: 12,
  },
});

export default SportBikeAnimation;
