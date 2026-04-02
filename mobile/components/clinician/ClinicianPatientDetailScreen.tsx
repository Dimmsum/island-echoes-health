import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { layout } from '../../constants/layout';
import { clinicianTheme as c } from './clinicianTheme';
import { IconNotes, IconPlus, IconActivity, IconCheckCircle } from './clinicianIcons';
import { IconChevronLeft } from '../user/userDesignAIcons';
import {
  useClinicianPatientDetail,
  addAppointmentNote,
  AppointmentStatus,
  ClinicianPatientMetric,
} from '../../lib/clinicianPortal';

type Props = {
  patientId: string;
  onBack: () => void;
};

function initials(name: string): string {
  return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
}

function formatApptDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatApptTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function formatNoteDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getApptStatusColor(status: AppointmentStatus): string {
  switch (status) {
    case 'scheduled': return c.statusGreen;
    case 'completed': return c.statusGray;
    case 'no_show': return c.statusRed;
    case 'cancelled': return c.statusRed;
  }
}

function buildVitals(metrics: ClinicianPatientMetric[]): { label: string; value: string; unit: string; recorded: string }[] {
  if (metrics.length === 0) return [];
  const latest = metrics[0];
  const result: { label: string; value: string; unit: string; recorded: string }[] = [];
  const recordedAt = new Date(latest.recorded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  if (latest.blood_pressure_systolic != null && latest.blood_pressure_diastolic != null) {
    result.push({ label: 'Blood Pressure', value: `${latest.blood_pressure_systolic}/${latest.blood_pressure_diastolic}`, unit: 'mmHg', recorded: recordedAt });
  }
  if (latest.weight_kg != null) {
    result.push({ label: 'Weight', value: String(latest.weight_kg), unit: 'kg', recorded: recordedAt });
  }
  if (latest.a1c != null) {
    result.push({ label: 'A1C', value: String(latest.a1c), unit: '%', recorded: recordedAt });
  }
  if (latest.medication_adherence != null) {
    result.push({ label: 'Medication', value: latest.medication_adherence.charAt(0).toUpperCase() + latest.medication_adherence.slice(1), unit: 'adherence', recorded: recordedAt });
  }
  return result;
}

export function ClinicianPatientDetailScreen({ patientId, onBack }: Props) {
  const insets = useSafeAreaInsets();
  const patientDetail = useClinicianPatientDetail(patientId);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  const backHeader = (
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
      {patientDetail.status === 'loaded' ? (
        <Text style={styles.headerTitle} numberOfLines={1}>
          {patientDetail.data.patient.patient_name}
        </Text>
      ) : <Text style={styles.headerTitle} />}
      <View style={styles.headerRight} />
    </View>
  );

  if (patientDetail.status === 'loading') {
    return (
      <View style={styles.root}>
        {backHeader}
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={c.teal} />
        </View>
      </View>
    );
  }

  if (patientDetail.status === 'error') {
    return (
      <View style={styles.root}>
        {backHeader}
        <View style={styles.centeredState}>
          <Text style={styles.centeredText}>{patientDetail.error}</Text>
        </View>
      </View>
    );
  }

  const { patient, appointments, latestMetrics, latestNotes, latestAppointmentId } = patientDetail.data;
  const vitals = buildVitals(latestMetrics);

  const handleSubmitNote = async () => {
    if (!noteText.trim() || !latestAppointmentId) return;
    setSubmittingNote(true);
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) { setSubmittingNote(false); return; }
    const result = await addAppointmentNote(latestAppointmentId, noteText.trim(), token);
    setSubmittingNote(false);
    if (result.error) {
      Alert.alert('Error', result.error);
    } else {
      setNoteText('');
      setShowNoteInput(false);
      patientDetail.reload();
    }
  };

  return (
    <View style={styles.root}>
      {backHeader}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + (showNoteInput ? layout.s(200) : layout.s(96)) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero card */}
        <View style={styles.heroCard}>
          <View style={styles.heroAvatarCircle}>
            <Text style={styles.heroAvatarText}>{initials(patient.patient_name)}</Text>
          </View>
          <Text style={styles.heroName}>{patient.patient_name}</Text>
          <Text style={styles.heroCondition}>{patient.plan_name}</Text>
          <View style={styles.heroMetaRow}>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>Active</Text>
            </View>
            {patient.next_appointment_clinician ? (
              <Text style={styles.heroMeta}>Dr. {patient.next_appointment_clinician}</Text>
            ) : null}
          </View>
        </View>

        {/* Vitals section */}
        {vitals.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <IconActivity size={16} color={c.teal} strokeWidth={2} />
              <Text style={styles.sectionTitle}>Latest Vitals</Text>
            </View>
            <View style={styles.vitalsGrid}>
              {vitals.map((vital, idx) => (
                <View key={idx} style={styles.vitalCard}>
                  <Text style={styles.vitalLabel}>{vital.label}</Text>
                  <Text style={styles.vitalValue}>{vital.value}</Text>
                  <Text style={styles.vitalUnit}>{vital.unit}</Text>
                  <Text style={styles.vitalTime}>{vital.recorded}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Appointments section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconCheckCircle size={16} color={c.teal} strokeWidth={2} />
            <Text style={styles.sectionTitle}>Appointments</Text>
          </View>
          {appointments.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyCardText}>No appointments</Text>
            </View>
          ) : (
            appointments.slice(0, 4).map((appt) => (
              <View key={appt.id} style={styles.apptMiniCard}>
                <View style={styles.apptMiniLeft}>
                  <Text style={styles.apptMiniDate}>{formatApptDate(appt.scheduled_at)}</Text>
                  <Text style={styles.apptMiniTime}>{formatApptTime(appt.scheduled_at)}</Text>
                </View>
                <View style={styles.apptMiniBody}>
                  <Text style={styles.apptMiniType}>Appointment</Text>
                  <Text style={styles.apptMiniLocation}>{appt.clinician_name}</Text>
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
          {latestNotes.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyCardText}>No notes yet</Text>
            </View>
          ) : (
            latestNotes.map((note) => (
              <View key={note.id} style={styles.noteCard}>
                <Text style={styles.noteDate}>{formatNoteDate(note.created_at)}</Text>
                <Text style={styles.noteContent} numberOfLines={4}>{note.content}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Note input panel */}
      {showNoteInput ? (
        <View style={[styles.noteInputPanel, { paddingBottom: insets.bottom + layout.s(12) }]}>
          <TextInput
            style={styles.noteInputField}
            placeholder="Write a note..."
            placeholderTextColor={c.text3}
            value={noteText}
            onChangeText={setNoteText}
            multiline
            maxLength={1000}
            autoFocus
            accessibilityLabel="Note content"
          />
          <View style={styles.noteInputActions}>
            <TouchableOpacity
              style={styles.noteCancelBtn}
              onPress={() => { setShowNoteInput(false); setNoteText(''); }}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              <Text style={styles.noteCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.noteSubmitBtn, (!noteText.trim() || submittingNote) && styles.noteSubmitBtnDisabled]}
              onPress={handleSubmitNote}
              disabled={!noteText.trim() || submittingNote}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              {submittingNote ? (
                <ActivityIndicator size="small" color={c.bg} />
              ) : (
                <Text style={styles.noteSubmitText}>Save Note</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {/* Floating Add Note button */}
      {!showNoteInput ? (
        <View style={[styles.fabWrap, { bottom: insets.bottom + layout.s(16) }]}>
          <TouchableOpacity
            style={[styles.fab, !latestAppointmentId && styles.fabDisabled]}
            onPress={() => latestAppointmentId && setShowNoteInput(true)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Add note"
          >
            <IconPlus size={18} color={c.bg} strokeWidth={2.5} />
            <Text style={styles.fabText}>Add Note</Text>
          </TouchableOpacity>
        </View>
      ) : null}
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
    color: c.teal,
    fontWeight: '500',
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
    backgroundColor: c.statusGreenBg,
  },
  statusBadgeText: {
    fontSize: layout.f(10),
    fontWeight: '700',
    letterSpacing: 0.3,
    color: c.statusGreen,
  },
  heroMeta: {
    fontSize: layout.f(12),
    color: c.text3,
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
  centeredState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centeredText: {
    fontSize: layout.f(13),
    color: c.text3,
    textAlign: 'center',
    paddingHorizontal: layout.s(24),
  },
  noteDate: {
    fontSize: layout.f(11),
    fontWeight: '700',
    color: c.teal,
    marginBottom: layout.s(6),
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
  fabDisabled: {
    opacity: 0.4,
  },
  noteInputPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: c.bg2,
    borderTopWidth: 1,
    borderTopColor: c.borderTeal,
    paddingHorizontal: layout.s(16),
    paddingTop: layout.s(12),
    gap: layout.s(10),
  },
  noteInputField: {
    backgroundColor: c.surface,
    borderRadius: layout.s(12),
    borderWidth: 1,
    borderColor: c.border,
    paddingHorizontal: layout.s(14),
    paddingVertical: layout.s(10),
    fontSize: layout.f(13),
    color: c.text1,
    minHeight: layout.s(80),
    textAlignVertical: 'top',
  },
  noteInputActions: {
    flexDirection: 'row',
    gap: layout.s(10),
  },
  noteCancelBtn: {
    flex: 1,
    paddingVertical: layout.s(12),
    borderRadius: layout.s(10),
    alignItems: 'center',
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
  },
  noteCancelText: {
    fontSize: layout.f(13),
    fontWeight: '600',
    color: c.text3,
  },
  noteSubmitBtn: {
    flex: 2,
    paddingVertical: layout.s(12),
    borderRadius: layout.s(10),
    alignItems: 'center',
    backgroundColor: c.teal,
  },
  noteSubmitBtnDisabled: {
    opacity: 0.5,
  },
  noteSubmitText: {
    fontSize: layout.f(13),
    fontWeight: '700',
    color: c.bg,
  },
});
