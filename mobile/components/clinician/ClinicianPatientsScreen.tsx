import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { layout } from '../../constants/layout';
import { clinicianTheme as c } from './clinicianTheme';
import { IconSearch } from './clinicianIcons';
import { IconChevronRight } from '../user/userDesignAIcons';
import { useClinicianDashboard, ClinicianDashboardPatient } from '../../lib/clinicianPortal';

type Props = {
  onOpenPatient: (patientId: string) => void;
};

function initials(name: string): string {
  return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
}

function formatNextAppt(iso: string | null): string {
  if (!iso) return 'No upcoming';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ' · ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export function ClinicianPatientsScreen({ onOpenPatient }: Props) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const dashboard = useClinicianDashboard();

  const patients: ClinicianDashboardPatient[] =
    dashboard.status === 'loaded' ? dashboard.data.patientsWithPlans : [];

  const filtered = patients.filter((p) => {
    if (query.trim() === '') return true;
    return (
      p.patient_name.toLowerCase().includes(query.toLowerCase()) ||
      p.plan_name.toLowerCase().includes(query.toLowerCase())
    );
  });

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + layout.s(16) }]}>
        <Text style={styles.headerTitle}>Patients</Text>
        {dashboard.status === 'loaded' ? (
          <Text style={styles.headerSub}>{patients.length} under your care</Text>
        ) : null}
      </View>

      {/* Search bar */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <IconSearch size={16} color={c.text3} strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search patients..."
            placeholderTextColor={c.text3}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            clearButtonMode="while-editing"
            accessibilityRole="search"
            accessibilityLabel="Search patients"
          />
        </View>
      </View>

      {/* Patient list */}
      {dashboard.status === 'loading' ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={c.teal} />
        </View>
      ) : dashboard.status === 'error' ? (
        <View style={styles.loadingState}>
          <Text style={styles.errorText}>{dashboard.error}</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + layout.s(24) }]}
          showsVerticalScrollIndicator={false}
        >
          {filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <IconSearch size={24} color={c.tealDim} strokeWidth={1.5} />
              </View>
              <Text style={styles.emptyTitle}>No patients found</Text>
              <Text style={styles.emptySub}>
                {query.trim() ? 'Try adjusting your search.' : 'No patients are enrolled yet.'}
              </Text>
            </View>
          ) : (
            filtered.map((patient) => (
              <TouchableOpacity
                key={patient.patient_id}
                style={styles.patientCard}
                onPress={() => onOpenPatient(patient.patient_id)}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={`Open patient ${patient.patient_name}`}
              >
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>{initials(patient.patient_name)}</Text>
                </View>
                <View style={styles.cardBody}>
                  <View style={styles.cardTopRow}>
                    <Text style={styles.cardName}>{patient.patient_name}</Text>
                    <View style={styles.activeBadge}>
                      <Text style={styles.activeBadgeText}>Active</Text>
                    </View>
                  </View>
                  <Text style={styles.cardCondition}>{patient.plan_name}</Text>
                  <View style={styles.cardMetaRow}>
                    <Text style={styles.cardMeta}>Next: {formatNextAppt(patient.next_appointment)}</Text>
                  </View>
                </View>
                <IconChevronRight size={16} color={c.text4} strokeWidth={2} />
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
  searchWrap: {
    paddingHorizontal: layout.s(16),
    paddingTop: layout.s(12),
    paddingBottom: layout.s(8),
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layout.s(10),
    backgroundColor: c.surface,
    borderRadius: layout.s(12),
    borderWidth: 1,
    borderColor: c.border,
    paddingHorizontal: layout.s(14),
    paddingVertical: layout.s(10),
  },
  searchInput: {
    flex: 1,
    fontSize: layout.f(14),
    color: c.text1,
    padding: 0,
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
  activeBadge: {
    paddingVertical: layout.s(3),
    paddingHorizontal: layout.s(9),
    borderRadius: layout.s(20),
    backgroundColor: c.statusGreenBg,
  },
  activeBadgeText: {
    fontSize: layout.f(10),
    fontWeight: '700',
    letterSpacing: 0.2,
    color: c.statusGreen,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: layout.s(16),
    paddingTop: layout.s(4),
    gap: layout.s(8),
  },
  patientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.surface,
    borderRadius: layout.s(14),
    borderWidth: 1,
    borderColor: c.border,
    padding: layout.s(14),
    gap: layout.s(12),
  },
  avatarCircle: {
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
  avatarText: {
    fontSize: layout.f(14),
    fontWeight: '700',
    color: c.teal,
  },
  cardBody: {
    flex: 1,
    gap: layout.s(3),
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: layout.s(8),
  },
  cardName: {
    fontSize: layout.f(14),
    fontWeight: '700',
    color: c.text1,
    flex: 1,
  },
  cardCondition: {
    fontSize: layout.f(12),
    color: c.text2,
    fontWeight: '500',
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layout.s(6),
  },
  cardMeta: {
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
    width: layout.s(52),
    height: layout.s(52),
    borderRadius: layout.s(26),
    backgroundColor: c.tealBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: layout.s(4),
  },
  emptyTitle: {
    fontSize: layout.f(15),
    fontWeight: '600',
    color: c.text2,
  },
  emptySub: {
    fontSize: layout.f(12),
    color: c.text3,
    textAlign: 'center',
  },
});
