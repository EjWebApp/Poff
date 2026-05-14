import { useEffect } from 'react';
import { Stack, useRouter, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import Toast from 'react-native-toast-message';
import { AuthProvider, useAuth } from '../lib/AuthContext';
import { useFonts, Pacifico_400Regular } from '@expo-google-fonts/pacifico';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Pacifico_400Regular });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fffef9' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}

function AuthGate() {
  const { isAuthenticated, isLoading, autoLoginReady, isAutoLoggingIn } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || !autoLoginReady || isAutoLoggingIn) return;
    if (!isAuthenticated && pathname !== '/login') {
      router.replace('/login');
    } else if (isAuthenticated && pathname === '/login') {
      router.replace('/');
    }
  }, [isAuthenticated, isLoading, autoLoginReady, isAutoLoggingIn, pathname]);

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#fffef9' },
        }}
      />
      <Toast />
    </>
  );
}
