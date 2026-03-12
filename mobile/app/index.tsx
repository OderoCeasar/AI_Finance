import { Redirect } from 'expo-router';

import { useAuth } from '@/lib/auth';

export default function Index() {
  const { tokens, isReady } = useAuth();

  if (!isReady) {
    return null;
  }

  return <Redirect href={tokens?.access ? '/(tabs)' : '/WelcomeScreen'} />;
}
