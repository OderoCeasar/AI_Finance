import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

import BottomNav from '@/components/bottom-nav';
import { loadPreference } from '@/lib/preferences';

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

export default function ConnectAccountsPlusScreen() {
  const router = useRouter();
  const [prefs, setPrefs] = useState<ConnectionPrefs>(defaultPrefs);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const hydrate = async () => {
      const stored = await loadPreference('connections', defaultPrefs);
      setPrefs(stored);
      setIsLoading(false);
    };
    hydrate();
  }, []);

  const hasConnection = prefs.mpesaEnabled || prefs.bankEnabled;

  const lastSyncLabel = useMemo(() => {
    const syncs = [prefs.mpesaLastSync, prefs.bankLastSync].filter(
      (value) => value && value !== 'Not connected',
    );
    if (!syncs.length) {
      return 'Never';
    }
    return syncs[0];
  }, [prefs.mpesaLastSync, prefs.bankLastSync]);

  const handleManageConnections = () => router.push('/ConnectedAccountsScreen');

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={palette.sidebar} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Connect Accounts</Text>
          <Text style={styles.headerSubtitle}>
            Link M-Pesa and bank data for smarter insights.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Status</Text>
          {isLoading ? (
            <Text style={styles.cardText}>Loading connection status…</Text>
          ) : (
            <>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>M-Pesa</Text>
                <Text style={prefs.mpesaEnabled ? styles.statusOn : styles.statusOff}>
                  {prefs.mpesaEnabled ? 'Connected' : 'Not connected'}
                </Text>
              </View>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Bank</Text>
                <Text style={prefs.bankEnabled ? styles.statusOn : styles.statusOff}>
                  {prefs.bankEnabled ? 'Connected' : 'Not connected'}
                </Text>
              </View>
              <Text style={styles.statusMeta}>Last sync: {lastSyncLabel}</Text>
            </>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quick Actions</Text>
          <TouchableOpacity style={styles.actionButton} onPress={handleManageConnections}>
            <Text style={styles.actionText}>Connect M-Pesa</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleManageConnections}>
            <Text style={styles.actionText}>Connect Bank</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleManageConnections}>
            <Text style={styles.secondaryText}>Import last 30 days</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleManageConnections}>
            <Text style={styles.secondaryText}>Upload statement (CSV/PDF)</Text>
          </TouchableOpacity>
          <Text style={styles.helperText}>
            We import transactions only. No personal messages.
          </Text>
        </View>

        {hasConnection ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Snapshot</Text>
            <View style={styles.snapshotRow}>
              <Text style={styles.snapshotLabel}>Transactions imported</Text>
              <Text style={styles.snapshotValue}>186</Text>
            </View>
            <View style={styles.snapshotRow}>
              <Text style={styles.snapshotLabel}>Top category</Text>
              <Text style={styles.snapshotValue}>Food</Text>
            </View>
            <View style={styles.snapshotRow}>
              <Text style={styles.snapshotLabel}>Biggest spend</Text>
              <Text style={styles.snapshotValue}>KES 8,500</Text>
            </View>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Unlock Insights</Text>
            <Text style={styles.cardText}>Connect to unlock smart insights.</Text>
            <TouchableOpacity style={styles.actionButton} onPress={handleManageConnections}>
              <Text style={styles.actionText}>Connect M-Pesa / Bank</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Privacy</Text>
          <Text style={styles.cardText}>We only read transaction data.</Text>
          <Text style={styles.cardText}>You can disconnect anytime.</Text>
          <Text style={styles.cardText}>Your data is encrypted in transit and at rest.</Text>
        </View>
      </ScrollView>
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.surface,
  },
  content: {
    padding: 20,
    paddingBottom: 120,
  },
  header: {
    backgroundColor: palette.sidebar,
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
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
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  statusLabel: {
    fontSize: 13,
    color: palette.textPrimary,
    fontWeight: '600',
  },
  statusOn: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.mpesaGreen,
  },
  statusOff: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.textSecondary,
  },
  statusMeta: {
    fontSize: 12,
    color: palette.textSecondary,
    marginTop: 10,
  },
  actionButton: {
    backgroundColor: 'rgba(74, 222, 128, 0.2)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.5)',
    marginTop: 8,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.textPrimary,
  },
  secondaryButton: {
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.35)',
    marginTop: 8,
  },
  secondaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.cashBlue,
  },
  helperText: {
    fontSize: 12,
    color: palette.textSecondary,
    marginTop: 10,
  },
  snapshotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  snapshotLabel: {
    fontSize: 12,
    color: palette.textSecondary,
  },
  snapshotValue: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.textPrimary,
  },
});
