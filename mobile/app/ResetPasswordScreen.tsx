import React, { useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { api } from '@/lib/api';
import BottomNav from '@/components/bottom-nav';

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

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const router = useRouter();

  const uid = typeof params.uid === 'string' ? params.uid : '';
  const token = typeof params.token === 'string' ? params.token : '';

  const handleSubmit = async () => {
    setFormError('');
    setFormMessage('');
    if (!uid || !token) {
      setFormError('Reset link is missing or invalid.');
      return;
    }
    if (!newPassword) {
      setFormError('Enter a new password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    const result = await api.post('auth/password-reset/confirm/', {
      uid,
      token,
      new_password: newPassword,
    });
    setIsLoading(false);

    if (result.ok) {
      setFormMessage('Password reset successful. You can sign in now.');
      setTimeout(() => router.replace('/LoginScreen'), 1200);
      return;
    }
    setFormError(result.message ?? 'Unable to reset password.');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={palette.surface} />

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

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.brandName}>OptiFi</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formContainer}>
          <View style={styles.formHeader}>
            <Text style={styles.title}>Set New Password</Text>
            <Text style={styles.subtitle}>Choose a strong password to secure your account.</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>New Password</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter new password"
                  placeholderTextColor={palette.textSecondary}
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Confirm new password"
                  placeholderTextColor={palette.textSecondary}
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>
            </View>

            {formError ? <Text style={styles.errorText}>{formError}</Text> : null}
            {formMessage ? <Text style={styles.successText}>{formMessage}</Text> : null}

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color={palette.textPrimary} />
              ) : (
                <Text style={styles.submitButtonText}>Reset Password</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      <BottomNav />
    </View>
  );
}

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
    width: width * 1.1,
    height: width * 1.1,
    top: -width * 0.3,
    right: -width * 0.2,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
  },
  circle2: {
    width: width * 1.1,
    height: width * 1.1,
    bottom: -width * 0.3,
    left: -width * 0.2,
    backgroundColor: 'rgba(74, 222, 128, 0.12)',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  backText: {
    color: palette.textPrimary,
    fontSize: 24,
  },
  brandName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: palette.textPrimary,
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
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: palette.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
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
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: palette.textSecondary,
    marginBottom: 8,
  },
  inputWrapper: {
    backgroundColor: palette.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.25)',
  },
  input: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    color: palette.textPrimary,
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: palette.accentGreen,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  submitButtonText: {
    color: palette.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: palette.cashBlue,
    fontSize: 12,
    marginBottom: 8,
  },
  successText: {
    color: palette.mpesaGreen,
    fontSize: 12,
    marginBottom: 8,
  },
});
