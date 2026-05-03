const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '.env'),
  quiet: true,
});

module.exports = {
  expo: {
    name: 'Poff',
    slug: 'poff',
    version: '0.0.1',
    orientation: 'portrait',
    icon: './assets/main_char.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    splash: {
      image: './assets/main_char.png',
      resizeMode: 'contain',
      backgroundColor: '#fffef9',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.poff.app',
      infoPlist: {},
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/main_char.png',
        backgroundColor: '#fffef9',
      },
      package: 'com.poff.app',
      versionCode: 1,
    },
    plugins: [
      'expo-router',
      ['expo-notifications', { icon: './assets/main_char.png', color: '#FF8B7B' }],
      'expo-asset',
    ],
    scheme: 'poff',
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
      eas: {
        projectId: 'a41fdc9b-ba6b-4284-aaf0-b3b116e26be7',
      },
    },
  },
};
