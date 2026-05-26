import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { layout } from '../../constants/layout';
import { clinicianTheme as c } from './clinicianTheme';
import { IconCheckCircle, IconAlertCircle, IconNotes, IconPlus } from './clinicianIcons';
import { IconChevronLeft } from '../user/userDesignAIcons';
import {
  useClinicianAppointmentDetail,
  updateAppointmentStatus,
  addAppointmentNote,
  AppointmentStatus,
} from '../../lib/clinicianPortal';

type Props = {
  appointmentId: string;
  onBack: () => void;
};

function initials(name: string): string {
  return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return (
    d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) +
    ' · ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  );
}

function formatNoteDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getStatusColor(status: AppointmentStatus): string {
  switch (status) {
    case 'scheduled': return c.statusGreen;
    case 'completed': return c.statusGray;
    case 'no_show': return c.statusRed;
    case 'cancelled': return c.statusRed;
  }
}

function getStatusBg(status: AppointmentStatus): string {
  switch (status) {
    case 'scheduled': return c.statusGreenBg;
    case 'completed': return c.statusGrayBg;
    case 'no_show': return c.statusRedBg;
    case 'cancelled': return c.statusRedBg;
  }
}

function getStatusLabel(status: AppointmentStatus): string {
  switch (status) {
    case 'scheduled': return 'Scheduled';
    case 'completed': return 'Completed';
    case 'no_show': return 'No Show';
    case 'cancelled': return 'Cancelled';
  }
}

type InfoRowProps = { label: string; value: string; valueColor?: string };

