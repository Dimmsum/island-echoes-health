import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { layout } from '../../constants/layout';
import { clinicianTheme as c } from './clinicianTheme';
import { IconNotes, IconPlus, IconActivity, IconCheckCircle } from './clinicianIcons';
import { IconChevronLeft } from '../user/userDesignAIcons';
import {
  MOCK_PATIENTS,
  MOCK_APPOINTMENTS,
  MOCK_PATIENT_NOTES,
  MOCK_PATIENT_VITALS,
  PatientRow,
} from './clinicianMockData';

type Props = {
  patientId: string;
  onBack: () => void;
};

function getStatusColor(status: PatientRow['status']): string {
  switch (status) {
    case 'active': return c.statusGreen;
    case 'review': return c.statusYellow;
    case 'new': return c.teal;
    case 'stable': return c.statusGray;
    default: return c.statusGray;
  }
}

function getStatusBg(status: PatientRow['status']): string {
  switch (status) {
    case 'active': return c.statusGreenBg;
    case 'review': return c.statusYellowBg;
    case 'new': return c.tealBg;
    case 'stable': return c.statusGrayBg;
    default: return c.statusGrayBg;
  }
}

function getTrendSymbol(trend: 'up' | 'down' | 'stable'): string {
  switch (trend) {
    case 'up': return '↑';
    case 'down': return '↓';
    case 'stable': return '→';
  }
}

function getTrendColor(trend: 'up' | 'down' | 'stable'): string {
  switch (trend) {
    case 'up': return c.statusRed;
    case 'down': return c.teal;
    case 'stable': return c.statusGray;
  }
}

function getApptStatusColor(status: string): string {
  switch (status) {
    case 'confirmed': return c.statusGreen;
    case 'pending': return c.statusYellow;
    case 'completed': return c.statusGray;
    case 'cancelled': return c.statusRed;
    default: return c.statusGray;
  }
}

