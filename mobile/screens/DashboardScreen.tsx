import React, { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
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

type DashboardSummary = {
  income: number | string;
  expenses: number | string;
  savings: number | string;
  savings_rate: number | string;
  top_categories: Array<{ category: string; total: number | string }>;
};

type QuickAction = {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  color: string;
  background: string;
};

type AccountBalance = {
  label: string;
  amount: number;
};

type ActivityItem = {
  id: string;
  title: string;
  category: string;
  source: string;
  amount: number;
  icon: keyof typeof Feather.glyphMap;
};

const fallbackSummary: DashboardSummary = {
  income: 120000,
  expenses: 72000,
  savings: 124580,
  savings_rate: 12.5,
  top_categories: [],
};

const quickActions: QuickAction[] = [
  {
    label: 'Send',
    icon: 'arrow-up-right',
    color: '#16A34A',
    background: 'rgba(34, 197, 94, 0.15)',
  },
  {
    label: 'Receive',
    icon: 'arrow-down-left',
    color: '#EA580C',
    background: 'rgba(249, 115, 22, 0.15)',
  },
  {
    label: 'Budget',
    icon: 'pie-chart',
    color: '#2563EB',
    background: 'rgba(37, 99, 235, 0.12)',
  },
  {
    label: 'Save',
    icon: 'dollar-sign',
    color: '#CA8A04',
    background: 'rgba(234, 179, 8, 0.18)',
  },
];

const recentActivities: ActivityItem[] = [
  {
    id: 'zara',
    title: 'Zara - Westgate',
    category: 'Shopping',
    source: 'M-Pesa',
    amount: -4800,
    icon: 'shopping-bag',
  },
  {
    id: 'salary',
    title: 'Salary Deposit',
    category: 'Income',
    source: 'Equity',
    amount: 95000,
    icon: 'briefcase',
  },
  {
    id: 'java',
    title: 'Java House',
    category: 'Food',
    source: 'M-Pesa',
    amount: -890,
    icon: 'coffee',
  },
];

const toNumber = (value: number | string) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const formatKes = (value: number | string) => {
  const numeric = toNumber(value);
  try {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      maximumFractionDigits: 0,
    }).format(numeric);
  } catch (error) {
    return `KES ${Math.round(numeric).toLocaleString()}`;
  }
};

const formatCompact = (value: number) => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toFixed(0);
};

const formatSigned = (value: number) => {
  const sign = value >= 0 ? '+' : '-';
  const abs = Math.abs(value);
  return `${sign}${abs.toLocaleString('en-KE')}`;
};

