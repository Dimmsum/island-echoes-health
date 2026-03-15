import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { theme } from '../../constants/theme';
import { layout } from '../../constants/layout';
import { signInWithPassword } from '../../lib/auth';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export function SignInPanel({ visible, onClose, onSuccess }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const slideAnim = useRef(new Animated.Value(layout.height)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }).start();
    } else {
      slideAnim.setValue(layout.height);
    }
  }, [visible, slideAnim]);

  const handleSignIn = async () => {
    setError(null);
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError('Please enter email and password.');
      return;
    }
    setLoading(true);
    const result = await signInWithPassword(trimmedEmail, password);
    setLoading(false);
    if ('error' in result) {
      setError(result.error);
      return;
    }
    onSuccess();
  };

  if (!visible) return null;

  return (
    <Animated.View style={[styles.panel, { transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onClose} activeOpacity={0.85}>
          <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
            <Path d="M14 9H4M8 14L3 9L8 4" stroke="white" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.title}>Sign in</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <Text style={styles.sub}>Enter your account details.</Text>

        {error ? (
          <View style={styles.errorWrap}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor="rgba(255,255,255,0.2)"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.input, styles.inputFlex]}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor="rgba(255,255,255,0.2)"
              secureTextEntry={!showPass}
              editable={!loading}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowPass((p) => !p)}
              activeOpacity={0.7}
            >
              <Text style={styles.eyeText}>{showPass ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSignIn}
          activeOpacity={0.85}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={theme.green} size="small" />
          ) : (
            <Text style={styles.submitBtnText}>Sign in</Text>
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  panel: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.green,
    zIndex: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layout.s(12),
    paddingTop: layout.s(44),
    paddingHorizontal: layout.s(24),
    paddingBottom: layout.s(16),
  },
  backBtn: {
    width: layout.s(40),
    height: layout.s(40),
    borderRadius: layout.s(20),
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: layout.f(22),
    fontWeight: '600',
    color: theme.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: layout.s(28),
    paddingTop: layout.s(8),
  },
  sub: {
    fontSize: layout.f(14),
    color: 'rgba(255,255,255,0.6)',
    marginBottom: layout.s(24),
  },
  errorWrap: {
    backgroundColor: 'rgba(255,100,100,0.15)',
    borderRadius: layout.s(12),
    paddingVertical: layout.s(10),
    paddingHorizontal: layout.s(14),
    marginBottom: layout.s(16),
  },
  errorText: {
    fontSize: layout.f(13),
    color: '#ffb3b3',
  },
  field: {
    marginBottom: layout.s(18),
  },
  label: {
    fontSize: layout.f(12),
    fontWeight: '500',
    color: 'rgba(255,255,255,0.5)',
    marginBottom: layout.s(6),
  },
  input: {
    height: layout.s(52),
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: layout.s(14),
    paddingHorizontal: layout.s(16),
    fontSize: layout.f(16),
    color: theme.white,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  inputFlex: {
    flex: 1,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: layout.s(14),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  eyeBtn: {
    paddingHorizontal: layout.s(14),
    height: layout.s(52),
    justifyContent: 'center',
  },
  eyeText: {
    fontSize: layout.f(13),
    color: theme.gold,
    fontWeight: '500',
  },
  submitBtn: {
    width: '100%',
    height: layout.s(58),
    backgroundColor: theme.gold,
    borderRadius: layout.s(18),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: layout.s(24),
  },
  submitBtnDisabled: {
    opacity: 0.9,
  },
  submitBtnText: {
    fontSize: layout.f(16),
    fontWeight: '600',
    color: theme.green,
    letterSpacing: 0.5,
  },
});
