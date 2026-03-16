import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { theme } from '../../constants/theme';
import { layout } from '../../constants/layout';

const SCREEN_WIDTH = layout.width;

type Props = {
  onSignIn: () => void;
  onComplete: () => void;
  onOpenSignUp?: (role: 'sponsor' | 'patient' | 'clinic') => void;
  onSelectRole?: (role: 'sponsor' | 'patient' | 'clinic') => void;
};

const ROLES = [
  {
    key: 'sponsor' as const,
    label: "I'm a Sponsor",
    desc: 'Fund patient care and track your health impact.',
    iconBg: 'rgba(231,211,28,0.12)',
    Icon: () => (
      <Svg width={26} height={26} viewBox="0 0 26 26" fill="none">
        <Circle cx="13" cy="9" r="5.5" fill="rgba(231,211,28,0.8)" />
        <Path d="M4 22C4 17.6 8.0 14 13 14C18 14 22 17.6 22 22" stroke="rgba(231,211,28,0.8)" strokeWidth={2} strokeLinecap="round" fill="none" />
        <Path d="M18 6L20 8L24 4" stroke={theme.gold} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    ),
  },
  {
    key: 'patient' as const,
    label: "I'm a Patient",
    desc: 'Access sponsored care and track your health journey.',
    iconBg: 'rgba(255,255,255,0.07)',
    Icon: () => (
      <Svg width={26} height={26} viewBox="0 0 26 26" fill="none">
        <Circle cx="13" cy="9" r="5.5" fill="rgba(255,255,255,0.55)" />
        <Path d="M4 22C4 17.6 8.0 14 13 14C18 14 22 17.6 22 22" stroke="rgba(255,255,255,0.55)" strokeWidth={2} strokeLinecap="round" fill="none" />
        <Rect x="10" y="15" width="6" height="2" rx={1} fill="rgba(255,255,255,0.7)" />
        <Rect x="12" y="13" width="2" height="6" rx={1} fill="rgba(255,255,255,0.7)" />
      </Svg>
    ),
  },
  {
    key: 'clinic' as const,
    label: 'I\'m a Clinician',
    desc: 'Manage referrals, records and sponsored treatments.',
    iconBg: 'rgba(93,202,165,0.1)',
    Icon: () => (
      <Svg width={26} height={26} viewBox="0 0 26 26" fill="none">
        <Rect x="4" y="11" width="18" height="13" rx={2} stroke="rgba(93,202,165,0.8)" strokeWidth={1.6} fill="none" />
        <Path d="M8 11V8C8 6.3 9.3 5 11 5H15C16.7 5 18 6.3 18 8V11" stroke="rgba(93,202,165,0.8)" strokeWidth={1.6} fill="none" />
        <Rect x="11" y="15" width="4" height="1.5" rx={0.75} fill="rgba(93,202,165,0.8)" />
        <Rect x="12.25" y="13.75" width="1.5" height="4" rx={0.75} fill="rgba(93,202,165,0.8)" />
      </Svg>
    ),
  },
];

