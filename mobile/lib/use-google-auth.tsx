import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
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
  redirectPath?: string;
  onSuccess: (idToken: string) => Promise<void> | void;
};

export function useGoogleAuth({
  clientId,
  redirectPath,
  onSuccess,
}: GoogleAuthOptions): GoogleAuthResult {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isWeb = Platform.OS === 'web';
  WebBrowser.maybeCompleteAuthSession({ skipRedirectCheck: isWeb });

  const googleClientId = clientId ?? process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;

  if (!googleClientId) {
    throw new Error('EXPO_PUBLIC_GOOGLE_CLIENT_ID is missing in the environment.');
  }

  const redirectUri = AuthSession.makeRedirectUri({
    useProxy: !isWeb,
    path: isWeb ? redirectPath : undefined,
  });
  if (process.env.NODE_ENV !== 'production') {
    console.log('[GoogleAuth] redirectUri:', redirectUri);
  }
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
    if (!isWeb || typeof window === 'undefined') {
      return;
    }
    const hash = window.location.hash;
    if (!hash || !hash.includes('id_token=')) {
      return;
    }
    const params = new URLSearchParams(hash.replace(/^#/, ''));
    const idToken = params.get('id_token');
    if (!idToken) {
      setError(params.get('error_description') ?? params.get('error') ?? 'Google sign-in failed.');
      return;
    }
    setIsLoading(true);
    Promise.resolve(onSuccess(idToken))
      .catch((err) => {
        if (err instanceof Error && err.message) {
          setError(err.message);
        } else {
          setError('Google sign-in failed.');
        }
      })
      .finally(() => {
        setIsLoading(false);
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      });
  }, [isWeb, onSuccess]);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' && response) {
      console.log('Google auth response:', response);
    }
    if (response?.type === 'success') {
      const { authentication, params } = response;
      const idToken = authentication?.idToken ?? params?.id_token;
      if (!idToken) {
        const details = params?.error_description || params?.error || 'Unable to read Google ID token.';
        setError(details);
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
        .finally(() => {
          setIsLoading(false);
          if (isWeb && typeof window !== 'undefined') {
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
          }
        });
    }
    if (response && response.type !== 'success') {
      if (response.type === 'error') {
        setError(response.error?.message ?? 'Google sign-in failed.');
      }
      setIsLoading(false);
    }
  }, [response, onSuccess]);

  const prompt = () => {
    setError('');
    if (isWeb) {
      promptAsync({ windowName: '_self' });
      return;
    }
    promptAsync({ useProxy: true, preferEphemeralSession: true });
  };

  return {
    isLoading: isLoading || !request,
    error,
    prompt,
  };
}
