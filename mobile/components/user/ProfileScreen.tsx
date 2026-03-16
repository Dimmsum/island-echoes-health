import React, { useMemo, useState, useEffect } from 'react';
import { Image, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { layout } from '../../constants/layout';
import { userDesignATheme as c } from './userDesignATheme';
import { useMe } from '../../lib/me';
import { IconUser } from './userDesignAIcons';

type Props = {
  onOpenSettings: () => void;
};

export function ProfileScreen({ onOpenSettings }: Props) {
  const insets = useSafeAreaInsets();
  const me = useMe();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (me.status === 'loaded') {
      const profile = me.data.profile;
      setFullName(profile?.full_name ?? '');
      setPhone(profile?.phone ?? '');
      setAvatarUrl(profile?.avatar_url ?? null);
    }
  }, [me.status, me.data]);

  const email = me.status === 'loaded' ? me.data.user.email : '';

  const initials = useMemo(() => {
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    return (parts[0]?.[0] ?? 'S') + (parts[1]?.[0] ?? '');
  }, [fullName]);

  return (
    <View style={styles.root}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + layout.s(16) }}>
        <View style={[styles.hero, { paddingTop: insets.top + layout.s(16) }]}>
          <View style={styles.heroTopRow}>
            <View />
            <TouchableOpacity
              style={styles.settingsBtn}
              activeOpacity={0.8}
              onPress={onOpenSettings}
            >
              <Text style={styles.settingsText}>Settings</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.avatar}
            activeOpacity={0.85}
            onPress={() => {
              // TODO: implement image picker + upload to /api/profile/avatar
            }}
          >
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <IconUser size={32} color={c.y900} />
            )}
          </TouchableOpacity>
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
          </View>

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
  heroTopRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: layout.s(12),
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
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: layout.s(36),
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
  settingsBtn: {
    paddingHorizontal: layout.s(10),
    paddingVertical: layout.s(6),
    borderRadius: layout.s(999),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  settingsText: {
    color: '#ffebe8',
    fontSize: layout.f(13),
    fontWeight: '600',
  },
});
