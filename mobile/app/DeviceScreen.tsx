import React, { useEffect, useState } from 'react';
import { StatusBar, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

import BottomNav from '@/components/bottom-nav';
import { loadPreference, savePreference } from '@/lib/preferences';
import { useAuth } from '@/lib/auth';

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

export default function DeviceScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [lastActive, setLastActive] = useState('');

  useEffect(() => {
    const hydrate = async () => {
      const prefs = await loadPreference('device', {
        rememberDevice: true,
        lastActive: new Date().toLocaleString(),
      });
      setRememberDevice(prefs.rememberDevice);
      setLastActive(prefs.lastActive);
      setIsLoading(false);
    };
    hydrate();
  }, []);

  const toggleRemember = async (value: boolean) => {
    const next = { rememberDevice: value, lastActive: new Date().toLocaleString() };
    setRememberDevice(value);
    setLastActive(next.lastActive);
    await savePreference('device', next);
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/WelcomeScreen');
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={palette.sidebar} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Device</Text>
        <Text style={styles.headerSubtitle}>Trusted devices and sessions</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Device Management</Text>
        {isLoading ? (
          <Text style={styles.cardText}>Loading device status…</Text>
        ) : (
          <>
            <View style={styles.deviceRow}>
              <View style={styles.deviceCopy}>
                <Text style={styles.deviceTitle}>This device</Text>
                <Text style={styles.deviceSubtitle}>Last active: {lastActive}</Text>
              </View>
              <Switch
                value={rememberDevice}
                onValueChange={toggleRemember}
                trackColor={{ false: 'rgba(100, 116, 139, 0.3)', true: 'rgba(74, 222, 128, 0.6)' }}
                thumbColor={rememberDevice ? palette.accentGreen : '#CBD5F5'}
              />
            </View>
            <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
              <Text style={styles.signOutText}>Sign out of this device</Text>
            </TouchableOpacity>
          </>
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
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
  },
  deviceCopy: {
    flex: 1,
  },
  deviceTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.textPrimary,
    marginBottom: 4,
  },
  deviceSubtitle: {
    fontSize: 12,
    color: palette.textSecondary,
  },
  signOutButton: {
    marginTop: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  signOutText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#B91C1C',
  },
});
