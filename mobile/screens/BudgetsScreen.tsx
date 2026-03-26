import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

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

type CategoryOption = {
  id: number;
  name: string;
};

type BudgetItem = {
  id: number;
  month: string;
  amount: number | string;
  category: CategoryOption;
};

type BreakdownItem = {
  category: string;
  total: number | string;
};

const toNumber = (value: number | string | null | undefined) => {
  if (value === null || value === undefined) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
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

export default function BudgetsScreen() {
  const { tokens, refreshAccessToken } = useAuth();
  const accessToken = tokens?.access;
  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [breakdown, setBreakdown] = useState<BreakdownItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [amount, setAmount] = useState('');
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    if (!accessToken) {
      setBudgets([]);
      setCategories([]);
      setBreakdown([]);
      return;
    }

    let isMounted = true;

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

    const fetchBudgets = async () => {
      setIsLoading(true);
      setErrorMessage('');
      try {
        const [budgetsRes, categoriesRes, breakdownRes] = await Promise.all([
          fetchWithRefresh((token) => api.get<BudgetItem[]>(`budgets/?month=${month}`, token)),
          fetchWithRefresh((token) => api.get<CategoryOption[]>('categories/', token)),
          fetchWithRefresh((token) => api.get<BreakdownItem[]>(`analytics/category-breakdown/?month=${month}`, token)),
        ]);

        if (!isMounted) return;

        setBudgets(budgetsRes.ok && budgetsRes.data ? budgetsRes.data : []);
        setCategories(categoriesRes.ok && categoriesRes.data ? categoriesRes.data : []);
        setBreakdown(breakdownRes.ok && breakdownRes.data ? breakdownRes.data : []);
      } catch (error) {
        if (isMounted) {
          setErrorMessage('Unable to load budgets right now.');
          setBudgets([]);
          setCategories([]);
          setBreakdown([]);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchBudgets();

    return () => {
      isMounted = false;
    };
  }, [accessToken, month, refreshAccessToken]);

  const spentByCategory = useMemo(() => {
    return breakdown.reduce<Record<string, number>>((acc, item) => {
      acc[item.category] = toNumber(item.total);
      return acc;
    }, {});
  }, [breakdown]);

  const totalBudget = useMemo(() => budgets.reduce((sum, item) => sum + toNumber(item.amount), 0), [budgets]);
  const totalSpent = useMemo(() => {
    return budgets.reduce((sum, item) => sum + (spentByCategory[item.category?.name] ?? 0), 0);
  }, [budgets, spentByCategory]);

  const remaining = totalBudget - totalSpent;
  const progressPercent = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;
  const monthLabel = useMemo(() => {
    const parsed = new Date(`${month}-01T00:00:00`);
    return parsed.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  }, [month]);

  const handleAddBudget = async () => {
    setErrorMessage('');
    const numericAmount = toNumber(amount);
    if (!selectedCategoryId) {
      setErrorMessage('Select a category.');
      return;
    }
    if (!numericAmount || numericAmount <= 0) {
      setErrorMessage('Enter a valid budget amount.');
      return;
    }
    if (!accessToken) {
      setErrorMessage('Sign in to create budgets.');
      return;
    }
    setIsSaving(true);
    try {
      let result = await api.post<BudgetItem>(
        'budgets/',
        { category_id: selectedCategoryId, month: `${month}-01`, amount: numericAmount },
        accessToken,
      );
      if (result.status === 401) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          result = await api.post<BudgetItem>(
            'budgets/',
            { category_id: selectedCategoryId, month: `${month}-01`, amount: numericAmount },
            newToken,
          );
        }
      }
      if (result.ok && result.data) {
        setBudgets((prev) => [result.data, ...prev]);
        setAmount('');
        setSelectedCategoryId(null);
        setShowAdd(false);
      } else {
        setErrorMessage(result.message ?? 'Unable to create budget.');
      }
    } catch (error) {
      setErrorMessage('Unable to create budget right now.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={palette.surface} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Budgets</Text>
          <Text style={styles.headerSubtitle}>Track spending and savings goals</Text>
        </View>

        <LinearGradient
          colors={[palette.sidebar, '#1F2937']}
          style={styles.summaryCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.summaryTopRow}>
            <Text style={styles.summaryMonth}>{monthLabel}</Text>
            <Text style={styles.summaryPercent}>{Math.round(progressPercent)}%</Text>
          </View>
          <Text style={styles.summarySpent}>{formatKes(totalSpent)}</Text>
          <Text style={styles.summaryMeta}>of {formatKes(totalBudget)} budget</Text>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>

          <View style={styles.summaryFooter}>
            <Feather name="trending-up" size={14} color={palette.accentGreen} />
            <Text style={styles.summaryFooterText}>
              {remaining >= 0
                ? `${formatKes(remaining)} remaining for this month`
                : `${formatKes(Math.abs(remaining))} over budget`}
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <TouchableOpacity style={styles.addRow} onPress={() => setShowAdd((prev) => !prev)}>
            <Text style={styles.addText}>{showAdd ? 'Close' : '+ Add'}</Text>
          </TouchableOpacity>
        </View>

        {showAdd ? (
          <View style={styles.addCard}>
            <Text style={styles.addLabel}>Month (YYYY-MM)</Text>
            <TextInput
              value={month}
              onChangeText={setMonth}
              placeholder="YYYY-MM"
              placeholderTextColor={palette.textSecondary}
              style={styles.addInput}
            />
            <Text style={styles.addLabel}>Select Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.chip,
                    selectedCategoryId === category.id && styles.chipActive,
                  ]}
                  onPress={() => setSelectedCategoryId(category.id)}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedCategoryId === category.id && styles.chipTextActive,
                    ]}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.addLabel}>Budget Amount</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="e.g. 25000"
              placeholderTextColor={palette.textSecondary}
              keyboardType="numeric"
              style={styles.addInput}
            />
            <TouchableOpacity
              style={[styles.addButton, isSaving && styles.addButtonDisabled]}
              onPress={handleAddBudget}
              disabled={isSaving}
            >
              {isSaving ? <ActivityIndicator color={palette.card} /> : <Text style={styles.addButtonText}>Save Budget</Text>}
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.categoryList}>
          {isLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={palette.accentGreen} />
              <Text style={styles.loadingText}>Loading budgets…</Text>
            </View>
          ) : null}
          {!isLoading && budgets.length === 0 ? (
            <Text style={styles.emptyText}>No budgets for this month yet.</Text>
          ) : null}
          {budgets.map((budget) => {
            const spent = spentByCategory[budget.category.name] ?? 0;
            const percent = budget.amount ? Math.min((spent / toNumber(budget.amount)) * 100, 100) : 0;
            const remainingForCategory = toNumber(budget.amount) - spent;
            const isOver = remainingForCategory < 0;
            const progressColor = isOver ? '#EF4444' : palette.accentGreen;
            return (
              <View key={budget.id} style={styles.categoryCard}>
                <View style={styles.categoryHeader}>
                  <View style={styles.categoryIcon}>
                    <Feather name="tag" size={18} color={palette.accentGreen} />
                  </View>
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryTitle}>{budget.category.name}</Text>
                    <Text style={styles.categoryMeta}>
                      {formatKes(spent)} / {formatKes(toNumber(budget.amount))}
                    </Text>
                  </View>
                </View>
                <View style={styles.categoryProgressTrack}>
                  <View
                    style={[
                      styles.categoryProgressFill,
                      { width: `${percent}%`, backgroundColor: progressColor },
                    ]}
                  />
                </View>
                <View style={styles.categoryFooter}>
                  <Text
                    style={[
                      styles.categoryUsed,
                      isOver && styles.categoryUsedOver,
                    ]}
                  >
                    {`${Math.round(percent)}% used`}
                  </Text>
                  <Text
                    style={[
                      styles.categoryLeft,
                      isOver && styles.categoryLeftOver,
                    ]}
                  >
                    {isOver
                      ? `${formatKes(Math.abs(remainingForCategory))} over budget`
                      : `${formatKes(remainingForCategory)} left`}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
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
    marginBottom: 18,
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
  summaryCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 24,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 6,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryMonth: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
  },
  summaryPercent: {
    color: palette.accentGreen,
    fontSize: 20,
    fontWeight: '700',
  },
  summarySpent: {
    color: palette.card,
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 6,
  },
  summaryMeta: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginVertical: 14,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: palette.accentGreen,
  },
  summaryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryFooterText: {
    color: palette.card,
    fontSize: 12,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.textPrimary,
  },
  sectionTitleSpacing: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.textPrimary,
    marginTop: 22,
    marginBottom: 12,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addText: {
    fontSize: 13,
    color: palette.accentGreen,
    fontWeight: '600',
  },
  addCard: {
    backgroundColor: palette.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    marginBottom: 18,
    gap: 10,
  },
  addLabel: {
    fontSize: 12,
    color: palette.textSecondary,
    fontWeight: '600',
  },
  addInput: {
    backgroundColor: palette.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    fontSize: 13,
    color: palette.textPrimary,
  },
  addButton: {
    marginTop: 6,
    backgroundColor: palette.accentGreen,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: 'center',
  },
  addButtonDisabled: {
    opacity: 0.7,
  },
  addButtonText: {
    color: palette.card,
    fontSize: 12,
    fontWeight: '700',
  },
  chipRow: {
    gap: 10,
    paddingRight: 12,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: palette.surface,
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
  categoryList: {
    gap: 14,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 12,
    color: palette.textSecondary,
  },
  emptyText: {
    fontSize: 12,
    color: palette.textSecondary,
  },
  categoryCard: {
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
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: 'rgba(74, 222, 128, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryInfo: {
    flex: 1,
  },
  alertBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  alertBadgeText: {
    color: '#EF4444',
    fontWeight: '700',
    fontSize: 12,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.textPrimary,
    marginBottom: 6,
  },
  categoryMeta: {
    fontSize: 12,
    color: palette.textSecondary,
  },
  categoryProgressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(148, 163, 184, 0.18)',
    marginBottom: 8,
  },
  categoryProgressFill: {
    height: '100%',
    borderRadius: 999,
  },
  categoryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryUsed: {
    fontSize: 12,
    color: palette.accentGreen,
    fontWeight: '600',
  },
  categoryUsedOver: {
    color: '#EF4444',
  },
  categoryLeft: {
    fontSize: 12,
    color: palette.textSecondary,
  },
  categoryLeftOver: {
    color: '#EF4444',
    fontWeight: '600',
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 10,
  },
  savingsCard: {
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 6,
  },
  savingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  savingsIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  savingsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: palette.card,
    marginBottom: 4,
  },
  savingsSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  savingsAmount: {
    fontSize: 26,
    fontWeight: '700',
    color: palette.card,
    marginBottom: 12,
  },
  savingsProgressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    marginBottom: 8,
  },
  savingsProgressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: palette.card,
  },
  savingsMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  savingsMeta: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  savingsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  savingsLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  savingsTarget: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.card,
  },
  savingsButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  savingsButtonText: {
    color: palette.card,
    fontSize: 12,
    fontWeight: '700',
  },
  tipCard: {
    backgroundColor: 'rgba(74, 222, 128, 0.12)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.35)',
    marginBottom: 24,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  tipIcon: {
    fontSize: 16,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.textPrimary,
  },
  tipText: {
    fontSize: 12,
    color: palette.textSecondary,
    lineHeight: 18,
  },
});
