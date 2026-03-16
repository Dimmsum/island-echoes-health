import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { ClinicianHomeScreen } from './ClinicianHomeScreen';
import { UserTabsNavigator } from './user/UserTabsNavigator';
import { getCurrentUserRole } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { theme } from '../constants/theme';

type Props = {
  onSignOut: () => void;
};

export function HomeRouter({ onSignOut }: Props) {
  const [role, setRole] = useState<'user' | 'clinician' | 'admin' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!session) {
        onSignOut();
        setLoading(false);
        return;
      }
      const userRole = await getCurrentUserRole();
      if (cancelled) return;
      setRole(userRole);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [onSignOut]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={theme.gold} />
      </View>
    );
  }

  if (role === 'clinician' || role === 'admin') {
    return <ClinicianHomeScreen onSignOut={onSignOut} />;
  }

  return <UserTabsNavigator onSignOut={onSignOut} />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: theme.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
