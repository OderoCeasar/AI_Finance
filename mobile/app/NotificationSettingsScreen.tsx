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

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [inAppEnabled, setInAppEnabled] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(false);

  useEffect(() => {
    const hydrate = async () => {
      const prefs = await loadPreference('notifications', {
        pushEnabled: true,
        inAppEnabled: true,
        weeklySummary: false,
      });
      setPushEnabled(prefs.pushEnabled);
      setInAppEnabled(prefs.inAppEnabled);
      setWeeklySummary(prefs.weeklySummary);
      setIsLoading(false);
    };
    hydrate();
  }, []);

  const persist = async (next: {
    pushEnabled: boolean;
    inAppEnabled: boolean;
    weeklySummary: boolean;
  }) => {
    await savePreference('notifications', next);
  };

  const togglePush = async (value: boolean) => {
    setPushEnabled(value);
    await persist({ pushEnabled: value, inAppEnabled, weeklySummary });
  };

  const toggleInApp = async (value: boolean) => {
    setInAppEnabled(value);
    await persist({ pushEnabled, inAppEnabled: value, weeklySummary });
  };

  const toggleWeeklySummary = async (value: boolean) => {
    setWeeklySummary(value);
    await persist({ pushEnabled, inAppEnabled, weeklySummary: value });
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={palette.sidebar} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification Settings</Text>
        <Text style={styles.headerSubtitle}>Push and in-app preferences</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Notifications</Text>
        {isLoading ? (
          <Text style={styles.cardText}>Loading preferences…</Text>
        ) : (
          <View style={styles.preferenceList}>
            <View style={styles.preferenceRow}>
              <View style={styles.preferenceCopy}>
                <Text style={styles.preferenceTitle}>Push Notifications</Text>
                <Text style={styles.preferenceSubtitle}>Real-time budget alerts.</Text>
              </View>
              <Switch
                value={pushEnabled}
                onValueChange={togglePush}
                trackColor={{ false: 'rgba(100, 116, 139, 0.3)', true: 'rgba(74, 222, 128, 0.6)' }}
                thumbColor={pushEnabled ? palette.accentGreen : '#CBD5F5'}
              />
            </View>
            <View style={styles.preferenceRow}>
              <View style={styles.preferenceCopy}>
                <Text style={styles.preferenceTitle}>In-App Alerts</Text>
                <Text style={styles.preferenceSubtitle}>Warnings inside the app.</Text>
              </View>
              <Switch
                value={inAppEnabled}
                onValueChange={toggleInApp}
                trackColor={{ false: 'rgba(100, 116, 139, 0.3)', true: 'rgba(74, 222, 128, 0.6)' }}
                thumbColor={inAppEnabled ? palette.accentGreen : '#CBD5F5'}
              />
            </View>
            <View style={styles.preferenceRow}>
              <View style={styles.preferenceCopy}>
                <Text style={styles.preferenceTitle}>Weekly Summary</Text>
                <Text style={styles.preferenceSubtitle}>Digest of your spending.</Text>
              </View>
              <Switch
                value={weeklySummary}
                onValueChange={toggleWeeklySummary}
                trackColor={{ false: 'rgba(100, 116, 139, 0.3)', true: 'rgba(74, 222, 128, 0.6)' }}
                thumbColor={weeklySummary ? palette.accentGreen : '#CBD5F5'}
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
