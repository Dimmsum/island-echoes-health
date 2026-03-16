import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { layout } from '../../constants/layout';
import { IconChevronRight, IconPlus } from './userDesignAIcons';
import { useUserHomeData } from '../../lib/userHome';
import { userDesignATheme as c } from './userDesignATheme';

type Props = {
  onLinkPatient: () => void;
  onOpenPatientDetail: (patientLinkId: string) => void;
};

export function PatientsScreen({ onLinkPatient, onOpenPatientDetail }: Props) {
  const insets = useSafeAreaInsets();
  const home = useUserHomeData();
  const linkedPatients = home.status === 'loaded' ? home.data.linkedPatients : [];

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + layout.s(24) }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, { paddingTop: insets.top + layout.s(16) }]}>
          <Text style={styles.shLabel}>Care network</Text>
          <Text style={styles.shTitle}>Linked patients</Text>
          <Text style={styles.shPara}>
            View metrics, appointments, and visit summaries for patients you support.
          </Text>
        </View>

        <View style={styles.content}>
          <TouchableOpacity style={styles.linkCard} activeOpacity={0.85} onPress={onLinkPatient}>
            <View style={styles.lpIcon}>
              <IconPlus size={18} color={c.g600} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.linkTitle}>Link a patient</Text>
              <Text style={styles.linkSub}>Enter a patient email and choose a care plan.</Text>
            </View>
            <IconChevronRight size={16} color={c.g300} />
          </TouchableOpacity>

          {home.status === 'loading' && (
            <Text style={styles.loadingText}>Loading your linked patients…</Text>
          )}
          {home.status === 'error' && (
            <Text style={styles.errorText}>{home.error}</Text>
          )}
          {home.status === 'loaded' && linkedPatients.length === 0 && (
            <Text style={styles.emptyText}>No linked patients yet. Start by linking a patient above.</Text>
          )}

          {linkedPatients.map((link) => {
            const p = link.patient;
            const plan = link.care_plan;
            if (!p) return null;
            const initials =
              p.full_name
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part[0]?.toUpperCase())
                .join('') || '?';
            const ageLabel = p.age != null ? `${p.age} yrs` : 'Age N/A';
            const planName = plan?.name ?? 'Care plan';
            return (
            <TouchableOpacity
              key={link.id}
              style={styles.patientRow}
              activeOpacity={0.85}
              onPress={() => onOpenPatientDetail(link.id)}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.pName}>{p.full_name}</Text>
                <Text style={styles.pPlan}>
                  {planName} • {ageLabel}
                </Text>
              </View>
              <Text style={styles.openLink}>Open →</Text>
            </TouchableOpacity>
          );})}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.off },
  scroll: { flex: 1 },
  header: {
    backgroundColor: c.g900,
    paddingHorizontal: layout.s(24),
    paddingBottom: layout.s(28),
  },
  shLabel: {
    fontSize: layout.f(11),
    fontWeight: '500',
    color: c.y400,
    letterSpacing: 0.5,
    marginBottom: layout.s(6),
  },
  shTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Playfair Display' : 'serif',
    color: c.white,
    fontSize: layout.f(22),
    fontWeight: '600',
    marginBottom: layout.s(8),
  },
  shPara: {
    fontSize: layout.f(12),
    color: 'rgba(255,255,255,0.5)',
    lineHeight: layout.f(12 * 1.6),
  },
  content: {
    paddingHorizontal: layout.s(20),
    paddingTop: layout.s(16),
  },
  linkCard: {
    backgroundColor: c.g50,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: c.g300,
    borderRadius: layout.s(16),
    paddingVertical: layout.s(16),
    paddingHorizontal: layout.s(18),
    flexDirection: 'row',
    alignItems: 'center',
    gap: layout.s(12),
    marginBottom: layout.s(16),
  },
  lpIcon: {
    width: layout.s(36),
    height: layout.s(36),
    borderRadius: layout.s(10),
    backgroundColor: c.g100,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  linkTitle: {
    fontSize: layout.f(13.5),
    fontWeight: '600',
    color: c.g700,
  },
  linkSub: {
    fontSize: layout.f(11.5),
    color: c.text3,
    marginTop: layout.s(3),
  },
  patientRow: {
    backgroundColor: c.white,
    borderRadius: layout.s(16),
    paddingVertical: layout.s(14),
    paddingHorizontal: layout.s(16),
    flexDirection: 'row',
    alignItems: 'center',
    gap: layout.s(12),
    marginBottom: layout.s(10),
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.04)',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  avatar: {
    width: layout.s(44),
    height: layout.s(44),
    borderRadius: layout.s(22),
    backgroundColor: c.g600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarAlt: {
    backgroundColor: c.y500,
  },
  avatarText: {
    color: c.white,
    fontWeight: '700',
    fontSize: layout.f(14),
  },
  avatarTextAlt: {
    color: c.y900,
  },
  pName: {
    fontSize: layout.f(13.5),
    fontWeight: '600',
    color: c.text1,
    marginBottom: layout.s(3),
  },
  pPlan: {
    fontSize: layout.f(11.5),
    color: c.text3,
  },
  openLink: {
    fontSize: layout.f(11),
    fontWeight: '600',
    color: c.g500,
  },
});
