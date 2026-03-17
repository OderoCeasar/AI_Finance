import React from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import BottomNav from '@/components/bottom-nav';

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

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={palette.sidebar} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <LinearGradient
            colors={[palette.sidebar, '#111827']}
            style={styles.heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.heroTitle}>AI_Finance</Text>
            <Text style={styles.heroSubtitle}>Your personal money cockpit</Text>
          </LinearGradient>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shortcuts</Text>
          <View style={styles.shortcutGrid}>
            <TouchableOpacity
              style={[styles.shortcutCard, styles.shortcutPrimary]}
              onPress={() => router.push('/(tabs)/TransactionScreen')}
            >
              <Text style={styles.shortcutTitle}>Add Transaction</Text>
              <Text style={styles.shortcutMeta}>Income or expense</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.shortcutCard}
              onPress={() => router.push('/(tabs)/TransactionScreen')}
            >
              <Text style={styles.shortcutTitle}>Transactions</Text>
              <Text style={styles.shortcutMeta}>History & filters</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.shortcutCard}
              onPress={() => router.push('/Dashboard')}
            >
              <Text style={styles.shortcutTitle}>Dashboard</Text>
              <Text style={styles.shortcutMeta}>Insights & trends</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.shortcutCard}
              onPress={() => router.push('/AllScreens')}
            >
              <Text style={styles.shortcutTitle}>All Screens</Text>
              <Text style={styles.shortcutMeta}>Navigation hub</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.shortcutCard}
              onPress={() => router.push('/(tabs)/ProfileScreen')}
            >
              <Text style={styles.shortcutTitle}>Profile</Text>
              <Text style={styles.shortcutMeta}>Account settings</Text>
            </TouchableOpacity>
          </View>
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
  hero: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
  },
  heroGradient: {
    padding: 24,
  },
  heroTitle: {
    color: palette.card,
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 8,
  },
  heroSubtitle: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: palette.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  shortcutGrid: {
    gap: 12,
  },
  shortcutCard: {
    backgroundColor: palette.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
  },
  shortcutPrimary: {
    backgroundColor: 'rgba(74, 222, 128, 0.18)',
    borderColor: 'rgba(74, 222, 128, 0.4)',
  },
  shortcutTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: palette.textPrimary,
    marginBottom: 4,
  },
  shortcutMeta: {
    fontSize: 12,
    color: palette.textSecondary,
  },
});
