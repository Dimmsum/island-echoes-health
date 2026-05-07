import React, { useState } from 'react';
import { Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { layout } from '../../constants/layout';
import { userDesignATheme as c } from './userDesignATheme';
import { IconChevronLeft } from './userDesignAIcons';

type Props = {
  onBack: () => void;
  onSignOut: () => void;
  onOpenTerms: () => void;
};

export function SettingsScreen({ onBack, onSignOut, onOpenTerms }: Props) {
  const insets = useSafeAreaInsets();
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + layout.s(16) }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, { paddingTop: insets.top + layout.s(12) }]}>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.85} onPress={onBack}>
            <IconChevronLeft size={14} color={c.y300} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Settings</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Legal</Text>
            <TouchableOpacity
              style={styles.rowButton}
              activeOpacity={0.85}
              onPress={onOpenTerms}
            >
              <Text style={styles.rowLabel}>Terms & Conditions</Text>
              <Text style={styles.rowLabelSub}>View our terms of service</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.section, { marginTop: layout.s(12) }]}>
            <Text style={styles.sectionLabel}>Account</Text>
            <TouchableOpacity
              style={styles.rowButton}
              activeOpacity={0.85}
              onPress={() => setShowSignOutConfirm(true)}
            >
              <Text style={styles.rowLabel}>Sign out</Text>
              <Text style={styles.rowLabelSub}>Sign out of Island Echoes Health</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <Modal
        transparent
        visible={showSignOutConfirm}
        animationType="fade"
        onRequestClose={() => setShowSignOutConfirm(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Sign out?</Text>
            <Text style={styles.modalBody}>Are you sure you want to sign out of Island Echoes Health?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancel]}
                activeOpacity={0.85}
                onPress={() => setShowSignOutConfirm(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirm]}
                activeOpacity={0.85}
                onPress={() => {
                  setShowSignOutConfirm(false);
                  onSignOut();
                }}
              >
                <Text style={styles.modalConfirmText}>Yes, sign out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.off },
  scroll: { flex: 1 },
  header: {
    backgroundColor: c.g900,
    paddingHorizontal: layout.s(24),
    paddingBottom: layout.s(16),
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layout.s(6),
    marginBottom: layout.s(8),
  },
  backText: {
    color: c.y300,
    fontSize: layout.f(12.5),
    fontWeight: '500',
  },
  title: {
    fontFamily: Platform.OS === 'ios' ? 'Playfair Display' : 'serif',
    color: c.white,
    fontSize: layout.f(20),
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: layout.s(20),
    paddingTop: layout.s(16),
  },
  section: {
    backgroundColor: c.white,
    borderRadius: layout.s(16),
    paddingHorizontal: layout.s(16),
    paddingVertical: layout.s(12),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  sectionLabel: {
    fontSize: layout.f(11),
    fontWeight: '600',
    color: c.text3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: layout.s(10),
  },
  rowButton: {
    paddingVertical: layout.s(10),
  },
  rowLabel: {
    fontSize: layout.f(14),
    fontWeight: '600',
    color: c.text1,
    marginBottom: layout.s(2),
  },
  rowLabelSub: {
    fontSize: layout.f(11.5),
    color: c.text3,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: layout.s(24),
  },
  modalCard: {
    width: '100%',
    maxWidth: layout.s(340),
    backgroundColor: c.white,
    borderRadius: layout.s(16),
    paddingVertical: layout.s(18),
    paddingHorizontal: layout.s(18),
  },
  modalTitle: {
    fontSize: layout.f(16),
    fontWeight: '600',
    color: c.text1,
    marginBottom: layout.s(6),
  },
  modalBody: {
    fontSize: layout.f(13),
    color: c.text3,
    lineHeight: layout.f(13 * 1.5),
    marginBottom: layout.s(16),
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: layout.s(8),
  },
  modalButton: {
    borderRadius: layout.s(10),
    paddingVertical: layout.s(9),
    paddingHorizontal: layout.s(14),
  },
  modalCancel: {
    backgroundColor: c.g50,
  },
  modalConfirm: {
    backgroundColor: c.g700,
  },
  modalCancelText: {
    fontSize: layout.f(13),
    fontWeight: '500',
    color: c.text1,
  },
  modalConfirmText: {
    fontSize: layout.f(13),
    fontWeight: '600',
    color: c.white,
  },
});

