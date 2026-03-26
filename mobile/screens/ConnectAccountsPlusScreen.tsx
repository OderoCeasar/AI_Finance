import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

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

type MpesaStatus = {
  phone_number: string;
  status: 'pending' | 'connected' | 'disconnected' | 'error';
  last_sync: string | null;
  transactions_imported: number;
};

export default function ConnectAccountsPlusScreen() {
  const router = useRouter();
  const { tokens, refreshAccessToken } = useAuth();
  const accessToken = tokens?.access;
  const [mpesaStatus, setMpesaStatus] = useState<MpesaStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [csvText, setCsvText] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [actionTone, setActionTone] = useState<'info' | 'error' | 'success'>('info');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!accessToken) {
      setMpesaStatus(null);
      setIsLoading(false);
      return;
    }
    let isMounted = true;

    const fetchStatus = async () => {
      setIsLoading(true);
      try {
        let result = await api.get<MpesaStatus>('integrations/mpesa/status/', accessToken);
        if (result.status === 401) {
          const newToken = await refreshAccessToken();
          if (newToken) {
            result = await api.get<MpesaStatus>('integrations/mpesa/status/', newToken);
          }
        }
        if (isMounted) {
          setMpesaStatus(result.ok ? result.data ?? null : null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchStatus();

    return () => {
      isMounted = false;
    };
  }, [accessToken, refreshAccessToken]);

  const hasConnection = mpesaStatus?.status === 'connected';

  const lastSyncLabel = useMemo(() => {
    if (!mpesaStatus?.last_sync) {
      return 'Never';
    }
    return new Date(mpesaStatus.last_sync).toLocaleString();
  }, [mpesaStatus?.last_sync]);

  const handleManageConnections = () => router.push('/ConnectedAccountsScreen');
  const handleConnect = async () => {
    setActionMessage('');
    setActionTone('info');
    if (!accessToken) {
      setActionTone('error');
      setActionMessage('Sign in to connect M-Pesa.');
      return;
    }
    if (!phoneNumber.trim()) {
      setActionTone('error');
      setActionMessage('Enter your M-Pesa phone number.');
      return;
    }
    setIsSaving(true);
    setActionMessage('Connecting to M-Pesa…');
    try {
      let result = await api.post<MpesaStatus>('integrations/mpesa/connect/', { phone_number: phoneNumber.trim() }, accessToken);
      if (result.status === 401) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          result = await api.post<MpesaStatus>('integrations/mpesa/connect/', { phone_number: phoneNumber.trim() }, newToken);
        }
      }
      if (result.ok && result.data) {
        setMpesaStatus({ ...result.data, transactions_imported: result.data.transactions_imported ?? 0 });
        setActionTone('success');
        setActionMessage('OTP sent. Demo OTP is 123456.');
      } else {
        setActionTone('error');
        setActionMessage(result.message ?? 'Unable to start connection.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirm = async () => {
    setActionMessage('');
    setActionTone('info');
    if (!accessToken) {
      setActionTone('error');
      setActionMessage('Sign in to confirm connection.');
      return;
    }
    if (!otp.trim()) {
      setActionTone('error');
      setActionMessage('Enter the OTP sent to your phone.');
      return;
    }
    setIsSaving(true);
    setActionMessage('Confirming OTP…');
    try {
      let result = await api.post<MpesaStatus>('integrations/mpesa/confirm/', { otp: otp.trim() }, accessToken);
      if (result.status === 401) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          result = await api.post<MpesaStatus>('integrations/mpesa/confirm/', { otp: otp.trim() }, newToken);
        }
      }
      if (result.ok && result.data) {
        setMpesaStatus({ ...result.data, transactions_imported: result.data.transactions_imported ?? 0 });
        setActionTone('success');
        setActionMessage('M-Pesa connected.');
        setOtp('');
      } else {
        setActionTone('error');
        setActionMessage(result.message ?? 'Unable to confirm connection.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisconnect = async () => {
    setActionMessage('');
    setActionTone('info');
    if (!accessToken) {
      setActionTone('error');
      setActionMessage('Sign in to disconnect.');
      return;
    }
    setIsSaving(true);
    setActionMessage('Disconnecting…');
    try {
      let result = await api.post<MpesaStatus>('integrations/mpesa/disconnect/', {}, accessToken);
      if (result.status === 401) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          result = await api.post<MpesaStatus>('integrations/mpesa/disconnect/', {}, newToken);
        }
      }
      if (result.ok && result.data) {
        setMpesaStatus({ ...result.data, transactions_imported: result.data.transactions_imported ?? 0 });
        setActionTone('success');
        setActionMessage('M-Pesa disconnected.');
      } else {
        setActionTone('error');
        setActionMessage(result.message ?? 'Unable to disconnect.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleImport = async () => {
    setActionMessage('');
    setActionTone('info');
    if (!accessToken) {
      setActionTone('error');
      setActionMessage('Sign in to import transactions.');
      return;
    }
    if (!csvText.trim()) {
      setActionTone('error');
      setActionMessage('Paste your M-Pesa CSV statement to import.');
      return;
    }
    setIsSaving(true);
    setActionMessage('Importing transactions…');
    try {
      let result = await api.post<{ imported: number }>('integrations/mpesa/transactions/import/', { csv: csvText }, accessToken);
      if (result.status === 401) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          result = await api.post<{ imported: number }>('integrations/mpesa/transactions/import/', { csv: csvText }, newToken);
        }
      }
      if (result.ok) {
        setActionTone('success');
        setActionMessage(`Imported ${result.data?.imported ?? 0} transactions.`);
        setCsvText('');
      } else {
        setActionTone('error');
        setActionMessage(result.message ?? 'Unable to import transactions.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={palette.sidebar} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Connect Accounts</Text>
          <Text style={styles.headerSubtitle}>
            Link M-Pesa and bank data for smarter insights.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Status</Text>
          {isLoading ? (
            <Text style={styles.cardText}>Loading connection status…</Text>
          ) : (
            <>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>M-Pesa</Text>
                <Text style={hasConnection ? styles.statusOn : styles.statusOff}>
                  {hasConnection ? 'Connected' : 'Not connected'}
                </Text>
              </View>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Bank</Text>
                <Text style={styles.statusOff}>Not connected</Text>
              </View>
              <Text style={styles.statusMeta}>Last sync: {lastSyncLabel}</Text>
            </>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quick Actions</Text>
          {!hasConnection ? (
            <>
              <TextInput
                placeholder="M-Pesa phone number"
                placeholderTextColor={palette.textSecondary}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                style={styles.input}
                keyboardType="phone-pad"
              />
              <TouchableOpacity style={styles.actionButton} onPress={handleConnect} disabled={isSaving}>
                {isSaving ? <ActivityIndicator color={palette.card} /> : <Text style={styles.actionText}>Connect M-Pesa</Text>}
              </TouchableOpacity>
              {mpesaStatus?.status === 'pending' ? (
                <>
                  <TextInput
                    placeholder="Enter OTP"
                    placeholderTextColor={palette.textSecondary}
                    value={otp}
                    onChangeText={setOtp}
                    style={styles.input}
                    keyboardType="number-pad"
                  />
                  <TouchableOpacity style={styles.secondaryButton} onPress={handleConfirm} disabled={isSaving}>
                    {isSaving ? <ActivityIndicator color={palette.accentGreen} /> : <Text style={styles.secondaryText}>Confirm OTP</Text>}
                  </TouchableOpacity>
                </>
              ) : null}
            </>
          ) : (
            <>
              <TouchableOpacity style={styles.secondaryButton} onPress={handleDisconnect} disabled={isSaving}>
                {isSaving ? <ActivityIndicator color={palette.accentGreen} /> : <Text style={styles.secondaryText}>Disconnect M-Pesa</Text>}
              </TouchableOpacity>
              <TextInput
                placeholder="Paste CSV statement (date,amount,description,type)"
                placeholderTextColor={palette.textSecondary}
                value={csvText}
                onChangeText={setCsvText}
                style={styles.textArea}
                multiline
                numberOfLines={6}
              />
              <TouchableOpacity style={styles.actionButton} onPress={handleImport} disabled={isSaving}>
                {isSaving ? <ActivityIndicator color={palette.card} /> : <Text style={styles.actionText}>Import Statement</Text>}
              </TouchableOpacity>
            </>
          )}
          <Text style={styles.helperText}>
            We import transactions only. No personal messages.
          </Text>
          {actionMessage ? (
            <View
              style={[
                styles.messageBanner,
                actionTone === 'error' && styles.messageBannerError,
                actionTone === 'success' && styles.messageBannerSuccess,
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  actionTone === 'error' && styles.messageTextError,
                  actionTone === 'success' && styles.messageTextSuccess,
                ]}
              >
                {actionMessage}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Snapshot</Text>
          <View style={styles.snapshotRow}>
            <Text style={styles.snapshotLabel}>Transactions imported</Text>
            <Text style={styles.snapshotValue}>{mpesaStatus?.transactions_imported ?? 0}</Text>
          </View>
          <View style={styles.snapshotRow}>
            <Text style={styles.snapshotLabel}>Last sync</Text>
            <Text style={styles.snapshotValue}>{lastSyncLabel}</Text>
          </View>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleManageConnections}>
            <Text style={styles.secondaryText}>Manage connections</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Privacy</Text>
          <Text style={styles.cardText}>We only read transaction data.</Text>
          <Text style={styles.cardText}>You can disconnect anytime.</Text>
          <Text style={styles.cardText}>Your data is encrypted in transit and at rest.</Text>
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
  header: {
    backgroundColor: palette.sidebar,
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
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
    marginBottom: 16,
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
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  statusLabel: {
    fontSize: 13,
    color: palette.textPrimary,
    fontWeight: '600',
  },
  statusOn: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.mpesaGreen,
  },
  statusOff: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.textSecondary,
  },
  statusMeta: {
    fontSize: 12,
    color: palette.textSecondary,
    marginTop: 10,
  },
  actionButton: {
    backgroundColor: 'rgba(74, 222, 128, 0.2)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.5)',
    marginTop: 8,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.textPrimary,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: palette.textPrimary,
    marginTop: 10,
  },
  textArea: {
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: palette.textPrimary,
    marginTop: 10,
    textAlignVertical: 'top',
    minHeight: 120,
  },
  secondaryButton: {
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.35)',
    marginTop: 8,
  },
  secondaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.cashBlue,
  },
  helperText: {
    fontSize: 12,
    color: palette.textSecondary,
    marginTop: 10,
  },
  messageBanner: {
    marginTop: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  messageBannerError: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  messageBannerSuccess: {
    backgroundColor: '#ECFDF3',
    borderColor: '#BBF7D0',
  },
  messageText: {
    fontSize: 12,
    color: palette.textSecondary,
  },
  messageTextError: {
    color: '#B91C1C',
    fontWeight: '600',
  },
  messageTextSuccess: {
    color: '#15803D',
    fontWeight: '600',
  },
  snapshotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  snapshotLabel: {
    fontSize: 12,
    color: palette.textSecondary,
  },
  snapshotValue: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.textPrimary,
  },
});
