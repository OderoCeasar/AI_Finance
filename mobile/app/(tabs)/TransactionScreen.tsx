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
import { AntDesign } from '@expo/vector-icons';

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

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8000/api';
const API_TOKEN = process.env.EXPO_PUBLIC_API_TOKEN;

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

const fallbackCategories: CategoryOption[] = [
  { id: 1, name: 'Food' },
  { id: 2, name: 'Transport' },
  { id: 3, name: 'Rent' },
  { id: 4, name: 'Entertainment' },
  { id: 5, name: 'Salary' },
];

const fallbackTransactions: TransactionItem[] = [
  {
    id: 101,
    amount: 8500,
    type: 'expense',
    description: 'Groceries and pantry restock',
    date: '2026-03-08',
    category: { id: 1, name: 'Food' },
  },
  {
    id: 102,
    amount: 120000,
    type: 'income',
    description: 'Monthly salary',
    date: '2026-03-05',
    category: { id: 5, name: 'Salary' },
  },
  {
    id: 103,
    amount: 3000,
    type: 'expense',
    description: 'Matatu and fuel',
    date: '2026-03-03',
    category: { id: 2, name: 'Transport' },
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

const formatDateLabel = (value: string) => {
  if (!value) {
    return 'Select date';
  }
  return value;
};

const normalizeAmountInput = (value: string) =>
  value.replace(/[^0-9.]/g, '');

const parseAmount = (value: string) => {
  if (!value) {
    return 0;
  }
  const normalized = normalizeAmountInput(value);
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

export default function TransactionScreen() {
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [categories, setCategories] = useState<CategoryOption[]>(fallbackCategories);
  const [transactions, setTransactions] = useState<TransactionItem[]>(fallbackTransactions);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterCategoryId, setFilterCategoryId] = useState<number | null>(null);
  const [filterMonth, setFilterMonth] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [filterCategoryOpen, setFilterCategoryOpen] = useState(false);

  useEffect(() => {
    if (!API_TOKEN) {
      return;
    }

    let isMounted = true;

    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/categories/`, {
          headers: { Authorization: `Bearer ${API_TOKEN}` },
        });
        const payload = await response.json();
        if (isMounted && response.ok && payload?.success && payload?.data?.length) {
          setCategories(payload.data);
        }
      } catch (error) {
        if (isMounted) {
          setCategories(fallbackCategories);
        }
      }
    };

    fetchCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!API_TOKEN) {
      return;
    }

    let isMounted = true;

    const fetchTransactions = async () => {
      setIsLoading(true);
      try {
        const query = new URLSearchParams();
        if (filterType !== 'all') {
          query.append('type', filterType);
        }
        if (filterCategoryId) {
          query.append('category', String(filterCategoryId));
        }
        if (filterMonth && filterMonth.length >= 7) {
          query.append('month', filterMonth.slice(0, 7));
        }

        const response = await fetch(`${API_BASE_URL}/transactions/?${query.toString()}`, {
          headers: { Authorization: `Bearer ${API_TOKEN}` },
        });
        const payload = await response.json();
        if (!isMounted) {
          return;
        }
        if (response.ok && payload?.success) {
          const data = payload.data?.results ?? payload.data ?? [];
          setTransactions(data);
        }
      } catch (error) {
        if (isMounted) {
          setTransactions(fallbackTransactions);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchTransactions();

    return () => {
      isMounted = false;
    };
  }, [filterType, filterCategoryId, filterMonth]);

  const selectedCategory = useMemo(() => {
    return categories.find((item) => item.id === categoryId) ?? null;
  }, [categories, categoryId]);

  const selectedFilterCategory = useMemo(() => {
    return categories.find((item) => item.id === filterCategoryId) ?? null;
  }, [categories, filterCategoryId]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((item) => {
      if (filterType !== 'all' && item.type !== filterType) {
        return false;
      }
      if (filterCategoryId && item.category?.id !== filterCategoryId) {
        return false;
      }
      if (filterMonth && item.date) {
        const targetMonth = filterMonth.slice(0, 7);
        if (!item.date.startsWith(targetMonth)) {
          return false;
        }
      }
      return true;
    });
  }, [transactions, filterType, filterCategoryId, filterMonth]);

  const handleSave = async () => {
    setFormError('');

    const amountValue = parseAmount(amount);
    if (!amountValue || amountValue <= 0) {
      setFormError('Enter a valid amount greater than zero.');
      return;
    }
    if (!description.trim()) {
      setFormError('Add a short description for this transaction.');
      return;
    }
    if (!date) {
      setFormError('Provide a date in YYYY-MM-DD format.');
      return;
    }

    if (!API_TOKEN) {
      const tempCategory = selectedCategory ?? categories[0];
      const newItem: TransactionItem = {
        id: Math.floor(Math.random() * 100000),
        amount: amountValue,
        type: transactionType,
        description: description.trim(),
        date,
        category: tempCategory,
      };
      setTransactions((prev) => [newItem, ...prev]);
      setAmount('');
      setDescription('');
      setDate('');
      setCategoryId(null);
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/transactions/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amountValue,
          category_id: categoryId,
          type: transactionType,
          description: description.trim(),
          date,
        }),
      });
      const payload = await response.json();
      if (response.ok && payload?.success && payload?.data) {
        setTransactions((prev) => [payload.data, ...prev]);
        setAmount('');
        setDescription('');
        setDate('');
        setCategoryId(null);
      } else {
        setFormError(payload?.message ?? 'Unable to save transaction.');
      }
    } catch (error) {
      setFormError('Unable to save transaction right now.');
    } finally {
      setIsSaving(false);
    }
  };

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
            <Text style={styles.headerTitle}>Transactions</Text>
            <Text style={styles.headerSubtitle}>Track income and expenses</Text>
          </View>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>KES</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Add Transaction</Text>

          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                transactionType === 'income' && styles.toggleButtonActive,
              ]}
              onPress={() => setTransactionType('income')}
            >
              <Text
                style={[
                  styles.toggleText,
                  transactionType === 'income' && styles.toggleTextActive,
                ]}
              >
                Income
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                transactionType === 'expense' && styles.toggleButtonActive,
              ]}
              onPress={() => setTransactionType('expense')}
            >
              <Text
                style={[
                  styles.toggleText,
                  transactionType === 'expense' && styles.toggleTextActive,
                ]}
              >
                Expense
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Amount</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 2,500"
              placeholderTextColor={palette.textSecondary}
              keyboardType="numeric"
              value={amount}
              onChangeText={(value) => setAmount(normalizeAmountInput(value))}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category</Text>
            <TouchableOpacity
              style={styles.dropdownTrigger}
              onPress={() => setCategoryOpen((prev) => !prev)}
            >
              <Text style={styles.dropdownValue}>
                {selectedCategory?.name ?? 'Select category'}
              </Text>
              <AntDesign name={categoryOpen ? 'up' : 'down'} size={16} color={palette.textSecondary} />
            </TouchableOpacity>
            {categoryOpen ? (
              <View style={styles.dropdownList}>
                {categories.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setCategoryId(item.id);
                      setCategoryOpen(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{item.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date</Text>
            <View style={styles.dateRow}>
              <TextInput
                style={[styles.input, styles.dateInput]}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={palette.textSecondary}
                value={date}
                onChangeText={setDate}
              />
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => {
                  const today = new Date().toISOString().slice(0, 10);
                  setDate(today);
                }}
              >
                <Text style={styles.dateButtonText}>Today</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.helpText}>{formatDateLabel(date)}</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Add a short note"
              placeholderTextColor={palette.textSecondary}
              value={description}
              onChangeText={setDescription}
              multiline
            />
          </View>

          {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color={palette.textPrimary} />
            ) : (
              <Text style={styles.saveButtonText}>Save Transaction</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Transaction History</Text>

          <View style={styles.filtersRow}>
            <TouchableOpacity
              style={[styles.filterChip, filterType === 'all' && styles.filterChipActive]}
              onPress={() => setFilterType('all')}
            >
              <Text
                style={[styles.filterText, filterType === 'all' && styles.filterTextActive]}
              >
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, filterType === 'income' && styles.filterChipActive]}
              onPress={() => setFilterType('income')}
            >
              <Text
                style={[styles.filterText, filterType === 'income' && styles.filterTextActive]}
              >
                Income
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, filterType === 'expense' && styles.filterChipActive]}
              onPress={() => setFilterType('expense')}
            >
              <Text
                style={[styles.filterText, filterType === 'expense' && styles.filterTextActive]}
              >
                Expense
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.filterInputs}>
            <View style={styles.filterBlock}>
              <Text style={styles.label}>Month (YYYY-MM)</Text>
              <TextInput
                style={styles.input}
                placeholder="2026-03"
                placeholderTextColor={palette.textSecondary}
                value={filterMonth}
                onChangeText={setFilterMonth}
              />
            </View>

            <View style={styles.filterBlock}>
              <Text style={styles.label}>Category</Text>
              <TouchableOpacity
                style={styles.dropdownTrigger}
                onPress={() => setFilterCategoryOpen((prev) => !prev)}
              >
                <Text style={styles.dropdownValue}>
                  {selectedFilterCategory?.name ?? 'All categories'}
                </Text>
                <AntDesign
                  name={filterCategoryOpen ? 'up' : 'down'}
                  size={16}
                  color={palette.textSecondary}
                />
              </TouchableOpacity>
              {filterCategoryOpen ? (
                <View style={styles.dropdownList}>
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => {
                      setFilterCategoryId(null);
                      setFilterCategoryOpen(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>All categories</Text>
                  </TouchableOpacity>
                  {categories.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setFilterCategoryId(item.id);
                        setFilterCategoryOpen(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{item.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}
            </View>
          </View>

          {isLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={palette.accentGreen} />
            </View>
          ) : (
            <View>
              {filteredTransactions.map((item) => {
                const isIncome = item.type === 'income';
                return (
                  <View key={item.id} style={styles.transactionRow}>
                    <View
                      style={[
                        styles.transactionIcon,
                        { backgroundColor: isIncome ? palette.mpesaGreen : palette.cashBlue },
                      ]}
                    >
                      <AntDesign name={isIncome ? 'arrow-down' : 'arrow-up'} size={14} color="#fff" />
                    </View>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionCategory}>
                        {item.category?.name ?? 'Uncategorized'}
                      </Text>
                      <Text style={styles.transactionMeta}>{item.date}</Text>
                    </View>
                    <View style={styles.transactionAmountBlock}>
                      <Text style={[styles.transactionAmount, isIncome && styles.amountIncome]}>
                        {formatKes(item.amount)}
                      </Text>
                      <Text style={styles.transactionMeta}>{item.description}</Text>
                    </View>
                  </View>
                );
              })}
              {!filteredTransactions.length ? (
                <Text style={styles.emptyText}>No transactions found for the selected filters.</Text>
              ) : null}
            </View>
          )}
        </View>
      </ScrollView>
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
  headerBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  headerBadgeText: {
    color: palette.card,
    fontWeight: '600',
    fontSize: 12,
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
  toggleRow: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: 'rgba(100, 116, 139, 0.12)',
    borderRadius: 12,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: palette.accentGreen,
  },
  toggleText: {
    color: palette.textSecondary,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: palette.textPrimary,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    color: palette.textSecondary,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.25)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: palette.textPrimary,
    backgroundColor: palette.card,
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  dropdownTrigger: {
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.25)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: palette.card,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownValue: {
    color: palette.textPrimary,
    fontSize: 14,
  },
  dropdownList: {
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.25)',
    borderRadius: 12,
    marginTop: 8,
    backgroundColor: palette.card,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(100, 116, 139, 0.12)',
  },
  dropdownItemText: {
    color: palette.textPrimary,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateInput: {
    flex: 1,
  },
  dateButton: {
    marginLeft: 10,
    backgroundColor: palette.sidebar,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  dateButtonText: {
    color: palette.card,
    fontSize: 12,
    fontWeight: '600',
  },
  helpText: {
    marginTop: 6,
    fontSize: 11,
    color: palette.textSecondary,
  },
  saveButton: {
    backgroundColor: palette.accentGreen,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: palette.textPrimary,
    fontWeight: '700',
    fontSize: 15,
  },
  errorText: {
    color: palette.cashBlue,
    fontSize: 12,
    marginBottom: 8,
  },
  filtersRow: {
    flexDirection: 'row',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.25)',
    backgroundColor: palette.card,
    marginRight: 8,
    marginBottom: 8,
  },
  filterChipActive: {
    backgroundColor: palette.accentGreen,
    borderColor: palette.accentGreen,
  },
  filterText: {
    fontSize: 12,
    color: palette.textSecondary,
    fontWeight: '600',
  },
  filterTextActive: {
    color: palette.textPrimary,
  },
  filterInputs: {
    marginBottom: 16,
  },
  filterBlock: {
    marginBottom: 12,
  },
  loadingRow: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(100, 116, 139, 0.12)',
  },
  transactionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionCategory: {
    color: palette.textPrimary,
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 4,
  },
  transactionMeta: {
    color: palette.textSecondary,
    fontSize: 11,
  },
  transactionAmountBlock: {
    alignItems: 'flex-end',
    maxWidth: 140,
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.cashBlue,
    marginBottom: 4,
  },
  amountIncome: {
    color: palette.mpesaGreen,
  },
  emptyText: {
    color: palette.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 12,
  },
});
