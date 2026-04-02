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
import { IconCheckCircle, IconAlertCircle, IconNotes } from './clinicianIcons';
import { IconChevronLeft } from '../user/userDesignAIcons';
import { MOCK_APPOINTMENTS, MOCK_PATIENTS, AppointmentRow } from './clinicianMockData';

type Props = {
  appointmentId: string;
  onBack: () => void;
};

function getStatusColor(status: AppointmentRow['status']): string {
  switch (status) {
    case 'confirmed': return c.statusGreen;
    case 'pending': return c.statusYellow;
    case 'completed': return c.statusGray;
    case 'cancelled': return c.statusRed;
    default: return c.statusGray;
  }
}

function getStatusBg(status: AppointmentRow['status']): string {
  switch (status) {
    case 'confirmed': return c.statusGreenBg;
    case 'pending': return c.statusYellowBg;
    case 'completed': return c.statusGrayBg;
    case 'cancelled': return c.statusRedBg;
    default: return c.statusGrayBg;
  }
}

type InfoRowProps = {
  label: string;
  value: string;
  valueColor?: string;
};

function InfoRow({ label, value, valueColor }: InfoRowProps) {
  return (
    <View style={infoStyles.row}>
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={[infoStyles.value, valueColor ? { color: valueColor } : undefined]}>
        {value}
      </Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: layout.s(12),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  label: {
    fontSize: layout.f(13),
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '500',
  },
  value: {
    fontSize: layout.f(13),
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'right',
    flex: 1,
    marginLeft: layout.s(16),
  },
});

