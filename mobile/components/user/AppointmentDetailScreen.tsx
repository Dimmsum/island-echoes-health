import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { layout } from '../../constants/layout';
import { IconChevronLeft, IconDoc } from './userDesignAIcons';
import { appointments, patients } from './userDesignAMockData';
import { userDesignATheme as c } from './userDesignATheme';

type Props = {
  appointmentId: number;
  onBack: () => void;
};

export function AppointmentDetailScreen({ appointmentId, onBack }: Props) {
  const insets = useSafeAreaInsets();
  const a = appointments.find((x) => x.id === appointmentId) ?? appointments[0];
  const p = patients.find((x) => x.id === a.patientId);

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
            <Text style={styles.backText}>Back to appointments</Text>
          </TouchableOpacity>

          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>Appointment</Text>
          </View>

          <Text style={styles.headerTitle}>{a.title}</Text>

          {p ? (
            <View style={styles.headerMetaRow}>
              <View style={[styles.patientAvatarSm, p.avatarClass === 'green' ? styles.avatarSmGreen : styles.avatarSmYellow]}>
                <Text style={[styles.avatarSmText, p.avatarClass === 'yellow' && styles.avatarSmTextYellow]}>{p.initials}</Text>
              </View>
              <Text style={styles.headerMetaText}>
                {p.name} · {a.clinician}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.content}>
          <Text style={[styles.sectionH, { marginBottom: layout.s(10) }]}>Details</Text>
          <View style={styles.detailCard}>
            <KV k="Date & time" v={`${a.day} ${a.month} ${a.year}, ${a.time}`} />
            <KV k="Clinic" v={a.clinic} />
            <KV k="Location" v={a.location} />
            <KV k="Visit type" v={a.type} />
            <KV k="Status" v={<StatusPill status={a.status} />} />
          </View>

          <Text style={[styles.sectionH, { marginBottom: layout.s(10) }]}>Visit notes</Text>
          <View style={styles.detailCard}>
            <View style={styles.notesEmpty}>
              <View style={styles.notesIcon}>
                <IconDoc size={20} color={c.g400} />
              </View>
              <Text style={styles.notesTitle}>No notes recorded yet</Text>
              <Text style={styles.notesSub}>
                Visit notes will appear here once the appointment is completed.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function KV({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <View style={styles.kvRow}>
      <Text style={styles.kvKey}>{k}</Text>
      {typeof v === 'string' ? <Text style={styles.kvVal}>{v}</Text> : <View style={styles.kvValWrap}>{v}</View>}
    </View>
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
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layout.s(6),
    marginBottom: layout.s(12),
  },
  backText: {
    color: c.y300,
    fontSize: layout.f(12.5),
    fontWeight: '500',
  },
  headerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(245,184,0,0.15)',
    borderRadius: layout.s(20),
    paddingHorizontal: layout.s(10),
    paddingVertical: layout.s(4),
    marginBottom: layout.s(10),
  },
  headerBadgeText: {
    color: c.y300,
    fontSize: layout.f(10),
    fontWeight: '600',
  },
  headerTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Playfair Display' : 'serif',
    color: c.white,
    fontSize: layout.f(20),
    fontWeight: '600',
    marginBottom: layout.s(8),
  },
  headerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layout.s(8),
  },
  headerMetaText: {
    fontSize: layout.f(12.5),
    fontWeight: '500',
    color: 'rgba(255,255,255,0.65)',
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

  content: {
    paddingHorizontal: layout.s(20),
    paddingTop: layout.s(16),
  },
  sectionH: {
    fontFamily: Platform.OS === 'ios' ? 'Playfair Display' : 'serif',
    fontSize: layout.f(14),
    fontWeight: '600',
    color: c.text1,
  },
  detailCard: {
    backgroundColor: c.white,
    borderRadius: layout.s(16),
    paddingVertical: layout.s(16),
    paddingHorizontal: layout.s(18),
    marginBottom: layout.s(12),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  kvRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: layout.s(9),
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  kvKey: {
    fontSize: layout.f(12),
    color: c.text3,
    fontWeight: '500',
    flex: 1,
    paddingRight: layout.s(8),
  },
  kvValWrap: {
    maxWidth: '55%',
    alignItems: 'flex-end',
  },
  kvVal: {
    fontSize: layout.f(12),
    color: c.text1,
    fontWeight: '500',
    textAlign: 'right',
    maxWidth: '55%',
  },
  statusPill: {
    borderRadius: layout.s(20),
    paddingHorizontal: layout.s(8),
    paddingVertical: layout.s(3),
  },
  statusScheduled: { backgroundColor: c.g50 },
  statusCompleted: { backgroundColor: '#f0f0f0' },
  statusText: { fontSize: layout.f(9.5), fontWeight: '600' },
  statusTextScheduled: { color: c.g700 },
  statusTextCompleted: { color: '#666' },
  notesEmpty: {
    alignItems: 'center',
    paddingVertical: layout.s(20),
    paddingHorizontal: layout.s(12),
  },
  notesIcon: {
    width: layout.s(40),
    height: layout.s(40),
    borderRadius: layout.s(20),
    backgroundColor: c.g50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: layout.s(10),
  },
  notesTitle: {
    fontSize: layout.f(13),
    fontWeight: '600',
    color: c.text1,
    marginBottom: layout.s(4),
    textAlign: 'center',
  },
  notesSub: {
    fontSize: layout.f(11.5),
    color: c.text3,
    textAlign: 'center',
  },
});
