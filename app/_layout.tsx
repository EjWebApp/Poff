import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import { AuthProvider } from '../lib/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#fffef9' },
        }}
      />
      <Toast />
    </AuthProvider>
  );
}
