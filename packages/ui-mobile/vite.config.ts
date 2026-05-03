import { resolve } from 'path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    react(),
    dts({
      include: ['lib/**/*'],
      exclude: ['lib/**/*.stories.tsx', 'lib/**/*.test.tsx'],
      insertTypesEntry: true,
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'lib'),
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'lib/index.ts'),
      name: 'TodoUIMobile',
      fileName: 'index',
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: [
        'react',
        'react-native',
        'react-native-reanimated',
        'react-native-gesture-handler',
        'react-native-safe-area-context',
        'react-native-screens',
        'react-native-vector-icons',
        'react-native-vector-icons/MaterialIcons',
        'react-native-vector-icons/FontAwesome',
        'react-native-vector-icons/Ionicons',
        '@expo/vector-icons',
        '@expo/vector-icons/MaterialIcons',
        '@ui-kitten/components',
        '@ui-kitten/eva-icons',
        '@eva-design/eva',
        'react-native-svg',
        'react-native-web',
        'react-native-webview',
        '@react-native-async-storage/async-storage',
        '@react-navigation/bottom-tabs',
        '@react-navigation/elements',
        '@react-navigation/native',
        'expo',
        'expo-blur',
        'expo-constants',
        'expo-font',
        'expo-haptics',
        'expo-image',
        'expo-linking',
        'expo-router',
        'expo-splash-screen',
        'expo-status-bar',
        'expo-symbols',
        'expo-system-ui',
        'expo-web-browser',
      ],
      output: {
        globals: {
          react: 'React',
          'react-native': 'ReactNative',
          'react-native-vector-icons': 'ReactNativeVectorIcons',
        },
      },
    },
    sourcemap: false,
    emptyOutDir: true,
  },
});
