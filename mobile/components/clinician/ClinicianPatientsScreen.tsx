import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { layout } from '../../constants/layout';
import { clinicianTheme as c } from './clinicianTheme';
import { IconSearch } from './clinicianIcons';
import { IconChevronRight } from '../user/userDesignAIcons';
import { MOCK_PATIENTS, PatientRow } from './clinicianMockData';

type FilterKey = 'all' | 'active' | 'review' | 'new' | 'stable';

type Props = {
  onOpenPatient: (patientId: string) => void;
};

function getStatusColor(status: PatientRow['status']): string {
  switch (status) {
    case 'active': return c.statusGreen;
    case 'review': return c.statusYellow;
    case 'new': return c.teal;
    case 'stable': return c.statusGray;
    default: return c.statusGray;
  }
}

function getStatusBg(status: PatientRow['status']): string {
  switch (status) {
    case 'active': return c.statusGreenBg;
    case 'review': return c.statusYellowBg;
    case 'new': return c.tealBg;
    case 'stable': return c.statusGrayBg;
    default: return c.statusGrayBg;
  }
}

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'review', label: 'Review' },
  { key: 'new', label: 'New' },
  { key: 'stable', label: 'Stable' },
];

export function ClinicianPatientsScreen({ onOpenPatient }: Props) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');

  const filtered = MOCK_PATIENTS.filter((p) => {
    const matchesFilter = filter === 'all' || p.status === filter;
    const matchesQuery =
      query.trim() === '' ||
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.condition.toLowerCase().includes(query.toLowerCase());
    return matchesFilter && matchesQuery;
  });

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + layout.s(16) }]}>
        <Text style={styles.headerTitle}>Patients</Text>
        <Text style={styles.headerSub}>{MOCK_PATIENTS.length} under your care</Text>
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

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setFilter(f.key)}
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

      {/* Patient list */}
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
              Try adjusting your search or filter.
            </Text>
          </View>
        ) : (
          filtered.map((patient) => (
            <TouchableOpacity
              key={patient.id}
              style={styles.patientCard}
              onPress={() => onOpenPatient(patient.id)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={`Open patient ${patient.name}`}
            >
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{patient.initials}</Text>
              </View>
              <View style={styles.cardBody}>
                <View style={styles.cardTopRow}>
                  <Text style={styles.cardName}>{patient.name}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusBg(patient.status) }]}>
                    <Text style={[styles.statusBadgeText, { color: getStatusColor(patient.status) }]}>
                      {patient.status.charAt(0).toUpperCase() + patient.status.slice(1)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.cardCondition}>{patient.condition}</Text>
                <View style={styles.cardMetaRow}>
                  <Text style={styles.cardMeta}>Age {patient.age}</Text>
                  <View style={styles.metaDot} />
                  <Text style={styles.cardMeta}>Last visit {patient.lastVisit}</Text>
                </View>
              </View>
              <IconChevronRight size={16} color={c.text4} strokeWidth={2} />
            </TouchableOpacity>
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
  filterScroll: {
    flexGrow: 0,
    paddingBottom: layout.s(4),
  },
  filterContent: {
    paddingHorizontal: layout.s(16),
    gap: layout.s(8),
    paddingBottom: layout.s(10),
  },
  filterChip: {
    paddingVertical: layout.s(6),
    paddingHorizontal: layout.s(16),
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
