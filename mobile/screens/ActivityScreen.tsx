import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import BottomNav from '@/components/bottom-nav';
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

type CategoryChip = {
  id: string;
  label: string;
  count: number;
  active?: boolean;
};

type ActivityItem = {
  id: number;
  title: string;
  category: string;
  time: string;
  source: string;
  amount: number;
  icon: keyof typeof Feather.glyphMap;
  badge?: string;
};
type CategoryOption = {
  id: number;
  name: string;
};

type TransactionItem = {
  id: number;
  amount: number | string;
  type: 'income' | 'expense';
  description: string;
  date: string;
  category?: CategoryOption | null;
};

type DashboardSummary = {
  expenses: number | string;
};

const formatKes = (value: number) => {
  try {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      maximumFractionDigits: 0,
    }).format(value);
  } catch (error) {
    return `KES ${Math.round(value).toLocaleString()}`;
  }
};

const formatSigned = (value: number) => {
  const sign = value >= 0 ? '+' : '-';
  return `${sign}${Math.abs(value).toLocaleString('en-KE')}`;
};

export default function ActivityScreen() {
  const { tokens, refreshAccessToken } = useAuth();
  const accessToken = tokens?.access;
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [searchText, setSearchText] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!accessToken) {
      setCategories([]);
      setTransactions([]);
      setSummary(null);
      return;
    }

    let isMounted = true;

    const fetchData = async () => {
      setIsLoading(true);
      setErrorMessage('');
      try {
        const fetchWithRefresh = async <T,>(fetcher: (token: string) => ReturnType<typeof api.get<T>>) => {
          let result = await fetcher(accessToken);
          if (result.status === 401) {
            const newToken = await refreshAccessToken();
            if (newToken) {
              result = await fetcher(newToken);
            }
          }
          return result;
        };

        const [categoriesRes, transactionsRes, summaryRes] = await Promise.all([
          fetchWithRefresh((token) => api.get<CategoryOption[]>('categories/', token)),
          fetchWithRefresh((token) => api.get<{ results?: TransactionItem[] } | TransactionItem[]>('transactions/', token)),
          fetchWithRefresh((token) => api.get<DashboardSummary>('analytics/dashboard/', token)),
        ]);

        if (!isMounted) {
          return;
        }

        setCategories(categoriesRes.ok && categoriesRes.data ? categoriesRes.data : []);
        if (transactionsRes.ok && transactionsRes.data) {
          const items = Array.isArray(transactionsRes.data)
            ? transactionsRes.data
            : transactionsRes.data.results ?? [];
          setTransactions(items);
        } else {
          setTransactions([]);
        }
        setSummary(summaryRes.ok && summaryRes.data ? summaryRes.data : null);
      } catch (error) {
        if (isMounted) {
          setErrorMessage('Unable to load transactions right now.');
          setCategories([]);
          setTransactions([]);
          setSummary(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [accessToken, refreshAccessToken]);

  const categoryChips: CategoryChip[] = useMemo(() => {
    const counts = transactions.reduce<Record<number, number>>((acc, item) => {
      const id = item.category?.id;
      if (id) {
        acc[id] = (acc[id] ?? 0) + 1;
      }
      return acc;
    }, {});

    const allChip: CategoryChip = {
      id: 'all',
      label: 'All',
      count: transactions.length,
      active: selectedCategoryId === 'all',
    };

    const categoryChipsList = categories.map((category) => ({
      id: String(category.id),
      label: category.name,
      count: counts[category.id] ?? 0,
      active: selectedCategoryId === String(category.id),
    }));

    return [allChip, ...categoryChipsList];
  }, [categories, transactions, selectedCategoryId]);

  const filteredTransactions = useMemo(() => {
    const term = searchText.trim().toLowerCase();
    return transactions.filter((item) => {
      if (selectedCategoryId !== 'all' && String(item.category?.id ?? '') !== selectedCategoryId) {
        return false;
      }
      if (term && !item.description.toLowerCase().includes(term)) {
        return false;
      }
      return true;
    });
  }, [transactions, selectedCategoryId, searchText]);

  const groupedTransactions = useMemo(() => {
    const groups: Record<string, ActivityItem[]> = {};
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    filteredTransactions.forEach((item) => {
      const dateLabel =
        item.date === today
          ? 'Today'
          : item.date === yesterday
            ? 'Yesterday'
            : new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      const amount = Number(item.amount);
      const isIncome = item.type === 'income';
      const activity: ActivityItem = {
        id: item.id,
        title: item.description || 'Transaction',
        category: item.category?.name ?? 'Uncategorized',
        time: item.date,
        source: item.type.toUpperCase(),
        amount: isIncome ? amount : -amount,
        icon: isIncome ? 'dollar-sign' : 'shopping-bag',
        badge: isIncome ? 'Income' : undefined,
      };

      if (!groups[dateLabel]) {
        groups[dateLabel] = [];
      }
      groups[dateLabel].push(activity);
    });

    return groups;
  }, [filteredTransactions]);

  const summarySpent = Number(summary?.expenses ?? 0);
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const avgPerDay = daysInMonth > 0 ? summarySpent / daysInMonth : 0;

  const renderActivityList = (items: ActivityItem[]) => (
    <View style={styles.activityList}>
      {items.map((item) => {
        const isPositive = item.amount >= 0;
        return (
          <Pressable
            key={item.id}
            style={({ pressed, hovered }) => [
              styles.activityCard,
              (pressed || hovered) && styles.activityCardActive,
            ]}
          >
            <View style={styles.activityIcon}>
              <Feather name={item.icon} size={18} color={palette.accentGreen} />
            </View>
            <View style={styles.activityDetails}>
              <View style={styles.activityTitleRow}>
                <Text style={styles.activityTitle}>{item.title}</Text>
                {item.badge ? (
                  <View style={styles.activityBadge}>
                    <Text style={styles.activityBadgeText}>{item.badge}</Text>
                  </View>
                ) : null}
              </View>
              <View style={styles.activityMetaRow}>
                <Text style={styles.activityMeta}>{item.category}</Text>
                <Text style={styles.activityMeta}>{item.time}</Text>
                <View style={styles.activityTag}>
                  <Text style={styles.activityTagText}>{item.source}</Text>
                </View>
              </View>
            </View>
            <Text
              style={[
                styles.activityAmount,
                isPositive && styles.activityAmountPositive,
              ]}
            >
              {formatSigned(item.amount)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={palette.surface} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Transactions</Text>
          <Text style={styles.headerSubtitle}>All your spending in one place</Text>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchField}>
            <Feather name="search" size={18} color={palette.textSecondary} />
            <TextInput
              placeholder="Search transactions..."
              placeholderTextColor={palette.textSecondary}
              style={styles.searchInput}
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>
          <TouchableOpacity style={styles.filterButton} activeOpacity={0.85}>
            <Feather name="sliders" size={18} color={palette.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {categoryChips.map((chip) => (
            <TouchableOpacity
              key={chip.id}
              style={[styles.chip, chip.active && styles.chipActive]}
              activeOpacity={0.85}
              onPress={() => setSelectedCategoryId(chip.id)}
            >
              <Text style={[styles.chipText, chip.active && styles.chipTextActive]}>
                {chip.label} ({chip.count})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Spent</Text>
            <Text style={styles.summaryValue}>{formatKes(summarySpent)}</Text>
            <Text style={styles.summaryMeta}>This month</Text>
          </View>
          <View style={[styles.summaryCard, styles.summaryCardAccent]}>
            <Text style={[styles.summaryLabel, styles.summaryLabelAccent]}>Avg per Day</Text>
            <Text style={styles.summaryValueAccent}>{formatKes(Math.round(avgPerDay))}</Text>
            <Text style={styles.summaryMetaAccent}>Based on this month</Text>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={palette.accentGreen} />
            <Text style={styles.loadingText}>Loading activity…</Text>
          </View>
        ) : null}

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        {!isLoading && !errorMessage && Object.keys(groupedTransactions).length === 0 ? (
          <Text style={styles.emptyText}>No transactions found.</Text>
        ) : null}

        {Object.entries(groupedTransactions).map(([label, items]) => (
          <View key={label}>
            <View style={styles.todayHeader}>
              <Feather name="calendar" size={16} color={palette.textSecondary} />
              <Text style={styles.todayTitle}>{label}</Text>
            </View>
            {renderActivityList(items)}
            <View style={styles.sectionSpacer} />
          </View>
        ))}
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
    paddingBottom: 140,
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: palette.textPrimary,
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 13,
    color: palette.textSecondary,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  searchField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: palette.card,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: palette.textPrimary,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: palette.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  chipRow: {
    gap: 10,
    paddingRight: 20,
    marginBottom: 18,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  chipActive: {
    backgroundColor: palette.accentGreen,
    borderColor: 'rgba(74, 222, 128, 0.6)',
  },
  chipText: {
    fontSize: 12,
    color: palette.textSecondary,
    fontWeight: '600',
  },
  chipTextActive: {
    color: palette.card,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: palette.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  summaryCardAccent: {
    backgroundColor: '#33C86E',
    borderColor: 'rgba(51, 200, 110, 0.6)',
  },
  summaryLabel: {
    fontSize: 12,
    color: palette.textSecondary,
    marginBottom: 8,
  },
  summaryLabelAccent: {
    color: 'rgba(255, 255, 255, 0.85)',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.textPrimary,
    marginBottom: 6,
  },
  summaryValueAccent: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.card,
    marginBottom: 6,
  },
  summaryMeta: {
    fontSize: 12,
    color: palette.textSecondary,
  },
  summaryMetaAccent: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  todayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  todayTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.textSecondary,
  },
  activityList: {
    gap: 12,
  },
  sectionSpacer: {
    height: 10,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 12,
    color: palette.textSecondary,
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 12,
    color: palette.textSecondary,
    marginBottom: 10,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.18)',
  },
  activityCardActive: {
    backgroundColor: 'rgba(74, 222, 128, 0.08)',
    borderColor: 'rgba(74, 222, 128, 0.5)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  activityIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: 'rgba(74, 222, 128, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityDetails: {
    flex: 1,
  },
  activityTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.textPrimary,
  },
  activityBadge: {
    backgroundColor: 'rgba(74, 222, 128, 0.18)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  activityBadgeText: {
    fontSize: 11,
    color: palette.accentGreen,
    fontWeight: '700',
  },
  activityMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  activityMeta: {
    fontSize: 12,
    color: palette.textSecondary,
  },
  activityTag: {
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  activityTagText: {
    fontSize: 11,
    color: palette.cashBlue,
    fontWeight: '600',
  },
  activityAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.textPrimary,
    marginLeft: 10,
  },
  activityAmountPositive: {
    color: palette.accentGreen,
  },
});
