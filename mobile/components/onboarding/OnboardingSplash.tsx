import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { theme } from '../../constants/theme';
import { layout } from '../../constants/layout';

const SCREEN_WIDTH = layout.width;
const VISUAL_HEIGHT = layout.pctH(0.5);
const SVG_VIEW_WIDTH = 390;
const SVG_VIEW_HEIGHT = 340;

const ECG_PATH =
  'M0 175 L60 175 L80 175 L95 175 L105 135 L115 215 L125 155 L135 195 L148 175 L390 175';
const ECG_PATH_LENGTH = 900;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

type Props = {
  onGetStarted: () => void;
  onSignIn: () => void;
};

export function OnboardingSplash({ onGetStarted, onSignIn }: Props) {
  // Ripples (3 circles: r and opacity, staggered)
  const ripple1R = useRef(new Animated.Value(30)).current;
  const ripple1Opacity = useRef(new Animated.Value(0.5)).current;
  const ripple2R = useRef(new Animated.Value(30)).current;
  const ripple2Opacity = useRef(new Animated.Value(0.35)).current;
  const ripple3R = useRef(new Animated.Value(30)).current;
  const ripple3Opacity = useRef(new Animated.Value(0.25)).current;

  // ECG draw-in
  const ecgOffset = useRef(new Animated.Value(ECG_PATH_LENGTH)).current;

  // Center pulse dot and ring (ring: r 5 -> 18, opacity 0.6 -> 0)
  const pulseOpacity = useRef(new Animated.Value(0)).current;
  const pulseRingR = useRef(new Animated.Value(5)).current;
  const pulseRingOpacity = useRef(new Animated.Value(0.6)).current;

  // Entry animations (staggered slide-up / fade-in)
  const headlineOpacity = useRef(new Animated.Value(0)).current;
  const headlineTranslateY = useRef(new Animated.Value(30)).current;
  const sublineOpacity = useRef(new Animated.Value(0)).current;
  const sublineTranslateY = useRef(new Animated.Value(30)).current;
  const dividerOpacity = useRef(new Animated.Value(0)).current;
  const dividerTranslateY = useRef(new Animated.Value(30)).current;
  const ctaOpacity = useRef(new Animated.Value(0)).current;
  const ctaTranslateY = useRef(new Animated.Value(30)).current;
  const signInOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Ripple 1: r 30 -> 160, opacity 0.5 -> 0, 3s, start 0
    const ripple1 = Animated.parallel([
      Animated.timing(ripple1R, {
        toValue: 160,
        duration: 3000,
        useNativeDriver: false,
      }),
      Animated.timing(ripple1Opacity, {
        toValue: 0,
        duration: 3000,
        useNativeDriver: false,
      }),
    ]);
    // Ripple 2: start 1s
    const ripple2 = Animated.parallel([
      Animated.timing(ripple2R, { toValue: 130, duration: 3000, useNativeDriver: false }),
      Animated.timing(ripple2Opacity, { toValue: 0, duration: 3000, useNativeDriver: false }),
    ]);
    const ripple3 = Animated.parallel([
      Animated.timing(ripple3R, { toValue: 100, duration: 3000, useNativeDriver: false }),
      Animated.timing(ripple3Opacity, { toValue: 0, duration: 3000, useNativeDriver: false }),
    ]);

    const loopRipple1 = () => {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(ripple1R, { toValue: 160, duration: 3000, useNativeDriver: false }),
          Animated.timing(ripple1Opacity, { toValue: 0, duration: 3000, useNativeDriver: false }),
        ]),
      ]).start(() => {
        ripple1R.setValue(30);
        ripple1Opacity.setValue(0.5);
        loopRipple1();
      });
    };
    const loopRipple2 = () => {
      Animated.sequence([
        Animated.delay(1000),
        Animated.parallel([
          Animated.timing(ripple2R, { toValue: 130, duration: 3000, useNativeDriver: false }),
          Animated.timing(ripple2Opacity, { toValue: 0, duration: 3000, useNativeDriver: false }),
        ]),
      ]).start(() => {
        ripple2R.setValue(30);
        ripple2Opacity.setValue(0.35);
        loopRipple2();
      });
    };
    const loopRipple3 = () => {
      Animated.sequence([
        Animated.delay(2000),
        Animated.parallel([
          Animated.timing(ripple3R, { toValue: 100, duration: 3000, useNativeDriver: false }),
          Animated.timing(ripple3Opacity, { toValue: 0, duration: 3000, useNativeDriver: false }),
        ]),
      ]).start(() => {
        ripple3R.setValue(30);
        ripple3Opacity.setValue(0.25);
        loopRipple3();
      });
    };
    loopRipple1();
    loopRipple2();
    loopRipple3();

    // ECG draw-in: start 0.2s, dur 1.8s
    Animated.sequence([
      Animated.delay(200),
      Animated.timing(ecgOffset, {
        toValue: 0,
        duration: 1800,
        useNativeDriver: false,
      }),
    ]).start();

    // Pulse dot + ring: start after ECG (1.8s), loop
    const runPulse = () => {
      Animated.sequence([
        Animated.delay(1800),
        Animated.parallel([
          Animated.sequence([
            Animated.timing(pulseOpacity, { toValue: 1, duration: 300, useNativeDriver: false }),
            Animated.delay(1200),
            Animated.timing(pulseOpacity, { toValue: 0, duration: 300, useNativeDriver: false }),
          ]),
          Animated.parallel([
            Animated.timing(pulseRingR, { toValue: 18, duration: 1500, useNativeDriver: false }),
            Animated.timing(pulseRingOpacity, { toValue: 0, duration: 1500, useNativeDriver: false }),
          ]),
        ]),
      ]).start(() => {
        pulseRingR.setValue(5);
        pulseRingOpacity.setValue(0.6);
        runPulse();
      });
    };
    runPulse();

    // Staggered entry
    Animated.sequence([
      Animated.delay(500),
      Animated.parallel([
        Animated.timing(headlineOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(headlineTranslateY, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]),
    ]).start();

    Animated.sequence([
      Animated.delay(650),
      Animated.parallel([
        Animated.timing(sublineOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(sublineTranslateY, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]),
    ]).start();

    Animated.sequence([
      Animated.delay(750),
      Animated.parallel([
        Animated.timing(dividerOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(dividerTranslateY, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
    ]).start();

    Animated.sequence([
      Animated.delay(850),
      Animated.parallel([
        Animated.timing(ctaOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(ctaTranslateY, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
    ]).start();

    Animated.sequence([
      Animated.delay(1200),
      Animated.timing(signInOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const cx = SVG_VIEW_WIDTH / 2;
  const cy = 175;

  return (
    <View style={[styles.screen, { width: SCREEN_WIDTH }]}>
      {/* Top: full-bleed visual */}
      <View style={[styles.visualWrap, { height: VISUAL_HEIGHT }]}>
        <Svg
          viewBox={`0 0 ${SVG_VIEW_WIDTH} ${SVG_VIEW_HEIGHT}`}
          style={StyleSheet.absoluteFill}
          preserveAspectRatio="xMidYMid slice"
        >
          {/* Ripple circles */}
          <AnimatedCircle
            cx={cx}
            cy={cy}
            r={ripple1R}
            stroke={theme.gold}
            strokeWidth={1}
            fill="none"
            opacity={ripple1Opacity}
          />
          <AnimatedCircle
            cx={cx}
            cy={cy}
            r={ripple2R}
            stroke={theme.gold}
            strokeWidth={0.8}
            fill="none"
            opacity={ripple2Opacity}
          />
          <AnimatedCircle
            cx={cx}
            cy={cy}
            r={ripple3R}
            stroke={theme.gold}
            strokeWidth={0.6}
            fill="none"
            opacity={ripple3Opacity}
          />

          {/* ECG path (draw-in) */}
          <AnimatedPath
            d={ECG_PATH}
            stroke={theme.gold}
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            strokeDasharray={ECG_PATH_LENGTH}
            strokeDashoffset={ecgOffset}
            opacity={0.9}
          />

          {/* Pulse dot at center */}
          <AnimatedCircle cx={cx} cy={cy} r={5} fill={theme.gold} opacity={pulseOpacity} />
          <AnimatedCircle
            cx={cx}
            cy={cy}
            r={pulseRingR}
            fill="none"
            stroke={theme.gold}
            strokeWidth={1.5}
            opacity={pulseRingOpacity}
          />

          {/* Island silhouette */}
          <Path
            d="M0 290 Q40 260 80 270 Q120 280 140 260 Q160 245 180 255 Q200 265 220 250 Q245 235 270 248 Q295 262 320 255 Q355 245 390 265 L390 340 L0 340 Z"
            fill="rgba(0,40,15,0.6)"
          />
          <Path
            d="M0 310 Q50 295 100 300 Q150 305 190 295 Q230 285 270 298 Q310 310 390 295 L390 340 L0 340 Z"
            fill="rgba(0,30,10,0.8)"
          />
        </Svg>
        {/* Overlay lines */}
        <Svg
          viewBox={`0 0 ${SVG_VIEW_WIDTH} ${SVG_VIEW_HEIGHT}`}
          style={[StyleSheet.absoluteFill, { opacity: 0.04 }]}
          preserveAspectRatio="xMidYMid slice"
        >
          {[60, 110, 160, 210, 260].map((y) => (
            <Path
              key={y}
              d={`M0 ${y} L${SVG_VIEW_WIDTH} ${y}`}
              stroke="white"
              strokeWidth={0.5}
            />
          ))}
        </Svg>
      </View>

      {/* Bottom panel: content pushed down, CTA + sign in at bottom */}
      <View style={styles.bottomPanel}>
        <View style={styles.topContent}>
          <Animated.View
            style={[
              styles.headlineWrap,
              {
                opacity: headlineOpacity,
                transform: [{ translateY: headlineTranslateY }],
              },
            ]}
          >
            <Text style={styles.headline}>
              Care that{' '}
              <Text style={styles.headlineEm}>echoes</Text>
              {' '}across oceans.
            </Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.sublineWrap,
              {
                opacity: sublineOpacity,
                transform: [{ translateY: sublineTranslateY }],
              },
            ]}
          >
            <Text style={styles.subline}>
              Connecting sponsors, patients and clinics{'\n'}across the islands — real care, tracked.
            </Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.dividerWrap,
              {
                opacity: dividerOpacity,
                transform: [{ translateY: dividerTranslateY }],
              },
            ]}
          >
            <View style={styles.divider} />
          </Animated.View>
        </View>

        <View style={styles.bottomActions}>
          <Animated.View
            style={[
              styles.ctaWrap,
              {
                opacity: ctaOpacity,
                transform: [{ translateY: ctaTranslateY }],
              },
            ]}
          >
            <TouchableOpacity style={styles.cta} onPress={onGetStarted} activeOpacity={0.85}>
              <Text style={styles.ctaText}>Get Started →</Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={[styles.signInWrap, { opacity: signInOpacity }]}>
            <TouchableOpacity onPress={onSignIn} activeOpacity={0.7}>
              <Text style={styles.skipText}>Already have an account? <Text style={styles.signInLink}>Sign in</Text></Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.green,
  },
  visualWrap: {
    width: '100%',
    overflow: 'hidden',
    minHeight: 0,
  },
  bottomPanel: {
    flex: 1,
    backgroundColor: theme.green,
    paddingHorizontal: layout.s(32),
    paddingTop: layout.s(24),
    paddingBottom: layout.s(36),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.07)',
    justifyContent: 'space-between',
  },
  topContent: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: layout.s(24),
    gap: layout.s(18),
  },
  bottomActions: {
    gap: layout.s(8),
  },
  headlineWrap: {},
  headline: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: layout.f(42),
    fontWeight: '700',
    color: theme.white,
    lineHeight: layout.f(46),
    letterSpacing: -0.5,
  },
  headlineEm: {
    fontStyle: 'italic',
    color: theme.gold,
  },
  sublineWrap: {},
  subline: {
    fontSize: layout.f(13.5),
    color: 'rgba(255,255,255,0.55)',
    lineHeight: layout.f(21),
    fontWeight: '400',
  },
  dividerWrap: {},
  divider: {
    width: layout.s(48),
    height: 2,
    backgroundColor: theme.gold,
    borderRadius: 2,
  },
  ctaWrap: {},
  cta: {
    width: '100%',
    backgroundColor: theme.gold,
    borderRadius: layout.s(18),
    height: layout.s(60),
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontSize: layout.f(16),
    fontWeight: '600',
    color: theme.green,
    letterSpacing: 0.5,
  },
  signInWrap: {
    alignItems: 'center',
    paddingVertical: layout.s(6),
  },
  skipText: {
    fontSize: layout.f(12.5),
    color: 'rgba(255,255,255,0.38)',
  },
  signInLink: {
    color: theme.gold,
    fontWeight: '600',
  },
});
