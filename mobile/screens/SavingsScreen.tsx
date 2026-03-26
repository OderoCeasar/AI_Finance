import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

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

type SavingsGoal = {
  id: number;
  name: string;
  target_amount: number | string;
  current_amount: number | string;
  monthly_target?: number | string | null;
};

const toNumber = (value: number | string | null | undefined) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
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

export default function SavingsScreen() {
  const { tokens, refreshAccessToken } = useAuth();
  const accessToken = tokens?.access;
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [monthlyTarget, setMonthlyTarget] = useState('');
  const [contributions, setContributions] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!accessToken) {
      setGoals([]);
      return;
    }
    let isMounted = true;

    const fetchGoals = async () => {
      setIsLoading(true);
      try {
        let result = await api.get<SavingsGoal[]>('savings-goals/', accessToken);
        if (result.status === 401) {
          const newToken = await refreshAccessToken();
          if (newToken) {
            result = await api.get<SavingsGoal[]>('savings-goals/', newToken);
          }
        }
        if (isMounted) {
          setGoals(result.ok && result.data ? result.data : []);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchGoals();

    return () => {
      isMounted = false;
    };
  }, [accessToken, refreshAccessToken]);

  const handleCreateGoal = async () => {
    setErrorMessage('');
    if (!accessToken) {
      setErrorMessage('Sign in to create a savings goal.');
      return;
    }
    const targetValue = toNumber(target);
    if (!name.trim()) {
      setErrorMessage('Enter a goal name.');
      return;
    }
    if (!targetValue || targetValue <= 0) {
      setErrorMessage('Enter a valid target amount.');
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        name: name.trim(),
        target_amount: targetValue,
        monthly_target: monthlyTarget ? toNumber(monthlyTarget) : null,
      };
      let result = await api.post<SavingsGoal>('savings-goals/', payload, accessToken);
      if (result.status === 401) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          result = await api.post<SavingsGoal>('savings-goals/', payload, newToken);
        }
      }
      if (result.ok && result.data) {
        setGoals((prev) => [result.data!, ...prev]);
        setName('');
        setTarget('');
        setMonthlyTarget('');
      } else {
        setErrorMessage(result.message ?? 'Unable to create goal.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddContribution = async (goal: SavingsGoal) => {
    setErrorMessage('');
    if (!accessToken) {
      setErrorMessage('Sign in to add a contribution.');
      return;
    }
    const amount = toNumber(contributions[goal.id]);
    if (!amount || amount <= 0) {
      setErrorMessage('Enter a valid contribution amount.');
      return;
    }
    setIsSaving(true);
    try {
      const nextAmount = toNumber(goal.current_amount) + amount;
      let result = await api.patch<SavingsGoal>(
        `savings-goals/${goal.id}/`,
        { current_amount: nextAmount },
        accessToken,
      );
      if (result.status === 401) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          result = await api.patch<SavingsGoal>(
            `savings-goals/${goal.id}/`,
            { current_amount: nextAmount },
            newToken,
          );
        }
      }
      if (result.ok && result.data) {
        setGoals((prev) => prev.map((item) => (item.id === goal.id ? result.data! : item)));
        setContributions((prev) => ({ ...prev, [goal.id]: '' }));
      } else {
        setErrorMessage(result.message ?? 'Unable to update savings.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const totalSaved = useMemo(() => goals.reduce((sum, item) => sum + toNumber(item.current_amount), 0), [goals]);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={palette.surface} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Savings</Text>
          <Text style={styles.headerSubtitle}>Set goals and track your progress.</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Saved</Text>
          <Text style={styles.summaryValue}>{formatKes(totalSaved)}</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Create a Goal</Text>
          <TextInput
            placeholder="Goal name"
            placeholderTextColor={palette.textSecondary}
            value={name}
            onChangeText={setName}
            style={styles.input}
          />
          <TextInput
            placeholder="Target amount"
            placeholderTextColor={palette.textSecondary}
            value={target}
            onChangeText={setTarget}
            keyboardType="numeric"
            style={styles.input}
          />
          <TextInput
            placeholder="Monthly target (optional)"
            placeholderTextColor={palette.textSecondary}
            value={monthlyTarget}
            onChangeText={setMonthlyTarget}
            keyboardType="numeric"
            style={styles.input}
          />
          <TouchableOpacity style={styles.primaryButton} onPress={handleCreateGoal} disabled={isSaving}>
            {isSaving ? <ActivityIndicator color={palette.card} /> : <Text style={styles.primaryButtonText}>Save Goal</Text>}
          </TouchableOpacity>
          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        </View>

        <Text style={styles.sectionTitle}>Your Goals</Text>
        {isLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={palette.accentGreen} />
            <Text style={styles.loadingText}>Loading goals…</Text>
          </View>
        ) : null}
        {!isLoading && goals.length === 0 ? (
          <Text style={styles.emptyText}>No savings goals yet.</Text>
        ) : null}
        {goals.map((goal) => {
          const progress = Math.min((toNumber(goal.current_amount) / toNumber(goal.target_amount)) * 100, 100);
          return (
            <View key={goal.id} style={styles.goalCard}>
              <View style={styles.goalHeader}>
                <View style={styles.goalIcon}>
                  <Feather name="target" size={16} color={palette.accentGreen} />
                </View>
                <View style={styles.goalInfo}>
                  <Text style={styles.goalTitle}>{goal.name}</Text>
                  <Text style={styles.goalMeta}>
                    {formatKes(goal.current_amount)} / {formatKes(goal.target_amount)}
                  </Text>
                </View>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
              </View>
              <View style={styles.contributionRow}>
                <TextInput
                  placeholder="Add amount"
                  placeholderTextColor={palette.textSecondary}
                  value={contributions[goal.id] ?? ''}
                  onChangeText={(value) => setContributions((prev) => ({ ...prev, [goal.id]: value }))}
                  keyboardType="numeric"
                  style={styles.contributionInput}
                />
                <TouchableOpacity style={styles.secondaryButton} onPress={() => handleAddContribution(goal)} disabled={isSaving}>
                  <Text style={styles.secondaryButtonText}>Add</Text>
                </TouchableOpacity>
              </View>
              {goal.monthly_target ? (
                <Text style={styles.goalHint}>Monthly target: {formatKes(goal.monthly_target)}</Text>
              ) : null}
            </View>
          );
        })}
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
  summaryCard: {
    backgroundColor: palette.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    marginBottom: 18,
  },
  summaryLabel: {
    fontSize: 12,
    color: palette.textSecondary,
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: palette.textPrimary,
  },
  formCard: {
    backgroundColor: palette.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.textPrimary,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: palette.textPrimary,
    marginBottom: 10,
  },
  primaryButton: {
    backgroundColor: palette.accentGreen,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: palette.card,
  },
  errorText: {
    marginTop: 8,
    fontSize: 12,
    color: '#DC2626',
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
  emptyText: {
    fontSize: 12,
    color: palette.textSecondary,
    marginBottom: 10,
  },
  goalCard: {
    backgroundColor: palette.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    marginBottom: 14,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  goalIcon: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: 'rgba(74, 222, 128, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalInfo: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.textPrimary,
    marginBottom: 4,
  },
  goalMeta: {
    fontSize: 12,
    color: palette.textSecondary,
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: palette.accentGreen,
  },
  contributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  contributionInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    color: palette.textPrimary,
  },
  secondaryButton: {
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.35)',
  },
  secondaryButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.cashBlue,
  },
  goalHint: {
    marginTop: 8,
    fontSize: 12,
    color: palette.textSecondary,
  },
});
