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
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    splash: {
      image: './assets/splash-icon.png',
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
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#fffef9',
      },
      package: 'com.poff.app',
    },
    plugins: [
      'expo-router',
      ['expo-notifications', { icon: './assets/icon.png', color: '#d97706' }],
      'expo-asset',
    ],
    scheme: 'poff',
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
    },
  },
};
