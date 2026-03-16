import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
  Modal,
  Animated,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { theme } from '../../constants/theme';
import { layout } from '../../constants/layout';
import { signUp as authSignUp, resendVerificationEmail } from '../../lib/auth';
import { submitClinicianRequest } from '../../lib/api';

const PARISHES = [
  'Kingston', 'St. Andrew', 'St. Thomas', 'Portland', 'St. Mary', 'St. Ann',
  'Trelawny', 'St. James', 'Hanover', 'Westmoreland', 'St. Elizabeth', 'Manchester',
  'Clarendon', 'St. Catherine', 'Other',
];

const FACILITY_TYPES = [
  'General Practice', 'Health Centre', 'Hospital', 'Specialist Clinic',
  'Pharmacy', 'Diagnostic Centre', 'Community Health', 'Other',
];

const CONTACT_ROLES = [
  'Medical Director', 'Chief Medical Officer', 'Practice Manager', 'Head Nurse',
  'Administrator', 'Receptionist', 'Other',
];

type Role = 'sponsor' | 'patient' | 'clinic';

type Props = {
  visible: boolean;
  role: Role | null;
  onClose: () => void;
  onComplete: () => void;
  /** When provided, "Already have an account? Sign in" calls this instead of onClose. */
  onSignInPress?: () => void;
};

function getPasswordStrength(pass: string): 'none' | 'weak' | 'medium' | 'strong' {
  if (!pass.length) return 'none';
  let score = 0;
  if (pass.length >= 8) score++;
  if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score++;
  if (/[0-9]/.test(pass) || /[^a-zA-Z0-9]/.test(pass)) score++;
  if (score === 1) return 'weak';
  if (score === 2) return 'medium';
  return 'strong';
}

/** Format date of birth as DD/MM/YYYY: 2 digits day, 2 month, 4 year. Only digits allowed. */
function formatDobInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/** Convert DD/MM/YYYY to YYYY-MM-DD for API. */
function dobToApi(ddMmYyyy: string): string | undefined {
  const parts = ddMmYyyy.split('/').map((p) => p.trim());
  if (parts.length !== 3) return undefined;
  const [d, m, y] = parts;
  if (d.length === 2 && m.length === 2 && y.length === 4) {
    return `${y}-${m}-${d}`;
  }
  return undefined;
}

