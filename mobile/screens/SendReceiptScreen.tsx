import React, { useCallback, useMemo, useState } from 'react';
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
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

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
  errorRed: '#EF4444',
};

type SavingsGoal = {
  id: number;
  name: string;
  target_amount: number | string;
  current_amount: number | string;
  monthly_target?: number | string | null;
};

const toNumber = (value: number | string | null | undefined) => {
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

export default function SendReceiptScreen() {
  const router = useRouter();
  const { tokens, refreshAccessToken } = useAuth();
  const accessToken = tokens?.access;
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const selectedGoal = useMemo(
    () => goals.find((goal) => goal.id === selectedGoalId) ?? null,
    [goals, selectedGoalId],
  );

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const fetchGoals = async () => {
        if (!accessToken) {
          if (isActive) {
            setGoals([]);
            setSelectedGoalId(null);
          }
          return;
        }
        if (isActive) {
          setIsLoading(true);
        }
        try {
          let result = await api.get<SavingsGoal[]>('savings-goals/', accessToken);
          if (result.status === 401) {
            const newToken = await refreshAccessToken();
            if (newToken) {
              result = await api.get<SavingsGoal[]>('savings-goals/', newToken);
            }
          }
          if (isActive) {
            const nextGoals = result.ok && result.data ? result.data : [];
            setGoals(nextGoals);
            setSelectedGoalId((prev) => prev ?? (nextGoals[0]?.id ?? null));
          }
        } finally {
          if (isActive) {
            setIsLoading(false);
          }
        }
      };

      fetchGoals();

      return () => {
        isActive = false;
      };
    }, [accessToken, refreshAccessToken]),
  );

  const handleSend = useCallback(async () => {
    setErrorMessage('');
    setSuccessMessage('');
    if (!accessToken) {
      setErrorMessage('Sign in to send to savings.');
      return;
    }
    if (!selectedGoal) {
      setErrorMessage('Choose where you want to send it.');
      return;
    }
    const numericAmount = toNumber(amount);
    if (!numericAmount || numericAmount <= 0) {
      setErrorMessage('Enter a valid amount.');
      return;
    }

    setIsSaving(true);
    try {
      const nextAmount = toNumber(selectedGoal.current_amount) + numericAmount;
      let result = await api.patch<SavingsGoal>(
        `savings-goals/${selectedGoal.id}/`,
        { current_amount: nextAmount },
        accessToken,
      );
      if (result.status === 401) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          result = await api.patch<SavingsGoal>(
            `savings-goals/${selectedGoal.id}/`,
            { current_amount: nextAmount },
            newToken,
          );
        }
      }
      if (!result.ok || !result.data) {
        setErrorMessage(result.message ?? 'Unable to save right now.');
        return;
      }
      setGoals((prev) => prev.map((goal) => (goal.id === result.data!.id ? result.data! : goal)));
      setAmount('');
      setSuccessMessage(`Sent ${formatKes(numericAmount)} to ${selectedGoal.name}.`);
    } finally {
      setIsSaving(false);
    }
  }, [accessToken, amount, refreshAccessToken, selectedGoal]);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={palette.surface} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Send to Savings</Text>
          <Text style={styles.subtitle}>Choose an amount and where you want it saved.</Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={palette.mpesaGreen} />
            <Text style={styles.loadingText}>Loading goals…</Text>
          </View>
        ) : goals.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No savings goals yet</Text>
            <Text style={styles.emptyText}>Create a goal first, then you can send money to it.</Text>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/SavingsScreen')}>
              <Text style={styles.secondaryButtonText}>Create a Goal</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Amount</Text>
              <TextInput
                placeholder="e.g. 500"
                placeholderTextColor={palette.textSecondary}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                style={styles.input}
              />
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Send To</Text>
              {goals.map((goal) => {
                const active = goal.id === selectedGoalId;
                return (
                  <TouchableOpacity
                    key={goal.id}
                    style={[styles.goalRow, active && styles.goalRowActive]}
                    onPress={() => setSelectedGoalId(goal.id)}
                    activeOpacity={0.8}
                  >
                    <View>
                      <Text style={[styles.goalName, active && styles.goalNameActive]}>{goal.name}</Text>
                      <Text style={styles.goalMeta}>
                        Saved: {formatKes(goal.current_amount)} / {formatKes(goal.target_amount)}
                      </Text>
                    </View>
                    <Text style={[styles.goalChip, active && styles.goalChipActive]}>
                      {active ? 'Selected' : 'Select'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={handleSend} disabled={isSaving}>
              {isSaving ? (
                <ActivityIndicator color={palette.textPrimary} />
              ) : (
                <Text style={styles.primaryButtonText}>Send Now</Text>
              )}
            </TouchableOpacity>

            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
            {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}
          </>
        )}
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
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: palette.textPrimary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: palette.textSecondary,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  loadingText: {
    color: palette.textSecondary,
    fontSize: 13,
  },
  card: {
    backgroundColor: palette.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.16)',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.textPrimary,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: palette.textPrimary,
    fontSize: 16,
  },
  goalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.2)',
  },
  goalRowActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  goalName: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.textPrimary,
    marginBottom: 4,
  },
  goalNameActive: {
    color: palette.sidebar,
  },
  goalMeta: {
    fontSize: 12,
    color: palette.textSecondary,
  },
  goalChip: {
    fontSize: 12,
    color: palette.textSecondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.5)',
  },
  goalChipActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.18)',
    borderColor: 'rgba(34, 197, 94, 0.45)',
    color: palette.sidebar,
  },
  primaryButton: {
    backgroundColor: palette.accentGreen,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: palette.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: palette.errorRed,
    fontSize: 12,
  },
  successText: {
    color: palette.mpesaGreen,
    fontSize: 12,
  },
  emptyCard: {
    backgroundColor: palette.card,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.16)',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.textPrimary,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: palette.textSecondary,
    marginBottom: 12,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.6)',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: palette.mpesaGreen,
    fontWeight: '600',
  },
});
