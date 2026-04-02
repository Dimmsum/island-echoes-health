import React, { useState } from 'react';
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
import { IconCalendar } from '../user/userDesignAIcons';
import { MOCK_APPOINTMENTS, AppointmentRow } from './clinicianMockData';

type DayEntry = {
  date: string;
  label: string;
  dayShort: string;
  dayNum: string;
};

type ApptFilterKey = 'all' | 'confirmed' | 'pending' | 'completed';

const WEEK_DAYS: DayEntry[] = [
  { date: '2026-04-01', label: 'Today', dayShort: 'Wed', dayNum: '1' },
  { date: '2026-04-02', label: 'Thu Apr 2', dayShort: 'Thu', dayNum: '2' },
  { date: '2026-04-03', label: 'Fri Apr 3', dayShort: 'Fri', dayNum: '3' },
  { date: '2026-04-04', label: 'Sat Apr 4', dayShort: 'Sat', dayNum: '4' },
  { date: '2026-04-05', label: 'Sun Apr 5', dayShort: 'Sun', dayNum: '5' },
  { date: '2026-04-06', label: 'Mon Apr 6', dayShort: 'Mon', dayNum: '6' },
  { date: '2026-04-07', label: 'Tue Apr 7', dayShort: 'Tue', dayNum: '7' },
];

const APPT_FILTERS: { key: ApptFilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'pending', label: 'Pending' },
  { key: 'completed', label: 'Completed' },
];

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

export function ClinicianScheduleScreen() {
  const insets = useSafeAreaInsets();
  const [selectedDate, setSelectedDate] = useState<string>('2026-04-01');
  const [apptFilter, setApptFilter] = useState<ApptFilterKey>('all');

  const dayAppts = MOCK_APPOINTMENTS.filter((a) => a.date === selectedDate);
  const filteredAppts = dayAppts.filter((a) => {
    if (apptFilter === 'all') return true;
    return a.status === apptFilter;
  });

  const selectedDay = WEEK_DAYS.find((d) => d.date === selectedDate);

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + layout.s(16) }]}>
        <Text style={styles.headerTitle}>Schedule</Text>
        <Text style={styles.headerSub}>Apr 1 – Apr 7, 2026</Text>
      </View>

      {/* Day selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.dayScroll}
        contentContainerStyle={styles.dayScrollContent}
      >
        {WEEK_DAYS.map((day) => {
          const active = day.date === selectedDate;
          const hasAppts = MOCK_APPOINTMENTS.some((a) => a.date === day.date);
          return (
            <TouchableOpacity
              key={day.date}
              style={[styles.dayBtn, active && styles.dayBtnActive]}
              onPress={() => {
                setSelectedDate(day.date);
                setApptFilter('all');
              }}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityState={active ? { selected: true } : {}}
              accessibilityLabel={day.label}
            >
              <Text style={[styles.dayShort, active && styles.dayShortActive]}>
                {day.dayShort}
              </Text>
              <Text style={[styles.dayNum, active && styles.dayNumActive]}>
                {day.dayNum}
              </Text>
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
        <Text style={styles.daySummaryLabel}>
          {selectedDay?.label ?? selectedDate}
        </Text>
        <View style={styles.daySummaryCount}>
          <Text style={styles.daySummaryCountText}>
            {dayAppts.length} {dayAppts.length === 1 ? 'appointment' : 'appointments'}
          </Text>
        </View>
      </View>

      {/* Appointment list */}
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
            <View key={appt.id} style={styles.apptRow}>
              {/* Timeline */}
              <View style={styles.timelineCol}>
                <Text style={styles.timelineTime}>{appt.time}</Text>
                {idx < filteredAppts.length - 1 ? (
                  <View style={styles.timelineLine} />
                ) : null}
              </View>

              {/* Card */}
              <View style={styles.apptCard}>
                <View style={styles.apptCardHeader}>
                  <View style={styles.apptInitialsCircle}>
                    <Text style={styles.apptInitialsText}>{appt.patientInitials}</Text>
                  </View>
                  <View style={styles.apptCardInfo}>
                    <Text style={styles.apptPatientName}>{appt.patientName}</Text>
                    <Text style={styles.apptType}>{appt.type}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusBg(appt.status) }]}>
                    <Text style={[styles.statusBadgeText, { color: getStatusColor(appt.status) }]}>
                      {appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
                    </Text>
                  </View>
                </View>
                <View style={styles.apptCardMeta}>
                  <Text style={styles.apptMetaText}>{appt.duration}</Text>
                  <View style={styles.metaDot} />
                  <Text style={styles.apptMetaText}>{appt.location}</Text>
                </View>
              </View>
            </View>
          ))
        )}
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
  apptCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layout.s(6),
    paddingTop: layout.s(8),
    borderTopWidth: 1,
    borderTopColor: c.border,
  },
  apptMetaText: {
    fontSize: layout.f(11),
    color: c.text3,
  },
  metaDot: {
    width: layout.s(3),
    height: layout.s(3),
    borderRadius: layout.s(1.5),
    backgroundColor: c.text4,
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
