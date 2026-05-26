import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { layout } from '../constants/layout';
import { userDesignATheme as uc } from './user/userDesignATheme';
import { clinicianTheme as cc } from './clinician/clinicianTheme';
import { IconChevronLeft } from './user/userDesignAIcons';

type Variant = 'user' | 'clinician';

type Props = {
  onBack: () => void;
  variant?: Variant;
};

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    body: 'By accessing or using the website and services provided by Island Echoes Health ("Services"), you agree to be bound by these Terms and Conditions. If you do not agree, you should not use the Services.',
  },
  {
    title: '2. Services Overview',
    body: 'Island Echoes Health provides integrative health, wellness, and educational services designed to support whole-person care. Services may include, but are not limited to, personalized consultations, care coordination, wellness programs, health education, and digital resources delivered through online or virtual platforms.\n\nServices are intended to support prevention, lifestyle improvement, and overall well-being, and may be offered to individuals locally or internationally, subject to applicable laws and provider availability.\n\nAll Services are subject to availability and may be modified, updated, or discontinued at any time without prior notice.',
  },
  {
    title: '3. Medical Disclaimer',
    body: 'The information and services provided by Island Echoes Health are for informational and wellness purposes only and are not intended as medical advice, diagnosis, or treatment.',
  },
  {
    title: '4. User Responsibilities',
    body: 'You agree to provide accurate and complete information when required, use the Services only for lawful purposes, and not interfere with or disrupt the functionality, security, or accessibility of the website or Services.',
  },
  {
    title: '5. Appointments and Payments',
    body: 'All appointments must be scheduled through the designated booking system and may require payment in advance. Fees for Services are subject to change at any time without notice.\n\nFailure to attend a scheduled appointment, including late arrival beyond a reasonable grace period, may result in forfeiture of payment.',
  },
  {
    title: '6. Cancellation and Refund Policy',
    body: 'Cancellations must be made at least 24–48 hours in advance. Late cancellations or missed appointments may not be eligible for a refund.\n\nRefunds, if any, are issued at the discretion of Island Echoes Health unless otherwise required by law.',
  },
  {
    title: '7. Privacy',
    body: 'Your use of the Services is also governed by the Island Echoes Health Privacy Policy. By using the Services, you consent to the collection, use, and storage of your information as described in that policy.',
  },
  {
    title: '8. Intellectual Property',
    body: 'All content on this website, including but not limited to text, graphics, logos, program materials, and digital resources, is the property of Island Echoes Health and is protected by applicable intellectual property laws.\n\nYou may not copy, reproduce, distribute, modify, or create derivative works without prior written permission.',
  },
  {
    title: '9. Limitation of Liability',
    body: 'To the fullest extent permitted by law, Island Echoes Health shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Services.\n\nIsland Echoes Health makes no guarantees regarding specific results or outcomes.',
  },
  {
    title: '10. Third-Party Links',
    body: 'The website may contain links to third-party websites or resources. Island Echoes Health is not responsible for the content, accuracy, or practices of any third-party sites and does not endorse them.',
  },
  {
    title: '11. Modifications to Terms',
    body: 'Island Echoes Health reserves the right to update or modify these Terms and Conditions at any time. Changes will be effective immediately upon posting. Continued use of the Services after changes are posted constitutes your acceptance of those changes.',
  },
  {
    title: '12. Governing Law',
    body: 'These Terms and Conditions are governed by and construed in accordance with the laws of the United States of America, without regard to conflict of law principles.',
  },
  {
    title: '13. Contact Information',
    body: 'Island Echoes Health\nEmail: info@islandechoeshealth.com\nWebsite: islandechoeshealth.com',
  },
];

export function TermsScreen({ onBack, variant = 'user' }: Props) {
  const insets = useSafeAreaInsets();
  const isClinician = variant === 'clinician';

  const colors = {
    bg: isClinician ? cc.bg : uc.off,
    header: isClinician ? cc.bg : uc.g900,
    backText: isClinician ? cc.teal : uc.y300,
    backIcon: isClinician ? cc.teal : uc.y300,
    title: isClinician ? cc.text1 : uc.white,
    subtitle: isClinician ? cc.text3 : 'rgba(255,255,255,0.5)',
    sectionBg: isClinician ? cc.surface : uc.white,
    sectionBorder: isClinician ? cc.border : 'rgba(0,0,0,0.04)',
    sectionTitle: isClinician ? cc.teal : uc.g700,
    sectionBody: isClinician ? cc.text2 : uc.text2,
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + layout.s(32) }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, { paddingTop: insets.top + layout.s(12), backgroundColor: colors.header }]}>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.85} onPress={onBack}>
            <IconChevronLeft size={14} color={colors.backIcon} />
            <Text style={[styles.backText, { color: colors.backText }]}>Back</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.title }]}>Terms and Conditions</Text>
          <Text style={[styles.subtitle, { color: colors.subtitle }]}>
            Island Echoes Health — Last updated: April 15, 2026
          </Text>
        </View>

        <View style={styles.content}>
          {SECTIONS.map((section) => (
            <View
              key={section.title}
              style={[styles.sectionCard, { backgroundColor: colors.sectionBg, borderColor: colors.sectionBorder }]}
            >
              <Text style={[styles.sectionTitle, { color: colors.sectionTitle }]}>{section.title}</Text>
              <Text style={[styles.sectionBody, { color: colors.sectionBody }]}>{section.body}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  header: {
    paddingHorizontal: layout.s(24),
    paddingBottom: layout.s(20),
    gap: layout.s(4),
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layout.s(6),
    marginBottom: layout.s(8),
  },
  backText: {
    fontSize: layout.f(12.5),
    fontWeight: '500',
  },
  title: {
    fontFamily: Platform.OS === 'ios' ? 'Playfair Display' : 'serif',
    fontSize: layout.f(22),
    fontWeight: '700',
  },
  subtitle: {
    fontSize: layout.f(11),
    fontWeight: '400',
    marginTop: layout.s(2),
  },
  content: {
    paddingHorizontal: layout.s(16),
    paddingTop: layout.s(20),
    gap: layout.s(12),
  },
  sectionCard: {
    borderRadius: layout.s(14),
    borderWidth: 1,
    paddingHorizontal: layout.s(16),
    paddingVertical: layout.s(14),
    gap: layout.s(6),
  },
  sectionTitle: {
    fontSize: layout.f(12),
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  sectionBody: {
    fontSize: layout.f(13),
    lineHeight: layout.f(13 * 1.6),
    fontWeight: '400',
  },
});
