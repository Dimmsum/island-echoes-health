import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { layout } from '../../constants/layout';
import { clinicianTheme as c } from './clinicianTheme';
import { IconBell, IconCheckCircle } from './clinicianIcons';
import { IconChevronRight, IconCalendar, IconUsers } from '../user/userDesignAIcons';
import {
  useClinicianDashboard,
  AppointmentStatus,
  ClinicianDashboardPatient,
  DashboardTodayAppointment,
} from '../../lib/clinicianPortal';

type Props = {
  onNavigatePatients: () => void;
  onNavigateSchedule: () => void;
};

function toLocalDateStr(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function initials(name: string): string {
  return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
}

function getFirstName(fullName: string | null): string {
  if (!fullName) return 'Doctor';
  return fullName.split(' ')[0];
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

export function ClinicianDashboardScreen({ onNavigatePatients, onNavigateSchedule }: Props) {
  const insets = useSafeAreaInsets();
  const dashboard = useClinicianDashboard();

  const header = (
    <View style={[styles.header, { paddingTop: insets.top + layout.s(16) }]}>
      <View style={styles.headerLeft}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>CLINICIAN</Text>
        </View>
        <Text style={styles.logo}>Island Echoes Health</Text>
      </View>
      <TouchableOpacity
        style={styles.bellBtn}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Notifications"
      >
        <IconBell size={20} color={c.teal} strokeWidth={2} />
      </TouchableOpacity>
    </View>
  );

  if (dashboard.status === 'loading') {
    return (
      <View style={styles.root}>
        {header}
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={c.teal} />
        </View>
      </View>
    );
  }

  if (dashboard.status === 'error') {
    return (
      <View style={styles.root}>
        {header}
        <View style={styles.loadingState}>
          <Text style={styles.errorText}>{dashboard.error}</Text>
        </View>
      </View>
    );
  }

  const { data } = dashboard;
  const todayStr = toLocalDateStr(new Date().toISOString());

  // Today's appointments (all statuses, from allAppointments)
  const todayAll = data.allAppointments.filter(
    (a) => toLocalDateStr(a.scheduled_at) === todayStr,
  );
  const seenToday = todayAll.filter((a) => a.status === 'completed').length;

  // Upcoming scheduled for today (from the dedicated todayAppointments list)
  const upcomingToday: (DashboardTodayAppointment & {
    patient_name: string;
    patient_initials: string;
  })[] = data.todayAppointments.slice(0, 3).map((a) => {
    const p = data.patientsWithPlans.find((pw) => pw.patient_id === a.patient_id);
    const name = p?.patient_name ?? 'Patient';
    return { ...a, patient_name: name, patient_initials: initials(name) };
  });

  const nextAppt = upcomingToday[0] ?? null;
  const recentPatients: ClinicianDashboardPatient[] = data.patientsWithPlans.slice(0, 3);

  return (
    <View style={styles.root}>
      {header}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + layout.s(24) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome block */}
        <View style={styles.welcomeBlock}>
          <Text style={styles.welcomeGreeting}>Good morning,</Text>
          <Text style={styles.welcomeName}>
            Dr.{' '}
            <Text style={styles.welcomeNameEm}>{getFirstName(data.profile?.full_name ?? null)}</Text>
          </Text>
          <Text style={styles.welcomeSub}>Here's your overview for today.</Text>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderColor: c.tealBorder }]}>
            <Text style={[styles.statValue, { color: c.teal }]}>{data.todayAppointments.length}</Text>
            <Text style={styles.statLabel}>Today's{'\n'}Appts</Text>
          </View>
          <View style={[styles.statCard, { borderColor: c.tealBorder }]}>
            <Text style={[styles.statValue, { color: c.teal }]}>{seenToday}</Text>
            <Text style={styles.statLabel}>Seen{'\n'}Today</Text>
          </View>
          <View style={[styles.statCard, { borderColor: c.goldBorder }]}>
            <Text style={[styles.statValue, { color: c.gold }]}>{data.patientsWithPlans.length}</Text>
            <Text style={styles.statLabel}>Active{'\n'}Patients</Text>
          </View>
        </View>

        {/* Next appointment featured card */}
        {nextAppt ? (
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionLabel}>NEXT UP</Text>
            <View style={styles.featuredCard}>
              <View style={styles.featuredCardHeader}>
                <View style={styles.initialsCircle}>
                  <Text style={styles.initialsText}>{nextAppt.patient_initials}</Text>
                </View>
                <View style={styles.featuredCardInfo}>
                  <Text style={styles.featuredPatientName}>{nextAppt.patient_name}</Text>
                  <Text style={styles.featuredApptType}>Scheduled appointment</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusBg(nextAppt.status) }]}>
                  <Text style={[styles.statusBadgeText, { color: getStatusColor(nextAppt.status) }]}>
                    {getStatusLabel(nextAppt.status)}
                  </Text>
                </View>
              </View>
              <View style={styles.featuredCardMeta}>
                <View style={styles.metaRow}>
                  <Text style={styles.metaIcon}>◷</Text>
                  <Text style={styles.metaText}>{formatTime(nextAppt.scheduled_at)}</Text>
                </View>
              </View>
            </View>
          </View>
        ) : null}

        {/* Upcoming Today */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionLabel}>UPCOMING TODAY</Text>
          {upcomingToday.length === 0 ? (
            <View style={styles.emptyCard}>
              <IconCheckCircle size={24} color={c.tealDim} strokeWidth={1.5} />
              <Text style={styles.emptyCardText}>No appointments scheduled today</Text>
            </View>
          ) : (
            upcomingToday.map((appt) => (
              <View key={appt.id} style={styles.apptRow}>
                <View style={styles.apptTimeCol}>
                  <Text style={styles.apptTime}>{formatTime(appt.scheduled_at)}</Text>
                </View>
                <View style={styles.apptDivider} />
                <View style={styles.apptBody}>
                  <Text style={styles.apptPatient}>{appt.patient_name}</Text>
                  <Text style={styles.apptMeta}>Scheduled appointment</Text>
                </View>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(appt.status) }]} />
              </View>
            ))
          )}
        </View>

        {/* Recent Patients */}
        {recentPatients.length > 0 ? (
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionLabel}>RECENT PATIENTS</Text>
            {recentPatients.map((patient) => (
              <View key={patient.patient_id} style={styles.patientRow}>
                <View style={styles.patientInitialsCircle}>
                  <Text style={styles.patientInitialsText}>{initials(patient.patient_name)}</Text>
                </View>
                <View style={styles.patientBody}>
                  <Text style={styles.patientName}>{patient.patient_name}</Text>
                  <Text style={styles.patientMeta}>{patient.plan_name}</Text>
                </View>
                <IconChevronRight size={16} color={c.text4} strokeWidth={2} />
              </View>
            ))}
          </View>
        ) : null}

        {/* Quick action row */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={onNavigateSchedule}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="View Full Schedule"
          >
            <IconCalendar size={16} color={c.bg} strokeWidth={2.5} />
            <Text style={styles.actionBtnText}>Full Schedule</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnOutline]}
            onPress={onNavigatePatients}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="All Patients"
          >
            <IconUsers size={16} color={c.teal} strokeWidth={2.5} />
            <Text style={[styles.actionBtnText, styles.actionBtnOutlineText]}>All Patients</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    justifyContent: 'space-between',
    paddingHorizontal: layout.s(24),
    paddingBottom: layout.s(14),
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layout.s(10),
  },
  badge: {
    backgroundColor: c.tealBg,
    paddingVertical: layout.s(4),
    paddingHorizontal: layout.s(10),
    borderRadius: layout.s(8),
    borderWidth: 1,
    borderColor: c.tealBorder,
  },
  badgeText: {
    fontSize: layout.f(10),
    fontWeight: '700',
    letterSpacing: 0.8,
    color: c.teal,
  },
  logo: {
    fontFamily: Platform.OS === 'ios' ? 'Playfair Display' : 'serif',
    fontSize: layout.f(15),
    fontWeight: '700',
    color: c.white,
  },
  bellBtn: {
    width: layout.s(38),
    height: layout.s(38),
    borderRadius: layout.s(19),
    backgroundColor: c.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: c.border,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: layout.s(20),
    paddingTop: layout.s(24),
  },
  welcomeBlock: {
    marginBottom: layout.s(24),
  },
  welcomeGreeting: {
    fontSize: layout.f(14),
    color: c.text3,
    marginBottom: layout.s(4),
  },
  welcomeName: {
    fontFamily: Platform.OS === 'ios' ? 'Playfair Display' : 'serif',
    fontSize: layout.f(28),
    fontWeight: '700',
    color: c.white,
    lineHeight: layout.s(34),
    letterSpacing: -0.3,
    marginBottom: layout.s(6),
  },
  welcomeNameEm: {
    fontStyle: 'italic',
    color: c.teal,
  },
  welcomeSub: {
    fontSize: layout.f(13),
    color: c.text3,
    lineHeight: layout.s(20),
  },
  statsRow: {
    flexDirection: 'row',
    gap: layout.s(10),
    marginBottom: layout.s(24),
  },
  statCard: {
    flex: 1,
    backgroundColor: c.surface,
    borderRadius: layout.s(14),
    borderWidth: 1,
    paddingVertical: layout.s(14),
    paddingHorizontal: layout.s(10),
    alignItems: 'center',
  },
  statValue: {
    fontSize: layout.f(28),
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: layout.s(4),
  },
  statLabel: {
    fontSize: layout.f(10),
    color: c.text3,
    textAlign: 'center',
    lineHeight: layout.s(14),
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  sectionBlock: {
    marginBottom: layout.s(24),
  },
  sectionLabel: {
    fontSize: layout.f(10),
    fontWeight: '700',
    letterSpacing: 1.2,
    color: c.text4,
    marginBottom: layout.s(10),
  },
  featuredCard: {
    backgroundColor: c.surface,
    borderRadius: layout.s(16),
    borderWidth: 1,
    borderColor: c.tealBorder,
    padding: layout.s(16),
  },
  featuredCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layout.s(12),
    marginBottom: layout.s(14),
  },
  initialsCircle: {
    width: layout.s(44),
    height: layout.s(44),
    borderRadius: layout.s(22),
    backgroundColor: c.tealBg,
    borderWidth: 1,
    borderColor: c.tealBorder,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  initialsText: {
    fontSize: layout.f(14),
    fontWeight: '700',
    color: c.teal,
  },
  featuredCardInfo: {
    flex: 1,
  },
  featuredPatientName: {
    fontSize: layout.f(15),
    fontWeight: '700',
    color: c.text1,
    marginBottom: layout.s(2),
  },
  featuredApptType: {
    fontSize: layout.f(12),
    color: c.text3,
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
  featuredCardMeta: {
    gap: layout.s(6),
    paddingTop: layout.s(12),
    borderTopWidth: 1,
    borderTopColor: c.border,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layout.s(8),
  },
  metaIcon: {
    fontSize: layout.f(13),
    color: c.teal,
    width: layout.s(16),
  },
  metaText: {
    fontSize: layout.f(13),
    color: c.text2,
  },
  apptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.surface,
    borderRadius: layout.s(12),
    borderWidth: 1,
    borderColor: c.border,
    padding: layout.s(14),
    marginBottom: layout.s(8),
    gap: layout.s(12),
  },
  apptTimeCol: {
    width: layout.s(60),
    flexShrink: 0,
  },
  apptTime: {
    fontSize: layout.f(12),
    fontWeight: '700',
    color: c.teal,
    marginBottom: layout.s(2),
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: layout.f(13),
    color: c.text3,
    textAlign: 'center',
    paddingHorizontal: layout.s(24),
  },
  apptDuration: {
    fontSize: layout.f(10),
    color: c.text3,
  },
  apptDivider: {
    width: 1,
    height: layout.s(32),
    backgroundColor: c.border,
  },
  apptBody: {
    flex: 1,
  },
  apptPatient: {
    fontSize: layout.f(13),
    fontWeight: '600',
    color: c.text1,
    marginBottom: layout.s(2),
  },
  apptMeta: {
    fontSize: layout.f(11),
    color: c.text3,
  },
  statusDot: {
    width: layout.s(8),
    height: layout.s(8),
    borderRadius: layout.s(4),
    flexShrink: 0,
  },
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.surface,
    borderRadius: layout.s(12),
    borderWidth: 1,
    borderColor: c.border,
    padding: layout.s(14),
    marginBottom: layout.s(8),
    gap: layout.s(12),
  },
  patientInitialsCircle: {
    width: layout.s(38),
    height: layout.s(38),
    borderRadius: layout.s(19),
    backgroundColor: c.tealBg,
    borderWidth: 1,
    borderColor: c.tealBorder,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  patientInitialsText: {
    fontSize: layout.f(12),
    fontWeight: '700',
    color: c.teal,
  },
  patientBody: {
    flex: 1,
  },
  patientName: {
    fontSize: layout.f(13),
    fontWeight: '600',
    color: c.text1,
    marginBottom: layout.s(2),
  },
  patientMeta: {
    fontSize: layout.f(11),
    color: c.text3,
  },
  emptyCard: {
    backgroundColor: c.surface,
    borderRadius: layout.s(14),
    borderWidth: 1,
    borderColor: c.border,
    paddingVertical: layout.s(20),
    alignItems: 'center',
    gap: layout.s(8),
  },
  emptyCardText: {
    fontSize: layout.f(13),
    color: c.text3,
  },
  actionRow: {
    flexDirection: 'row',
    gap: layout.s(12),
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: layout.s(8),
    backgroundColor: c.teal,
    borderRadius: layout.s(12),
    paddingVertical: layout.s(14),
  },
  actionBtnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: c.tealBorder,
  },
  actionBtnText: {
    fontSize: layout.f(13),
    fontWeight: '700',
    color: c.bg,
    letterSpacing: 0.2,
  },
  actionBtnOutlineText: {
    color: c.teal,
  },
});
