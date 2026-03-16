import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { layout } from '../../constants/layout';
import { IconClock } from './userDesignAIcons';
import { appointments, patients } from './userDesignAMockData';
import { userDesignATheme as c } from './userDesignATheme';

type Props = {
  onOpenAppointmentDetail: (appointmentId: number) => void;
};

export function AppointmentsScreen({ onOpenAppointmentDetail }: Props) {
  const insets = useSafeAreaInsets();
  const upcoming = appointments.filter((a) => a.status === 'Scheduled');
  const past = appointments.filter((a) => a.status === 'Completed');

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

          {upcoming.map((a) => (
            <AppointmentCard key={a.id} appointmentId={a.id} onPress={() => onOpenAppointmentDetail(a.id)} />
          ))}

          <View style={[styles.badgeRow, { marginTop: layout.s(4) }]}>
            <View style={[styles.sectionBadge, { backgroundColor: '#eee' }]}>
              <Text style={[styles.sectionBadgeText, { color: '#666' }]}>Past</Text>
            </View>
          </View>

          {past.map((a) => (
            <AppointmentCard key={a.id} appointmentId={a.id} onPress={() => onOpenAppointmentDetail(a.id)} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function AppointmentCard({ appointmentId, onPress }: { appointmentId: number; onPress: () => void }) {
  const a = appointments.find((x) => x.id === appointmentId) ?? appointments[0];
  const p = patients.find((x) => x.id === a.patientId);
  const isPast = a.status === 'Completed';

  return (
    <TouchableOpacity style={styles.apptCard} activeOpacity={0.9} onPress={onPress}>
      <View style={styles.apptTop}>
        <View style={[styles.dateBlock, isPast && styles.dateBlockPast]}>
          <Text style={[styles.dayNum, isPast && styles.dayNumPast]}>{a.day}</Text>
          <Text style={[styles.monthStr, isPast && styles.monthStrPast]}>{a.month}</Text>
          <Text style={[styles.yearStr, isPast && styles.yearStrPast]}>{a.year}</Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.apptTitle}>{a.title}</Text>
          <Text style={styles.apptClinic}>{a.clinic}</Text>
          <View style={styles.timeRow}>
            <IconClock size={12} color={c.g500} />
            <Text style={styles.apptTime}>{a.time}</Text>
            <View style={{ marginLeft: layout.s(6) }}>
              <StatusPill status={a.status} />
            </View>
          </View>
        </View>
      </View>

      {p ? (
        <View style={styles.apptFooter}>
          <View style={[styles.patientAvatarSm, p.avatarClass === 'green' ? styles.avatarSmGreen : styles.avatarSmYellow]}>
            <Text style={[styles.avatarSmText, p.avatarClass === 'yellow' && styles.avatarSmTextYellow]}>{p.initials}</Text>
          </View>
          <Text style={styles.footerName}>{p.name}</Text>
          <Text style={styles.footerPlan}>{p.plan.replace(' Care Plan', '')}</Text>
        </View>
      ) : null}
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
