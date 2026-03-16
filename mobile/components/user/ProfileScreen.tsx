import React, { useMemo, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { layout } from '../../constants/layout';
import { userDesignATheme as c } from './userDesignATheme';

type Props = {
  onSignOut: () => void;
};

export function ProfileScreen({ onSignOut }: Props) {
  const insets = useSafeAreaInsets();
  const [fullName, setFullName] = useState('Sarah Mitchell');
  const [phone, setPhone] = useState('+1 (876) 555-0142');
  const email = 'sarah.mitchell@email.com';

  const initials = useMemo(() => {
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    return (parts[0]?.[0] ?? 'S') + (parts[1]?.[0] ?? '');
  }, [fullName]);

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + layout.s(24) }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.hero, { paddingTop: insets.top + layout.s(16) }]}>
          <Text style={styles.heroTitle}>Profile</Text>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials.toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{fullName}</Text>
          <Text style={styles.email}>{email}</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.formSection}>
            <Field label="Full name">
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                style={styles.input}
                placeholder="Full name"
                placeholderTextColor={c.text3}
              />
            </Field>
            <Field label="Phone">
              <TextInput
                value={phone}
                onChangeText={setPhone}
                style={styles.input}
                keyboardType="phone-pad"
                placeholder="+1 (xxx) xxx-xxxx"
                placeholderTextColor={c.text3}
              />
            </Field>
            <Field label="Email">
              <TextInput value={email} editable={false} style={[styles.input, styles.inputReadonly]} />
            </Field>
            <Text style={styles.formInfo}>
              Changes to your profile will be synced to your account. Email address cannot be changed here.
            </Text>
          </View>

          <TouchableOpacity style={styles.saveBtn} activeOpacity={0.9} onPress={() => {}}>
            <Text style={styles.saveBtnText}>Save changes</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.signoutBtn, { marginBottom: layout.s(20) }]} activeOpacity={0.9} onPress={onSignOut}>
            <Text style={styles.signoutText}>Sign out</Text>
          </TouchableOpacity>

          <Text style={styles.paymentsTitle}>Payments & sponsorships</Text>

          <View style={styles.paymentsCard}>
            <View pointerEvents="none" style={styles.paymentsCircle} />
            <Text style={styles.pcLabel}>Monthly total</Text>
            <Text style={styles.pcAmount}>$165 / mo</Text>
            <Text style={styles.pcSub}>2 active sponsorships</Text>
          </View>

          <TouchableOpacity style={styles.sponsorBtn} activeOpacity={0.9} onPress={() => {}}>
            <Text style={styles.sponsorBtnText}>+ Sponsor a care plan</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: layout.s(14) }}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.off },
  scroll: { flex: 1 },
  hero: {
    backgroundColor: c.g900,
    paddingHorizontal: layout.s(24),
    paddingBottom: layout.s(32),
    alignItems: 'center',
  },
  heroTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Playfair Display' : 'serif',
    color: c.white,
    fontSize: layout.f(20),
    fontWeight: '600',
    alignSelf: 'flex-start',
    marginBottom: layout.s(20),
  },
  avatar: {
    width: layout.s(72),
    height: layout.s(72),
    borderRadius: layout.s(36),
    backgroundColor: c.y500,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.15)',
    marginBottom: layout.s(12),
  },
  avatarText: {
    fontSize: layout.f(26),
    fontWeight: '700',
    color: c.y900,
  },
  name: {
    fontFamily: Platform.OS === 'ios' ? 'Playfair Display' : 'serif',
    color: c.white,
    fontSize: layout.f(18),
    fontWeight: '600',
    marginBottom: layout.s(4),
  },
  email: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: layout.f(12),
  },
  content: {
    paddingHorizontal: layout.s(20),
    paddingTop: layout.s(16),
  },
  formSection: {
    backgroundColor: c.white,
    borderRadius: layout.s(16),
    paddingVertical: layout.s(16),
    paddingHorizontal: layout.s(18),
    marginBottom: layout.s(12),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  label: {
    fontSize: layout.f(11),
    fontWeight: '600',
    color: c.text3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: layout.s(6),
  },
  input: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.08)',
    borderRadius: layout.s(10),
    paddingVertical: layout.s(10),
    paddingHorizontal: layout.s(12),
    fontSize: layout.f(13.5),
    color: c.text1,
    backgroundColor: c.off,
  },
  inputReadonly: {
    opacity: 0.6,
  },
  formInfo: {
    fontSize: layout.f(11),
    color: c.text3,
    lineHeight: layout.f(11 * 1.5),
    marginTop: layout.s(12),
    paddingVertical: layout.s(10),
    paddingHorizontal: layout.s(12),
    backgroundColor: c.g50,
    borderRadius: layout.s(8),
    borderLeftWidth: layout.s(3),
    borderLeftColor: c.g300,
  },
  saveBtn: {
    width: '100%',
    backgroundColor: c.g700,
    borderRadius: layout.s(10),
    paddingVertical: layout.s(13),
    paddingHorizontal: layout.s(12),
    marginBottom: layout.s(10),
  },
  saveBtnText: {
    fontSize: layout.f(13.5),
    fontWeight: '600',
    color: c.white,
    textAlign: 'center',
  },
  signoutBtn: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: 'rgba(200,0,0,0.2)',
    borderRadius: layout.s(10),
    paddingVertical: layout.s(13),
    paddingHorizontal: layout.s(12),
    backgroundColor: 'transparent',
  },
  signoutText: {
    fontSize: layout.f(13.5),
    fontWeight: '600',
    color: '#c0392b',
    textAlign: 'center',
  },
  paymentsTitle: {
    fontSize: layout.f(14),
    fontWeight: '600',
    color: c.text1,
    marginBottom: layout.s(10),
    fontFamily: Platform.OS === 'ios' ? 'Playfair Display' : 'serif',
  },
  paymentsCard: {
    borderRadius: layout.s(16),
    paddingVertical: layout.s(18),
    paddingHorizontal: layout.s(20),
    marginBottom: layout.s(12),
    overflow: 'hidden',
    backgroundColor: c.g600,
  },
  paymentsCircle: {
    position: 'absolute',
    right: -layout.s(30),
    bottom: -layout.s(30),
    width: layout.s(120),
    height: layout.s(120),
    borderRadius: layout.s(60),
    backgroundColor: 'rgba(245,184,0,0.1)',
  },
  pcLabel: {
    fontSize: layout.f(10.5),
    fontWeight: '600',
    color: c.y300,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: layout.s(5),
  },
  pcAmount: {
    fontFamily: Platform.OS === 'ios' ? 'Playfair Display' : 'serif',
    fontSize: layout.f(28),
    fontWeight: '600',
    color: c.white,
    marginBottom: layout.s(4),
  },
  pcSub: {
    fontSize: layout.f(12),
    color: 'rgba(255,255,255,0.55)',
  },
  sponsorBtn: {
    width: '100%',
    backgroundColor: c.y400,
    borderRadius: layout.s(10),
    paddingVertical: layout.s(13),
    paddingHorizontal: layout.s(12),
  },
  sponsorBtnText: {
    fontSize: layout.f(13.5),
    fontWeight: '700',
    color: c.y900,
    textAlign: 'center',
  },
});
