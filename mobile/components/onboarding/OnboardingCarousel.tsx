import React, { useRef, useState } from 'react';
import { ScrollView, NativeSyntheticEvent, NativeScrollEvent, View, StyleSheet } from 'react-native';
import { layout } from '../../constants/layout';
import { OnboardingSplash } from './OnboardingSplash';
import { OnboardingFeature } from './OnboardingFeature';
import { OnboardingRoleSelect } from './OnboardingRoleSelect';
import { SignUpPanel } from './SignUpPanel';

const SCREEN_WIDTH = layout.width;

type Props = {
  onComplete: () => void;
};

export type SignUpRole = 'sponsor' | 'patient' | 'clinic';

export function OnboardingCarousel({ onComplete }: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);
  const [signUpRole, setSignUpRole] = useState<SignUpRole | null>(null);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const index = Math.round(x / SCREEN_WIDTH);
    if (index !== page) setPage(index);
  };

  const goTo = (index: number) => {
    scrollRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: true });
    setPage(index);
  };

  const handleGetStarted = () => goTo(1);
  const handleSignIn = () => {
    goTo(3);
    // Optionally complete immediately when skipping to sign-in
    // onComplete();
  };

  return (
    <>
    <ScrollView
      ref={scrollRef}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      onMomentumScrollEnd={handleScroll}
      scrollEventThrottle={16}
      bounces={false}
      style={{ flex: 1 }}
      contentContainerStyle={{ width: SCREEN_WIDTH * 4 }}
    >
      <OnboardingSplash onGetStarted={handleGetStarted} onSignIn={handleSignIn} />
      <OnboardingFeature
        variant="sponsors"
        onNext={() => goTo(2)}
        onBack={() => goTo(0)}
        showBack={true}
        dotIndex={0}
        totalDots={3}
      />
      <OnboardingFeature
        variant="tracking"
        onNext={() => goTo(3)}
        onBack={() => goTo(1)}
        showBack={true}
        dotIndex={1}
        totalDots={3}
      />
      <OnboardingRoleSelect
        onSignIn={onComplete}
        onComplete={onComplete}
        onOpenSignUp={setSignUpRole}
        onSelectRole={(_role) => {}}
      />
    </ScrollView>
    <View style={StyleSheet.absoluteFill} pointerEvents={signUpRole ? 'auto' : 'none'}>
      <SignUpPanel
        visible={!!signUpRole}
        role={signUpRole}
        onClose={() => setSignUpRole(null)}
        onComplete={() => {
          setSignUpRole(null);
          onComplete();
        }}
      />
    </View>
    </>
  );
}
