import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { layout } from '../../constants/layout';
import { clinicianTheme as c } from './clinicianTheme';
import { ClinicianDashboardScreen } from './ClinicianDashboardScreen';
import { ClinicianPatientsScreen } from './ClinicianPatientsScreen';
import { ClinicianPatientDetailScreen } from './ClinicianPatientDetailScreen';
import { ClinicianScheduleScreen } from './ClinicianScheduleScreen';
import { ClinicianAppointmentDetailScreen } from './ClinicianAppointmentDetailScreen';
import { ClinicianProfileScreen } from './ClinicianProfileScreen';
import { IconHome, IconUsers, IconCalendar, IconUser } from '../user/userDesignAIcons';

type TabKey = 'dashboard' | 'patients' | 'schedule' | 'profile';

type Props = {
  onSignOut: () => void;
};

export function ClinicianTabsNavigator({ onSignOut }: Props) {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<TabKey>('dashboard');
  const [activePatientId, setActivePatientId] = useState<string | null>(null);
  const [scheduleAppointmentId, setScheduleAppointmentId] = useState<string | null>(null);

  const TAB_BAR_BASE_HEIGHT = layout.s(56);

  const renderContent = () => {
    switch (tab) {
      case 'dashboard':
        return (
          <ClinicianDashboardScreen
            onNavigatePatients={() => setTab('patients')}
            onNavigateSchedule={() => setTab('schedule')}
          />
        );
      case 'patients':
        if (activePatientId !== null) {
          return (
            <ClinicianPatientDetailScreen
              patientId={activePatientId}
              onBack={() => setActivePatientId(null)}
            />
          );
        }
        return (
          <ClinicianPatientsScreen
            onOpenPatient={(patientId) => setActivePatientId(patientId)}
          />
        );
      case 'schedule':
        if (scheduleAppointmentId !== null) {
          return (
            <ClinicianAppointmentDetailScreen
              appointmentId={scheduleAppointmentId}
              onBack={() => setScheduleAppointmentId(null)}
            />
          );
        }
        return (
          <ClinicianScheduleScreen
            onOpenAppointment={(id) => setScheduleAppointmentId(id)}
          />
        );
      case 'profile':
        return <ClinicianProfileScreen onSignOut={onSignOut} />;
      default:
        return null;
    }
  };

  const renderTabIcon = (key: TabKey, active: boolean) => {
    const color = active ? c.teal : 'rgba(255,255,255,0.35)';
    switch (key) {
      case 'dashboard':
        return <IconHome size={22} color={color} strokeWidth={2} />;
      case 'patients':
        return <IconUsers size={22} color={color} strokeWidth={2} />;
      case 'schedule':
        return <IconCalendar size={22} color={color} strokeWidth={2} />;
      case 'profile':
      default:
        return <IconUser size={22} color={color} strokeWidth={2} />;
    }
  };

  const handleTabPress = (key: TabKey) => {
    setTab(key);
    // Reset sub-navigation when switching tabs
    if (key !== 'patients') {
      setActivePatientId(null);
    }
    if (key !== 'schedule') {
      setScheduleAppointmentId(null);
    }
  };

  const renderTab = (key: TabKey, label: string) => {
    const active = tab === key;
    return (
      <TouchableOpacity
        key={key}
        style={styles.tab}
        onPress={() => handleTabPress(key)}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityState={active ? { selected: true } : {}}
        accessibilityLabel={label}
      >
        <View style={styles.tabInner}>
          <View style={styles.tabIndicatorTrack}>
            {active ? <View style={styles.tabIndicator} /> : null}
          </View>
          <View style={[styles.tabIconWrap, !active && styles.tabIconWrapInactive]}>
            {renderTabIcon(key, active)}
          </View>
          <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.root}>
      <View style={styles.content}>{renderContent()}</View>
      <View
        style={[
          styles.tabBar,
          { height: TAB_BAR_BASE_HEIGHT + (insets.bottom || 0), paddingBottom: insets.bottom || 0 },
        ]}
      >
        {renderTab('dashboard', 'Dashboard')}
        {renderTab('patients', 'Patients')}
        {renderTab('schedule', 'Schedule')}
        {renderTab('profile', 'Profile')}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: c.bg,
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    paddingHorizontal: layout.s(4),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.07)',
    backgroundColor: c.bg,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  tabInner: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: layout.s(8),
    paddingBottom: layout.s(8),
  },
  tabIndicatorTrack: {
    width: '100%',
    height: layout.s(3),
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: layout.s(6),
  },
  tabIndicator: {
    width: '60%',
    height: layout.s(2.5),
    borderBottomLeftRadius: layout.s(3),
    borderBottomRightRadius: layout.s(3),
    backgroundColor: c.teal,
  },
  tabIconWrap: {
    width: layout.s(28),
    height: layout.s(28),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: layout.s(4),
  },
  tabIconWrapInactive: {
    opacity: 0.7,
  },
  tabLabel: {
    fontSize: layout.f(9.5),
    fontWeight: '500',
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: Platform.OS === 'ios' ? 0.3 : 0.1,
  },
  tabLabelActive: {
    fontWeight: '700',
    color: c.teal,
  },
});