export function ClinicianAppointmentDetailScreen({ appointmentId, onBack }: Props) {
  const insets = useSafeAreaInsets();

  const appt = MOCK_APPOINTMENTS.find((a) => a.id === appointmentId);
  const patient = appt ? MOCK_PATIENTS.find((p) => p.id === appt.patientId) : undefined;

  if (!appt) {
    return (
      <View style={styles.root}>
        <View style={[styles.header, { paddingTop: insets.top + layout.s(16) }]}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Go back to Schedule"
          >
            <IconChevronLeft size={16} color={c.teal} strokeWidth={2.5} />
            <Text style={styles.backBtnText}>Schedule</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.notFoundState}>
          <Text style={styles.notFoundText}>Appointment not found.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + layout.s(16) }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Go back to Schedule"
        >
          <IconChevronLeft size={16} color={c.teal} strokeWidth={2.5} />
          <Text style={styles.backBtnText}>Schedule</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Appointment</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + layout.s(104) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Patient card */}
        <View style={styles.patientCard}>
          <View style={styles.patientAvatarCircle}>
            <Text style={styles.patientAvatarText}>{appt.patientInitials}</Text>
          </View>
          <View style={styles.patientInfo}>
            <Text style={styles.patientName}>{appt.patientName}</Text>
            {patient ? (
              <View style={styles.patientMeta}>
                <Text style={styles.patientMetaText}>Age {patient.age}</Text>
                <View style={styles.metaDot} />
                <Text style={styles.patientMetaText}>{patient.condition}</Text>
              </View>
            ) : null}
          </View>
          <View style={[styles.apptTypeBadge, { backgroundColor: c.tealBg }]}>
            <Text style={[styles.apptTypeBadgeText, { color: c.teal }]}>{appt.type}</Text>
          </View>
        </View>

        {/* Info card */}
        <View style={styles.infoCard}>
          <InfoRow
            label="Date"
            value={`${appt.dateLabel !== appt.date ? appt.dateLabel + ' · ' : ''}${appt.date}`}
          />
          <InfoRow label="Time" value={appt.time} />
          <InfoRow label="Duration" value={appt.duration} />
          <InfoRow label="Type" value={appt.type} />
          <InfoRow label="Location" value={appt.location} />
          <View style={[infoStyles.row, { borderBottomWidth: 0 }]}>
            <Text style={infoStyles.label}>Status</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusBg(appt.status) }]}>
              <Text style={[styles.statusBadgeText, { color: getStatusColor(appt.status) }]}>
                {appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
              </Text>
            </View>
          </View>
        </View>

        {/* Notes section */}
        <View style={styles.notesSection}>
          <View style={styles.notesSectionHeader}>
            <IconNotes size={16} color={c.teal} strokeWidth={2} />
            <Text style={styles.notesSectionTitle}>Appointment Notes</Text>
          </View>
          <View style={styles.notesCard}>
            {appt.notes ? (
              <Text style={styles.notesText}>{appt.notes}</Text>
            ) : (
              <Text style={styles.notesEmpty}>No notes for this appointment.</Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Action row */}
      <View style={[styles.actionBar, { paddingBottom: insets.bottom + layout.s(12) }]}>
        <TouchableOpacity
          style={styles.actionBtnPrimary}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Mark appointment as completed"
        >
          <IconCheckCircle size={16} color={c.bg} strokeWidth={2.5} />
          <Text style={styles.actionBtnPrimaryText}>Mark Completed</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtnDestructive}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Cancel appointment"
        >
          <IconAlertCircle size={16} color={c.statusRed} strokeWidth={2} />
          <Text style={styles.actionBtnDestructiveText}>Cancel Appt</Text>
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
    gap: layout.s(16),
  },
  patientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.surface,
    borderRadius: layout.s(16),
    borderWidth: 1,
    borderColor: c.tealBorder,
    padding: layout.s(16),
    gap: layout.s(12),
  },
  patientAvatarCircle: {
    width: layout.s(50),
    height: layout.s(50),
    borderRadius: layout.s(25),
    backgroundColor: c.tealBg,
    borderWidth: 2,
    borderColor: c.teal,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  patientAvatarText: {
    fontSize: layout.f(16),
    fontWeight: '700',
    color: c.teal,
  },
  patientInfo: {
    flex: 1,
    gap: layout.s(4),
  },
  patientName: {
    fontFamily: Platform.OS === 'ios' ? 'Playfair Display' : 'serif',
    fontSize: layout.f(16),
    fontWeight: '700',
    color: c.text1,
  },
  patientMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layout.s(6),
  },
  patientMetaText: {
    fontSize: layout.f(12),
    color: c.text3,
  },
  metaDot: {
    width: layout.s(3),
    height: layout.s(3),
    borderRadius: layout.s(1.5),
    backgroundColor: c.text4,
  },
  apptTypeBadge: {
    paddingVertical: layout.s(5),
    paddingHorizontal: layout.s(10),
    borderRadius: layout.s(20),
    flexShrink: 0,
  },
  apptTypeBadgeText: {
    fontSize: layout.f(11),
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  infoCard: {
    backgroundColor: c.surface,
    borderRadius: layout.s(16),
    borderWidth: 1,
    borderColor: c.border,
    paddingHorizontal: layout.s(16),
    paddingTop: layout.s(4),
    paddingBottom: layout.s(4),
  },
  statusBadge: {
    paddingVertical: layout.s(4),
    paddingHorizontal: layout.s(12),
    borderRadius: layout.s(20),
  },
  statusBadgeText: {
    fontSize: layout.f(11),
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  notesSection: {
    gap: layout.s(10),
  },
  notesSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layout.s(8),
  },
  notesSectionTitle: {
    fontSize: layout.f(14),
    fontWeight: '700',
    color: c.text1,
  },
  notesCard: {
    backgroundColor: c.surface,
    borderRadius: layout.s(14),
    borderWidth: 1,
    borderColor: c.border,
    padding: layout.s(16),
    minHeight: layout.s(100),
  },
  notesText: {
    fontSize: layout.f(13),
    color: c.text2,
    lineHeight: layout.s(21),
  },
  notesEmpty: {
    fontSize: layout.f(13),
    color: c.text3,
    fontStyle: 'italic',
  },
  actionBar: {
    flexDirection: 'row',
    gap: layout.s(12),
    paddingHorizontal: layout.s(16),
    paddingTop: layout.s(12),
    borderTopWidth: 1,
    borderTopColor: c.border,
    backgroundColor: c.bg,
  },
  actionBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: layout.s(8),
    backgroundColor: c.teal,
    borderRadius: layout.s(12),
    paddingVertical: layout.s(14),
  },
  actionBtnPrimaryText: {
    fontSize: layout.f(13),
    fontWeight: '700',
    color: c.bg,
  },
  actionBtnDestructive: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: layout.s(8),
    backgroundColor: 'transparent',
    borderRadius: layout.s(12),
    paddingVertical: layout.s(14),
    borderWidth: 1,
    borderColor: c.statusRed,
  },
  actionBtnDestructiveText: {
    fontSize: layout.f(13),
    fontWeight: '700',
    color: c.statusRed,
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
