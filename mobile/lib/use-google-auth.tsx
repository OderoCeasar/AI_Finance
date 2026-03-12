import { useEffect, useState } from 'react';
import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

type GoogleAuthResult = {
  isLoading: boolean;
  error: string;
  prompt: () => void;
};

type GoogleAuthOptions = {
  clientId?: string;
  onSuccess: (idToken: string) => Promise<void> | void;
};

export function useGoogleAuth({ clientId, onSuccess }: GoogleAuthOptions): GoogleAuthResult {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  WebBrowser.maybeCompleteAuthSession();

  const googleClientId = clientId ?? process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;

  if (!googleClientId) {
    throw new Error('EXPO_PUBLIC_GOOGLE_CLIENT_ID is missing in the environment.');
  }

  const redirectUri = AuthSession.makeRedirectUri();
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: googleClientId,
    webClientId: googleClientId,
    expoClientId: googleClientId,
    redirectUri,
    responseType: AuthSession.ResponseType.IdToken,
    scopes: ['openid', 'profile', 'email'],
    prompt: 'select_account',
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      const idToken = authentication?.idToken;
      if (!idToken) {
        setError('Unable to read Google ID token.');
        setIsLoading(false);
        return;
      }

      Promise.resolve(onSuccess(idToken))
        .catch((err) => {
          if (err instanceof Error && err.message) {
            setError(err.message);
          } else {
            setError('Google sign-in failed.');
          }
        })
        .finally(() => setIsLoading(false));
    }
    if (response && response.type !== 'success') {
      setIsLoading(false);
    }
  }, [response, onSuccess]);

  const prompt = () => {
    setError('');
    setIsLoading(true);
    promptAsync();
  };

  return {
    isLoading: isLoading || !request,
    error,
    prompt,
  };
}