function InfoRow({ label, value, valueColor }: InfoRowProps) {
  return (
    <View style={infoStyles.row}>
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={[infoStyles.value, valueColor ? { color: valueColor } : undefined]}>{value}</Text>
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
  label: { fontSize: layout.f(13), color: 'rgba(255,255,255,0.45)', fontWeight: '500' },
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
  const detail = useClinicianAppointmentDetail(appointmentId);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  const backHeader = (
    <TouchableOpacity
      style={[styles.backBtn, { paddingTop: insets.top + layout.s(12) }]}
      onPress={onBack}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel="Go back to Schedule"
    >
      <IconChevronLeft size={16} color={c.teal} strokeWidth={2.5} />
      <Text style={styles.backBtnText}>Schedule</Text>
    </TouchableOpacity>
  );

  if (detail.status === 'loading') {
    return (
      <View style={styles.root}>
        {backHeader}
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={c.teal} />
        </View>
      </View>
    );
  }

  if (detail.status === 'error') {
    return (
      <View style={styles.root}>
        {backHeader}
        <View style={styles.centeredState}>
          <Text style={styles.centeredText}>{detail.error}</Text>
        </View>
      </View>
    );
  }

  const { appointment, patient, clinician, notes, services } = detail.data;

  const handleStatusUpdate = async (newStatus: AppointmentStatus) => {
    setUpdatingStatus(true);
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) { setUpdatingStatus(false); return; }
    const result = await updateAppointmentStatus(appointment.id, newStatus, token);
    setUpdatingStatus(false);
    if (result.error) {
      Alert.alert('Error', result.error);
    } else {
      detail.reload();
    }
  };

  const handleSubmitNote = async () => {
    if (!noteText.trim()) return;
    setSubmittingNote(true);
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) { setSubmittingNote(false); return; }
    const result = await addAppointmentNote(appointment.id, noteText.trim(), token);
    setSubmittingNote(false);
    if (result.error) {
      Alert.alert('Error', result.error);
    } else {
      setNoteText('');
      setShowNoteInput(false);
      detail.reload();
    }
  };

  const isTerminal = appointment.status === 'completed' || appointment.status === 'cancelled' || appointment.status === 'no_show';

  return (
    <View style={styles.root}>
      {backHeader}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + (showNoteInput ? layout.s(200) : layout.s(104)) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Patient card */}
        <View style={styles.patientCard}>
          <View style={styles.patientAvatarCircle}>
            <Text style={styles.patientAvatarText}>
              {patient ? initials(patient.full_name) : '?'}
            </Text>
          </View>
          <View style={styles.patientInfo}>
            <Text style={styles.patientName}>{patient?.full_name ?? 'Patient'}</Text>
            {clinician ? (
              <View style={styles.patientMeta}>
                <Text style={styles.patientMetaText}>Dr. {clinician.full_name}</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.apptTypeBadge}>
            <Text style={styles.apptTypeBadgeText}>Appointment</Text>
          </View>
        </View>

        {/* Info card */}
        <View style={styles.infoCard}>
          <InfoRow label="Date & Time" value={formatDateTime(appointment.scheduled_at)} />
          <View style={[infoStyles.row, { borderBottomWidth: 0 }]}>
            <Text style={infoStyles.label}>Status</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusBg(appointment.status) }]}>
              <Text style={[styles.statusBadgeText, { color: getStatusColor(appointment.status) }]}>
                {getStatusLabel(appointment.status)}
              </Text>
            </View>
          </View>
        </View>

        {/* Services */}
        {services.length > 0 ? (
          <View style={styles.notesSection}>
            <View style={styles.notesSectionHeader}>
              <IconCheckCircle size={16} color={c.teal} strokeWidth={2} />
              <Text style={styles.notesSectionTitle}>Services Provided</Text>
            </View>
            <View style={styles.notesCard}>
              {services.map((s) => (
                <View key={s.id} style={styles.serviceRow}>
                  <Text style={styles.serviceType}>
                    {s.service_type.replace(/_/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase())}
                  </Text>
                  {s.details ? <Text style={styles.serviceDetails}>{s.details}</Text> : null}
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Notes section */}
        <View style={styles.notesSection}>
          <View style={styles.notesSectionHeader}>
            <IconNotes size={16} color={c.teal} strokeWidth={2} />
            <Text style={styles.notesSectionTitle}>
              Visit Notes{notes.length > 0 ? ` (${notes.length})` : ''}
            </Text>
          </View>
          {notes.length === 0 ? (
            <View style={styles.notesCard}>
              <Text style={styles.notesEmpty}>No notes for this appointment.</Text>
            </View>
          ) : (
            notes.map((note) => (
              <View key={note.id} style={styles.noteCard}>
                <Text style={styles.noteDate}>{formatNoteDate(note.created_at)}</Text>
                <Text style={styles.notesText}>{note.content}</Text>
              </View>
            ))
          )}
        </View>

        {/* Add note input */}
        {showNoteInput ? (
          <View style={styles.noteInputBlock}>
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
      </ScrollView>

      {/* Action bar */}
      <View style={[styles.actionBar, { paddingBottom: insets.bottom + layout.s(12) }]}>
        {!showNoteInput ? (
          <TouchableOpacity
            style={styles.actionBtnNote}
            onPress={() => setShowNoteInput(true)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Add note"
          >
            <IconPlus size={15} color={c.teal} strokeWidth={2.5} />
            <Text style={styles.actionBtnNoteText}>Add Note</Text>
          </TouchableOpacity>
        ) : null}
        {!isTerminal ? (
          <>
            <TouchableOpacity
              style={[styles.actionBtnPrimary, updatingStatus && styles.actionBtnDisabled]}
              onPress={() => handleStatusUpdate('completed')}
              disabled={updatingStatus}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Mark appointment as completed"
            >
              {updatingStatus ? (
                <ActivityIndicator size="small" color={c.bg} />
              ) : (
                <>
                  <IconCheckCircle size={16} color={c.bg} strokeWidth={2.5} />
                  <Text style={styles.actionBtnPrimaryText}>Mark Completed</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtnDestructive, updatingStatus && styles.actionBtnDisabled]}
              onPress={() =>
                Alert.alert('Cancel Appointment', 'Are you sure?', [
                  { text: 'No' },
                  { text: 'Yes, Cancel', style: 'destructive', onPress: () => handleStatusUpdate('cancelled') },
                ])
              }
              disabled={updatingStatus}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Cancel appointment"
            >
              <IconAlertCircle size={16} color={c.statusRed} strokeWidth={2} />
              <Text style={styles.actionBtnDestructiveText}>Cancel Appt</Text>
            </TouchableOpacity>
          </>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: c.bg,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layout.s(4),
    paddingHorizontal: layout.s(16),
    paddingBottom: layout.s(8),
  },
  backBtnText: {
    fontSize: layout.f(13),
    fontWeight: '600',
    color: c.teal,
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
  noteCard: {
    backgroundColor: c.surface,
    borderRadius: layout.s(12),
    borderWidth: 1,
    borderColor: c.border,
    padding: layout.s(14),
    gap: layout.s(6),
    marginBottom: layout.s(8),
  },
  noteDate: {
    fontSize: layout.f(10),
    fontWeight: '700',
    color: c.teal,
  },
  serviceRow: {
    paddingVertical: layout.s(6),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  serviceType: {
    fontSize: layout.f(13),
    fontWeight: '600',
    color: c.text1,
  },
  serviceDetails: {
    fontSize: layout.f(11),
    color: c.text3,
    marginTop: layout.s(2),
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
  noteInputBlock: {
    gap: layout.s(10),
    marginTop: layout.s(4),
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
  actionBtnNote: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: layout.s(6),
    backgroundColor: 'transparent',
    borderRadius: layout.s(12),
    paddingVertical: layout.s(14),
    borderWidth: 1,
    borderColor: c.tealBorder,
  },
  actionBtnNoteText: {
    fontSize: layout.f(13),
    fontWeight: '700',
    color: c.teal,
  },
  actionBtnDisabled: {
    opacity: 0.55,
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
});
