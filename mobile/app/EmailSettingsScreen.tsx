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

export default function EmailSettingsScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [newsletters, setNewsletters] = useState(true);
  const [securityAlerts, setSecurityAlerts] = useState(true);
  const [productUpdates, setProductUpdates] = useState(false);

  useEffect(() => {
    const hydrate = async () => {
      const prefs = await loadPreference('email', {
        newsletters: true,
        securityAlerts: true,
        productUpdates: false,
      });
      setNewsletters(prefs.newsletters);
      setSecurityAlerts(prefs.securityAlerts);
      setProductUpdates(prefs.productUpdates);
      setIsLoading(false);
    };
    hydrate();
  }, []);

  const persist = async (next: {
    newsletters: boolean;
    securityAlerts: boolean;
    productUpdates: boolean;
  }) => {
    await savePreference('email', next);
  };

  const toggleNewsletters = async (value: boolean) => {
    setNewsletters(value);
    await persist({ newsletters: value, securityAlerts, productUpdates });
  };

  const toggleSecurityAlerts = async (value: boolean) => {
    setSecurityAlerts(value);
    await persist({ newsletters, securityAlerts: value, productUpdates });
  };

  const toggleProductUpdates = async (value: boolean) => {
    setProductUpdates(value);
    await persist({ newsletters, securityAlerts, productUpdates: value });
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={palette.sidebar} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Email Settings</Text>
        <Text style={styles.headerSubtitle}>Manage newsletters and alerts</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Preferences</Text>
        {isLoading ? (
          <Text style={styles.cardText}>Loading preferences…</Text>
        ) : (
          <View style={styles.preferenceList}>
            <View style={styles.preferenceRow}>
              <View style={styles.preferenceCopy}>
                <Text style={styles.preferenceTitle}>Newsletters</Text>
                <Text style={styles.preferenceSubtitle}>Weekly tips and updates.</Text>
              </View>
              <Switch
                value={newsletters}
                onValueChange={toggleNewsletters}
                trackColor={{ false: 'rgba(100, 116, 139, 0.3)', true: 'rgba(74, 222, 128, 0.6)' }}
                thumbColor={newsletters ? palette.accentGreen : '#CBD5F5'}
              />
            </View>
            <View style={styles.preferenceRow}>
              <View style={styles.preferenceCopy}>
                <Text style={styles.preferenceTitle}>Security Alerts</Text>
                <Text style={styles.preferenceSubtitle}>Login and password changes.</Text>
              </View>
              <Switch
                value={securityAlerts}
                onValueChange={toggleSecurityAlerts}
                trackColor={{ false: 'rgba(100, 116, 139, 0.3)', true: 'rgba(74, 222, 128, 0.6)' }}
                thumbColor={securityAlerts ? palette.accentGreen : '#CBD5F5'}
              />
            </View>
            <View style={styles.preferenceRow}>
              <View style={styles.preferenceCopy}>
                <Text style={styles.preferenceTitle}>Product Updates</Text>
                <Text style={styles.preferenceSubtitle}>Feature announcements.</Text>
              </View>
              <Switch
                value={productUpdates}
                onValueChange={toggleProductUpdates}
                trackColor={{ false: 'rgba(100, 116, 139, 0.3)', true: 'rgba(74, 222, 128, 0.6)' }}
                thumbColor={productUpdates ? palette.accentGreen : '#CBD5F5'}
              />
            </View>
          </View>
        )}
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
});
