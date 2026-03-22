import React, { useEffect, useState } from 'react';
import { StatusBar, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

import BottomNav from '@/components/bottom-nav';
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

type ConnectionPrefs = {
  mpesaEnabled: boolean;
  bankEnabled: boolean;
  mpesaLastSync: string;
  bankLastSync: string;
};

const defaultPrefs: ConnectionPrefs = {
  mpesaEnabled: false,
  bankEnabled: false,
  mpesaLastSync: 'Not connected',
  bankLastSync: 'Not connected',
};

export default function ConnectedAccountsScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [prefs, setPrefs] = useState<ConnectionPrefs>(defaultPrefs);

  useEffect(() => {
    const hydrate = async () => {
      const stored = await loadPreference('connections', defaultPrefs);
      setPrefs(stored);
      setIsLoading(false);
    };
    hydrate();
  }, []);

  const persist = async (next: ConnectionPrefs) => {
    setPrefs(next);
    await savePreference('connections', next);
  };

  const updateLastSync = (enabled: boolean) =>
    enabled ? new Date().toLocaleString() : 'Not connected';

  const toggleMpesa = async (value: boolean) => {
    await persist({
      ...prefs,
      mpesaEnabled: value,
      mpesaLastSync: updateLastSync(value),
    });
  };

  const toggleBank = async (value: boolean) => {
    await persist({
      ...prefs,
      bankEnabled: value,
      bankLastSync: updateLastSync(value),
    });
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={palette.sidebar} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Connected Accounts</Text>
        <Text style={styles.headerSubtitle}>Manage M-Pesa and bank access</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Data Sources</Text>
        {isLoading ? (
          <Text style={styles.cardText}>Loading connections…</Text>
        ) : (
          <>
            <View style={styles.preferenceRow}>
              <View style={styles.preferenceCopy}>
                <Text style={styles.preferenceTitle}>M-Pesa SMS</Text>
                <Text style={styles.preferenceSubtitle}>Last sync: {prefs.mpesaLastSync}</Text>
              </View>
              <Switch
                value={prefs.mpesaEnabled}
                onValueChange={toggleMpesa}
                trackColor={{ false: 'rgba(100, 116, 139, 0.3)', true: 'rgba(74, 222, 128, 0.6)' }}
                thumbColor={prefs.mpesaEnabled ? palette.accentGreen : '#CBD5F5'}
              />
            </View>
            <View style={styles.preferenceRow}>
              <View style={styles.preferenceCopy}>
                <Text style={styles.preferenceTitle}>Bank Statements</Text>
                <Text style={styles.preferenceSubtitle}>Last sync: {prefs.bankLastSync}</Text>
              </View>
              <Switch
                value={prefs.bankEnabled}
                onValueChange={toggleBank}
                trackColor={{ false: 'rgba(100, 116, 139, 0.3)', true: 'rgba(74, 222, 128, 0.6)' }}
                thumbColor={prefs.bankEnabled ? palette.accentGreen : '#CBD5F5'}
              />
            </View>
          </>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Import Options</Text>
        <Text style={styles.cardText}>Choose how you want to bring in transactions.</Text>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionText}>Import last 30 days</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton}>
          <Text style={styles.secondaryText}>Upload statement (CSV/PDF)</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Privacy & Control</Text>
        <Text style={styles.cardText}>We only read transaction data, not personal messages.</Text>
        <Text style={styles.cardText}>You can disconnect or delete imported data anytime.</Text>
        <Text style={styles.cardText}>Your data is encrypted in transit and at rest.</Text>
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
    marginBottom: 16,
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
    marginBottom: 10,
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
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
  actionButton: {
    backgroundColor: 'rgba(74, 222, 128, 0.2)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.5)',
    marginTop: 6,
  },
  actionText: {
    color: palette.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.35)',
    marginTop: 10,
  },
  secondaryText: {
    color: palette.cashBlue,
    fontSize: 13,
    fontWeight: '600',
  },
});
