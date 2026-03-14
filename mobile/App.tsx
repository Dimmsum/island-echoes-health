import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScreenContent } from 'components/ScreenContent';
import { LoadingScreen } from 'components/LoadingScreen';
import { OnboardingCarousel } from 'components/onboarding/OnboardingCarousel';
import { StatusBar } from 'expo-status-bar';

import './global.css';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const LOADING_MIN_MS = 1500;
const FADE_OUT_MS = 500;
const ONBOARDING_KEY = '@island_echoes_onboarding_done';

export default function App() {
  const [phase, setPhase] = useState<'visible' | 'fading' | 'done'>('visible');
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((v) => {
      setOnboardingDone(v === '1');
    });
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setPhase('fading'), LOADING_MIN_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (phase !== 'fading') return;
    Animated.timing(opacity, {
      toValue: 0,
      duration: FADE_OUT_MS,
      useNativeDriver: true,
    }).start(() => setPhase('done'));
  }, [phase, opacity]);

  const handleOnboardingComplete = () => {
    AsyncStorage.setItem(ONBOARDING_KEY, '1');
    setOnboardingDone(true);
  };

  const showOnboarding = phase === 'done' && onboardingDone !== true;
  const showHome = phase === 'done' && onboardingDone === true;

  return (
    <SafeAreaProvider>
      <View style={StyleSheet.absoluteFill}>
        {phase !== 'done' && (
          <Animated.View style={[StyleSheet.absoluteFill, { opacity }]} pointerEvents={phase === 'fading' ? 'none' : 'auto'}>
            <LoadingScreen />
          </Animated.View>
        )}
        {showOnboarding && (
          <OnboardingCarousel onComplete={handleOnboardingComplete} />
        )}
        {showHome && (
          <ScreenContent title="Home" path="App.tsx" />
        )}
      </View>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}
