import React from 'react';
import { useColorScheme, View } from 'react-native';
import { LogoIcon } from './LogoIcon';

const LIGHT_BG = '#FFFFFF';
const DARK_BG = '#121212';

export function LoadingScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const backgroundColor = isDark ? DARK_BG : LIGHT_BG;

  return (
    <View
      className="flex-1 items-center justify-center"
      style={{ backgroundColor }}
    >
      <LogoIcon width={160} height={160} />
    </View>
  );
}
