import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { layout } from '../../constants/layout';
import { IconCalendar, IconChevronLeft } from './userDesignAIcons';
import { patients } from './userDesignAMockData';
import { userDesignATheme as c } from './userDesignATheme';

type Props = {
  patientId: number;
  onBack: () => void;
};

export function PatientDetailScreen({ patientId, onBack }: Props) {
  const insets = useSafeAreaInsets();
  const p = patients.find((x) => x.id === patientId) ?? patients[0];

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + layout.s(24) }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, { paddingTop: insets.top + layout.s(16) }]}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.85}>
            <IconChevronLeft size={14} color={c.y300} />
            <Text style={styles.backText}>Back to patients</Text>
          </TouchableOpacity>

          <View style={styles.heroRow}>
            <View style={styles.heroAvatar}>
              <Text style={styles.heroAvatarText}>{p.initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroName}>{p.name}</Text>
              <View style={styles.pillsWrap}>
                <Pill kind="green">{p.plan}</Pill>
                <Pill>{p.age} yrs</Pill>
                <Pill kind="yellow">Since {p.since}</Pill>
                <Pill>{p.price}/mo</Pill>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.statsRow}>
            <StatCard value={p.visits} label="Total visits" />
            <StatCard value={p.upcoming} label="Upcoming" />
            <StatCard value={p.metrics} label="Metrics" />
          </View>

          <Text style={styles.sectionH}>Latest vitals</Text>
          <View style={styles.vitalsGrid}>
            <VitalCard label="Blood pressure" value="118" unit="/76" badge="Normal" badgeKind="normal" />
            <VitalCard label="Weight" value="72" unit=" kg" badge="Stable" badgeKind="normal" />
            <VitalCard label="A1C" value="6.8" unit="%" badge="Monitor" badgeKind="warn" />
            <VitalCard label="Med adherence" value="94" unit="%" badge="Excellent" badgeKind="normal" />
          </View>

          <Text style={styles.sectionH}>Recent appointments</Text>
          <View style={[styles.emptyState, { marginBottom: layout.s(14) }]}>
            <View style={styles.emptyIcon}>
              <IconCalendar size={20} color={c.g400} />
            </View>
            <Text style={styles.emptyTitle}>No data yet</Text>
            <Text style={styles.emptySub}>Visit history will appear here once appointments are recorded.</Text>
          </View>

          <TouchableOpacity style={styles.manageBtn} activeOpacity={0.85} onPress={() => {}}>
            <Text style={styles.manageBtnText}>Adjust or cancel sponsorship</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function Pill({
  children,
  kind,
}: {
  children: React.ReactNode;
  kind?: 'green' | 'yellow';
}) {
  return (
    <View
      style={[
        styles.metaPill,
        kind === 'green' && styles.metaPillGreen,
        kind === 'yellow' && styles.metaPillYellow,
      ]}
    >
      <Text style={styles.metaPillText}>{children}</Text>
    </View>
  );
}

