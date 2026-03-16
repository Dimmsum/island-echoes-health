import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { layout } from '../../constants/layout';
import { IconClock } from './userDesignAIcons';
import { userDesignATheme as c } from './userDesignATheme';
import { useUserHomeData } from '../../lib/userHome';

type Props = {
  onOpenAppointmentDetail: (appointmentId: string) => void;
};

export function AppointmentsScreen({ onOpenAppointmentDetail }: Props) {
  const insets = useSafeAreaInsets();
  const home = useUserHomeData();
  const all = home.status === 'loaded' ? home.data.upcomingAppointments : [];
  const upcoming = all.filter((a) => a.status === 'scheduled');
  const past: typeof all = []; // TODO: wire past visits API when available

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + layout.s(24) }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, { paddingTop: insets.top + layout.s(16) }]}>
          <Text style={styles.shLabel}>Your visits</Text>
          <Text style={styles.shTitle}>Appointments</Text>
          <Text style={styles.shPara}>See upcoming and past visits across your care plans.</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.badgeRow}>
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionBadgeText}>Upcoming</Text>
            </View>
          </View>

          {home.status === 'loading' && (
            <Text style={styles.loadingText}>Loading your appointments…</Text>
          )}
          {home.status === 'error' && (
            <Text style={styles.errorText}>{home.error}</Text>
          )}
          {home.status === 'loaded' && upcoming.length === 0 && (
            <Text style={styles.emptyText}>No upcoming appointments found.</Text>
          )}

          {upcoming.map((a) => (
            <AppointmentCard key={a.id} appointment={a} onPress={() => onOpenAppointmentDetail(a.id)} />
          ))}

          <View style={[styles.badgeRow, { marginTop: layout.s(4) }]}>
            <View style={[styles.sectionBadge, { backgroundColor: '#eee' }]}>
              <Text style={[styles.sectionBadgeText, { color: '#666' }]}>Past</Text>
            </View>
          </View>

          {past.map((a) => (
            <AppointmentCard key={a.id} appointment={a} onPress={() => onOpenAppointmentDetail(a.id)} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

type CardProps = {
  appointment: {
    id: string;
    scheduled_at: string;
    status: string;
    clinician_name: string | null;
    patient_name: string | null;
  };
  onPress: () => void;
};

function AppointmentCard({ appointment, onPress }: CardProps) {
  const a = appointment;
  const isPast = a.status === 'completed';
  const date = new Date(a.scheduled_at);
  const day = String(date.getDate()).padStart(2, '0');
  const month = date.toLocaleString('en-US', { month: 'short' });
  const year = String(date.getFullYear());
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const title = a.clinician_name ? 'Visit with ' + a.clinician_name : 'Scheduled visit';
  const clinic = a.patient_name ? a.patient_name : 'Your care plan';

  return (
    <TouchableOpacity style={styles.apptCard} activeOpacity={0.9} onPress={onPress}>
      <View style={styles.apptTop}>
        <View style={[styles.dateBlock, isPast && styles.dateBlockPast]}>
          <Text style={[styles.dayNum, isPast && styles.dayNumPast]}>{day}</Text>
          <Text style={[styles.monthStr, isPast && styles.monthStrPast]}>{month}</Text>
          <Text style={[styles.yearStr, isPast && styles.yearStrPast]}>{year}</Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.apptTitle}>{title}</Text>
          <Text style={styles.apptClinic}>{clinic}</Text>
          <View style={styles.timeRow}>
            <IconClock size={12} color={c.g500} />
            <Text style={styles.apptTime}>{time}</Text>
            <View style={{ marginLeft: layout.s(6) }}>
              <StatusPill status={a.status} />
            </View>
          </View>
        </View>
      </View>

      {/* In this first pass we omit footer sponsor details; can be added when API exposes them */}
    </TouchableOpacity>
  );
}

function StatusPill({ status }: { status: 'Scheduled' | 'Completed' }) {
  const scheduled = status === 'Scheduled';
  return (
    <View style={[styles.statusPill, scheduled ? styles.statusScheduled : styles.statusCompleted]}>
      <Text style={[styles.statusText, scheduled ? styles.statusTextScheduled : styles.statusTextCompleted]}>{status}</Text>
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
  shLabel: {
    fontSize: layout.f(11),
    fontWeight: '500',
    color: c.y400,
    letterSpacing: 0.5,
    marginBottom: layout.s(6),
  },
  shTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Playfair Display' : 'serif',
    color: c.white,
    fontSize: layout.f(22),
    fontWeight: '600',
    marginBottom: layout.s(8),
  },
  shPara: {
    fontSize: layout.f(12),
    color: 'rgba(255,255,255,0.5)',
    lineHeight: layout.f(12 * 1.6),
  },
  content: {
    paddingHorizontal: layout.s(20),
    paddingTop: layout.s(16),
  },
  badgeRow: {
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
  apptCard: {
    backgroundColor: c.white,
    borderRadius: layout.s(18),
    marginBottom: layout.s(12),
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.04)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  apptTop: {
    paddingHorizontal: layout.s(16),
    paddingTop: layout.s(14),
    paddingBottom: layout.s(12),
    flexDirection: 'row',
    gap: layout.s(12),
    alignItems: 'flex-start',
  },
  dateBlock: {
    backgroundColor: c.g900,
    borderRadius: layout.s(12),
    paddingHorizontal: layout.s(10),
    paddingVertical: layout.s(8),
    alignItems: 'center',
    minWidth: layout.s(46),
  },
  dateBlockPast: {
    backgroundColor: '#e8e8e8',
  },
  dayNum: {
    fontSize: layout.f(18),
    fontWeight: '700',
    color: c.white,
    lineHeight: layout.f(18),
  },
  dayNumPast: { color: '#888' },
  monthStr: {
    fontSize: layout.f(9),
    fontWeight: '700',
    color: c.y400,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: layout.s(2),
  },
  monthStrPast: { color: '#aaa' },
  yearStr: {
    fontSize: layout.f(9),
    color: 'rgba(255,255,255,0.4)',
  },
  yearStrPast: { color: '#bbb' },
  apptTitle: {
    fontSize: layout.f(13.5),
    fontWeight: '600',
    color: c.text1,
    marginBottom: layout.s(4),
    lineHeight: layout.f(13.5 * 1.3),
  },
  apptClinic: {
    fontSize: layout.f(11.5),
    color: c.text3,
    marginBottom: layout.s(6),
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layout.s(5),
  },
  apptTime: {
    fontSize: layout.f(11),
    fontWeight: '600',
    color: c.g600,
  },
  statusPill: {
    borderRadius: layout.s(20),
    paddingHorizontal: layout.s(8),
    paddingVertical: layout.s(3),
  },
  statusScheduled: { backgroundColor: c.g50 },
  statusCompleted: { backgroundColor: '#f0f0f0' },
  statusText: {
    fontSize: layout.f(9.5),
    fontWeight: '600',
  },
  statusTextScheduled: { color: c.g700 },
  statusTextCompleted: { color: '#666' },
  apptFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: layout.s(16),
    paddingVertical: layout.s(10),
    flexDirection: 'row',
    alignItems: 'center',
    gap: layout.s(8),
    backgroundColor: 'rgba(0,0,0,0.012)',
  },
  patientAvatarSm: {
    width: layout.s(26),
    height: layout.s(26),
    borderRadius: layout.s(13),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  avatarSmGreen: { backgroundColor: c.g600 },
  avatarSmYellow: { backgroundColor: c.y500 },
  avatarSmText: { fontSize: layout.f(10), fontWeight: '700', color: c.white },
  avatarSmTextYellow: { color: c.y900 },
  footerName: {
    fontSize: layout.f(11.5),
    fontWeight: '500',
    color: c.text2,
    flex: 1,
  },
  footerPlan: {
    fontSize: layout.f(10.5),
    color: c.text3,
  },
});
