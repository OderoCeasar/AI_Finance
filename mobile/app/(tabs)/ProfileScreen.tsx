import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

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

type ProfilePayload = {
  id: number;
  name: string;
  email: string;
  date_joined: string;
};

export default function ProfileScreen() {
  const [profile, setProfile] = useState<ProfilePayload | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { tokens, refreshAccessToken, signOut } = useAuth();
  const accessToken = tokens?.access;

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    let isMounted = true;

    const fetchProfile = async () => {
      setIsLoading(true);
      setError('');
      try {
        let result = await api.get<ProfilePayload>('auth/profile/', accessToken);
        if (result.status === 401) {
          const newToken = await refreshAccessToken();
          if (newToken) {
            result = await api.get<ProfilePayload>('auth/profile/', newToken);
          }
        }

        if (!isMounted) {
          return;
        }

        if (result.ok && result.data) {
          setProfile(result.data);
        } else {
          setError(result.message ?? 'Unable to load profile.');
        }
      } catch (err) {
        if (isMounted) {
          setError('Unable to load profile right now.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, [accessToken, refreshAccessToken]);

  const handleLogout = async () => {
    await signOut();
    router.replace('/WelcomeScreen');
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={palette.sidebar} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <Text style={styles.headerSubtitle}>Account overview</Text>
        </View>

        <View style={styles.card}>
          {isLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={palette.accentGreen} />
            </View>
          ) : (
            <>
              <Text style={styles.profileName}>{profile?.name ?? 'Your Name'}</Text>
              <Text style={styles.profileEmail}>{profile?.email ?? 'your.email@example.com'}</Text>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Member since</Text>
                <Text style={styles.metaValue}>{profile?.date_joined ?? '--'}</Text>
              </View>
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </>
          )}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </ScrollView>
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
    paddingBottom: 40,
  },
  header: {
    backgroundColor: palette.sidebar,
    borderRadius: 18,
    padding: 20,
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
  card: {
    backgroundColor: palette.card,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(100, 116, 139, 0.2)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: palette.textPrimary,
    marginBottom: 6,
  },
  profileEmail: {
    fontSize: 14,
    color: palette.textSecondary,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(100, 116, 139, 0.12)',
    paddingTop: 12,
  },
  metaLabel: {
    color: palette.textSecondary,
    fontSize: 12,
  },
  metaValue: {
    color: palette.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  errorText: {
    color: palette.cashBlue,
    fontSize: 12,
    marginTop: 10,
  },
  loadingRow: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  logoutButton: {
    marginTop: 18,
    backgroundColor: palette.cashBlue,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutText: {
    color: palette.card,
    fontWeight: '700',
    fontSize: 14,
  },
});
