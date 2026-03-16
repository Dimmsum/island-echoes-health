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

export function ClinicianHomeScreen({ onSignOut }: Props) {
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
        <View style={styles.headerTitleRow}>
          <View style={styles.clinicianBadge}>
            <Text style={styles.clinicianBadgeText}>CLINICIAN</Text>
          </View>
          <Text style={styles.logo}>Island Echoes Health</Text>
        </View>
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
          <Text style={styles.welcomeLabel}>Clinician portal</Text>
          <Text style={styles.welcomeTitle}>
            {userEmail ? (
              <>Welcome back, <Text style={styles.welcomeTitleEm}>{userEmail.split('@')[0]}</Text>.</>
            ) : (
              'Welcome back.'
            )}
          </Text>
          <Text style={styles.welcomeSub}>
            Manage appointments, patient records, and clinic activity from this dashboard.
          </Text>
        </View>

        <View style={[styles.card, styles.cardTeal]}>
          <View style={[styles.cardIcon, { backgroundColor: 'rgba(93,202,165,0.2)' }]}>
            <Text style={[styles.cardIconText, { color: theme.accentTeal }]}>📅</Text>
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>Appointments</Text>
            <Text style={styles.cardDesc}>View and manage your upcoming appointments.</Text>
          </View>
          <Text style={styles.cardArrow}>›</Text>
        </View>

        <View style={[styles.card, styles.cardTeal]}>
          <View style={[styles.cardIcon, { backgroundColor: 'rgba(93,202,165,0.2)' }]}>
            <Text style={[styles.cardIconText, { color: theme.accentTeal }]}>👥</Text>
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>Patients</Text>
            <Text style={styles.cardDesc}>Access patient records and care plans.</Text>
          </View>
          <Text style={styles.cardArrow}>›</Text>
        </View>

        <View style={[styles.card, styles.cardTeal]}>
          <View style={[styles.cardIcon, { backgroundColor: 'rgba(93,202,165,0.2)' }]}>
            <Text style={[styles.cardIconText, { color: theme.accentTeal }]}>📋</Text>
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>Schedule</Text>
            <Text style={styles.cardDesc}>Manage your availability and calendar.</Text>
          </View>
          <Text style={styles.cardArrow}>›</Text>
        </View>

        <View style={styles.footerNote}>
          <Text style={styles.footerNoteText}>Clinician dashboard • Separate from patient/sponsor view</Text>
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
    borderBottomColor: 'rgba(93,202,165,0.15)',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layout.s(10),
  },
  clinicianBadge: {
    backgroundColor: 'rgba(93,202,165,0.2)',
    paddingVertical: layout.s(4),
    paddingHorizontal: layout.s(10),
    borderRadius: layout.s(8),
  },
  clinicianBadgeText: {
    fontSize: layout.f(10),
    fontWeight: '700',
    letterSpacing: 0.8,
    color: theme.accentTeal,
  },
  logo: {
    fontFamily: Platform.OS === 'ios' ? 'Playfair Display' : 'serif',
    fontSize: layout.f(16),
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
    color: theme.accentTeal,
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
    color: theme.accentTeal,
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
    color: theme.accentTeal,
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
  cardTeal: {
    borderColor: 'rgba(93,202,165,0.15)',
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
    color: 'rgba(93,202,165,0.5)',
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
