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
import { IconMail, IconPhone, IconMapPin, IconBell, IconAlertCircle } from './clinicianIcons';
import { IconChevronRight, IconDoc } from '../user/userDesignAIcons';
import { MOCK_CLINICIAN_PROFILE } from './clinicianMockData';

type Props = {
  onSignOut: () => void;
};

type InfoRowProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
};

function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <View style={infoRowStyles.row}>
      <View style={infoRowStyles.iconWrap}>{icon}</View>
      <View style={infoRowStyles.body}>
        <Text style={infoRowStyles.label}>{label}</Text>
        <Text style={infoRowStyles.value}>{value}</Text>
      </View>
    </View>
  );
}

const infoRowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layout.s(12),
    paddingVertical: layout.s(13),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  iconWrap: {
    width: layout.s(34),
    height: layout.s(34),
    borderRadius: layout.s(10),
    backgroundColor: 'rgba(93,202,165,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(93,202,165,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  body: {
    flex: 1,
    gap: layout.s(2),
  },
  label: {
    fontSize: layout.f(10),
    fontWeight: '600',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: layout.f(13),
    fontWeight: '500',
    color: '#ffffff',
  },
});

type SettingsRowProps = {
  icon: React.ReactNode;
  label: string;
};

function SettingsRow({ icon, label }: SettingsRowProps) {
  return (
    <TouchableOpacity
      style={settingsRowStyles.row}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={settingsRowStyles.iconWrap}>{icon}</View>
      <Text style={settingsRowStyles.label}>{label}</Text>
      <IconChevronRight size={16} color={c.text4} strokeWidth={2} />
    </TouchableOpacity>
  );
}

const settingsRowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layout.s(12),
    paddingVertical: layout.s(13),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  iconWrap: {
    width: layout.s(34),
    height: layout.s(34),
    borderRadius: layout.s(10),
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  label: {
    flex: 1,
    fontSize: layout.f(14),
    fontWeight: '500',
    color: '#ffffff',
  },
});

export function ClinicianProfileScreen({ onSignOut }: Props) {
  const insets = useSafeAreaInsets();
  const profile = MOCK_CLINICIAN_PROFILE;

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + layout.s(16) }]}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + layout.s(32) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar block */}
        <View style={styles.avatarBlock}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{profile.initials}</Text>
          </View>
          <Text style={styles.profileName}>{profile.name}</Text>
          <Text style={styles.profileSpecialty}>{profile.specialty}</Text>
          <Text style={styles.profileClinic}>{profile.clinic}</Text>
        </View>

        {/* Info card */}
        <View style={styles.card}>
          <InfoRow
            icon={<IconMail size={16} color={c.teal} strokeWidth={2} />}
            label="Email"
            value={profile.email}
          />
          <InfoRow
            icon={<IconPhone size={16} color={c.teal} strokeWidth={2} />}
            label="Phone"
            value={profile.phone}
          />
          <InfoRow
            icon={<IconDoc size={16} color={c.teal} strokeWidth={2} />}
            label="License"
            value={profile.license}
          />
          <View style={{ borderBottomWidth: 0 }}>
            <InfoRow
              icon={<IconMapPin size={16} color={c.teal} strokeWidth={2} />}
              label="Clinic"
              value={profile.clinic}
            />
          </View>
        </View>

        {/* Settings section */}
        <Text style={styles.settingsSectionLabel}>SETTINGS</Text>
        <View style={styles.card}>
          <SettingsRow
            icon={<IconBell size={16} color={c.text3} strokeWidth={2} />}
            label="Notifications"
          />
          <SettingsRow
            icon={<IconAlertCircle size={16} color={c.text3} strokeWidth={2} />}
            label="Privacy & Security"
          />
          <View style={{ borderBottomWidth: 0 }}>
            <SettingsRow
              icon={<IconDoc size={16} color={c.text3} strokeWidth={2} />}
              label="Help & Support"
            />
          </View>
        </View>

        {/* Sign out */}
        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={onSignOut}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
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
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: layout.s(16),
    paddingTop: layout.s(24),
    gap: layout.s(16),
  },
  avatarBlock: {
    alignItems: 'center',
    paddingBottom: layout.s(8),
    gap: layout.s(6),
  },
  avatarCircle: {
    width: layout.s(80),
    height: layout.s(80),
    borderRadius: layout.s(40),
    backgroundColor: c.tealBg,
    borderWidth: 2,
    borderColor: c.teal,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: layout.s(6),
  },
  avatarText: {
    fontSize: layout.f(26),
    fontWeight: '700',
    color: c.teal,
  },
  profileName: {
    fontFamily: Platform.OS === 'ios' ? 'Playfair Display' : 'serif',
    fontSize: layout.f(22),
    fontWeight: '700',
    color: c.white,
    textAlign: 'center',
  },
  profileSpecialty: {
    fontSize: layout.f(13),
    color: c.teal,
    fontWeight: '600',
  },
  profileClinic: {
    fontSize: layout.f(12),
    color: c.text3,
    textAlign: 'center',
  },
  card: {
    backgroundColor: c.surface,
    borderRadius: layout.s(16),
    borderWidth: 1,
    borderColor: c.border,
    paddingHorizontal: layout.s(16),
  },
  settingsSectionLabel: {
    fontSize: layout.f(10),
    fontWeight: '700',
    letterSpacing: 1.2,
    color: c.text4,
    marginTop: layout.s(4),
    marginBottom: layout.s(-8),
    paddingHorizontal: layout.s(4),
  },
  signOutBtn: {
    marginTop: layout.s(8),
    alignSelf: 'center',
    paddingVertical: layout.s(12),
    paddingHorizontal: layout.s(32),
    borderRadius: layout.s(12),
    borderWidth: 1,
    borderColor: c.statusRed,
  },
  signOutText: {
    fontSize: layout.f(14),
    fontWeight: '700',
    color: c.statusRed,
    letterSpacing: 0.3,
  },
});
