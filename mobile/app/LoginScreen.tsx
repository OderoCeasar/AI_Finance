import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Dimensions,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { AntDesign } from '@expo/vector-icons';

import { useAuth } from '@/lib/auth';
import { useGoogleAuth } from '@/lib/use-google-auth';

const { width } = Dimensions.get('window');

const palette = {
  accentGreen: '#4ADE80',
  sidebar: '#1E293B',
  textSecondary: '#64748B',
  textPrimary: '#0F172A',
  cashBlue: '#2563EB',
  mpesaGreen: '#10B981',
  surface: '#F8FAFC',
  card: '#FFFFFF',
};

export default function LoginScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const router = useRouter();
  const { signIn, signInWithGoogle } = useAuth();

  const googleAuth = useGoogleAuth({
    redirectPath: 'LoginScreen',
    onSuccess: async (idToken) => {
      const result = await signInWithGoogle(idToken);
      if (result.ok) {
        router.replace('/Dashboard');
        return;
      }
      throw new Error(result.error ?? 'Google sign-in failed.');
    },
  });

  const formatErrors = (errors: unknown) => {
    if (!errors || typeof errors !== 'object') {
      return null;
    }
    const entries = Object.entries(errors as Record<string, unknown>);
    if (!entries.length) {
      return null;
    }
    const messages = entries.flatMap(([key, value]) => {
      if (Array.isArray(value)) {
        return value.map((item) => `${key}: ${String(item)}`);
      }
      if (value && typeof value === 'object') {
        return Object.entries(value).map(
          ([childKey, childValue]) => `${key}.${childKey}: ${String(childValue)}`,
        );
      }
      return `${key}: ${String(value)}`;
    });
    return messages.join(' | ');
  };

  const handleLogin = async () => {
    setFormError('');
    if (!email.trim() || !password) {
      setFormError('Enter your email and password.');
      return;
    }

    setIsLoading(true);
    const result = await signIn({ email: email.trim(), password });
    setIsLoading(false);
    if (result.ok) {
      router.replace('/Dashboard');
      return;
    }
    const fieldErrors = formatErrors(result.errors);
    setFormError(fieldErrors ?? result.error ?? 'Unable to sign in.');
  };

  useEffect(() => {
    if (googleAuth.error) {
      setFormError(googleAuth.error);
    }
  }, [googleAuth.error]);

  useEffect(() => {
    setIsGoogleLoading(googleAuth.isLoading);
  }, [googleAuth.isLoading]);

  const isGoogleInFlight = isGoogleLoading || googleAuth.isLoading;

  if (isGoogleInFlight) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color={palette.accentGreen} />
        <Text style={styles.loadingText}>Signing you in…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={palette.surface} />
      
      {/* Animated Background */}
      <View style={styles.backgroundContainer}>
        <LinearGradient
          colors={[palette.surface, palette.card]}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={[styles.circle, styles.circle1]} />
          <View style={[styles.circle, styles.circle2]} />
        </LinearGradient>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Text style={styles.logoIcon}>✨</Text>
          </View>
          <Text style={styles.brandName}>OptiFi</Text>
        </View>
      </View>

      {/* Form Content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formContainer}>
          {/* Header */}
          <View style={styles.formHeader}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue your financial journey</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Email Field */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}></Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor={palette.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}></Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor={palette.textSecondary}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text style={styles.eyeIcon}>{showPassword ? '' : ''}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Remember & Forgot */}
            <View style={styles.rememberRow}>
              <TouchableOpacity style={styles.checkboxContainer}>
                <View style={styles.checkbox}>
                  <Text style={styles.checkmark}>✓</Text>
                </View>
                <Text style={styles.checkboxLabel}>Remember me</Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={() => router.push('/ForgotPasswordScreen')}>
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>
            </View>

            {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color={palette.textPrimary} />
              ) : (
                <>
                  <Text style={styles.submitButtonText}>Sign In</Text>
                  <Text style={styles.submitArrow}>→</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Social Login */}
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.divider} />
          </View>

          <TouchableOpacity
            style={styles.socialButton}
            activeOpacity={0.8}
            onPress={() => {
              setFormError('');
              googleAuth.prompt();
            }}
            disabled={isGoogleLoading || googleAuth.isLoading}
          >
            {isGoogleLoading ? (
              <ActivityIndicator color={palette.textPrimary} />
            ) : (
              <>
                <Image
                  source={require('@/assets/images/image.png')}
                  style={styles.googleIcon}
                  resizeMode="contain"
                />
                <Text style={styles.socialText}>Sign in with Google</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Signup Link */}
          <View style={styles.signupRow}>
            <Text style={styles.signupText}>Do not have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/SignupScreen')}>
              <Text style={styles.signupLink}>Sign up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.surface,
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    flex: 1,
  },
  circle: {
    position: 'absolute',
    borderRadius: 1000,
    opacity: 0.2,
  },
  circle1: {
    width: width * 1.2,
    height: width * 1.2,
    top: -width * 0.3,
    right: -width * 0.2,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
  },
  circle2: {
    width: width * 1.2,
    height: width * 1.2,
    bottom: -width * 0.3,
    left: -width * 0.2,
    backgroundColor: 'rgba(74, 222, 128, 0.12)',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  backText: {
    color: palette.textPrimary,
    fontSize: 24,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: palette.sidebar,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoIcon: {
    fontSize: 20,
    color: palette.card,
  },
  brandName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: palette.textPrimary,
    marginLeft: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  formContainer: {
    paddingHorizontal: 24,
  },
  formHeader: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: palette.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: palette.textSecondary,
  },
  form: {
    backgroundColor: palette.card,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.25)',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: palette.textSecondary,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.25)',
  },
  inputIcon: {
    fontSize: 18,
    marginLeft: 16,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    color: palette.textPrimary,
    fontSize: 16,
  },
  eyeButton: {
    padding: 12,
  },
  eyeIcon: {
    fontSize: 18,
  },
  rememberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: 'rgba(100, 116, 139, 0.35)',
    backgroundColor: palette.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  checkmark: {
    color: palette.mpesaGreen,
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    color: palette.textSecondary,
    fontSize: 14,
  },
  errorText: {
    color: palette.cashBlue,
    fontSize: 12,
    marginBottom: 12,
  },
  forgotText: {
    color: palette.cashBlue,
    fontSize: 14,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.accentGreen,
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: palette.accentGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: palette.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  submitArrow: {
    color: palette.textPrimary,
    fontSize: 18,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(100, 116, 139, 0.3)',
  },
  dividerText: {
    color: palette.textSecondary,
    fontSize: 14,
    paddingHorizontal: 16,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.card,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.25)',
  },
  biometricIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  biometricText: {
    color: palette.textPrimary,
    fontSize: 16,
    fontWeight: '500',
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.card,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.25)',
  },
  googleIcon: {
    width: 22,
    height: 22,
    marginRight: 10,
  },
  socialIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  socialText: {
    color: palette.textPrimary,
    fontSize: 16,
    fontWeight: '500',
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  signupText: {
    color: palette.textSecondary,
    fontSize: 14,
  },
  signupLink: {
    color: palette.cashBlue,
    fontSize: 14,
    fontWeight: '600',
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: palette.textSecondary,
    fontSize: 14,
  },
});