export function SignUpPanel({ visible, role, onClose, onComplete, onSignInPress }: Props) {
  const isClinic = role === 'clinic';
  const flow = isClinic ? 'clinic' : 'user';
  const totalSteps = isClinic ? 3 : 4;
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showPass2, setShowPass2] = useState(false);
  const animValue = useRef(new Animated.Value(0)).current;

  // User form
  const [uFirst, setUFirst] = useState('');
  const [uLast, setULast] = useState('');
  const [uEmail, setUEmail] = useState('');
  const [uPhone, setUPhone] = useState('');
  const [uDob, setUDob] = useState('');
  const [uOrg, setUOrg] = useState('');
  const [uParish, setUParish] = useState('');
  const [uPass, setUPass] = useState('');
  const [uPass2, setUPass2] = useState('');
  const [uAvatarUri, setUAvatarUri] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [resendLoading, setResendLoading] = useState(false);
  const resendCooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clinician form (request flow: no password until approved)
  const [cName, setCName] = useState('');
  const [cEmail, setCEmail] = useState('');
  const [cReg, setCReg] = useState('');
  const [cSpecialty, setCSpecialty] = useState('');
  const [cInstitution, setCInstitution] = useState('');
  const [cLicenseUri, setCLicenseUri] = useState<string | null>(null);
  const [cLicenseMime, setCLicenseMime] = useState<string>('image/jpeg');
  const [cLicenseName, setCLicenseName] = useState<string>('license.jpg');

  const [picker, setPicker] = useState<{ type: string; options: string[]; onSelect: (v: string) => void } | null>(null);

  const isSuccess = (flow === 'user' && step === 5) || (flow === 'clinic' && step === 3);
  const progressPct = isSuccess ? 100 : ((step - 1) / totalSteps) * 100;

  const roleLabel = role === 'sponsor' ? 'Sponsor' : role === 'patient' ? 'Patient' : 'Clinician';
  const roleDotColor = role === 'sponsor' ? theme.gold : role === 'patient' ? 'rgba(255,255,255,0.6)' : theme.accentTeal;

  const validateStep = (): boolean => {
    setError(null);
    if (flow === 'user') {
      if (step === 1) {
        if (!uFirst.trim() || !uLast.trim() || !uEmail.trim() || !uPhone.trim()) {
          setError('Please fill in all fields.');
          return false;
        }
        if (!uEmail.includes('@')) {
          setError('Please enter a valid email address.');
          return false;
        }
      }
      if (step === 2) {
        if (!uDob.trim() || !uParish) {
          setError('Please complete all required fields.');
          return false;
        }
      }
      if (step === 3) {
        if (uPass.length < 8) {
          setError('Password must be at least 8 characters.');
          return false;
        }
        if (uPass !== uPass2) {
          setError('Passwords do not match.');
          return false;
        }
      }
    } else {
      if (step === 1) {
        if (!cEmail.trim() || !cReg.trim() || !cSpecialty.trim()) {
          setError('Please fill in work email, license number, and specialty.');
          return false;
        }
        if (!cEmail.includes('@')) {
          setError('Please enter a valid work email address.');
          return false;
        }
      }
      if (step === 2) {
        if (!cLicenseUri) {
          setError('Please add your medical license image.');
          return false;
        }
      }
    }
    return true;
  };

  const handleNext = async () => {
    if (isSuccess) {
      onComplete();
      return;
    }
    if (!validateStep()) return;
    if (loading) return;

    // User flow: step 3 → sign-up (Supabase sends verification email), then go to step 4
    if (flow === 'user' && step === 3) {
      setLoading(true);
      setError(null);
      const fullName = `${uFirst.trim()} ${uLast.trim()}`.trim();
      const dateOfBirth = dobToApi(uDob);
      const signUpResult = await authSignUp({
        email: uEmail.trim(),
        password: uPass,
        role: role === 'sponsor' ? 'sponsor' : 'patient',
        full_name: fullName,
        phone: uPhone.trim() || undefined,
        date_of_birth: dateOfBirth,
        organisation: role === 'sponsor' ? (uOrg.trim() || undefined) : undefined,
        parish: uParish || undefined,
      });
      if ('error' in signUpResult) {
        setError(signUpResult.error);
        setLoading(false);
        return;
      }
      setLoading(false);
      setStep(4);
      return;
    }

    // User flow: step 4 → "Check your email" screen; Continue goes to welcome
    if (flow === 'user' && step === 4) {
      setStep(5);
      return;
    }

    if (flow === 'clinic' && step === 2) {
      setLoading(true);
      setError(null);
      try {
        const result = await submitClinicianRequest({
          email: cEmail.trim(),
          name: cName.trim() || null,
          license_number: cReg.trim(),
          specialty: cSpecialty.trim(),
          institution_or_clinic_name: cInstitution.trim() || null,
          license_image_uri: cLicenseUri,
          license_image_mime: cLicenseMime,
          license_image_name: cLicenseName,
        });
        if ('error' in result) {
          setError(result.error);
          return;
        }
        setStep(3);
        return;
      } catch (e) {
        setError('Network error. Please check your connection and try again.');
        return;
      } finally {
        setLoading(false);
      }
    }

    setStep((s) => s + 1);
  };

  const handleBack = () => {
    setError(null);
    if (step === 1) {
      onClose();
    } else {
      setStep((s) => s - 1);
    }
  };

  const openPicker = (type: string, options: string[], onSelect: (v: string) => void) => {
    setPicker({ type, options, onSelect });
  };

  const strength = flow === 'user' ? getPasswordStrength(step === 3 ? uPass : '') : 'none';

  const slideAnim = useRef(new Animated.Value(layout.height)).current;
  useEffect(() => {
    if (visible && role) {
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }).start();
    } else {
      slideAnim.setValue(layout.height);
    }
  }, [visible, role]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setInterval(() => {
      setResendCooldown((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    resendCooldownRef.current = id;
    return () => {
      if (resendCooldownRef.current) clearInterval(resendCooldownRef.current);
      resendCooldownRef.current = null;
    };
  }, [resendCooldown]);

  const handleResendVerificationEmail = async () => {
    if (resendLoading || resendCooldown > 0) return;
    setResendLoading(true);
    setError(null);
    const result = await resendVerificationEmail(uEmail.trim());
    setResendLoading(false);
    if ('error' in result) {
      setError(result.error);
      return;
    }
    setResendCooldown(60);
  };

  if (!role) return null;

  const renderUserStep = () => {
    if (step === 1) {
      return (
        <View style={styles.step}>
          <Text style={styles.eyebrow}>Step 1 of 4</Text>
          <Text style={styles.title}>Personal{'\n'}<Text style={styles.titleEm}>details</Text></Text>
          <Text style={styles.sub}>Tell us a bit about yourself.</Text>
          <View style={styles.fields}>
            <View style={styles.field}>
              <Text style={styles.label}>First name</Text>
              <TextInput style={styles.input} value={uFirst} onChangeText={setUFirst} placeholder="Maria" placeholderTextColor="rgba(255,255,255,0.2)" />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Last name</Text>
              <TextInput style={styles.input} value={uLast} onChangeText={setULast} placeholder="Thompson" placeholderTextColor="rgba(255,255,255,0.2)" />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Email address</Text>
              <TextInput style={styles.input} value={uEmail} onChangeText={setUEmail} placeholder="you@example.com" placeholderTextColor="rgba(255,255,255,0.2)" keyboardType="email-address" autoCapitalize="none" />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Phone number</Text>
              <TextInput style={styles.input} value={uPhone} onChangeText={setUPhone} placeholder="+1 (876) 000-0000" placeholderTextColor="rgba(255,255,255,0.2)" keyboardType="phone-pad" />
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>
        </View>
      );
    }
    if (step === 2) {
      return (
        <View style={styles.step}>
          <Text style={styles.eyebrow}>Step 2 of 4</Text>
          <Text style={styles.title}>A little{'\n'}<Text style={styles.titleEm}>more info</Text></Text>
              <Text style={styles.sub}>{role === 'sponsor' ? 'Tell us about your organisation (optional).' : 'Just a couple more details.'}</Text>
          <View style={styles.fields}>
            <View style={styles.field}>
              <Text style={styles.label}>Profile photo</Text>
              <Text style={styles.hint}>Add a photo so sponsors and clinicians can recognise you. You can skip this for now.</Text>
              <View style={styles.avatarRow}>
                <View style={styles.avatarCircle}>
                  {uAvatarUri ? (
                    <Image source={{ uri: uAvatarUri }} style={styles.avatarImage} />
                  ) : (
                    <Text style={styles.avatarPlaceholderText}>{(uFirst || 'You')[0]?.toUpperCase()}</Text>
                  )}
                </View>
                <View style={styles.avatarButtons}>
                  <TouchableOpacity
                    style={styles.avatarBtn}
                    activeOpacity={0.85}
                    onPress={async () => {
                      const { status } = await ImagePicker.requestCameraPermissionsAsync();
                      if (status !== 'granted') {
                        setError('Camera permission is required to take a photo.');
                        return;
                      }
                      const result = await ImagePicker.launchCameraAsync({
                        allowsEditing: true,
                        aspect: [1, 1],
                        quality: 0.7,
                      });
                      if (!result.canceled && result.assets?.[0]?.uri) {
                        setUAvatarUri(result.assets[0].uri);
                      }
                    }}
                  >
                    <Text style={styles.avatarBtnText}>Take photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.avatarBtnSecondary}
                    activeOpacity={0.85}
                    onPress={async () => {
                      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                      if (status !== 'granted') {
                        setError('Media library permission is required to choose a photo.');
                        return;
                      }
                      const result = await ImagePicker.launchImageLibraryAsync({
                        mediaTypes: ImagePicker.MediaTypeOptions.Images,
                        allowsEditing: true,
                        aspect: [1, 1],
                        quality: 0.7,
                      });
                      if (!result.canceled && result.assets?.[0]?.uri) {
                        setUAvatarUri(result.assets[0].uri);
                      }
                    }}
                  >
                    <Text style={styles.avatarBtnSecondaryText}>{uAvatarUri ? 'Change photo' : 'Choose from library'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Date of birth</Text>
              <TextInput
                style={styles.input}
                value={uDob}
                onChangeText={(t) => setUDob(formatDobInput(t))}
                placeholder="DD/MM/YYYY"
                placeholderTextColor="rgba(255,255,255,0.2)"
                keyboardType="number-pad"
                maxLength={10}
              />
            </View>
            {role === 'sponsor' && (
              <View style={styles.field}>
                <Text style={styles.label}>Organisation / company</Text>
                <TextInput style={styles.input} value={uOrg} onChangeText={setUOrg} placeholder="e.g. National Health Fund" placeholderTextColor="rgba(255,255,255,0.2)" />
                <Text style={styles.hint}>Optional — helps us connect you with relevant patients.</Text>
              </View>
            )}
            <View style={styles.field}>
              <Text style={styles.label}>Parish / region</Text>
              <TouchableOpacity style={styles.selectTouch} onPress={() => openPicker('parish', PARISHES, setUParish)}>
                <Text style={[styles.selectText, !uParish && styles.selectPlaceholder]}>{uParish || 'Select parish'}</Text>
              </TouchableOpacity>
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>
        </View>
      );
    }
    if (step === 3) {
      return (
        <View style={styles.step}>
          <Text style={styles.eyebrow}>Step 3 of 4</Text>
          <Text style={styles.title}>Secure your{'\n'}<Text style={styles.titleEm}>account</Text></Text>
          <Text style={styles.sub}>Create a strong password to protect your account.</Text>
          <View style={styles.fields}>
            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passWrap}>
                <TextInput style={[styles.input, styles.passInput]} value={uPass} onChangeText={setUPass} placeholder="Min. 8 characters" placeholderTextColor="rgba(255,255,255,0.2)" secureTextEntry={!showPass} />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPass(!showPass)}>
                  <Svg width={18} height={18} viewBox="0 0 18 18" fill="none"><Path d="M1 9C1 9 4 3 9 3C14 3 17 9 17 9C17 9 14 15 9 15C4 15 1 9 1 9Z" stroke="rgba(255,255,255,0.35)" strokeWidth={1.5}/><Circle cx="9" cy="9" r={2.5} stroke="rgba(255,255,255,0.35)" strokeWidth={1.5}/></Svg>
                </TouchableOpacity>
              </View>
              <View style={styles.strengthWrap}>
                <View style={styles.strengthBars}>
                  <View style={[styles.strengthBar, strength === 'weak' && styles.strengthWeak, strength === 'medium' && styles.strengthMedium, strength === 'strong' && styles.strengthStrong]} />
                  <View style={[styles.strengthBar, (strength === 'medium' || strength === 'strong') && styles.strengthMedium, strength === 'strong' && styles.strengthStrong]} />
                  <View style={[styles.strengthBar, strength === 'strong' && styles.strengthStrong]} />
                </View>
                <Text style={styles.strengthLbl}>
                  {strength === 'none' && 'Enter a password'}
                  {strength === 'weak' && 'Weak'}
                  {strength === 'medium' && 'Medium'}
                  {strength === 'strong' && 'Strong'}
                </Text>
              </View>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Confirm password</Text>
              <View style={styles.passWrap}>
                <TextInput style={[styles.input, styles.passInput]} value={uPass2} onChangeText={setUPass2} placeholder="Repeat your password" placeholderTextColor="rgba(255,255,255,0.2)" secureTextEntry={!showPass2} />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPass2(!showPass2)}>
                  <Svg width={18} height={18} viewBox="0 0 18 18" fill="none"><Path d="M1 9C1 9 4 3 9 3C14 3 17 9 17 9C17 9 14 15 9 15C4 15 1 9 1 9Z" stroke="rgba(255,255,255,0.35)" strokeWidth={1.5}/><Circle cx="9" cy="9" r={2.5} stroke="rgba(255,255,255,0.35)" strokeWidth={1.5}/></Svg>
                </TouchableOpacity>
              </View>
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <Text style={styles.terms}>By continuing you agree to our <Text style={styles.termsLink}>Terms of Service</Text> and <Text style={styles.termsLink}>Privacy Policy</Text>.</Text>
          </View>
        </View>
      );
    }
    if (step === 4) {
      return (
        <View style={styles.step}>
          <Text style={styles.eyebrow}>Step 4 of 4</Text>
          <Text style={styles.title}>Check your{'\n'}<Text style={styles.titleEm}>email</Text></Text>
          <Text style={styles.sub}>
            We sent a verification email to {uEmail || 'your email'}. Click the link in that email to verify your account, then return here and tap Continue.
          </Text>
          <View style={styles.fields}>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <TouchableOpacity
              style={styles.resendRow}
              onPress={handleResendVerificationEmail}
              disabled={resendLoading || resendCooldown > 0}
              activeOpacity={0.7}
            >
              <Text style={styles.resend}>Didn&apos;t receive the email? </Text>
              {resendLoading ? (
                <Text style={styles.resendLink}>Sending…</Text>
              ) : resendCooldown > 0 ? (
                <Text style={styles.resendMuted}>Resend in {resendCooldown}s</Text>
              ) : (
                <Text style={styles.resendLink}>Resend</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    // step 5 - Welcome
    return (
      <View style={styles.step}>
        <View style={styles.successWrap}>
          <View style={styles.checkCircle}>
            <Svg width={36} height={36} viewBox="0 0 36 36" fill="none"><Path d="M8 18L14 24L28 10" stroke={theme.gold} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"/></Svg>
          </View>
          <Text style={styles.successTitle}>Welcome,{'\n'}<Text style={styles.titleEm}>{uFirst || 'there'}!</Text></Text>
          <Text style={styles.successSub}>Your account is ready. Here&apos;s what you can do with Island Echoes Health.</Text>
          <View style={styles.infoCards}>
            <View style={styles.infoCard}>
              <View style={[styles.infoIcon, { backgroundColor: 'rgba(231,211,28,0.12)' }]}>
                <Svg width={20} height={20} viewBox="0 0 20 20" fill="none"><Circle cx="10" cy="10" r="8" stroke={theme.gold} strokeWidth={1.5}/><Path d="M10 6V10L13 13" stroke={theme.gold} strokeWidth={1.5} strokeLinecap="round"/></Svg>
              </View>
              <View><Text style={styles.infoLabel}>Track in real time</Text><Text style={styles.infoDesc}>Monitor every appointment & milestone.</Text></View>
            </View>
            <View style={styles.infoCard}>
              <View style={[styles.infoIcon, { backgroundColor: 'rgba(93,202,165,0.12)' }]}>
                <Svg width={20} height={20} viewBox="0 0 20 20" fill="none"><Path d="M3 10C3 6.1 6.1 3 10 3S17 6.1 17 10 13.9 17 10 17 3 13.9 3 10Z" stroke={theme.accentTeal} strokeWidth={1.5}/><Path d="M7 10H13M10 7V13" stroke={theme.accentTeal} strokeWidth={1.5} strokeLinecap="round"/></Svg>
              </View>
              <View>
                <Text style={styles.infoLabel}>{role === 'patient' ? 'Access sponsored care' : 'Find & connect'}</Text>
                <Text style={styles.infoDesc}>{role === 'patient' ? 'Browse clinics and book appointments near you.' : 'Match with patients who need your support.'}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderClinicStep = () => {
    // Clinician flow: step 1 = details, step 2 = license image, step 3 = success
    if (step === 1) {
      return (
        <View style={styles.step}>
          <Text style={styles.eyebrow}>Step 1 of 3</Text>
          <Text style={styles.title}>Clinician{'\n'}<Text style={styles.titleEm}>details</Text></Text>
          <Text style={styles.sub}>Register for the clinician and staff portal. We verify all clinicians before they go live.</Text>
          <View style={styles.fields}>
            <View style={styles.field}>
              <Text style={styles.label}>Work email <Text style={styles.required}>*</Text></Text>
              <TextInput style={styles.input} value={cEmail} onChangeText={setCEmail} placeholder="you@clinic.org" placeholderTextColor="rgba(255,255,255,0.2)" keyboardType="email-address" autoCapitalize="none" />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Full name</Text>
              <TextInput style={styles.input} value={cName} onChangeText={setCName} placeholder="Jane Doe" placeholderTextColor="rgba(255,255,255,0.2)" />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>License number <Text style={styles.required}>*</Text></Text>
              <TextInput style={styles.input} value={cReg} onChangeText={setCReg} placeholder="e.g. MD-12345" placeholderTextColor="rgba(255,255,255,0.2)" />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Specialty <Text style={styles.required}>*</Text></Text>
              <TextInput style={styles.input} value={cSpecialty} onChangeText={setCSpecialty} placeholder="e.g. Family Medicine, Psychiatry" placeholderTextColor="rgba(255,255,255,0.2)" />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Institution / clinic name</Text>
              <TextInput style={styles.input} value={cInstitution} onChangeText={setCInstitution} placeholder="Optional" placeholderTextColor="rgba(255,255,255,0.2)" />
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>
        </View>
      );
    }
    if (step === 2) {
      return (
        <View style={styles.step}>
          <Text style={styles.eyebrow}>Step 2 of 3</Text>
          <Text style={styles.title}>Medical{'\n'}<Text style={styles.titleEm}>license</Text></Text>
          <Text style={styles.sub}>Upload an image or PDF of your medical license. You&apos;ll set your password after your account is approved.</Text>
          <View style={styles.fields}>
            <View style={styles.field}>
              <Text style={styles.label}>License image <Text style={styles.required}>*</Text></Text>
              <Text style={styles.hint}>JPEG, PNG, WebP or PDF, max 5 MB</Text>
              <View style={styles.avatarRow}>
                <View style={styles.avatarCircle}>
                  {cLicenseUri ? (
                    <Image source={{ uri: cLicenseUri }} style={styles.avatarImage} />
                  ) : (
                    <Text style={styles.avatarPlaceholderText}>📄</Text>
                  )}
                </View>
                <View style={styles.avatarButtons}>
                  <TouchableOpacity
                    style={styles.avatarBtn}
                    activeOpacity={0.85}
                    onPress={async () => {
                      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                      if (status !== 'granted') {
                        setError('Permission is required to choose a file.');
                        return;
                      }
                      const result = await ImagePicker.launchImageLibraryAsync({
                        mediaTypes: ImagePicker.MediaTypeOptions.Images,
                        allowsEditing: false,
                        quality: 0.9,
                      });
                      if (result.canceled || !result.assets?.[0]) return;
                      const asset = result.assets[0];
                      setCLicenseUri(asset.uri);
                      setCLicenseMime((asset as { mimeType?: string }).mimeType || 'image/jpeg');
                      setCLicenseName(asset.fileName || 'license.jpg');
                      setError(null);
                    }}
                  >
                    <Text style={styles.avatarBtnText}>Choose file</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.avatarBtn}
                    activeOpacity={0.85}
                    onPress={async () => {
                      const { status } = await ImagePicker.requestCameraPermissionsAsync();
                      if (status !== 'granted') {
                        setError('Camera permission is required.');
                        return;
                      }
                      const result = await ImagePicker.launchCameraAsync({
                        allowsEditing: false,
                        quality: 0.9,
                      });
                      if (result.canceled || !result.assets?.[0]) return;
                      const asset = result.assets[0];
                      setCLicenseUri(asset.uri);
                      setCLicenseMime((asset as { mimeType?: string }).mimeType || 'image/jpeg');
                      setCLicenseName(asset.fileName || 'license.jpg');
                      setError(null);
                    }}
                  >
                    <Text style={styles.avatarBtnText}>Take photo</Text>
                  </TouchableOpacity>
                  {cLicenseUri ? (
                    <TouchableOpacity style={styles.avatarBtn} onPress={() => { setCLicenseUri(null); setError(null); }}>
                      <Text style={styles.avatarBtnText}>Remove</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>
        </View>
      );
    }
    // step 3 - Submitted
    return (
      <View style={styles.step}>
        <View style={styles.successWrap}>
          <View style={styles.pendingCircle}>
            <Svg width={36} height={36} viewBox="0 0 36 36" fill="none">
              <Circle cx="18" cy="18" r="14" stroke={theme.accentTeal} strokeWidth={1.5} strokeDasharray="4 3"/>
              <Path d="M18 10V18L23 22" stroke={theme.accentTeal} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/>
            </Svg>
          </View>
          <Text style={styles.successTitle}>Application{'\n'}<Text style={[styles.titleEm, { color: theme.accentTeal }]}>submitted</Text></Text>
          <Text style={styles.successSub}>Your clinician application is under review. An administrator will review it; you&apos;ll receive an email when your account is approved. You&apos;ll set your password then.</Text>
          <View style={styles.infoCards}>
            <View style={styles.infoCard}>
              <View style={[styles.infoIcon, { backgroundColor: 'rgba(93,202,165,0.12)' }]}>
                <Svg width={20} height={20} viewBox="0 0 20 20" fill="none"><Path d="M3 4H17V15C17 15.6 16.6 16 16 16H4C3.4 16 3 15.6 3 15V4Z" stroke={theme.accentTeal} strokeWidth={1.5}/><Path d="M3 7H17" stroke={theme.accentTeal} strokeWidth={1.5}/><Rect x="6" y="2" width="2" height="4" rx={1} fill={theme.accentTeal}/><Rect x="12" y="2" width="2" height="4" rx={1} fill={theme.accentTeal}/></Svg>
              </View>
              <View><Text style={styles.infoLabel}>Review in progress</Text><Text style={styles.infoDesc}>Our team is checking your license and details.</Text></View>
            </View>
            <View style={styles.infoCard}>
              <View style={[styles.infoIcon, { backgroundColor: 'rgba(231,211,28,0.1)' }]}>
                <Svg width={20} height={20} viewBox="0 0 20 20" fill="none"><Path d="M3 4L10 11L17 4" stroke={theme.gold} strokeWidth={1.5} strokeLinecap="round"/><Path d="M3 4H17V15C17 15.6 16.6 16 16 16H4C3.4 16 3 15.6 3 15V4Z" stroke={theme.gold} strokeWidth={1.5}/></Svg>
              </View>
              <View>
                <Text style={styles.infoLabel}>Watch your inbox</Text>
                <Text style={styles.infoDesc}>We&apos;ll email you at {cEmail || 'your email'} when approved.</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const nextLabel = loading
    ? 'Loading...'
    : isSuccess
      ? 'Start exploring →'
      : (flow === 'clinic' && step === 2)
        ? 'Submit application →'
        : step === 4 && flow === 'user'
          ? 'Continue →'
          : 'Continue →';

  return (
    <Animated.View style={[styles.panel, { transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.header}>
        {!isSuccess && (
          <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.85}>
            <Svg width={18} height={18} viewBox="0 0 18 18" fill="none"><Path d="M14 9H4M8 14L3 9L8 4" stroke="white" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/></Svg>
          </TouchableOpacity>
        )}
        {isSuccess && <View style={styles.backBtn} />}
        <View style={styles.rolePill}>
          <View style={[styles.roleDot, { backgroundColor: roleDotColor }]} />
          <Text style={styles.roleName}>{roleLabel} sign-up</Text>
        </View>
        <Text style={styles.stepCounter}>{isSuccess ? 'Done ✓' : `${step} of ${totalSteps}`}</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
      </View>
      <KeyboardAvoidingView style={styles.contentWrap} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {flow === 'user' ? renderUserStep() : renderClinicStep()}
        </ScrollView>
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.nextBtn, loading && styles.nextBtnDisabled]}
            onPress={handleNext}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={theme.green} size="small" />
            ) : (
              <Text style={styles.nextBtnText}>{nextLabel}</Text>
            )}
          </TouchableOpacity>
          {!isSuccess && (
            <TouchableOpacity
              style={styles.signInRow}
              onPress={onSignInPress ?? onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.signInRowText}>Already have an account? <Text style={styles.signInLink}>Sign in</Text></Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>

      <Modal visible={!!picker} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setPicker(null)}>
          <View style={styles.pickerBox}>
            {picker?.options.map((opt) => (
              <TouchableOpacity key={opt} style={styles.pickerOption} onPress={() => { picker.onSelect(opt); setPicker(null); }}>
                <Text style={styles.pickerOptionText}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
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
    paddingBottom: 0,
  },
  backBtn: {
    width: layout.s(40),
    height: layout.s(40),
    borderRadius: layout.s(12),
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.13)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rolePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: layout.s(7),
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.13)',
    borderRadius: layout.s(30),
    paddingVertical: layout.s(6),
    paddingHorizontal: layout.s(14),
  },
  roleDot: {
    width: layout.s(7),
    height: layout.s(7),
    borderRadius: layout.s(3.5),
  },
  roleName: {
    fontSize: layout.f(12),
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.5,
  },
  stepCounter: {
    fontSize: layout.f(12),
    fontWeight: '500',
    color: 'rgba(255,255,255,0.4)',
  },
  progressTrack: {
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginTop: layout.s(14),
    marginHorizontal: layout.s(24),
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.gold,
    borderRadius: 2,
  },
  contentWrap: {
    flex: 1,
    minHeight: 0,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: layout.s(28),
    paddingBottom: layout.s(24),
  },
  step: {
    paddingTop: layout.s(26),
    paddingBottom: layout.s(20),
  },
  eyebrow: {
    fontSize: layout.f(10.5),
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.35)',
    fontWeight: '500',
    marginBottom: layout.s(8),
  },
  title: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: layout.f(32),
    fontWeight: '700',
    color: theme.white,
    lineHeight: layout.f(36),
    letterSpacing: -0.3,
    marginBottom: layout.s(6),
  },
  titleEm: {
    fontStyle: 'italic',
    color: theme.gold,
  },
  sub: {
    fontSize: layout.f(13.5),
    color: 'rgba(255,255,255,0.45)',
    lineHeight: layout.f(22),
    marginBottom: layout.s(28),
  },
  fields: {
    gap: layout.s(14),
  },
  field: {
    gap: layout.s(7),
  },
  label: {
    fontSize: layout.f(10.5),
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '500',
  },
  required: {
    color: 'rgba(255,255,255,0.6)',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: layout.s(14),
    paddingVertical: layout.s(15),
    paddingHorizontal: layout.s(18),
    fontSize: layout.f(15),
    color: theme.white,
  },
  selectTouch: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: layout.s(14),
    paddingVertical: layout.s(15),
    paddingHorizontal: layout.s(18),
  },
  selectText: {
    fontSize: layout.f(15),
    color: theme.white,
  },
  selectPlaceholder: {
    color: 'rgba(255,255,255,0.35)',
  },
  passWrap: {
    position: 'relative',
  },
  passInput: {
    paddingRight: layout.s(52),
  },
  eyeBtn: {
    position: 'absolute',
    right: layout.s(16),
    top: '50%',
    marginTop: -12,
    padding: layout.s(4),
  },
  strengthWrap: {
    marginTop: layout.s(8),
    gap: layout.s(6),
  },
  strengthBars: {
    flexDirection: 'row',
    gap: layout.s(4),
  },
  strengthBar: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  strengthWeak: { backgroundColor: '#e24b4a' },
  strengthMedium: { backgroundColor: theme.gold },
  strengthStrong: { backgroundColor: theme.accentTeal },
  strengthLbl: {
    fontSize: layout.f(11),
    color: 'rgba(255,255,255,0.35)',
  },
  hint: {
    fontSize: layout.f(11.5),
    color: 'rgba(255,255,255,0.3)',
    marginTop: layout.s(4),
    lineHeight: layout.f(17),
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layout.s(16),
    marginTop: layout.s(10),
  },
  avatarCircle: {
    width: layout.s(70),
    height: layout.s(70),
    borderRadius: layout.s(35),
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarPlaceholderText: {
    fontSize: layout.f(26),
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  avatarButtons: {
    flex: 1,
    gap: layout.s(8),
  },
  avatarBtn: {
    height: layout.s(40),
    borderRadius: layout.s(999),
    backgroundColor: theme.gold,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: layout.s(16),
  },
  avatarBtnText: {
    fontSize: layout.f(13),
    fontWeight: '600',
    color: theme.green,
  },
  avatarBtnSecondary: {
    height: layout.s(40),
    borderRadius: layout.s(999),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: layout.s(16),
  },
  avatarBtnSecondaryText: {
    fontSize: layout.f(13),
    fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
  },
  terms: {
    fontSize: layout.f(11.5),
    color: 'rgba(255,255,255,0.28)',
    textAlign: 'center',
    lineHeight: layout.f(18),
    marginTop: layout.s(8),
  },
  termsLink: {
    color: 'rgba(255,255,255,0.5)',
    textDecorationLine: 'underline',
  },
  errorText: {
    fontSize: layout.f(12),
    color: '#e87b7b',
    marginTop: layout.s(6),
  },
  otpWrap: {
    flexDirection: 'row',
    gap: layout.s(10),
    justifyContent: 'space-between',
    marginTop: layout.s(4),
  },
  otpBox: {
    flex: 1,
    height: layout.s(60),
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: layout.s(14),
    textAlign: 'center',
    fontSize: layout.f(24),
    fontWeight: '600',
    color: theme.white,
  },
  otpFilled: {
    borderColor: 'rgba(231,211,28,0.35)',
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: layout.s(20),
    flexWrap: 'wrap',
  },
  resend: {
    fontSize: layout.f(13),
    color: 'rgba(255,255,255,0.4)',
    lineHeight: layout.f(22),
  },
  resendLink: {
    color: theme.gold,
    fontWeight: '500',
    fontSize: layout.f(13),
  },
  resendMuted: {
    fontSize: layout.f(13),
    color: 'rgba(255,255,255,0.35)',
    fontWeight: '500',
  },
  successWrap: {
    alignItems: 'center',
    paddingTop: layout.s(20),
    gap: layout.s(16),
  },
  checkCircle: {
    width: layout.s(84),
    height: layout.s(84),
    borderRadius: layout.s(42),
    backgroundColor: 'rgba(231,211,28,0.15)',
    borderWidth: 2,
    borderColor: 'rgba(231,211,28,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingCircle: {
    width: layout.s(84),
    height: layout.s(84),
    borderRadius: layout.s(42),
    backgroundColor: 'rgba(93,202,165,0.12)',
    borderWidth: 2,
    borderColor: 'rgba(93,202,165,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: layout.f(34),
    fontWeight: '700',
    color: theme.white,
    lineHeight: layout.f(38),
    textAlign: 'center',
  },
  successSub: {
    fontSize: layout.f(14),
    color: 'rgba(255,255,255,0.5)',
    lineHeight: layout.f(23),
    textAlign: 'center',
    maxWidth: 280,
  },
  infoCards: {
    width: '100%',
    gap: layout.s(10),
    marginTop: layout.s(8),
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layout.s(14),
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: layout.s(16),
    paddingVertical: layout.s(14),
    paddingHorizontal: layout.s(18),
  },
  infoIcon: {
    width: layout.s(38),
    height: layout.s(38),
    borderRadius: layout.s(11),
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: {
    fontSize: layout.f(13),
    fontWeight: '500',
    color: 'rgba(255,255,255,0.75)',
    marginBottom: 2,
  },
  infoDesc: {
    fontSize: layout.f(11.5),
    color: 'rgba(255,255,255,0.35)',
    lineHeight: layout.f(16),
  },
  footer: {
    paddingHorizontal: layout.s(28),
    paddingTop: layout.s(12),
    paddingBottom: layout.s(32),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.07)',
    gap: layout.s(10),
  },
  nextBtn: {
    width: '100%',
    height: layout.s(58),
    backgroundColor: theme.gold,
    borderRadius: layout.s(18),
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnDisabled: {
    opacity: 0.9,
  },
  nextBtnText: {
    fontSize: layout.f(16),
    fontWeight: '600',
    color: theme.green,
    letterSpacing: 0.5,
  },
  signInRow: {
    alignItems: 'center',
    paddingVertical: layout.s(4),
  },
  signInRowText: {
    fontSize: layout.f(12.5),
    color: 'rgba(255,255,255,0.3)',
  },
  signInLink: {
    color: theme.gold,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  pickerBox: {
    backgroundColor: theme.green,
    borderTopLeftRadius: layout.s(20),
    borderTopRightRadius: layout.s(20),
    paddingBottom: layout.s(32),
    maxHeight: '50%',
  },
  pickerOption: {
    paddingVertical: layout.s(16),
    paddingHorizontal: layout.s(24),
  },
  pickerOptionText: {
    fontSize: layout.f(16),
    color: theme.white,
  },
});
