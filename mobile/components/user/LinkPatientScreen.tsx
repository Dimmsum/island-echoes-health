import React, { useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { layout } from '../../constants/layout';
import { userDesignATheme as c } from './userDesignATheme';
import { IconChevronLeft } from './userDesignAIcons';
import { useUserHomeData } from '../../lib/userHome';
import { createPaymentForPlanMobile } from '../../lib/sponsorship';
import { useStripe } from '@stripe/stripe-react-native';

type Props = {
  onBack: () => void;
};

export function LinkPatientScreen({ onBack }: Props) {
  const insets = useSafeAreaInsets();
  const home = useUserHomeData();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [email, setEmail] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const carePlans =
    home.status === 'loaded'
      ? home.data.carePlans
      : [];

  const handleSubmit = async () => {
    setError(null);
    setSuccess(false);
    if (!email.trim() || !selectedPlanId) {
      setError('Enter a patient email and choose a care plan.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await createPaymentForPlanMobile(email, selectedPlanId);
      if ('error' in res) {
        setError(res.error);
        setSubmitting(false);
        return;
      }

      const initResult = await initPaymentSheet({
        paymentIntentClientSecret: res.clientSecret,
      });
      if (initResult.error) {
        setError(initResult.error.message ?? 'Failed to start payment sheet.');
        setSubmitting(false);
        return;
      }

      const presentResult = await presentPaymentSheet();
      if (presentResult.error) {
        setError(presentResult.error.message ?? 'Payment was cancelled.');
        setSubmitting(false);
        return;
      }

      setSuccess(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + layout.s(24) }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, { paddingTop: insets.top + layout.s(12) }]}>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.85} onPress={onBack}>
            <IconChevronLeft size={14} color={c.y300} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Link a patient</Text>
          <Text style={styles.subtitle}>
            Enter your patient&apos;s email and choose a care plan to start sponsorship.
          </Text>
        </View>

        <View style={styles.content}>
          <View style={styles.card}>
            <Text style={styles.label}>Patient email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
              placeholder="patient@email.com"
              placeholderTextColor={c.text3}
            />

            <Text style={[styles.label, { marginTop: layout.s(14) }]}>Care plan</Text>
            {home.status === 'loading' && (
              <Text style={styles.helper}>Loading plans…</Text>
            )}
            {home.status === 'error' && (
              <Text style={[styles.helper, { color: '#c0392b' }]}>{home.error}</Text>
            )}
            {home.status === 'loaded' && carePlans.length === 0 && (
              <Text style={styles.helper}>No care plans are configured yet.</Text>
            )}
            {home.status === 'loaded' && carePlans.map((plan) => {
              const active = selectedPlanId === plan.id;
              const price = plan.price_cents != null ? `$${(plan.price_cents / 100).toFixed(0)} / mo` : null;
              const features = plan.features ?? [];
              return (
                <TouchableOpacity
                  key={plan.id}
                  style={[styles.planCard, active && styles.planCardActive]}
                  activeOpacity={0.85}
                  onPress={() => setSelectedPlanId(plan.id)}
                >
                  <View style={styles.planHeader}>
                    <Text style={[styles.planName, active && styles.planNameActive]}>{plan.name}</Text>
                    {price && <Text style={styles.planPrice}>{price}</Text>}
                  </View>
                  {features.length > 0 && (
                    <View style={styles.planFeatureList}>
                      {features.slice(0, 4).map((feat, idx) => (
                        <Text key={idx} style={styles.planFeatureItem}>
                          • {feat}
                        </Text>
                      ))}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}

            {error && <Text style={styles.errorText}>{error}</Text>}
            {success && (
              <Text style={styles.successText}>
                Request sent. Your patient will receive a consent notification.
              </Text>
            )}

            <TouchableOpacity
              style={[styles.submitBtn, (!email.trim() || !selectedPlanId || submitting) && styles.submitBtnDisabled]}
              activeOpacity={0.9}
              disabled={!email.trim() || !selectedPlanId || submitting}
              onPress={handleSubmit}
            >
              <Text style={styles.submitText}>{submitting ? 'Sending…' : 'Send sponsorship request'}</Text>
            </TouchableOpacity>
          </View>
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
    paddingBottom: layout.s(20),
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
    marginBottom: layout.s(6),
  },
  subtitle: {
    fontSize: layout.f(12),
    color: 'rgba(255,255,255,0.6)',
    lineHeight: layout.f(12 * 1.6),
  },
  content: {
    paddingHorizontal: layout.s(20),
    paddingTop: layout.s(16),
  },
  card: {
    backgroundColor: c.white,
    borderRadius: layout.s(16),
    paddingVertical: layout.s(18),
    paddingHorizontal: layout.s(18),
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
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.08)',
    borderRadius: layout.s(10),
    paddingVertical: layout.s(9),
    paddingHorizontal: layout.s(12),
    fontSize: layout.f(13.5),
    color: c.text1,
    backgroundColor: c.off,
  },
  helper: {
    fontSize: layout.f(11.5),
    color: c.text3,
    marginBottom: layout.s(8),
  },
  planCard: {
    marginTop: layout.s(8),
    borderRadius: layout.s(12),
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.06)',
    paddingVertical: layout.s(10),
    paddingHorizontal: layout.s(12),
    backgroundColor: c.off,
  },
  planCardActive: {
    borderColor: c.g500,
    backgroundColor: c.g50,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: layout.s(4),
  },
  planName: {
    fontSize: layout.f(13),
    color: c.text1,
  },
  planNameActive: {
    fontWeight: '600',
    color: c.g700,
  },
  planPrice: {
    fontSize: layout.f(12),
    fontWeight: '600',
    color: c.g700,
  },
  planFeatureList: {
    marginTop: layout.s(4),
  },
  planFeatureItem: {
    fontSize: layout.f(11),
    color: c.text3,
    lineHeight: layout.f(11 * 1.4),
  },
  errorText: {
    fontSize: layout.f(11.5),
    color: '#c0392b',
    marginTop: layout.s(10),
  },
  successText: {
    fontSize: layout.f(11.5),
    color: c.g700,
    marginTop: layout.s(10),
  },
  submitBtn: {
    marginTop: layout.s(16),
    borderRadius: layout.s(10),
    paddingVertical: layout.s(11),
    alignItems: 'center',
    backgroundColor: c.g700,
  },
  submitBtnDisabled: {
    backgroundColor: '#b7c9bf',
  },
  submitText: {
    fontSize: layout.f(13),
    fontWeight: '600',
    color: c.white,
  },
});

