import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Link } from 'expo-router';

import { api } from '@/lib/api';
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

type DashboardSummary = {
  income: number | string;
  expenses: number | string;
  savings: number | string;
  savings_rate: number | string;
  top_categories: Array<{ category: string; total: number | string }>;
};

type CategoryBreakdownItem = {
  category: string;
  total: number | string;
  percentage: number | string;
};

type RecommendationItem = {
  id?: number;
  message: string;
  priority?: string;
};

const fallbackSummary: DashboardSummary = {
  income: 120000,
  expenses: 72000,
  savings: 48000,
  savings_rate: 40,
  top_categories: [],
};

const fallbackBudgets = [
  { category: 'Food', percent: 60, color: palette.accentGreen },
  { category: 'Transport', percent: 40, color: palette.cashBlue },
  { category: 'Rent', percent: 100, color: palette.sidebar },
  { category: 'Entertainment', percent: 75, color: palette.mpesaGreen },
];

const fallbackInsights: RecommendationItem[] = [
  { message: 'You are likely to overspend on food this month.' },
  { message: 'You can save KES 5,000 if you reduce entertainment spending.' },
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

export default function DashboardScreen() {
  const [summary, setSummary] = useState<DashboardSummary>(fallbackSummary);
  const [breakdown, setBreakdown] = useState<CategoryBreakdownItem[]>([]);
  const [insights, setInsights] = useState<RecommendationItem[]>(fallbackInsights);
  const [isLoading, setIsLoading] = useState(false);
  const { tokens, refreshAccessToken } = useAuth();
  const accessToken = tokens?.access;

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    let isMounted = true;

    const fetchDashboard = async () => {
      setIsLoading(true);
      try {
        const fetchWithRefresh = async <T,>(fetcher: (token: string) => Promise<ReturnType<typeof api.get<T>>>) => {
          if (!accessToken) {
            return fetcher('');
          }
          let result = await fetcher(accessToken);
          if (result.status === 401) {
            const newToken = await refreshAccessToken();
            if (newToken) {
              result = await fetcher(newToken);
            }
          }
          return result;
        };

        const [summaryRes, breakdownRes, insightsRes] = await Promise.all([
          fetchWithRefresh((token) => api.get<DashboardSummary>('analytics/dashboard/', token)),
          fetchWithRefresh((token) => api.get<CategoryBreakdownItem[]>('analytics/category-breakdown/', token)),
          fetchWithRefresh((token) => api.get<RecommendationItem[]>('recommendations/', token)),
        ]);

        if (isMounted && summaryRes.ok && summaryRes.data) {
          setSummary(summaryRes.data);
        }

        if (isMounted && breakdownRes.ok && breakdownRes.data) {
          setBreakdown(breakdownRes.data);
        }

        if (isMounted && insightsRes.ok && insightsRes.data?.length) {
          setInsights(insightsRes.data);
        }
      } catch (error) {
        if (isMounted) {
          setSummary(fallbackSummary);
          setBreakdown([]);
          setInsights(fallbackInsights);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchDashboard();

    return () => {
      isMounted = false;
    };
  }, [accessToken, refreshAccessToken]);

  const budgetProgress = useMemo(() => {
    if (!breakdown.length) {
      return fallbackBudgets;
    }

    const breakdownMap = new Map(
      breakdown.map((item) => [item.category.toLowerCase(), toNumber(item.percentage)])
    );

    return fallbackBudgets.map((item) => ({
      ...item,
      percent: breakdownMap.get(item.category.toLowerCase()) ?? item.percent,
    }));
  }, [breakdown]);

  const savingsRate = toNumber(summary.savings_rate);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={palette.sidebar} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Dashboard</Text>
            <Text style={styles.headerSubtitle}>Report Period: This Month</Text>
          </View>
          <View style={styles.statusPill}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Online</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <Link href="/(tabs)/TransactionScreen" asChild>
              <TouchableOpacity style={styles.quickCard}>
                <Text style={styles.quickTitle}>Add Transaction</Text>
                <Text style={styles.quickSubtitle}>Log income or expense</Text>
              </TouchableOpacity>
            </Link>
            <Link href="/(tabs)/TransactionScreen" asChild>
              <TouchableOpacity style={styles.quickCard}>
                <Text style={styles.quickTitle}>View Transactions</Text>
                <Text style={styles.quickSubtitle}>History & filters</Text>
              </TouchableOpacity>
            </Link>
            <Link href="/(tabs)/ProfileScreen" asChild>
              <TouchableOpacity style={styles.quickCard}>
                <Text style={styles.quickTitle}>Profile</Text>
                <Text style={styles.quickSubtitle}>Account settings</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Financial Overview</Text>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Total Balance</Text>
            <Text style={styles.balanceValue}>{formatKes(summary.savings)}</Text>
          </View>
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Total Income (This Month)</Text>
              <Text style={[styles.metricValue, styles.metricIncome]}>
                {formatKes(summary.income)}
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Total Expenses (This Month)</Text>
              <Text style={[styles.metricValue, styles.metricExpense]}>
                {formatKes(summary.expenses)}
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Savings Rate (%)</Text>
              <Text style={[styles.metricValue, styles.metricSavings]}>
                {`${savingsRate.toFixed(1)}%`}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Budget Progress</Text>
          {budgetProgress.map((item) => (
            <View key={item.category} style={styles.progressRow}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>{item.category}</Text>
                <Text style={styles.progressPercent}>{`${item.percent}% used`}</Text>
              </View>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(item.percent, 100)}%`,
                      backgroundColor: item.color,
                    },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>AI Insights</Text>
          {insights.slice(0, 3).map((insight, index) => (
            <View key={`${insight.message}-${index}`} style={styles.insightRow}>
              <View style={styles.insightDot} />
              <Text style={styles.insightText}>{insight.message}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {isLoading ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={palette.accentGreen} />
        </View>
      ) : null}
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
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    backgroundColor: palette.sidebar,
    borderRadius: 18,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    color: palette.card,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 6,
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.accentGreen,
    marginRight: 6,
  },
  statusText: {
    color: palette.card,
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    backgroundColor: palette.card,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.textPrimary,
    marginBottom: 12,
  },
  quickActions: {
    gap: 12,
  },
  quickCard: {
    borderRadius: 14,
    padding: 14,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.2)',
  },
  quickTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.textPrimary,
    marginBottom: 4,
  },
  quickSubtitle: {
    fontSize: 12,
    color: palette.textSecondary,
  },
  balanceRow: {
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 13,
    color: palette.textSecondary,
    marginBottom: 6,
  },
  balanceValue: {
    fontSize: 28,
    fontWeight: '700',
    color: palette.textPrimary,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricItem: {
    width: '48%',
    marginBottom: 12,
  },
  metricLabel: {
    fontSize: 12,
    color: palette.textSecondary,
    marginBottom: 6,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  metricIncome: {
    color: palette.mpesaGreen,
  },
  metricExpense: {
    color: palette.cashBlue,
  },
  metricSavings: {
    color: palette.textPrimary,
  },
  progressRow: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.textPrimary,
  },
  progressPercent: {
    fontSize: 12,
    color: palette.textSecondary,
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(100, 116, 139, 0.18)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  insightDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.accentGreen,
    marginTop: 6,
    marginRight: 10,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    color: palette.textSecondary,
    lineHeight: 20,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(248, 250, 252, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
