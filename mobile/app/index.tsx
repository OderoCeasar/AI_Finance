import { Redirect } from 'expo-router';

import { useAuth } from '@/lib/auth';

export default function Index() {
  const { isReady } = useAuth();

  if (!isReady) {
    return null;
  }

  return <Redirect href="/WelcomeScreen" />;
}