export default function DashboardScreen() {
  const router = useRouter();
  const { tokens, refreshAccessToken, user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary>(fallbackSummary);
  const [showBalances, setShowBalances] = useState(true);
  const accessToken = tokens?.access;

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    let isMounted = true;

    const fetchDashboard = async () => {
      try {
        const fetchWithRefresh = async <T,>(
          fetcher: (token: string) => Promise<ReturnType<typeof api.get<T>>>,
        ) => {
          let result = await fetcher(accessToken);
          if (result.status === 401) {
            const newToken = await refreshAccessToken();
            if (newToken) {
              result = await fetcher(newToken);
            }
          }
          return result;
        };

        const summaryRes = await fetchWithRefresh((token) =>
          api.get<DashboardSummary>('analytics/dashboard/', token),
        );

        if (isMounted && summaryRes.ok && summaryRes.data) {
          setSummary(summaryRes.data);
        }
      } catch (error) {
        if (isMounted) {
          setSummary(fallbackSummary);
        }
      }
    };

    fetchDashboard();

    return () => {
      isMounted = false;
    };
  }, [accessToken, refreshAccessToken]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const displayName = user?.name?.trim() || 'there';
  const avatarLabel = useMemo(() => {
    const name = user?.name?.trim();
    if (!name) {
      return 'U';
    }
    const parts = name.split(' ').filter(Boolean);
    if (parts.length === 1) {
      return parts[0].slice(0, 1).toUpperCase();
    }
    return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
  }, [user?.name]);
  const savingsRate = toNumber(summary.savings_rate);

  const accountBalances: AccountBalance[] = useMemo(
    () => [
      { label: 'M-Pesa', amount: 45200 },
      { label: 'Equity Bank', amount: 79400 },
    ],
    [],
  );

  const maskedAmount = '*****';

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={palette.surface} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.greetingRow}>
          <View style={styles.greetingText}>
            <Text style={styles.greetingLabel}>{`${greeting},`}</Text>
            <Text style={styles.greetingName}>{displayName}</Text>
          </View>
          <TouchableOpacity
            style={styles.avatarButton}
            onPress={() => router.push('/(tabs)/ProfileScreen')}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Open profile"
          >
            <Text style={styles.avatarText}>{avatarLabel}</Text>
          </TouchableOpacity>
        </View>

        <LinearGradient
          colors={[palette.sidebar, '#0B1220']}
          style={styles.balanceCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>Total Balance</Text>
            <TouchableOpacity
              style={styles.eyeButton}
              activeOpacity={0.8}
              onPress={() => setShowBalances((prev) => !prev)}
              accessibilityRole="button"
              accessibilityLabel={showBalances ? 'Hide balances' : 'Show balances'}
            >
              <Feather
                name={showBalances ? 'eye' : 'eye-off'}
                size={16}
                color="rgba(255, 255, 255, 0.85)"
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.balanceValue}>
            {showBalances ? formatKes(summary.savings) : maskedAmount}
          </Text>
          <View style={styles.balanceChange}>
            <Feather name="trending-up" size={14} color={palette.accentGreen} />
            <Text style={styles.balanceChangeText}>{`${savingsRate.toFixed(1)}% this month`}</Text>
          </View>

          <View style={styles.accountRow}>
            {accountBalances.map((account) => (
              <View key={account.label} style={styles.accountCard}>
                <Text style={styles.accountLabel}>{account.label}</Text>
                <Text style={styles.accountValue}>
                  {showBalances ? formatCompact(account.amount) : maskedAmount}
                </Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickRow}>
          {quickActions.map((action) => (
            <TouchableOpacity key={action.label} style={styles.quickCard} activeOpacity={0.85}>
              <View style={[styles.quickIcon, { backgroundColor: action.background }]}>
                <Feather name={action.icon} size={18} color={action.color} />
              </View>
              <Text style={styles.quickLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <LinearGradient
          colors={['#34D399', '#10B981']}
          style={styles.insightCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.insightIcon}>
            <Feather name="star" size={18} color="white" />
          </View>
          <View style={styles.insightContent}>
            <Text style={styles.insightTitle}>AI Insight</Text>
            <Text style={styles.insightText}>
              You're on track to save {formatKes(28450)} this month!
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.activityHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity activeOpacity={0.8}>
            <Text style={styles.viewAll}>View all</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.activityList}>
          {recentActivities.map((item) => {
            const isPositive = item.amount >= 0;
            return (
              <View key={item.id} style={styles.activityCard}>
                <View style={styles.activityIcon}>
                  <Feather name={item.icon} size={18} color={palette.accentGreen} />
                </View>
                <View style={styles.activityDetails}>
                  <Text style={styles.activityTitle}>{item.title}</Text>
                  <View style={styles.activityMeta}>
                    <Text style={styles.activityCategory}>{item.category}</Text>
                    <View style={styles.activityTag}>
                      <Text style={styles.activityTagText}>{item.source}</Text>
                    </View>
                  </View>
                </View>
                <Text
                  style={[
                    styles.activityAmount,
                    isPositive ? styles.activityAmountPositive : styles.activityAmountNegative,
                  ]}
                >
                  {formatSigned(item.amount)}
                </Text>
              </View>
            );
          })}
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
  container: {
    flex: 1,
    backgroundColor: palette.surface,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 140,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  greetingText: {
    flex: 1,
  },
  greetingLabel: {
    fontSize: 14,
    color: palette.textSecondary,
    marginBottom: 6,
  },
  greetingName: {
    fontSize: 22,
    fontWeight: '700',
    color: palette.textPrimary,
  },
  avatarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(74, 222, 128, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.textPrimary,
  },
  balanceCard: {
    borderRadius: 22,
    padding: 18,
    marginBottom: 22,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 6,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  balanceLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  eyeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceValue: {
    fontSize: 28,
    fontWeight: '700',
    color: palette.card,
    marginBottom: 8,
  },
  balanceChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  balanceChangeText: {
    fontSize: 12,
    color: palette.accentGreen,
    fontWeight: '600',
  },
  accountRow: {
    flexDirection: 'row',
    gap: 12,
  },
  accountCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    padding: 12,
  },
  accountLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 6,
  },
  accountValue: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.card,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.textPrimary,
    marginBottom: 12,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 12,
  },
  viewAll: {
    color: palette.accentGreen,
    fontSize: 12,
    fontWeight: '600',
  },
  activityList: {
    gap: 12,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.14)',
  },
  activityIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(74, 222, 128, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityDetails: {
    flex: 1,
    marginLeft: 12,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.textPrimary,
    marginBottom: 6,
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activityCategory: {
    fontSize: 12,
    color: palette.textSecondary,
  },
  activityTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
  },
  activityTagText: {
    fontSize: 11,
    color: palette.cashBlue,
    fontWeight: '600',
  },
  activityAmount: {
    minWidth: 72,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: '700',
  },
  activityAmountPositive: {
    color: palette.accentGreen,
  },
  activityAmountNegative: {
    color: palette.textPrimary,
  },
  quickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  quickCard: {
    flex: 1,
    backgroundColor: palette.card,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.16)',
  },
  quickIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.textPrimary,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    padding: 16,
    gap: 12,
  },
  insightIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.card,
    marginBottom: 4,
  },
  insightText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 18,
  },
});
