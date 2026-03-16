import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../constants/theme';
import { layout } from '../constants/layout';
import { supabase } from '../lib/supabase';

type Props = {
  onSignOut?: () => void;
};

export function HomeScreen({ onSignOut }: Props) {
  const insets = useSafeAreaInsets();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email ?? null);
    });
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    onSignOut?.();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.logo}>Island Echoes Health</Text>
        <TouchableOpacity style={styles.profileBtn} onPress={handleSignOut} activeOpacity={0.85}>
          <Text style={styles.profileBtnText}>Sign out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + layout.s(32) }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.welcomeBlock}>
          <Text style={styles.welcomeLabel}>Welcome back</Text>
          <Text style={styles.welcomeTitle}>
            {userEmail ? (
              <>Welcome back, <Text style={styles.welcomeTitleEm}>{userEmail.split('@')[0]}</Text>.</>
            ) : (
              'Welcome back.'
            )}
          </Text>
          <Text style={styles.welcomeSub}>
            Here’s an overview of your account. This screen is a placeholder for the full home experience.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={[styles.cardIcon, { backgroundColor: 'rgba(231,211,28,0.12)' }]}>
            <Text style={styles.cardIconText}>♥</Text>
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>Your care</Text>
            <Text style={styles.cardDesc}>Care plans and health records will appear here.</Text>
          </View>
          <Text style={styles.cardArrow}>›</Text>
        </View>

        <View style={styles.card}>
          <View style={[styles.cardIcon, { backgroundColor: 'rgba(93,202,165,0.12)' }]}>
            <Text style={[styles.cardIconText, { color: theme.accentTeal }]}>$</Text>
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>Sponsorships</Text>
            <Text style={styles.cardDesc}>Track sponsored care and funding.</Text>
          </View>
          <Text style={styles.cardArrow}>›</Text>
        </View>

        <View style={styles.card}>
          <View style={[styles.cardIcon, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
            <Text style={styles.cardIconText}>📅</Text>
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>Upcoming</Text>
            <Text style={styles.cardDesc}>Appointments and reminders.</Text>
          </View>
          <Text style={styles.cardArrow}>›</Text>
        </View>

        <View style={styles.footerNote}>
          <Text style={styles.footerNoteText}>Dummy home • Replace with real dashboard</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.green,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.s(24),
    paddingVertical: layout.s(16),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  logo: {
    fontFamily: Platform.OS === 'ios' ? 'Playfair Display' : 'serif',
    fontSize: layout.f(18),
    fontWeight: '700',
    color: theme.white,
  },
  profileBtn: {
    paddingVertical: layout.s(8),
    paddingHorizontal: layout.s(14),
    borderRadius: layout.s(10),
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  profileBtnText: {
    fontSize: layout.f(13),
    fontWeight: '600',
    color: theme.gold,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: layout.s(24),
    paddingTop: layout.s(28),
  },
  welcomeBlock: {
    marginBottom: layout.s(28),
  },
  welcomeLabel: {
    fontSize: layout.f(11),
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: theme.gold,
    marginBottom: layout.s(6),
    fontWeight: '500',
  },
  welcomeTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Playfair Display' : 'serif',
    fontSize: layout.f(32),
    fontWeight: '700',
    color: theme.white,
    lineHeight: layout.s(38),
    letterSpacing: -0.5,
  },
  welcomeTitleEm: {
    fontStyle: 'italic',
    color: theme.gold,
  },
  welcomeSub: {
    fontSize: layout.f(14),
    color: 'rgba(255,255,255,0.5)',
    lineHeight: layout.s(22),
    marginTop: layout.s(10),
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: layout.s(20),
    padding: layout.s(18),
    marginBottom: layout.s(12),
  },
  cardIcon: {
    width: layout.s(48),
    height: layout.s(48),
    borderRadius: layout.s(14),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: layout.s(16),
  },
  cardIconText: {
    fontSize: layout.f(22),
    color: theme.gold,
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    fontSize: layout.f(16),
    fontWeight: '600',
    color: theme.white,
    marginBottom: layout.s(2),
  },
  cardDesc: {
    fontSize: layout.f(13),
    color: 'rgba(255,255,255,0.45)',
    lineHeight: layout.s(18),
  },
  cardArrow: {
    fontSize: layout.f(22),
    color: 'rgba(255,255,255,0.25)',
    fontWeight: '300',
  },
  footerNote: {
    marginTop: layout.s(24),
    alignItems: 'center',
  },
  footerNoteText: {
    fontSize: layout.f(12),
    color: 'rgba(255,255,255,0.3)',
  },
});
