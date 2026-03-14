import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated } from 'react-native';
import Svg, { Circle, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { theme } from '../../constants/theme';
import { layout } from '../../constants/layout';

const SCREEN_WIDTH = layout.width;
const SVG_VIEW_WIDTH = 390;
const SVG_VIEW_HEIGHT = 360;

const TRACKING_PATH = 'M-28 240 C 20 240 60 240 98 240 C 98 240 98 100 158 100 S 218 180 278 180 S 348 120 378 120';
const TRACKING_PATH_LENGTH = 720;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

type Props = {
  variant: 'sponsors' | 'tracking';
  onNext: () => void;
  onBack: () => void;
  showBack?: boolean;
  dotIndex: number;
  totalDots: number;
};

const CONTENT = {
  sponsors: {
    headline: 'Fund lives,\nacross islands.',
    headlineEm: 'across islands.',
    subline:
      'Patients can have their care sponsored by family, friends, or other external entities. Link your support directly to patients and clinics. Track every dollar, every appointment, every outcome — in real time.',
  },
  tracking: {
    headline: 'Every step,\naccounted for.',
    headlineEm: 'accounted for.',
    subline:
      'From referral to recovery — every appointment, treatment milestone and clinic visit is tracked and visible to all parties.',
  },
};

export function OnboardingFeature({
  variant,
  onNext,
  onBack,
  showBack = true,
  dotIndex,
  totalDots,
}: Props) {
  const content = CONTENT[variant];
  const isSponsors = variant === 'sponsors';

  // Sponsors: ripple animations from center node
  const ripple1R = useRef(new Animated.Value(36)).current;
  const ripple1Opacity = useRef(new Animated.Value(0.4)).current;
  const ripple2R = useRef(new Animated.Value(36)).current;
  const ripple2Opacity = useRef(new Animated.Value(0.3)).current;

  // Tracking: path draw + step dots
  const pathOffset = useRef(new Animated.Value(TRACKING_PATH_LENGTH)).current;
  const dot1Opacity = useRef(new Animated.Value(0)).current;
  const dot2Opacity = useRef(new Animated.Value(0)).current;
  const dot3Opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isSponsors) {
      const runRipple1 = () => {
        Animated.sequence([
          Animated.parallel([
            Animated.timing(ripple1R, { toValue: 90, duration: 2500, useNativeDriver: false }),
            Animated.timing(ripple1Opacity, { toValue: 0, duration: 2500, useNativeDriver: false }),
          ]),
        ]).start(() => {
          ripple1R.setValue(36);
          ripple1Opacity.setValue(0.4);
          runRipple1();
        });
      };
      const runRipple2 = () => {
        Animated.sequence([
          Animated.delay(1200),
          Animated.parallel([
            Animated.timing(ripple2R, { toValue: 75, duration: 2500, useNativeDriver: false }),
            Animated.timing(ripple2Opacity, { toValue: 0, duration: 2500, useNativeDriver: false }),
          ]),
        ]).start(() => {
          ripple2R.setValue(36);
          ripple2Opacity.setValue(0.3);
          runRipple2();
        });
      };
      runRipple1();
      runRipple2();
    } else {
      Animated.sequence([
        Animated.delay(300),
        Animated.timing(pathOffset, { toValue: 0, duration: 2000, useNativeDriver: false }),
      ]).start();
      Animated.sequence([
        Animated.delay(400),
        Animated.timing(dot1Opacity, { toValue: 1, duration: 300, useNativeDriver: false }),
      ]).start();
      Animated.sequence([
        Animated.delay(900),
        Animated.timing(dot2Opacity, { toValue: 1, duration: 300, useNativeDriver: false }),
      ]).start();
      Animated.sequence([
        Animated.delay(1500),
        Animated.timing(dot3Opacity, { toValue: 1, duration: 300, useNativeDriver: false }),
      ]).start();
    }
  }, [variant]);

  return (
    <View style={[styles.screen, { width: SCREEN_WIDTH }]}>
      {/* Illustration - flex so text and nav sit below, buttons at bottom */}
      <View style={styles.illustWrap}>
        {isSponsors && (
        <Svg
          viewBox={`0 0 ${SVG_VIEW_WIDTH} ${SVG_VIEW_HEIGHT}`}
          style={StyleSheet.absoluteFill}
          preserveAspectRatio="xMidYMid slice">
          <Line x1={0} y1={70} x2={SVG_VIEW_WIDTH} y2={70} stroke="white" strokeWidth={0.4} opacity={0.04} />
          <Line x1={0} y1={140} x2={SVG_VIEW_WIDTH} y2={140} stroke="white" strokeWidth={0.4} opacity={0.04} />
          <Line x1={0} y1={210} x2={SVG_VIEW_WIDTH} y2={210} stroke="white" strokeWidth={0.4} opacity={0.04} />
          <Line x1={0} y1={280} x2={SVG_VIEW_WIDTH} y2={280} stroke="white" strokeWidth={0.4} opacity={0.04} />
          <>
            <Circle cx={195} cy={155} r={36} fill="rgba(231,211,28,0.12)" stroke={theme.gold} strokeWidth={1.5} />
            <Circle cx={195} cy={155} r={24} fill="rgba(231,211,28,0.18)" />
            <Circle cx={195} cy={148} r={8} fill={theme.gold} />
            <Path d="M180 168C180 160.3 186.8 154 195 154C203.2 154 210 160.3 210 168" stroke={theme.gold} strokeWidth={2.5} strokeLinecap="round" fill="none" />
            <AnimatedCircle cx={195} cy={155} r={ripple1R} stroke={theme.gold} strokeWidth={1} fill="none" opacity={ripple1Opacity} />
            <AnimatedCircle cx={195} cy={155} r={ripple2R} stroke={theme.gold} strokeWidth={0.8} fill="none" opacity={ripple2Opacity} />
            <Line x1={195} y1={155} x2={88} y2={78} stroke="rgba(231,211,28,0.35)" strokeWidth={1.2} strokeDasharray="5 4" />
            <Circle cx={88} cy={78} r={22} fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.18)" strokeWidth={1} />
            <Circle cx={88} cy={72} r={6} fill="rgba(255,255,255,0.5)" />
            <Path d="M77 88C77 82.5 82 78.5 88 78.5C94 78.5 99 82.5 99 88" stroke="rgba(255,255,255,0.5)" strokeWidth={1.8} strokeLinecap="round" fill="none" />
            <Circle cx={104} cy={62} r={9} fill={theme.accentTeal} />
            <Path d="M109 61 L104 67 L100 63" stroke={theme.green} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <Line x1={195} y1={155} x2={302} y2={78} stroke="rgba(231,211,28,0.35)" strokeWidth={1.2} strokeDasharray="5 4" />
            <Circle cx={302} cy={78} r={22} fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.18)" strokeWidth={1} />
            <Circle cx={302} cy={72} r={6} fill="rgba(255,255,255,0.5)" />
            <Path d="M291 88C291 82.5 296 78.5 302 78.5C308 78.5 313 82.5 313 88" stroke="rgba(255,255,255,0.5)" strokeWidth={1.8} strokeLinecap="round" fill="none" />
            <Circle cx={318} cy={62} r={9} fill={theme.accentTeal} />
            <Path d="M323 61 L318 67 L314 63" stroke={theme.green} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <Line x1={195} y1={155} x2={88} y2={240} stroke="rgba(231,211,28,0.25)" strokeWidth={1.2} strokeDasharray="5 4" />
            <Circle cx={88} cy={240} r={22} fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.12)" strokeWidth={1} />
            <Circle cx={88} cy={234} r={6} fill="rgba(255,255,255,0.35)" />
            <Path d="M77 250C77 244.5 82 240.5 88 240.5C94 240.5 99 244.5 99 250" stroke="rgba(255,255,255,0.35)" strokeWidth={1.8} strokeLinecap="round" fill="none" />
            <Circle cx={104} cy={224} r={9} fill="rgba(231,211,28,0.35)" stroke={theme.gold} strokeWidth={1} />
            <SvgText x={104} y={228} textAnchor="middle" fontSize={9} fill={theme.gold} fontWeight="700">?</SvgText>
            <Line x1={195} y1={155} x2={302} y2={240} stroke="rgba(231,211,28,0.25)" strokeWidth={1.2} strokeDasharray="5 4" />
            <Circle cx={302} cy={240} r={22} fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.12)" strokeWidth={1} />
            <Circle cx={302} cy={234} r={6} fill="rgba(255,255,255,0.35)" />
            <Path d="M291 250C291 244.5 296 240.5 302 240.5C308 240.5 313 244.5 313 250" stroke="rgba(255,255,255,0.35)" strokeWidth={1.8} strokeLinecap="round" fill="none" />
            <Circle cx={318} cy={224} r={9} fill="rgba(231,211,28,0.35)" stroke={theme.gold} strokeWidth={1} />
            <SvgText x={318} y={228} textAnchor="middle" fontSize={9} fill={theme.gold} fontWeight="700">?</SvgText>
            <Rect x={136} y={202} width={118} height={28} rx={8} fill="rgba(231,211,28,0.14)" stroke="rgba(231,211,28,0.3)" strokeWidth={1} />
            <SvgText x={195} y={218} textAnchor="middle" fontSize={12} fill={theme.gold} fontWeight="600">$4,200 disbursed</SvgText>
            <Path d="M0 300 Q50 275 95 282 Q135 290 160 272 Q183 256 205 265 Q228 274 255 260 Q282 246 315 258 Q348 270 390 258 L390 360 L0 360 Z" fill="rgba(0,35,12,0.7)" />
            <Path d="M0 320 Q60 305 115 312 Q170 318 210 306 Q250 294 295 308 Q340 320 390 308 L390 360 L0 360 Z" fill="rgba(0,25,8,0.9)" />
          </>
        </Svg>
        )}
        {variant === 'tracking' && (
          <Svg
            viewBox={`0 0 ${SVG_VIEW_WIDTH} ${SVG_VIEW_HEIGHT}`}
            style={StyleSheet.absoluteFill}
            preserveAspectRatio="xMidYMid slice">
            {/* Grid */}
            <Line x1={0} y1={70} x2={SVG_VIEW_WIDTH} y2={70} stroke="white" strokeWidth={0.4} opacity={0.04} />
            <Line x1={0} y1={140} x2={SVG_VIEW_WIDTH} y2={140} stroke="white" strokeWidth={0.4} opacity={0.04} />
            <Line x1={0} y1={210} x2={SVG_VIEW_WIDTH} y2={210} stroke="white" strokeWidth={0.4} opacity={0.04} />
            <Line x1={0} y1={280} x2={SVG_VIEW_WIDTH} y2={280} stroke="white" strokeWidth={0.4} opacity={0.04} />
            {/* Journey path (track) */}
            <Path
              d={TRACKING_PATH}
              stroke="rgba(231,211,28,0.18)"
              strokeWidth={2.5}
              strokeDasharray="6 5"
              fill="none"
            />
            <AnimatedPath
              d={TRACKING_PATH}
              stroke={theme.gold}
              strokeWidth={2.2}
              fill="none"
              strokeDasharray={TRACKING_PATH_LENGTH}
              strokeDashoffset={pathOffset}
              strokeLinecap="round"
            />
            {/* Step 1: Referred */}
            <Circle cx={98} cy={240} r={16} fill="rgba(231,211,28,0.12)" stroke={theme.gold} strokeWidth={1.5} />
            <AnimatedCircle cx={98} cy={240} r={7} fill={theme.gold} opacity={dot1Opacity} />
            <SvgText x={98} y={272} textAnchor="middle" fontSize={10} fill="rgba(255,255,255,0.6)">Referred</SvgText>
            {/* Step 2: Funded */}
            <Circle cx={158} cy={100} r={16} fill="rgba(231,211,28,0.12)" stroke={theme.gold} strokeWidth={1.5} />
            <AnimatedCircle cx={158} cy={100} r={7} fill={theme.gold} opacity={dot2Opacity} />
            <SvgText x={158} y={128} textAnchor="middle" fontSize={10} fill="rgba(255,255,255,0.6)">Funded</SvgText>
            {/* 14 MAR pill above Scheduled */}
            <Rect x={256} y={108} width={44} height={42} rx={10} fill="rgba(231,211,28,0.18)" stroke="rgba(231,211,28,0.35)" strokeWidth={1} />
            <SvgText x={278} y={128} textAnchor="middle" fontSize={14} fill={theme.gold} fontWeight="700">14</SvgText>
            <SvgText x={278} y={143} textAnchor="middle" fontSize={9} fill="rgba(255,255,255,0.55)">MAR</SvgText>
            {/* Step 3: Scheduled */}
            <Circle cx={278} cy={180} r={16} fill="rgba(231,211,28,0.12)" stroke={theme.gold} strokeWidth={1.5} />
            <AnimatedCircle cx={278} cy={180} r={7} fill={theme.gold} opacity={dot3Opacity} />
            <SvgText x={278} y={208} textAnchor="middle" fontSize={10} fill="rgba(255,255,255,0.6)">Scheduled</SvgText>
            {/* Step 4: Attended (pending) */}
            <Circle cx={378} cy={120} r={16} fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.2)" strokeWidth={1.5} strokeDasharray="4 3" />
            <SvgText x={378} y={148} textAnchor="middle" fontSize={10} fill="rgba(255,255,255,0.35)">Attended</SvgText>
            {/* Island */}
            <Path d="M0 296 Q45 274 92 283 Q138 292 164 270 Q186 252 208 262 Q232 272 260 255 Q290 238 325 252 Q358 265 390 252 L390 360 L0 360 Z" fill="rgba(0,35,12,0.65)" />
            <Path d="M0 318 Q55 303 108 311 Q162 318 205 305 Q248 292 295 307 Q342 320 390 307 L390 360 L0 360 Z" fill="rgba(0,22,7,0.9)" />
          </Svg>
        )}
      </View>

      {/* Bottom panel - green */}
      <View style={styles.featBottom}>
        <Text style={styles.featHeadline}>
          {content.headline.split('\n')[0]}
          {'\n'}
          <Text style={styles.featHeadlineEm}>{content.headlineEm}</Text>
        </Text>
        <Text style={styles.featSubline}>{content.subline}</Text>
        <View style={styles.featDivider} />
      </View>

      <View style={styles.navBar}>
        {showBack ? (
          <TouchableOpacity style={styles.btnBack} onPress={onBack} activeOpacity={0.85}>
            <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
              <Path
                d="M17 11H5M10 16L5 11L10 6"
                stroke="white"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
        ) : (
          <View style={styles.btnBackPlaceholder} />
        )}
        <View style={styles.dots}>
          {Array.from({ length: totalDots }).map((_, i) => (
            <View key={i} style={[styles.dot, i === dotIndex && styles.dotActive]} />
          ))}
        </View>
        <TouchableOpacity style={styles.btnNext} onPress={onNext} activeOpacity={0.85}>
          <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
            <Path
              d="M5 11H17M12 6L17 11L12 16"
              stroke={theme.green}
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.green,
  },
  illustWrap: {
    flex: 1,
    width: '100%',
    overflow: 'hidden',
    minHeight: 0,
  },
  featBottom: {
    backgroundColor: theme.green,
    paddingVertical: layout.s(26),
    paddingHorizontal: layout.s(32),
    paddingBottom: layout.s(24),
    marginTop: -2,
    gap: layout.s(16),
  },
  featHeadline: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: layout.f(40),
    fontWeight: '700',
    color: theme.white,
    lineHeight: layout.f(44),
    letterSpacing: -0.5,
  },
  featHeadlineEm: {
    fontStyle: 'italic',
    color: theme.gold,
  },
  featSubline: {
    fontSize: layout.f(13.5),
    color: 'rgba(255,255,255,0.5)',
    lineHeight: layout.f(22),
    fontWeight: '400',
  },
  featDivider: {
    width: layout.s(48),
    height: 2,
    backgroundColor: theme.gold,
    borderRadius: 2,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.s(32),
    paddingVertical: layout.s(24),
    paddingBottom: layout.s(32),
    backgroundColor: theme.green,
  },
  btnBack: {
    width: layout.s(52),
    height: layout.s(52),
    borderRadius: layout.s(16),
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.13)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnBackPlaceholder: {
    width: layout.s(52),
    height: layout.s(52),
  },
  dots: {
    flexDirection: 'row',
    gap: layout.s(7),
    alignItems: 'center',
  },
  dot: {
    width: layout.s(7),
    height: layout.s(7),
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  dotActive: {
    width: layout.s(22),
    borderRadius: 4,
    backgroundColor: theme.gold,
  },
  btnNext: {
    width: layout.s(52),
    height: layout.s(52),
    borderRadius: layout.s(16),
    backgroundColor: theme.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
