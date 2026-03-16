import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { layout } from '../../constants/layout';
import { UserHomeScreen } from './UserHomeScreen';
import { PatientsScreen } from './PatientsScreen';
import { PatientDetailScreen } from './PatientDetailScreen';
import { AppointmentsScreen } from './AppointmentsScreen';
import { AppointmentDetailScreen } from './AppointmentDetailScreen';
import { ProfileScreen } from './ProfileScreen';
import { userDesignATheme as c } from './userDesignATheme';
import { IconCalendar, IconHome, IconUser, IconUsers } from './userDesignAIcons';

type TabKey = 'home' | 'patients' | 'appointments' | 'profile';

type Props = {
  onSignOut: () => void;
};

export function UserTabsNavigator({ onSignOut }: Props) {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<TabKey>('home');
  const [activePatientId, setActivePatientId] = useState<number | null>(null);
  const [activeAppointmentId, setActiveAppointmentId] = useState<number | null>(null);
  const TAB_BAR_BASE_HEIGHT = layout.s(56);

  const renderContent = () => {
    switch (tab) {
      case 'home':
        return (
          <UserHomeScreen
            onNavigatePatients={() => setTab('patients')}
            onNavigateAppointments={() => setTab('appointments')}
            onNavigatePayments={() => setTab('profile')}
          />
        );
      case 'patients':
        if (activePatientId != null) {
          return <PatientDetailScreen patientId={activePatientId} onBack={() => setActivePatientId(null)} />;
        }
        return (
          <PatientsScreen
            onOpenPatientDetail={(id) => setActivePatientId(id)}
            onLinkPatient={() => {}}
          />
        );
      case 'appointments':
        if (activeAppointmentId != null) {
          return <AppointmentDetailScreen appointmentId={activeAppointmentId} onBack={() => setActiveAppointmentId(null)} />;
        }
        return (
          <AppointmentsScreen
            onOpenAppointmentDetail={(id) => setActiveAppointmentId(id)}
          />
        );
      case 'profile':
        return <ProfileScreen onSignOut={onSignOut} />;
      default:
        return null;
    }
  };

  const renderTabIcon = (key: TabKey, active: boolean) => {
    const stroke = active ? c.g600 : '#b0c4bb';
    switch (key) {
      case 'home':
        return <IconHome size={22} color={stroke} strokeWidth={2} />;
      case 'patients':
        return <IconUsers size={22} color={stroke} strokeWidth={2} />;
      case 'appointments':
        return <IconCalendar size={22} color={stroke} strokeWidth={2} />;
      case 'profile':
      default:
        return <IconUser size={22} color={stroke} strokeWidth={2} />;
    }
  };

  const renderTab = (key: TabKey, label: string) => {
    const active = tab === key;
    return (
      <TouchableOpacity
        key={key}
        style={styles.tab}
        onPress={() => setTab(key)}
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
          <Text style={[styles.tabLabel, !active && styles.tabLabelInactive]}>{label}</Text>
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
        {renderTab('home', 'Home')}
        {renderTab('patients', 'Patients')}
        {renderTab('appointments', 'Appointments')}
        {renderTab('profile', 'Profile')}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: c.off,
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
    borderTopColor: 'rgba(0,0,0,0.08)',
    backgroundColor: c.white,
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
    backgroundColor: c.g500,
  },
  tabIconWrap: {
    width: layout.s(28),
    height: layout.s(28),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: layout.s(4),
  },
  tabIconWrapInactive: {
    opacity: 0.65,
  },
  tabLabel: {
    fontSize: layout.f(10.5),
    fontWeight: '600',
    color: c.g600,
    letterSpacing: Platform.OS === 'ios' ? 0.4 : 0.2,
  },
  tabLabelInactive: {
    color: '#a0b0a8',
    fontWeight: '500',
  },
});