export function ClinicianPatientDetailScreen({ patientId, onBack }: Props) {
  const insets = useSafeAreaInsets();

  const patient = MOCK_PATIENTS.find((p) => p.id === patientId);
  const vitals = MOCK_PATIENT_VITALS.filter((v) => v.patientId === patientId);
  const appointments = MOCK_APPOINTMENTS.filter((a) => a.patientId === patientId).slice(0, 3);
  const notes = MOCK_PATIENT_NOTES.filter((n) => n.patientId === patientId);

  if (!patient) {
    return (
      <View style={styles.root}>
        <View style={[styles.header, { paddingTop: insets.top + layout.s(16) }]}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Go back to Patients"
          >
            <IconChevronLeft size={16} color={c.teal} strokeWidth={2.5} />
            <Text style={styles.backBtnText}>Patients</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.notFoundState}>
          <Text style={styles.notFoundText}>Patient not found.</Text>
        </View>
      </View>
    );
  }

  const vitalGrid = vitals.slice(0, 4);

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + layout.s(16) }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Go back to Patients"
        >
          <IconChevronLeft size={16} color={c.teal} strokeWidth={2.5} />
          <Text style={styles.backBtnText}>Patients</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{patient.name}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + layout.s(96) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero card */}
        <View style={styles.heroCard}>
          <View style={styles.heroAvatarCircle}>
            <Text style={styles.heroAvatarText}>{patient.initials}</Text>
          </View>
          <Text style={styles.heroName}>{patient.name}</Text>
          <Text style={styles.heroCondition}>{patient.condition}</Text>
          <View style={styles.heroMetaRow}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusBg(patient.status) }]}>
              <Text style={[styles.statusBadgeText, { color: getStatusColor(patient.status) }]}>
                {patient.status.charAt(0).toUpperCase() + patient.status.slice(1)}
              </Text>
            </View>
            <Text style={styles.heroMeta}>Age {patient.age}</Text>
            <View style={styles.heroDot} />
            <Text style={styles.heroMeta}>DOB {patient.dob}</Text>
          </View>
        </View>

        {/* Vitals section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconActivity size={16} color={c.teal} strokeWidth={2} />
            <Text style={styles.sectionTitle}>Vitals</Text>
          </View>
          <View style={styles.vitalsGrid}>
            {vitalGrid.map((vital, idx) => (
              <View key={idx} style={styles.vitalCard}>
                <Text style={styles.vitalLabel}>{vital.label}</Text>
                <View style={styles.vitalValueRow}>
                  <Text style={styles.vitalValue}>{vital.value}</Text>
                  <Text style={[styles.vitalTrend, { color: getTrendColor(vital.trend) }]}>
                    {getTrendSymbol(vital.trend)}
                  </Text>
                </View>
                <Text style={styles.vitalUnit}>{vital.unit}</Text>
                <Text style={styles.vitalTime}>{vital.recordedAt}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Upcoming appointments */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconCheckCircle size={16} color={c.teal} strokeWidth={2} />
            <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
          </View>
          {appointments.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyCardText}>No upcoming appointments</Text>
            </View>
          ) : (
            appointments.map((appt) => (
              <View key={appt.id} style={styles.apptMiniCard}>
                <View style={styles.apptMiniLeft}>
                  <Text style={styles.apptMiniDate}>{appt.dateLabel}</Text>
                  <Text style={styles.apptMiniTime}>{appt.time}</Text>
                </View>
                <View style={styles.apptMiniBody}>
                  <Text style={styles.apptMiniType}>{appt.type}</Text>
                  <Text style={styles.apptMiniLocation}>{appt.location} · {appt.duration}</Text>
                </View>
                <View style={[styles.apptMiniStatus, { backgroundColor: getApptStatusColor(appt.status) }]} />
              </View>
            ))
          )}
        </View>

        {/* Notes section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconNotes size={16} color={c.teal} strokeWidth={2} />
            <Text style={styles.sectionTitle}>Recent Notes</Text>
          </View>
          {notes.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyCardText}>No notes yet</Text>
            </View>
          ) : (
            notes.map((note) => (
              <View key={note.id} style={styles.noteCard}>
                <View style={styles.noteMeta}>
                  <Text style={styles.noteDate}>{note.date}</Text>
                  <Text style={styles.noteAuthor}>{note.author}</Text>
                </View>
                <Text style={styles.noteContent} numberOfLines={4}>{note.content}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Floating Add Note button */}
      <View style={[styles.fabWrap, { bottom: insets.bottom + layout.s(16) }]}>
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Add note"
        >
          <IconPlus size={18} color={c.bg} strokeWidth={2.5} />
          <Text style={styles.fabText}>Add Note</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: c.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: layout.s(16),
    paddingBottom: layout.s(14),
    borderBottomWidth: 1,
    borderBottomColor: c.border,
    gap: layout.s(8),
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layout.s(4),
    paddingVertical: layout.s(4),
    paddingRight: layout.s(8),
    minWidth: layout.s(70),
  },
  backBtnText: {
    fontSize: layout.f(13),
    fontWeight: '600',
    color: c.teal,
  },
  headerTitle: {
    flex: 1,
    fontFamily: Platform.OS === 'ios' ? 'Playfair Display' : 'serif',
    fontSize: layout.f(17),
    fontWeight: '700',
    color: c.text1,
    textAlign: 'center',
  },
  headerRight: {
    minWidth: layout.s(70),
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: layout.s(16),
    paddingTop: layout.s(20),
    gap: layout.s(20),
  },
  heroCard: {
    backgroundColor: c.surface,
    borderRadius: layout.s(18),
    borderWidth: 1,
    borderColor: c.tealBorder,
    paddingVertical: layout.s(24),
    paddingHorizontal: layout.s(20),
    alignItems: 'center',
    gap: layout.s(6),
  },
  heroAvatarCircle: {
    width: layout.s(64),
    height: layout.s(64),
    borderRadius: layout.s(32),
    backgroundColor: c.tealBg,
    borderWidth: 2,
    borderColor: c.teal,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: layout.s(4),
  },
  heroAvatarText: {
    fontSize: layout.f(22),
    fontWeight: '700',
    color: c.teal,
  },
  heroName: {
    fontFamily: Platform.OS === 'ios' ? 'Playfair Display' : 'serif',
    fontSize: layout.f(20),
    fontWeight: '700',
    color: c.text1,
  },
  heroCondition: {
    fontSize: layout.f(13),
    color: c.text2,
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layout.s(8),
    marginTop: layout.s(4),
  },
  statusBadge: {
    paddingVertical: layout.s(4),
    paddingHorizontal: layout.s(10),
    borderRadius: layout.s(20),
  },
  statusBadgeText: {
    fontSize: layout.f(10),
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  heroMeta: {
    fontSize: layout.f(12),
    color: c.text3,
  },
  heroDot: {
    width: layout.s(3),
    height: layout.s(3),
    borderRadius: layout.s(1.5),
    backgroundColor: c.text4,
  },
  section: {
    gap: layout.s(10),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layout.s(8),
  },
  sectionTitle: {
    fontSize: layout.f(14),
    fontWeight: '700',
    color: c.text1,
    letterSpacing: 0.1,
  },
  vitalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: layout.s(10),
  },
  vitalCard: {
    width: '47.5%',
    backgroundColor: c.surface,
    borderRadius: layout.s(14),
    borderWidth: 1,
    borderColor: c.border,
    padding: layout.s(14),
    gap: layout.s(2),
  },
  vitalLabel: {
    fontSize: layout.f(10),
    fontWeight: '600',
    color: c.text3,
    letterSpacing: 0.3,
    marginBottom: layout.s(4),
  },
  vitalValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: layout.s(4),
  },
  vitalValue: {
    fontSize: layout.f(22),
    fontWeight: '700',
    color: c.text1,
    letterSpacing: -0.5,
  },
  vitalTrend: {
    fontSize: layout.f(16),
    fontWeight: '700',
  },
  vitalUnit: {
    fontSize: layout.f(11),
    color: c.text3,
  },
  vitalTime: {
    fontSize: layout.f(10),
    color: c.text4,
    marginTop: layout.s(4),
  },
  apptMiniCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.surface,
    borderRadius: layout.s(12),
    borderWidth: 1,
    borderColor: c.border,
    padding: layout.s(14),
    gap: layout.s(12),
  },
  apptMiniLeft: {
    width: layout.s(56),
    flexShrink: 0,
  },
  apptMiniDate: {
    fontSize: layout.f(11),
    fontWeight: '700',
    color: c.teal,
    marginBottom: layout.s(2),
  },
  apptMiniTime: {
    fontSize: layout.f(11),
    color: c.text3,
  },
  apptMiniBody: {
    flex: 1,
  },
  apptMiniType: {
    fontSize: layout.f(13),
    fontWeight: '600',
    color: c.text1,
    marginBottom: layout.s(2),
  },
  apptMiniLocation: {
    fontSize: layout.f(11),
    color: c.text3,
  },
  apptMiniStatus: {
    width: layout.s(8),
    height: layout.s(8),
    borderRadius: layout.s(4),
    flexShrink: 0,
  },
  noteCard: {
    backgroundColor: c.surface,
    borderRadius: layout.s(14),
    borderWidth: 1,
    borderColor: c.border,
    padding: layout.s(14),
    gap: layout.s(8),
  },
  noteMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noteDate: {
    fontSize: layout.f(11),
    fontWeight: '700',
    color: c.teal,
  },
  noteAuthor: {
    fontSize: layout.f(10),
    color: c.text3,
  },
  noteContent: {
    fontSize: layout.f(12.5),
    color: c.text2,
    lineHeight: layout.s(20),
  },
  emptyCard: {
    backgroundColor: c.surface,
    borderRadius: layout.s(12),
    borderWidth: 1,
    borderColor: c.border,
    paddingVertical: layout.s(18),
    alignItems: 'center',
  },
  emptyCardText: {
    fontSize: layout.f(12),
    color: c.text3,
  },
  fabWrap: {
    position: 'absolute',
    left: layout.s(16),
    right: layout.s(16),
    alignItems: 'center',
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: layout.s(8),
    backgroundColor: c.teal,
    borderRadius: layout.s(14),
    paddingVertical: layout.s(14),
    paddingHorizontal: layout.s(28),
    shadowColor: c.teal,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  fabText: {
    fontSize: layout.f(14),
    fontWeight: '700',
    color: c.bg,
  },
  notFoundState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundText: {
    fontSize: layout.f(14),
    color: c.text3,
  },
});
