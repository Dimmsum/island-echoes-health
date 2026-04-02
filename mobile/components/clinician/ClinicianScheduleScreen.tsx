import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { layout } from '../../constants/layout';
import { clinicianTheme as c } from './clinicianTheme';
import { IconCalendar } from '../user/userDesignAIcons';
import { useClinicianAppointments, AppointmentStatus, ClinicianAppointment } from '../../lib/clinicianPortal';

type ApptFilterKey = 'all' | 'scheduled' | 'completed' | 'cancelled';

type DayEntry = {
  dateStr: string;   // 'YYYY-MM-DD'
  label: string;     // 'Today', 'Thu Apr 2', …
  dayShort: string;  // 'Wed'
  dayNum: string;    // '1'
};

type Props = {
  onOpenAppointment: (appointmentId: string) => void;
};

const APPT_FILTERS: { key: ApptFilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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

function buildWeekDays(): DayEntry[] {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const label = i === 0 ? 'Today' : `${DAY_NAMES[d.getDay()]} ${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;
    return { dateStr, label, dayShort: DAY_NAMES[d.getDay()], dayNum: String(d.getDate()) };
  });
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

export function ClinicianScheduleScreen({ onOpenAppointment }: Props) {
  const insets = useSafeAreaInsets();
  const weekDays = useMemo(buildWeekDays, []);
  const [selectedDate, setSelectedDate] = useState<string>(weekDays[0].dateStr);
  const [apptFilter, setApptFilter] = useState<ApptFilterKey>('all');

  const appts = useClinicianAppointments();
  const allAppointments: ClinicianAppointment[] =
    appts.status === 'loaded' ? appts.data.appointments : [];

  const dayAppts = allAppointments
    .filter((a) => toLocalDateStr(a.scheduled_at) === selectedDate)
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());

  const filteredAppts = dayAppts.filter((a) => {
    if (apptFilter === 'all') return true;
    if (apptFilter === 'cancelled') return a.status === 'cancelled' || a.status === 'no_show';
    return a.status === apptFilter;
  });

  const selectedDay = weekDays.find((d) => d.dateStr === selectedDate);

  const headerRange = (() => {
    const first = weekDays[0];
    const last = weekDays[weekDays.length - 1];
    return `${first.dayShort} ${first.dayNum} – ${last.dayShort} ${last.dayNum}`;
  })();

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + layout.s(16) }]}>
        <Text style={styles.headerTitle}>Schedule</Text>
        <Text style={styles.headerSub}>{headerRange}</Text>
      </View>

      {/* Day selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.dayScroll}
        contentContainerStyle={styles.dayScrollContent}
      >
        {weekDays.map((day) => {
          const active = day.dateStr === selectedDate;
          const hasAppts = allAppointments.some(
            (a) => toLocalDateStr(a.scheduled_at) === day.dateStr,
          );
          return (
            <TouchableOpacity
              key={day.dateStr}
              style={[styles.dayBtn, active && styles.dayBtnActive]}
              onPress={() => {
                setSelectedDate(day.dateStr);
                setApptFilter('all');
              }}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityState={active ? { selected: true } : {}}
              accessibilityLabel={day.label}
            >
              <Text style={[styles.dayShort, active && styles.dayShortActive]}>{day.dayShort}</Text>
              <Text style={[styles.dayNum, active && styles.dayNumActive]}>{day.dayNum}</Text>
              {hasAppts ? (
                <View style={[styles.dayDot, active && styles.dayDotActive]} />
              ) : (
                <View style={styles.dayDotPlaceholder} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Filter row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        {APPT_FILTERS.map((f) => {
          const active = apptFilter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setApptFilter(f.key)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityState={active ? { selected: true } : {}}
              accessibilityLabel={`Filter by ${f.label}`}
            >
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Day summary bar */}
      <View style={styles.daySummary}>
        <Text style={styles.daySummaryLabel}>{selectedDay?.label ?? selectedDate}</Text>
        <View style={styles.daySummaryCount}>
          <Text style={styles.daySummaryCountText}>
            {dayAppts.length} {dayAppts.length === 1 ? 'appointment' : 'appointments'}
          </Text>
        </View>
      </View>

      {/* Appointment list */}
      {appts.status === 'loading' ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={c.teal} />
        </View>
      ) : appts.status === 'error' ? (
        <View style={styles.loadingState}>
          <Text style={styles.errorText}>{appts.error}</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + layout.s(24) }]}
          showsVerticalScrollIndicator={false}
        >
          {filteredAppts.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <IconCalendar size={24} color={c.tealDim} strokeWidth={1.5} />
              </View>
              <Text style={styles.emptyTitle}>
                {dayAppts.length === 0
                  ? 'No appointments scheduled'
                  : 'No appointments match this filter'}
              </Text>
              <Text style={styles.emptySub}>
                {dayAppts.length === 0
                  ? 'This day is currently clear.'
                  : 'Try selecting a different filter above.'}
              </Text>
            </View>
          ) : (
            filteredAppts.map((appt, idx) => (
              <TouchableOpacity
                key={appt.id}
                style={styles.apptRow}
                onPress={() => onOpenAppointment(appt.id)}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={`Open appointment for ${appt.patient_name}`}
              >
                {/* Timeline */}
                <View style={styles.timelineCol}>
                  <Text style={styles.timelineTime}>{formatTime(appt.scheduled_at)}</Text>
                  {idx < filteredAppts.length - 1 ? (
                    <View style={styles.timelineLine} />
                  ) : null}
                </View>

                {/* Card */}
                <View style={styles.apptCard}>
                  <View style={styles.apptCardHeader}>
                    <View style={styles.apptInitialsCircle}>
                      <Text style={styles.apptInitialsText}>{initials(appt.patient_name)}</Text>
                    </View>
                    <View style={styles.apptCardInfo}>
                      <Text style={styles.apptPatientName}>{appt.patient_name}</Text>
                      <Text style={styles.apptType}>{appt.clinician_name}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusBg(appt.status) }]}>
                      <Text style={[styles.statusBadgeText, { color: getStatusColor(appt.status) }]}>
                        {getStatusLabel(appt.status)}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: c.bg,
  },
  header: {
    paddingHorizontal: layout.s(24),
    paddingBottom: layout.s(16),
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  headerTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Playfair Display' : 'serif',
    fontSize: layout.f(22),
    fontWeight: '700',
    color: c.text1,
    marginBottom: layout.s(2),
  },
  headerSub: {
    fontSize: layout.f(12),
    color: c.text3,
  },
  dayScroll: {
    flexGrow: 0,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  dayScrollContent: {
    paddingHorizontal: layout.s(16),
    paddingVertical: layout.s(12),
    gap: layout.s(8),
  },
  dayBtn: {
    width: layout.s(52),
    alignItems: 'center',
    paddingVertical: layout.s(8),
    paddingHorizontal: layout.s(6),
    borderRadius: layout.s(12),
    backgroundColor: 'transparent',
    gap: layout.s(4),
  },
  dayBtnActive: {
    backgroundColor: c.tealBg,
    borderWidth: 1,
    borderColor: c.tealBorder,
  },
  dayShort: {
    fontSize: layout.f(10),
    fontWeight: '600',
    color: c.text3,
    letterSpacing: 0.2,
  },
  dayShortActive: {
    color: c.teal,
  },
  dayNum: {
    fontSize: layout.f(20),
    fontWeight: '700',
    color: c.text2,
  },
  dayNumActive: {
    color: c.teal,
  },
  dayDot: {
    width: layout.s(5),
    height: layout.s(5),
    borderRadius: layout.s(2.5),
    backgroundColor: c.text4,
  },
  dayDotActive: {
    backgroundColor: c.teal,
  },
  dayDotPlaceholder: {
    width: layout.s(5),
    height: layout.s(5),
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterContent: {
    paddingHorizontal: layout.s(16),
    paddingVertical: layout.s(10),
    gap: layout.s(8),
  },
  filterChip: {
    paddingVertical: layout.s(6),
    paddingHorizontal: layout.s(14),
    borderRadius: layout.s(20),
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
  },
  filterChipActive: {
    backgroundColor: c.tealBg,
    borderColor: c.tealBorder,
  },
  filterChipText: {
    fontSize: layout.f(12),
    fontWeight: '600',
    color: c.text3,
  },
  filterChipTextActive: {
    color: c.teal,
  },
  daySummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.s(20),
    paddingVertical: layout.s(10),
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  daySummaryLabel: {
    fontSize: layout.f(13),
    fontWeight: '700',
    color: c.text1,
  },
  daySummaryCount: {
    backgroundColor: c.surface,
    paddingHorizontal: layout.s(10),
    paddingVertical: layout.s(4),
    borderRadius: layout.s(20),
    borderWidth: 1,
    borderColor: c.border,
  },
  daySummaryCountText: {
    fontSize: layout.f(11),
    fontWeight: '600',
    color: c.text3,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: layout.s(16),
    paddingTop: layout.s(16),
  },
  apptRow: {
    flexDirection: 'row',
    gap: layout.s(12),
    marginBottom: layout.s(12),
  },
  timelineCol: {
    width: layout.s(52),
    alignItems: 'center',
    flexShrink: 0,
  },
  timelineTime: {
    fontSize: layout.f(11),
    fontWeight: '700',
    color: c.teal,
    textAlign: 'center',
    marginBottom: layout.s(8),
  },
  timelineLine: {
    flex: 1,
    width: 1,
    backgroundColor: c.tealBorder,
    minHeight: layout.s(24),
  },
  apptCard: {
    flex: 1,
    backgroundColor: c.surface,
    borderRadius: layout.s(14),
    borderWidth: 1,
    borderColor: c.border,
    padding: layout.s(14),
    marginBottom: layout.s(4),
  },
  apptCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layout.s(10),
    marginBottom: layout.s(10),
  },
  apptInitialsCircle: {
    width: layout.s(36),
    height: layout.s(36),
    borderRadius: layout.s(18),
    backgroundColor: c.tealBg,
    borderWidth: 1,
    borderColor: c.tealBorder,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  apptInitialsText: {
    fontSize: layout.f(11),
    fontWeight: '700',
    color: c.teal,
  },
  apptCardInfo: {
    flex: 1,
  },
  apptPatientName: {
    fontSize: layout.f(13),
    fontWeight: '700',
    color: c.text1,
    marginBottom: layout.s(2),
  },
  apptType: {
    fontSize: layout.f(11),
    color: c.text3,
  },
  statusBadge: {
    paddingVertical: layout.s(3),
    paddingHorizontal: layout.s(9),
    borderRadius: layout.s(20),
  },
  statusBadgeText: {
    fontSize: layout.f(10),
    fontWeight: '700',
    letterSpacing: 0.2,
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
  emptyState: {
    alignItems: 'center',
    paddingTop: layout.s(48),
    gap: layout.s(8),
  },
  emptyIconWrap: {
    width: layout.s(56),
    height: layout.s(56),
    borderRadius: layout.s(28),
    backgroundColor: c.tealBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: layout.s(4),
  },
  emptyTitle: {
    fontSize: layout.f(15),
    fontWeight: '600',
    color: c.text2,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: layout.f(12),
    color: c.text3,
    textAlign: 'center',
  },
});
