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
  ScrollView,
  Easing,
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { theme } from '../../constants/theme';
import { layout } from '../../constants/layout';
import { signInWithPassword } from '../../lib/auth';

type SignInRole = 'user' | 'clinic';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  /** "Don't have an account? Sign up" / "Create one" – close sign-in and show role select. */
  onSignUpPress?: () => void;
  /** "Clinic not registered? Apply to join" – close sign-in and open clinic sign-up. */
  onClinicSignUpPress?: () => void;
};

const easing = Easing.bezier(0.77, 0, 0.175, 1);

export function SignInPanel({ visible, onClose, onSuccess, onSignUpPress, onClinicSignUpPress }: Props) {
  const [view, setView] = useState<'role' | 'user'>('role');
  const [selectedRole, setSelectedRole] = useState<SignInRole | null>(null);
  const [clinicLayerVisible, setClinicLayerVisible] = useState(false);
  const [mfaVisible, setMfaVisible] = useState(false);
  const [mfaFor, setMfaFor] = useState<SignInRole | null>(null);
  const [mfaMethod, setMfaMethod] = useState<'email' | 'phone'>('email');

  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userError, setUserError] = useState<string | null>(null);
  const [userLoading, setUserLoading] = useState(false);
  const [showUserPass, setShowUserPass] = useState(false);

  const [clinicId, setClinicId] = useState('');
  const [clinicPassword, setClinicPassword] = useState('');
  const [clinicError, setClinicError] = useState<string | null>(null);
  const [clinicLoading, setClinicLoading] = useState(false);
  const [showClinicPass, setShowClinicPass] = useState(false);

  const [mfaCode, setMfaCode] = useState(['', '', '', '', '', '']);
  const [mfaError, setMfaError] = useState<string | null>(null);
  const mfaInputRefs = useRef<(TextInput | null)[]>([]);

  const panelAnim = useRef(new Animated.Value(layout.height)).current;
  const reelAnim = useRef(new Animated.Value(0)).current;
  const clinicLayerAnim = useRef(new Animated.Value(layout.width)).current;
  const mfaLayerAnim = useRef(new Animated.Value(layout.height)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(panelAnim, { toValue: 0, duration: 500, useNativeDriver: true, easing }).start();
    } else {
      panelAnim.setValue(layout.height);
      setView('role');
      setSelectedRole(null);
      setClinicLayerVisible(false);
      setMfaVisible(false);
      clinicLayerAnim.setValue(layout.width);
      mfaLayerAnim.setValue(layout.height);
      reelAnim.setValue(0);
    }
  }, [visible, panelAnim, clinicLayerAnim, mfaLayerAnim, reelAnim]);

  const handleContinue = () => {
    if (selectedRole === 'user') {
      setView('user');
      Animated.timing(reelAnim, { toValue: 1, duration: 450, useNativeDriver: true, easing }).start();
    } else if (selectedRole === 'clinic') {
      setClinicLayerVisible(true);
      Animated.timing(clinicLayerAnim, { toValue: 0, duration: 450, useNativeDriver: true, easing }).start();
    }
  };

  const closeClinicLayer = () => {
    Animated.timing(clinicLayerAnim, { toValue: layout.width, duration: 450, useNativeDriver: true, easing }).start(() => {
      setClinicLayerVisible(false);
    });
  };

  const closeMfa = () => {
    Animated.timing(mfaLayerAnim, { toValue: layout.height, duration: 450, useNativeDriver: true, easing }).start(() => {
      setMfaVisible(false);
      setMfaFor(null);
    });
  };

  const handleBackFromUser = () => {
    if (view === 'user') {
      setView('role');
      Animated.timing(reelAnim, { toValue: 0, duration: 450, useNativeDriver: true, easing }).start();
    } else {
      onClose();
    }
  };

  const handleSignInUser = async () => {
    setUserError(null);
    const email = userEmail.trim();
    if (!email || !email.includes('@')) {
      setUserError('Please enter a valid email address.');
      return;
    }
    if (!userPassword) {
      setUserError('Please enter your password.');
      return;
    }
    setUserLoading(true);
    const result = await signInWithPassword(email, userPassword);
    setUserLoading(false);
    if ('error' in result) {
      setUserError(result.error);
      return;
    }
    onSuccess();
  };

  const handleSignInClinic = async () => {
    setClinicError(null);
    const email = clinicId.trim();
    if (!email || !email.includes('@')) {
      setClinicError('Please enter your registered clinic email address.');
      return;
    }
    if (!clinicPassword) {
      setClinicError('Please enter your staff password.');
      return;
    }
    setClinicLoading(true);
    const result = await signInWithPassword(email, clinicPassword);
    setClinicLoading(false);
    if ('error' in result) {
      setClinicError(result.error);
      return;
    }
    closeClinicLayer();
    onClose();
    onSuccess();
  };

  const handleMfaVerify = () => {
    const code = mfaCode.join('');
    if (code.length < 6) {
      setMfaError('Please enter the full 6-digit code.');
      return;
    }
    closeMfa();
    if (clinicLayerVisible) closeClinicLayer();
    onClose();
    onSuccess();
  };

  const handleForgotUser = () => {
    setUserError('Password reset instructions will be sent to your email.');
    setTimeout(() => setUserError(null), 3500);
  };

  const handleForgotClinic = () => {
    setClinicError('Password reset instructions will be sent to your clinic email.');
    setTimeout(() => setClinicError(null), 3500);
  };

  const handleMfaResend = () => {
    setMfaError(null);
  };

  const handleSwitchMfaMethod = () => {
    setMfaMethod((m) => (m === 'email' ? 'phone' : 'email'));
  };

  const handleSignUpPress = () => {
    onSignUpPress?.() ?? onClose();
  };

  const handleClinicSignUpPress = () => {
    if (onClinicSignUpPress) {
      onClinicSignUpPress();
      return;
    }
    closeClinicLayer();
    onClose();
  };

  const updateMfaDigit = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...mfaCode];
    next[index] = digit;
    setMfaCode(next);
    setMfaError(null);
    if (digit && index < 5) mfaInputRefs.current[index + 1]?.focus();
  };

  const handleMfaKeyDown = (index: number, key: string) => {
    if (key === 'Backspace' && !mfaCode[index] && index > 0) {
      mfaInputRefs.current[index - 1]?.focus();
    }
  };

  if (!visible) return null;

  const reelTranslateX = reelAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -layout.width] });

  return (
    <Animated.View style={[styles.panel, { transform: [{ translateY: panelAnim }] }]}>
      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* ─── Header (shared for role + user) ─── */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBackFromUser} activeOpacity={0.85}>
            <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
              <Path d="M17 11H5M10 16L5 11L10 6" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
          {view === 'user' ? <Text style={styles.headerLabel}>Sign in</Text> : <View style={styles.headerSpacer} />}
        </View>

        {/* ─── Reel: View 0 = Role chooser, View 1 = User form ─── */}
        <View style={styles.reelWrapper}>
          <Animated.View style={[styles.reel, { transform: [{ translateX: reelTranslateX }] }]}>
            {/* VIEW 0: Role chooser */}
            <View style={styles.reelPage}>
            <ScrollView
              style={styles.roleChooserScroll}
              contentContainerStyle={styles.roleChooserScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.roleChooserTop}>
                <View style={styles.roleChooserContent}>
                  <Text style={styles.roleEyebrow}>WELCOME BACK</Text>
