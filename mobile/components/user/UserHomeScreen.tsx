import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { layout } from '../../constants/layout';
import { userDesignATheme as c } from './userDesignATheme';
import { IconCalendar, IconChevronRight, IconUsers } from './userDesignAIcons';
import { useUserHomeData } from '../../lib/userHome';
import { useMe } from '../../lib/me';

type Props = {
  onNavigatePatients: () => void;
  onNavigateAppointments: () => void;
  onNavigatePayments: () => void;
};

export function UserHomeScreen({ onNavigatePatients, onNavigateAppointments, onNavigatePayments }: Props) {
  const insets = useSafeAreaInsets();
  const home = useUserHomeData();
  const me = useMe();
  const upcoming = home.status === 'loaded' ? home.data.upcomingAppointments.slice(0, 1) : [];
  const firstName =
    me.status === 'loaded'
      ? ((me.data.profile?.full_name || me.data.user.email || '').split(' ')[0] || 'there')
      : 'there';

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + layout.s(24) }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, { paddingTop: insets.top + layout.s(16) }]}>
          <Text style={styles.heroTitle}>
            Welcome back,{'\n'}
            {firstName}.
          </Text>
          <Text style={styles.heroSub}>
            Stay connected with your care team and keep track of everyone&apos;s health journey in one place.
          </Text>
          <View pointerEvents="none" style={styles.headerCircleLg} />
          <View pointerEvents="none" style={styles.headerCircleSm} />
        </View>

        <View style={styles.content}>
          <TouchableOpacity style={styles.quickCard} activeOpacity={0.85} onPress={onNavigatePatients}>
            <View style={[styles.qcIcon, { backgroundColor: c.g50 }]}>
              <IconUsers size={20} color={c.g500} />
            </View>
            <View style={styles.qcText}>
              <Text style={styles.qcTitle}>Linked patients</Text>
              <Text style={styles.qcSub}>See the people and plans you support.</Text>
            </View>
            <IconChevronRight size={16} color={c.g200} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickCard, { marginBottom: layout.s(20) }]}
            activeOpacity={0.85}
            onPress={onNavigateAppointments}
          >
            <View style={[styles.qcIcon, { backgroundColor: c.y50 }]}>
              <IconCalendar size={20} color={c.y600} />
            </View>
            <View style={styles.qcText}>
              <Text style={styles.qcTitle}>Appointments</Text>
              <Text style={styles.qcSub}>Check upcoming and past visits.</Text>
            </View>
            <IconChevronRight size={16} color={c.g200} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.sponsorCard} activeOpacity={0.9} onPress={onNavigatePayments}>
            <View pointerEvents="none" style={styles.sponsorCircle} />
            <Text style={styles.scLabel}>Support someone</Text>
            <Text style={styles.scTitle}>Sponsor a care plan</Text>
            <Text style={styles.scSub}>Start or manage monthly payments for someone you care about.</Text>
            <View style={styles.scBtn}>
              <Text style={styles.scBtnText}>Get started →</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.sectionRow}>
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionBadgeText}>Upcoming</Text>
            </View>
            <Text style={styles.sectionTitle}>Appointments</Text>
          </View>

          {home.status === 'loading' && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Loading your appointments…</Text>
            </View>
          )}
          {home.status === 'error' && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Unable to load appointments</Text>
              <Text style={styles.emptySub}>{home.error}</Text>
            </View>
          )}
          {home.status === 'loaded' && upcoming.length === 0 && (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <IconCalendar size={22} color={c.g400} />
              </View>
              <Text style={styles.emptyTitle}>No upcoming appointments</Text>
              <Text style={styles.emptySub}>
                Appointments for patients you sponsor will appear here once scheduled.
              </Text>
            </View>
          )}
          {home.status === 'loaded' && upcoming.length > 0 && (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <IconCalendar size={22} color={c.g400} />
              </View>
              <Text style={styles.emptyTitle}>Next appointment</Text>
              <Text style={styles.emptySub}>
                {new Date(upcoming[0].scheduled_at).toLocaleString()}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: c.off,
  },
  scroll: {
    flex: 1,
  },
  header: {
    backgroundColor: c.g900,
    paddingHorizontal: layout.s(24),
    paddingBottom: layout.s(32),
    overflow: 'hidden',
  },
  headerCircleLg: {
    position: 'absolute',
    right: -layout.s(40),
    top: -layout.s(40),
    width: layout.s(180),
    height: layout.s(180),
    borderRadius: layout.s(90),
    backgroundColor: 'rgba(245,184,0,0.07)',
  },
  headerCircleSm: {
    position: 'absolute',
    right: layout.s(20),
    top: layout.s(20),
    width: layout.s(80),
    height: layout.s(80),
    borderRadius: layout.s(40),
    backgroundColor: 'rgba(245,184,0,0.05)',
  },
  brandTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Playfair Display' : 'serif',
    color: c.y400,
    fontSize: layout.f(13),
    fontWeight: '500',
    letterSpacing: 0.5,
    marginBottom: layout.s(18),
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(245,184,0,0.15)',
    paddingHorizontal: layout.s(10),
    paddingVertical: layout.s(4),
    borderRadius: layout.s(20),
    marginBottom: layout.s(10),
  },
  heroBadgeText: {
    color: c.y300,
    fontSize: layout.f(11),
    fontWeight: '500',
  },
  heroTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Playfair Display' : 'serif',
    color: c.white,
    fontSize: layout.f(26),
    fontWeight: '600',
    lineHeight: layout.f(26 * 1.25),
    marginBottom: layout.s(8),
  },
  heroSub: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: layout.f(12.5),
    lineHeight: layout.f(12.5 * 1.6),
    maxWidth: layout.s(280),
  },
  content: {
    paddingHorizontal: layout.s(20),
    paddingTop: layout.s(16),
  },
  quickCard: {
    backgroundColor: c.white,
    borderRadius: layout.s(16),
    paddingVertical: layout.s(16),
    paddingHorizontal: layout.s(18),
    flexDirection: 'row',
    alignItems: 'center',
    gap: layout.s(14),
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.04)',
    marginBottom: layout.s(12),
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  qcIcon: {
    width: layout.s(42),
    height: layout.s(42),
    borderRadius: layout.s(12),
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  qcText: {
    flex: 1,
  },
  qcTitle: {
    fontSize: layout.f(14),
    fontWeight: '600',
    color: c.text1,
    marginBottom: layout.s(3),
  },
  qcSub: {
    fontSize: layout.f(11.5),
    color: c.text3,
    lineHeight: layout.f(11.5 * 1.4),
  },
  sponsorCard: {
    borderRadius: layout.s(16),
    paddingVertical: layout.s(18),
    paddingHorizontal: layout.s(20),
    marginBottom: layout.s(24),
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.07)',
    backgroundColor: c.g600,
  },
  sponsorCircle: {
    position: 'absolute',
    right: -layout.s(20),
    top: -layout.s(20),
    width: layout.s(100),
    height: layout.s(100),
    borderRadius: layout.s(50),
    backgroundColor: 'rgba(245,184,0,0.1)',
  },
  scLabel: {
    fontSize: layout.f(10),
    fontWeight: '600',
    color: c.y300,
    letterSpacing: 0.5,
    marginBottom: layout.s(5),
  },
  scTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Playfair Display' : 'serif',
    color: c.white,
    fontSize: layout.f(18),
    fontWeight: '600',
    marginBottom: layout.s(5),
  },
  scSub: {
    fontSize: layout.f(12),
    color: 'rgba(255,255,255,0.55)',
    lineHeight: layout.f(12 * 1.5),
    maxWidth: layout.s(220),
  },
  scBtn: {
    alignSelf: 'flex-start',
    marginTop: layout.s(12),
    backgroundColor: c.y400,
    paddingHorizontal: layout.s(14),
    paddingVertical: layout.s(7),
    borderRadius: layout.s(8),
  },
  scBtnText: {
    fontSize: layout.f(12),
    fontWeight: '600',
    color: c.y900,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layout.s(8),
    marginBottom: layout.s(14),
  },
  sectionBadge: {
    backgroundColor: c.y100,
    paddingHorizontal: layout.s(8),
    paddingVertical: layout.s(3),
    borderRadius: layout.s(20),
  },
  sectionBadgeText: {
    color: c.y900,
    fontSize: layout.f(10),
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: layout.f(16),
    fontWeight: '600',
    color: c.text1,
    fontFamily: Platform.OS === 'ios' ? 'Playfair Display' : 'serif',
  },
  emptyState: {
    backgroundColor: c.white,
    borderRadius: layout.s(16),
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(0,0,0,0.08)',
    paddingVertical: layout.s(28),
    paddingHorizontal: layout.s(20),
    alignItems: 'center',
  },
  emptyIcon: {
    width: layout.s(48),
    height: layout.s(48),
    borderRadius: layout.s(24),
    backgroundColor: c.g50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: layout.s(10),
  },
  emptyTitle: {
    fontSize: layout.f(13.5),
    fontWeight: '600',
    color: c.text1,
    marginBottom: layout.s(5),
    textAlign: 'center',
  },
  emptySub: {
    fontSize: layout.f(11.5),
    color: c.text3,
    lineHeight: layout.f(11.5 * 1.5),
    textAlign: 'center',
  },
});