function StatCard({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statNum}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function VitalCard({
  label,
  value,
  unit,
  badge,
  badgeKind,
}: {
  label: string;
  value: string;
  unit: string;
  badge: string;
  badgeKind: 'normal' | 'warn';
}) {
  return (
    <View style={styles.vitalCard}>
      <Text style={styles.vitalLabel}>{label}</Text>
      <Text style={styles.vitalVal}>
        {value}
        <Text style={styles.vitalUnit}>{unit}</Text>
      </Text>
      <View style={[styles.vitalBadge, badgeKind === 'normal' ? styles.vitalBadgeNormal : styles.vitalBadgeWarn]}>
        <Text style={[styles.vitalBadgeText, badgeKind === 'normal' ? styles.vitalBadgeTextNormal : styles.vitalBadgeTextWarn]}>
          {badge}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.off },
  scroll: { flex: 1 },
  header: {
    backgroundColor: c.g900,
    paddingHorizontal: layout.s(24),
    paddingBottom: layout.s(28),
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layout.s(6),
    marginBottom: layout.s(14),
  },
  backText: {
    color: c.y300,
    fontSize: layout.f(12.5),
    fontWeight: '500',
  },
  heroRow: {
    flexDirection: 'row',
    gap: layout.s(14),
    alignItems: 'flex-start',
  },
  heroAvatar: {
    width: layout.s(60),
    height: layout.s(60),
    borderRadius: layout.s(30),
    backgroundColor: c.y500,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.12)',
    flexShrink: 0,
  },
  heroAvatarText: {
    fontWeight: '700',
    fontSize: layout.f(20),
    color: c.y900,
  },
  heroName: {
    fontFamily: Platform.OS === 'ios' ? 'Playfair Display' : 'serif',
    color: c.white,
    fontSize: layout.f(20),
    fontWeight: '600',
    marginBottom: layout.s(7),
  },
  pillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: layout.s(6),
  },
  metaPill: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: layout.s(20),
    paddingHorizontal: layout.s(8),
    paddingVertical: layout.s(3),
  },
  metaPillGreen: {
    backgroundColor: 'rgba(93,184,122,0.2)',
  },
  metaPillYellow: {
    backgroundColor: 'rgba(245,184,0,0.15)',
  },
  metaPillText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: layout.f(10.5),
  },
  content: {
    paddingHorizontal: layout.s(20),
    paddingTop: layout.s(16),
  },
  statsRow: {
    flexDirection: 'row',
    gap: layout.s(10),
    marginBottom: layout.s(18),
  },
  statCard: {
    flex: 1,
    backgroundColor: c.white,
    borderRadius: layout.s(10),
    paddingVertical: layout.s(12),
    paddingHorizontal: layout.s(12),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  statNum: {
    fontSize: layout.f(22),
    fontWeight: '600',
    color: c.g700,
    marginBottom: layout.s(2),
  },
  statLabel: {
    fontSize: layout.f(10),
    color: c.text3,
    fontWeight: '500',
  },
  sectionH: {
    fontFamily: Platform.OS === 'ios' ? 'Playfair Display' : 'serif',
    fontSize: layout.f(14),
    fontWeight: '600',
    color: c.text1,
    marginBottom: layout.s(12),
  },
  vitalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: layout.s(10),
    marginBottom: layout.s(18),
  },
  vitalCard: {
    width: '48.5%',
    backgroundColor: c.white,
    borderRadius: layout.s(10),
    paddingVertical: layout.s(12),
    paddingHorizontal: layout.s(12),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  vitalLabel: {
    fontSize: layout.f(10),
    color: c.text3,
    fontWeight: '500',
    marginBottom: layout.s(4),
  },
  vitalVal: {
    fontSize: layout.f(17),
    fontWeight: '600',
    color: c.g700,
  },
  vitalUnit: {
    fontSize: layout.f(11),
    color: c.text3,
  },
  vitalBadge: {
    alignSelf: 'flex-start',
    marginTop: layout.s(4),
    borderRadius: layout.s(10),
    paddingHorizontal: layout.s(6),
    paddingVertical: layout.s(2),
  },
  vitalBadgeNormal: { backgroundColor: c.g50 },
  vitalBadgeWarn: { backgroundColor: c.y50 },
  vitalBadgeText: {
    fontSize: layout.f(9),
    fontWeight: '600',
  },
  vitalBadgeTextNormal: { color: c.g700 },
  vitalBadgeTextWarn: { color: c.y800 },
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
  manageBtn: {
    width: '100%',
    borderWidth: 2,
    borderColor: c.g400,
    borderRadius: layout.s(10),
    paddingVertical: layout.s(13),
    paddingHorizontal: layout.s(12),
    backgroundColor: 'transparent',
  },
  manageBtnText: {
    fontSize: layout.f(13.5),
    fontWeight: '600',
    color: c.g600,
    textAlign: 'center',
  },
});