<Text style={styles.roleTitle}>
                  Sign in{'\n'}as <Text style={styles.roleTitleEm}>who?</Text>
                </Text>
                  <Text style={styles.roleSub}>Choose how you&apos;d like to access Island Echoes Health.</Text>
                </View>
                <View style={styles.roleTiles}>
                  <TouchableOpacity
                    style={[styles.tile, selectedRole === 'user' && styles.tileSelected]}
                    onPress={() => setSelectedRole('user')}
                    activeOpacity={0.97}
                  >
                    <View style={[styles.tileIcon, { backgroundColor: 'rgba(231,211,28,0.12)' }]}>
                      <Svg width={28} height={28} viewBox="0 0 28 28" fill="none">
                        <Circle cx={14} cy={10} r={5.5} fill="rgba(231,211,28,0.8)" />
                        <Path d="M5 24C5 19.6 9.1 16 14 16C18.9 16 23 19.6 23 24" stroke="rgba(231,211,28,0.8)" strokeWidth={2} strokeLinecap="round" />
                      </Svg>
                    </View>
                    <Text style={styles.tileLabel} numberOfLines={2}>Sponsor or Patient</Text>
                    <Text style={styles.tileSub} numberOfLines={1}>Personal account</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.tile, selectedRole === 'clinic' && styles.tileSelected]}
                    onPress={() => setSelectedRole('clinic')}
                    activeOpacity={0.97}
                  >
                    <View style={[styles.tileIcon, { backgroundColor: 'rgba(93,202,165,0.12)' }]}>
                      <Svg width={28} height={28} viewBox="0 0 28 28" fill="none">
                        <Rect x={4} y={12} width={20} height={14} rx={2.5} stroke="rgba(93,202,165,0.8)" strokeWidth={1.8} fill="none" />
                        <Path d="M8 12V9C8 7 9.5 5.5 11.5 5.5H16.5C18.5 5.5 20 7 20 9V12" stroke="rgba(93,202,165,0.8)" strokeWidth={1.8} fill="none" />
                        <Rect x={12} y={16.5} width={4.5} height={1.8} rx={0.9} fill="rgba(93,202,165,0.8)" />
                        <Rect x={13.6} y={14.8} width={1.8} height={5} rx={0.9} fill="rgba(93,202,165,0.8)" />
                      </Svg>
                    </View>
                    <Text style={styles.tileLabel} numberOfLines={2}>Clinician</Text>
                    <Text style={styles.tileSub} numberOfLines={1}>Clinic account</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.roleChooserBottom}>
                <TouchableOpacity
                  style={[styles.continueBtn, !selectedRole && styles.continueBtnDisabled]}
                  onPress={handleContinue}
                  activeOpacity={0.97}
                  disabled={!selectedRole}
                >
                  <Text style={styles.continueBtnText}>Continue</Text>
                </TouchableOpacity>
                <View style={styles.orDivider}>
                  <View style={styles.orLine} />
                  <Text style={styles.orText}>OR</Text>
                  <View style={styles.orLine} />
                </View>
                <TouchableOpacity
                  style={styles.googleSignInBtn}
                  onPress={() => {}}
                  activeOpacity={0.97}
                >
                  <Svg width={20} height={20} viewBox="0 0 24 24">
                    <Path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <Path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <Path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <Path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </Svg>
                  <Text style={styles.googleSignInBtnText}>Sign in with Google</Text>
                </TouchableOpacity>
                <View style={styles.roleFooter}>
                  <View style={styles.roleFooterDivider} />
                  <TouchableOpacity style={styles.signUpNudge} onPress={handleSignUpPress} activeOpacity={0.8}>
                    <Text style={styles.signUpNudgeText}>Don&apos;t have an account? </Text>
                    <Text style={styles.signUpNudgeLink}>Sign up</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>

          {/* VIEW 1: User sign-in form */}
          <View style={[styles.reelPage, styles.userFormPage]}>
            <ScrollView
              style={styles.scrollContent}
              contentContainerStyle={styles.scrollContentInner}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.userBadge}>
                <Svg width={10} height={10} viewBox="0 0 10 10" fill="none">
                  <Circle cx={5} cy={4} r={2.2} fill="rgba(231,211,28,0.9)" />
                  <Path d="M1 9C1 6.8 2.8 5 5 5S9 6.8 9 9" stroke="rgba(231,211,28,0.9)" strokeWidth={1.3} strokeLinecap="round" />
                </Svg>
                <Text style={styles.userBadgeText}>Sponsor / Patient</Text>
              </View>
              <Text style={styles.welcomeTitle}>
                Welcome{'\n'}<Text style={styles.welcomeTitleEm}>back.</Text>
              </Text>
              <Text style={styles.welcomeSub}>Sign in to your Island Echoes account.</Text>

              <View style={styles.field}>
                <Text style={styles.label}>Email address</Text>
                <TextInput
                  style={styles.input}
                  value={userEmail}
                  onChangeText={(t) => { setUserEmail(t); setUserError(null); }}
                  placeholder="you@example.com"
                  placeholderTextColor="rgba(255,255,255,0.2)"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!userLoading}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.passWrap}>
                  <TextInput
                    style={[styles.input, styles.inputFlex]}
                    value={userPassword}
                    onChangeText={(t) => { setUserPassword(t); setUserError(null); }}
                    placeholder="Your password"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    secureTextEntry={!showUserPass}
                    editable={!userLoading}
                  />
                  <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowUserPass((p) => !p)} activeOpacity={0.7}>
                    <Text style={styles.eyeText}>{showUserPass ? 'Hide' : 'Show'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity style={styles.forgotWrap} onPress={handleForgotUser} activeOpacity={0.8}>
                <Text style={styles.forgot}>Forgot password?</Text>
              </TouchableOpacity>
              {userError ? <Text style={[styles.errorText, userError.includes('reset') && styles.errorTextHint]}>{userError}</Text> : null}
            </ScrollView>
            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.submitBtn, userLoading && styles.submitBtnDisabled]}
                onPress={handleSignInUser}
                activeOpacity={0.97}
                disabled={userLoading}
              >
                {userLoading ? (
                  <ActivityIndicator color={theme.green} size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>Sign in →</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.signUpRow} onPress={handleSignUpPress} activeOpacity={0.8}>
                <Text style={styles.signUpRowText}>Don&apos;t have an account? </Text>
                <Text style={styles.signUpRowLink}>Create one</Text>
              </TouchableOpacity>
            </View>
          </View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>

      {/* ─── Clinic layer (slides from right) ─── */}
      {clinicLayerVisible && (
        <Animated.View style={[styles.overlayLayer, styles.clinicLayer, { transform: [{ translateX: clinicLayerAnim }] }]}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={closeClinicLayer} activeOpacity={0.85}>
              <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
                <Path d="M17 11H5M10 16L5 11L10 6" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </TouchableOpacity>
            <Text style={styles.headerLabel}>Clinician sign in</Text>
          </View>
          <ScrollView
            style={styles.scrollContent}
            contentContainerStyle={[styles.scrollContentInner, styles.clinicFormInner]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.clinicianBadge}>
              <Svg width={10} height={10} viewBox="0 0 10 10" fill="none">
                <Rect x={1} y={3.5} width={8} height={6} rx={1.2} stroke="rgba(93,202,165,0.9)" strokeWidth={1} fill="none" />
                <Path d="M3 3.5V2.5C3 1.7 3.7 1 4.5 1H5.5C6.3 1 7 1.7 7 2.5V3.5" stroke="rgba(93,202,165,0.9)" strokeWidth={1} fill="none" />
                <Rect x={4.1} y={5.5} width={1.8} height={1.1} rx={0.5} fill="rgba(93,202,165,0.9)" />
                <Rect x={4.6} y={4.5} width={0.8} height={3} rx={0.4} fill="rgba(93,202,165,0.9)" />
              </Svg>
              <Text style={styles.clinicianBadgeText}>Clinician access</Text>
            </View>
            <Text style={styles.welcomeTitle}>
              Clinic{'\n'}<Text style={[styles.welcomeTitleEm, { color: theme.accentTeal }]}>portal.</Text>
            </Text>
            <Text style={styles.welcomeSub}>Access your clinic dashboard and patient records.</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Clinic email</Text>
              <TextInput
                style={styles.input}
                value={clinicId}
                onChangeText={(t) => { setClinicId(t); setClinicError(null); }}
                placeholder="you@clinic.com"
                placeholderTextColor="rgba(255,255,255,0.2)"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!clinicLoading}
              />
              <Text style={styles.hint}>Use the email address registered with your clinic account.</Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Staff password</Text>
              <View style={styles.passWrap}>
                <TextInput
                  style={[styles.input, styles.inputFlex]}
                  value={clinicPassword}
                  onChangeText={(t) => { setClinicPassword(t); setClinicError(null); }}
                  placeholder="Your staff password"
                  placeholderTextColor="rgba(255,255,255,0.2)"
                  secureTextEntry={!showClinicPass}
                  editable={!clinicLoading}
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowClinicPass((p) => !p)} activeOpacity={0.7}>
                  <Text style={styles.eyeText}>{showClinicPass ? 'Hide' : 'Show'}</Text>
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity style={styles.forgotWrap} onPress={handleForgotClinic} activeOpacity={0.8}>
              <Text style={styles.forgot}>Forgot password?</Text>
            </TouchableOpacity>
            {clinicError ? <Text style={[styles.errorText, clinicError.includes('reset') && styles.errorTextHint]}>{clinicError}</Text> : null}

            <View style={styles.mfaNotice}>
              <Svg width={18} height={18} viewBox="0 0 18 18" fill="none" style={styles.mfaNoticeIcon}>
                <Circle cx={9} cy={9} r={7.5} stroke="rgba(93,202,165,0.7)" strokeWidth={1.2} />
                <Path d="M9 6V9.5" stroke="rgba(93,202,165,0.7)" strokeWidth={1.4} strokeLinecap="round" />
                <Circle cx={9} cy={12} r={0.7} fill="rgba(93,202,165,0.7)" />
              </Svg>
              <Text style={styles.mfaNoticeText}>
                Clinic accounts require <Text style={styles.mfaNoticeStrong}>two-factor authentication</Text>. You&apos;ll verify via a code sent to your registered email or phone.
              </Text>
            </View>
          </ScrollView>
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.submitBtn, styles.submitBtnTeal, clinicLoading && styles.submitBtnDisabled]}
              onPress={handleSignInClinic}
              activeOpacity={0.97}
              disabled={clinicLoading}
            >
              {clinicLoading ? (
                <ActivityIndicator color="#002e18" size="small" />
              ) : (
                <Text style={styles.submitBtnTextTeal}>Access clinic portal →</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.signUpRow} onPress={handleClinicSignUpPress} activeOpacity={0.8}>
              <Text style={styles.signUpRowText}>Clinic not registered? </Text>
              <Text style={styles.signUpRowLink}>Apply to join</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* ─── MFA layer (slides from bottom) ─── */}
      {mfaVisible && (
        <Animated.View style={[styles.overlayLayer, styles.mfaLayer, { transform: [{ translateY: mfaLayerAnim }] }]}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={closeMfa} activeOpacity={0.85}>
              <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
                <Path d="M17 11H5M10 16L5 11L10 6" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </TouchableOpacity>
            <Text style={styles.headerLabel}>{mfaFor === 'clinic' ? 'Clinic two-factor auth' : 'Two-factor verification'}</Text>
          </View>
          <ScrollView
            style={styles.scrollContent}
            contentContainerStyle={styles.mfaContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.mfaIconWrap, mfaFor === 'clinic' && styles.mfaIconWrapTeal]}>
              <Svg width={30} height={30} viewBox="0 0 30 30" fill="none">
                <Rect x={6} y={3} width={18} height={24} rx={4} stroke="rgba(231,211,28,0.7)" strokeWidth={1.5} />
                <Rect x={11} y={8} width={8} height={1.5} rx={0.75} fill="rgba(231,211,28,0.4)" />
                <Rect x={11} y={12} width={8} height={1.5} rx={0.75} fill="rgba(231,211,28,0.4)" />
                <Rect x={11} y={16} width={5} height={1.5} rx={0.75} fill="rgba(231,211,28,0.4)" />
                <Circle cx={20} cy={21} r={5} fill={theme.green} stroke="rgba(231,211,28,0.7)" strokeWidth={1} />
                <Path d="M17.5 21L19 22.5L22.5 19" stroke={theme.gold} strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </View>
            <Text style={styles.mfaTitle}>
              Verify it&apos;s{'\n'}<Text style={styles.welcomeTitleEm}>you</Text>
            </Text>
            <Text style={styles.mfaSub}>
              {mfaFor === 'clinic'
                ? 'Enter the 6-digit code we sent to your clinic&apos;s registered email.'
                : 'Enter the 6-digit code we sent to your registered email address.'}
            </Text>
            <View style={styles.otpRow}>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <TextInput
                  key={i}
                  ref={(r) => { mfaInputRefs.current[i] = r; }}
                  style={[styles.otpBox, mfaCode[i] && styles.otpBoxFilled]}
                  value={mfaCode[i]}
                  onChangeText={(v) => updateMfaDigit(i, v)}
                  onKeyPress={({ nativeEvent }) => handleMfaKeyDown(i, nativeEvent.key)}
                  maxLength={1}
                  keyboardType="number-pad"
                  placeholder=""
                  placeholderTextColor="rgba(255,255,255,0.2)"
                />
              ))}
            </View>
            {mfaError ? <Text style={styles.errorText}>{mfaError}</Text> : null}
            <View style={styles.resendRow}>
              <Text style={styles.resendText}>Didn&apos;t receive a code? </Text>
              <TouchableOpacity onPress={handleMfaResend} activeOpacity={0.8}>
                <Text style={styles.resendLink}>Resend</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.mfaSwitch} onPress={handleSwitchMfaMethod} activeOpacity={0.9}>
              <Text style={styles.mfaSwitchText}>
                {mfaMethod === 'email' ? 'Switch to phone verification instead' : 'Switch to email verification instead'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.submitBtn, mfaFor === 'clinic' && styles.submitBtnTeal]}
              onPress={handleMfaVerify}
              activeOpacity={0.97}
            >
              <Text style={[styles.submitBtnText, mfaFor === 'clinic' && styles.submitBtnTextTeal]}>Verify & sign in →</Text>
            </TouchableOpacity>
            <Text style={styles.mfaFooterText}>Having trouble? Contact support</Text>
          </View>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
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
    width: layout.s(52),
    height: layout.s(52),
    borderRadius: layout.s(16),
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.13)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLabel: {
    flex: 1,
    fontSize: layout.f(13),
    fontWeight: '500',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0.5,
  },
  headerSpacer: { flex: 1 },
  reelWrapper: {
    flex: 1,
    width: layout.width,
    overflow: 'hidden',
    minHeight: 0,
  },
  reel: {
    width: layout.width * 2,
    flexDirection: 'row',
    minHeight: 0,
    flex: 1,
  },
  reelPage: {
    width: layout.width,
    flexShrink: 0,
    minHeight: 0,
    flex: 1,
  },
  roleChooserScroll: {
    flex: 1,
  },
  roleChooserScrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingTop: layout.s(24),
    paddingBottom: layout.s(40),
  },
  roleChooserTop: {
    flex: 1,
  },
  roleChooserBottom: {
    paddingTop: 0,
    marginTop: -layout.s(32),
  },
  roleChooserContent: {
    paddingHorizontal: layout.s(28),
    paddingTop: layout.s(12),
    paddingBottom: layout.s(24),
  },
  roleEyebrow: {
    fontSize: layout.f(10),
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    color: theme.gold,
    marginBottom: layout.s(12),
    fontWeight: '500',
  },
  roleTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Playfair Display' : 'serif',
    fontSize: layout.f(44),
    fontWeight: '700',
    color: theme.white,
    lineHeight: layout.s(46),
    letterSpacing: -0.5,
  },
  roleTitleEm: {
    fontStyle: 'italic',
    color: theme.gold,
  },
  roleSub: {
    fontSize: layout.f(13),
    color: 'rgba(255,255,255,0.4)',
    lineHeight: layout.s(22),
    marginTop: layout.s(12),
  },
  roleTiles: {
    flexDirection: 'row',
    gap: layout.s(12),
    paddingHorizontal: layout.s(28),
    paddingTop: layout.s(8),
  },
  tile: {
    flex: 1,
    minWidth: 0,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: layout.s(22),
    paddingVertical: layout.s(28),
    paddingHorizontal: layout.s(18),
    alignItems: 'center',
  },
  tileSelected: {
    borderColor: theme.gold,
    backgroundColor: 'rgba(231,211,28,0.08)',
  },
  tileIcon: {
    width: layout.s(56),
    height: layout.s(56),
    borderRadius: layout.s(18),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: layout.s(12),
  },
  tileLabel: {
    fontSize: layout.f(14),
    fontWeight: '600',
    color: theme.white,
    lineHeight: layout.s(18),
    textAlign: 'center',
  },
  tileSub: {
    fontSize: layout.f(11),
    color: 'rgba(255,255,255,0.38)',
    lineHeight: layout.s(16),
    marginTop: layout.s(-6),
    textAlign: 'center',
  },
  continueBtn: {
    marginHorizontal: layout.s(28),
    height: layout.s(56),
    backgroundColor: theme.greenMid,
    borderRadius: layout.s(18),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: layout.s(14),
  },
  continueBtnDisabled: {
    opacity: 0.5,
  },
  continueBtnText: {
    fontSize: layout.f(16),
    fontWeight: '700',
    color: theme.white,
  },
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: layout.s(28),
    marginTop: layout.s(14),
    marginBottom: layout.s(14),
    gap: layout.s(14),
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  orText: {
    fontSize: layout.f(15),
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0.5,
  },
  googleSignInBtn: {
    marginHorizontal: layout.s(28),
    height: layout.s(52),
    backgroundColor: theme.white,
    borderWidth: 0,
    borderRadius: layout.s(16),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: layout.s(10),
    marginTop: layout.s(14),
    marginBottom: layout.s(20),
  },
  googleSignInBtnText: {
    fontSize: layout.f(15),
    fontWeight: '600',
    color: '#1f1f1f',
  },
  roleFooter: {
    paddingHorizontal: layout.s(28),
    alignItems: 'center',
  },
  roleFooterDivider: {
    height: 1,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginBottom: layout.s(12),
  },
  signUpNudge: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpNudgeText: { fontSize: layout.f(12.5), color: 'rgba(255,255,255,0.35)' },
  signUpNudgeLink: { fontSize: layout.f(12.5), color: theme.gold, fontWeight: '600' },

  userFormPage: {
    paddingTop: 0,
  },
  scrollContent: {
    flex: 1,
    minHeight: 0,
  },
  scrollContentInner: {
    paddingHorizontal: layout.s(28),
    paddingTop: layout.s(28),
    paddingBottom: layout.s(24),
  },
  clinicFormInner: {
    paddingBottom: layout.s(32),
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layout.s(7),
    backgroundColor: 'rgba(231,211,28,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(231,211,28,0.25)',
    borderRadius: layout.s(30),
    paddingVertical: layout.s(6),
    paddingHorizontal: layout.s(14),
    alignSelf: 'flex-start',
    marginBottom: layout.s(4),
  },
  userBadgeText: {
    fontSize: layout.f(11),
    fontWeight: '500',
    color: 'rgba(231,211,28,0.85)',
    letterSpacing: 0.8,
  },
  welcomeTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Playfair Display' : 'serif',
    fontSize: layout.f(36),
    fontWeight: '700',
    color: theme.white,
    lineHeight: layout.s(38),
    letterSpacing: -0.5,
    marginTop: layout.s(10),
    marginBottom: layout.s(6),
  },
  welcomeTitleEm: {
    fontStyle: 'italic',
    color: theme.gold,
  },
  welcomeSub: {
    fontSize: layout.f(13),
    color: 'rgba(255,255,255,0.4)',
    lineHeight: layout.s(22),
    marginBottom: layout.s(28),
  },
  field: { marginBottom: layout.s(14) },
  label: {
    fontSize: layout.f(10.5),
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '500',
    marginBottom: layout.s(7),
  },
  input: {
    height: layout.s(52),
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: layout.s(14),
    paddingHorizontal: layout.s(18),
    fontSize: layout.f(15),
    color: theme.white,
  },
  inputFlex: { flex: 1 },
  passWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: layout.s(14),
  },
  eyeBtn: {
    paddingHorizontal: layout.s(16),
    height: layout.s(52),
    justifyContent: 'center',
  },
  eyeText: {
    fontSize: layout.f(13),
    color: 'rgba(255,255,255,0.35)',
  },
  forgotWrap: { alignSelf: 'flex-end', marginTop: layout.s(-4) },
  forgot: {
    fontSize: layout.f(12.5),
    color: 'rgba(255,255,255,0.35)',
  },
  errorText: {
    fontSize: layout.f(12),
    color: '#e87b7b',
    marginTop: layout.s(6),
  },
  errorTextHint: {
    color: 'rgba(231,211,28,0.7)',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layout.s(12),
    marginVertical: layout.s(24),
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  dividerText: { fontSize: layout.f(11.5), color: 'rgba(255,255,255,0.25)' },
  ssoRow: { flexDirection: 'row', gap: layout.s(10) },
  ssoBtn: {
    flex: 1,
    height: layout.s(50),
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: layout.s(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  ssoBtnText: {
    fontSize: layout.f(13),
    fontWeight: '500',
    color: 'rgba(255,255,255,0.65)',
  },
  footer: {
    paddingHorizontal: layout.s(28),
    paddingVertical: layout.s(12),
    paddingBottom: layout.s(36),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.07)',
  },
  submitBtn: {
    width: '100%',
    height: layout.s(58),
    backgroundColor: theme.gold,
    borderRadius: layout.s(18),
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnTeal: {
    backgroundColor: theme.accentTeal,
  },
  submitBtnDisabled: { opacity: 0.8 },
  submitBtnText: {
    fontSize: layout.f(16),
    fontWeight: '600',
    color: theme.green,
    letterSpacing: 0.5,
  },
  submitBtnTextTeal: {
    color: '#002e18',
  },
  signUpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: layout.s(10),
  },
  signUpRowText: { fontSize: layout.f(12.5), color: 'rgba(255,255,255,0.3)' },
  signUpRowLink: { fontSize: layout.f(12.5), color: theme.gold, fontWeight: '500' },

  overlayLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.green,
    zIndex: 10,
  },
  clinicLayer: {},
  clinicianBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layout.s(7),
    backgroundColor: 'rgba(93,202,165,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(93,202,165,0.25)',
    borderRadius: layout.s(30),
    paddingVertical: layout.s(6),
    paddingHorizontal: layout.s(14),
    alignSelf: 'flex-start',
    marginBottom: layout.s(4),
  },
  clinicianBadgeText: {
    fontSize: layout.f(11),
    fontWeight: '500',
    color: 'rgba(93,202,165,0.85)',
    letterSpacing: 0.8,
  },
  hint: {
    fontSize: layout.f(11.5),
    color: 'rgba(255,255,255,0.3)',
    marginTop: layout.s(4),
    lineHeight: layout.s(18),
  },
  mfaNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: layout.s(12),
    backgroundColor: 'rgba(93,202,165,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(93,202,165,0.18)',
    borderRadius: layout.s(16),
    padding: layout.s(14),
    marginTop: layout.s(8),
  },
  mfaNoticeIcon: { marginTop: layout.s(1) },
  mfaNoticeText: {
    flex: 1,
    fontSize: layout.f(12),
    color: 'rgba(255,255,255,0.4)',
    lineHeight: layout.s(19),
  },
  mfaNoticeStrong: {
    color: 'rgba(93,202,165,0.8)',
    fontWeight: '500',
  },

  mfaLayer: { zIndex: 20 },
  mfaContent: {
    paddingHorizontal: layout.s(28),
    paddingTop: layout.s(32),
    alignItems: 'center',
  },
  mfaIconWrap: {
    width: layout.s(72),
    height: layout.s(72),
    borderRadius: layout.s(36),
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: layout.s(20),
  },
  mfaIconWrapTeal: {
    backgroundColor: 'rgba(93,202,165,0.1)',
    borderColor: 'rgba(93,202,165,0.25)',
  },
  mfaTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Playfair Display' : 'serif',
    fontSize: layout.f(30),
    fontWeight: '700',
    color: theme.white,
    lineHeight: layout.s(34),
    letterSpacing: -0.3,
    marginBottom: layout.s(8),
    textAlign: 'center',
  },
  mfaSub: {
    fontSize: layout.f(13.5),
    color: 'rgba(255,255,255,0.45)',
    lineHeight: layout.s(22),
    textAlign: 'center',
    maxWidth: layout.s(270),
    marginBottom: layout.s(28),
  },
  otpRow: {
    flexDirection: 'row',
    gap: layout.s(10),
    width: '100%',
    marginBottom: layout.s(8),
  },
  otpBox: {
    flex: 1,
    height: layout.s(60),
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: layout.s(14),
    fontSize: layout.f(24),
    fontWeight: '600',
    color: theme.white,
    textAlign: 'center',
  },
  otpBoxFilled: {
    borderColor: 'rgba(231,211,28,0.35)',
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: layout.s(8),
  },
  resendText: { fontSize: layout.f(13), color: 'rgba(255,255,255,0.4)' },
  resendLink: { fontSize: layout.f(13), color: theme.gold, fontWeight: '500' },
  mfaSwitch: {
    marginTop: layout.s(20),
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    borderRadius: layout.s(16),
    padding: layout.s(14),
  },
  mfaSwitchText: {
    fontSize: layout.f(12.5),
    color: 'rgba(255,255,255,0.35)',
  },
  mfaFooterText: {
    fontSize: layout.f(12.5),
    color: 'rgba(255,255,255,0.25)',
    textAlign: 'center',
    marginTop: layout.s(10),
  },
});
