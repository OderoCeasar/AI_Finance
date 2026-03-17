import React, { useEffect, useState } from 'react';
import { StatusBar, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

import BottomNav from '@/components/bottom-nav';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { loadPreference, savePreference } from '@/lib/preferences';

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

export default function SecurityScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [requireReauth, setRequireReauth] = useState(true);
  const [loginAlerts, setLoginAlerts] = useState(true);
  const [email, setEmail] = useState(user?.email ?? '');
  const [formMessage, setFormMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const hydrate = async () => {
      const prefs = await loadPreference('security', {
        requireReauth: true,
        loginAlerts: true,
      });
      setRequireReauth(prefs.requireReauth);
      setLoginAlerts(prefs.loginAlerts);
      setIsLoading(false);
    };
    hydrate();
  }, []);

  const persist = async (next: { requireReauth: boolean; loginAlerts: boolean }) => {
    await savePreference('security', next);
  };

  const toggleReauth = async (value: boolean) => {
    setRequireReauth(value);
    await persist({ requireReauth: value, loginAlerts });
  };

  const toggleAlerts = async (value: boolean) => {
    setLoginAlerts(value);
    await persist({ requireReauth, loginAlerts: value });
  };

  const handlePasswordReset = async () => {
    setFormMessage('');
    setFormError('');
    if (!email.trim()) {
      setFormError('Enter your email address.');
      return;
    }
    setIsSending(true);
    const result = await api.post<{ reset_link?: string }>('auth/password-reset/', {
      email: email.trim(),
    });
    setIsSending(false);
    if (result.ok) {
      let message = 'Reset link sent to your email.';
      if (result.data?.reset_link) {
        message = `Reset link (dev): ${result.data.reset_link}`;
      }
      setFormMessage(message);
      return;
    }
    setFormError(result.message ?? 'Unable to send reset email.');
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={palette.sidebar} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Security</Text>
        <Text style={styles.headerSubtitle}>Password and authentication</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Security Settings</Text>
        {isLoading ? (
          <Text style={styles.cardText}>Loading preferences…</Text>
        ) : (
          <View style={styles.preferenceList}>
            <View style={styles.preferenceRow}>
              <View style={styles.preferenceCopy}>
                <Text style={styles.preferenceTitle}>Require re-auth</Text>
                <Text style={styles.preferenceSubtitle}>Prompt before sensitive actions.</Text>
              </View>
              <Switch
                value={requireReauth}
                onValueChange={toggleReauth}
                trackColor={{ false: 'rgba(100, 116, 139, 0.3)', true: 'rgba(74, 222, 128, 0.6)' }}
                thumbColor={requireReauth ? palette.accentGreen : '#CBD5F5'}
              />
            </View>
            <View style={styles.preferenceRow}>
              <View style={styles.preferenceCopy}>
                <Text style={styles.preferenceTitle}>Login alerts</Text>
                <Text style={styles.preferenceSubtitle}>Email when a new login occurs.</Text>
              </View>
              <Switch
                value={loginAlerts}
                onValueChange={toggleAlerts}
                trackColor={{ false: 'rgba(100, 116, 139, 0.3)', true: 'rgba(74, 222, 128, 0.6)' }}
                thumbColor={loginAlerts ? palette.accentGreen : '#CBD5F5'}
              />
            </View>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Reset Password</Text>
        <Text style={styles.cardText}>Send a reset link to your email.</Text>
        <TextInput
          style={styles.input}
          placeholder="you@example.com"
          placeholderTextColor={palette.textSecondary}
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        {formError ? <Text style={styles.errorText}>{formError}</Text> : null}
        {formMessage ? <Text style={styles.successText}>{formMessage}</Text> : null}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handlePasswordReset}
          disabled={isSending}
        >
          <Text style={styles.actionText}>{isSending ? 'Sending…' : 'Send Reset Link'}</Text>
        </TouchableOpacity>
      </View>
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.surface,
    padding: 20,
  },
  header: {
    backgroundColor: palette.sidebar,
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    marginBottom: 12,
  },
  backText: {
    color: palette.card,
    fontSize: 12,
    fontWeight: '600',
  },
  headerTitle: {
    color: palette.card,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
  },
  card: {
    backgroundColor: palette.card,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.textPrimary,
    marginBottom: 8,
  },
  cardText: {
    fontSize: 13,
    color: palette.textSecondary,
    lineHeight: 18,
  },
  preferenceList: {
    gap: 16,
    marginTop: 8,
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  preferenceCopy: {
    flex: 1,
  },
  preferenceTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.textPrimary,
    marginBottom: 4,
  },
  preferenceSubtitle: {
    fontSize: 12,
    color: palette.textSecondary,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.25)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: palette.textPrimary,
    backgroundColor: palette.card,
    marginTop: 12,
  },
  actionButton: {
    marginTop: 12,
    backgroundColor: palette.accentGreen,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.textPrimary,
  },
  errorText: {
    color: palette.cashBlue,
    fontSize: 12,
    marginTop: 8,
  },
  successText: {
    color: palette.mpesaGreen,
    fontSize: 12,
    marginTop: 8,
  },
});