export function OnboardingRoleSelect({ onSignIn, onComplete, onOpenSignUp, onSelectRole }: Props) {
  const [selected, setSelected] = useState<'sponsor' | 'patient' | 'clinic' | null>(null);

  const handleSelect = (key: 'sponsor' | 'patient' | 'clinic') => {
    setSelected(key);
    onSelectRole?.(key);
  };

  return (
    <View style={[styles.screen, { width: SCREEN_WIDTH }]}>
      {/* Illustration - top */}
      <View style={styles.illustWrap}>
        <Svg viewBox="0 0 390 200" style={StyleSheet.absoluteFill} preserveAspectRatio="xMidYMid slice">
          <Circle cx={195} cy={110} r={40} stroke="rgba(231,211,28,0.12)" strokeWidth={1} fill="none" />
          <Circle cx={195} cy={110} r={70} stroke="rgba(231,211,28,0.08)" strokeWidth={1} fill="none" />
          <Circle cx={195} cy={110} r={100} stroke="rgba(231,211,28,0.05)" strokeWidth={1} fill="none" />

          <Circle cx={90} cy={100} r={28} fill="rgba(231,211,28,0.1)" stroke="rgba(231,211,28,0.25)" strokeWidth={1.2} />
          <Circle cx={90} cy={93} r={9} fill="rgba(231,211,28,0.7)" />
          <Path d="M74 114C74 106 81.3 100 90 100C98.7 100 106 106 106 114" stroke="rgba(231,211,28,0.7)" strokeWidth={2} strokeLinecap="round" fill="none" />
          <Path d="M100 86L103 89L108 84" stroke={theme.gold} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />

          <Circle cx={195} cy={100} r={28} fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.2)" strokeWidth={1.2} />
          <Circle cx={195} cy={93} r={9} fill="rgba(255,255,255,0.55)" />
          <Path d="M179 114C179 106 186.3 100 195 100C203.7 100 211 106 211 114" stroke="rgba(255,255,255,0.55)" strokeWidth={2} strokeLinecap="round" fill="none" />
          <Rect x={191} y={105} width={8} height={2} rx={1} fill="white" opacity={0.6} />
          <Rect x={194} y={102} width={2} height={8} rx={1} fill="white" opacity={0.6} />

          <Circle cx={300} cy={100} r={28} fill="rgba(93,202,165,0.1)" stroke="rgba(93,202,165,0.25)" strokeWidth={1.2} />
          <Rect x={290} y={93} width={20} height={16} rx={2} stroke="rgba(93,202,165,0.7)" strokeWidth={1.5} fill="none" />
          <Path d="M293 93V90C293 88 294.3 87 296 87H304C305.7 87 307 88 307 90V93" stroke="rgba(93,202,165,0.7)" strokeWidth={1.5} fill="none" />
          <Rect x={297} y={97} width={6} height={2} rx={1} fill="rgba(93,202,165,0.7)" />
          <Rect x={299} y={95} width={2} height={6} rx={1} fill="rgba(93,202,165,0.7)" />

          <Path d="M118 100 Q152 80 167 100" stroke="rgba(231,211,28,0.2)" strokeWidth={1} fill="none" strokeDasharray="4 3" />
          <Path d="M223 100 Q248 80 272 100" stroke="rgba(93,202,165,0.2)" strokeWidth={1} fill="none" strokeDasharray="4 3" />
        </Svg>
      </View>

      {/* Text block */}
      <View style={styles.textBlock}>
        <Text style={styles.headline}>
          Who are{'\n'}
          <Text style={styles.headlineEm}>you?</Text>
        </Text>
        <Text style={styles.subline}>Choose your role to get started with Island Echoes Health.</Text>
      </View>

      {/* Role cards */}
      <View style={styles.cardsWrap}>
        {ROLES.map(({ key, label, desc, iconBg, Icon }) => (
          <TouchableOpacity
            key={key}
            style={[styles.roleCard, selected === key && styles.roleCardSelected]}
            onPress={() => handleSelect(key)}
            activeOpacity={0.9}
          >
            <View style={[styles.roleIcon, { backgroundColor: iconBg }]}>
              <Icon />
            </View>
            <View style={styles.roleTextWrap}>
              <Text style={styles.roleLabel}>{label}</Text>
              <Text style={styles.roleDesc}>{desc}</Text>
            </View>
            <Text style={[styles.roleArrow, selected === key && styles.roleArrowSelected]}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Bottom */}
      <View style={styles.bottomWrap}>
        <TouchableOpacity
          style={[styles.continueBtn, !selected && styles.continueBtnDisabled]}
          onPress={() => (selected ? (onOpenSignUp ? onOpenSignUp(selected) : onComplete()) : undefined)}
          activeOpacity={0.85}
          disabled={!selected}
        >
          <Text style={[styles.continueBtnText, !selected && styles.continueBtnTextDisabled]}>Continue →</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.signInWrap} onPress={onSignIn} activeOpacity={0.7}>
          <Text style={styles.signInText}>
            Already have an account? <Text style={styles.signInLink}>Sign in</Text>
          </Text>
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
    height: layout.pctH(0.24),
    minHeight: 160,
    width: '100%',
    overflow: 'hidden',
    marginTop: layout.s(32),
  },
  textBlock: {
    paddingHorizontal: layout.s(32),
    paddingBottom: layout.s(20),
    gap: layout.s(8),
  },
  headline: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: layout.f(36),
    fontWeight: '700',
    color: theme.white,
    lineHeight: layout.f(40),
    letterSpacing: -0.5,
  },
  headlineEm: {
    fontStyle: 'italic',
    color: theme.gold,
  },
  subline: {
    fontSize: layout.f(14),
    color: 'rgba(255,255,255,0.9)',
    lineHeight: layout.f(22),
  },
  cardsWrap: {
    flex: 1,
    paddingHorizontal: layout.s(32),
    gap: layout.s(10),
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layout.s(16),
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.11)',
    borderRadius: layout.s(22),
    paddingVertical: layout.s(18),
    paddingHorizontal: layout.s(20),
  },
  roleCardSelected: {
    borderColor: theme.gold,
    backgroundColor: 'rgba(231,211,28,0.07)',
  },
  roleIcon: {
    width: layout.s(50),
    height: layout.s(50),
    borderRadius: layout.s(15),
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleTextWrap: {
    flex: 1,
  },
  roleLabel: {
    fontSize: layout.f(15),
    fontWeight: '600',
    color: theme.white,
    marginBottom: layout.s(3),
  },
  roleDesc: {
    fontSize: layout.f(13),
    color: 'rgba(255,255,255,0.8)',
    lineHeight: layout.f(20),
  },
  roleArrow: {
    fontSize: layout.f(20),
    color: 'rgba(255,255,255,0.3)',
    fontWeight: '300',
  },
  roleArrowSelected: {
    color: theme.gold,
  },
  bottomWrap: {
    paddingHorizontal: layout.s(32),
    paddingTop: layout.s(16),
    paddingBottom: layout.s(32),
    gap: layout.s(12),
  },
  continueBtn: {
    width: '100%',
    height: layout.s(56),
    backgroundColor: theme.gold,
    borderRadius: layout.s(18),
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtnText: {
    fontSize: layout.f(16),
    fontWeight: '600',
    color: theme.green,
    letterSpacing: 0.5,
  },
  continueBtnDisabled: {
    opacity: 0.4,
  },
  continueBtnTextDisabled: {
    color: 'rgba(0,59,19,0.6)',
  },
  signInWrap: {
    alignItems: 'center',
    paddingVertical: layout.s(4),
  },
  signInText: {
    fontSize: layout.f(12.5),
    color: 'rgba(255,255,255,0.3)',
  },
  signInLink: {
    color: theme.gold,
    fontWeight: '500',
  },
});
