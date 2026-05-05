import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    react(),
    dts({
      include: ['src/**/*', 'lib/**/*'],
      exclude: ['src/**/*.stories.tsx', 'src/**/*.test.tsx', 'lib/**/*.stories.tsx', 'lib/**/*.test.tsx'],
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'TodoUIWeb',
      fileName: format => `index.${format === 'es' ? 'js' : 'cjs'}`,
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'class-variance-authority',
        'clsx',
        'lucide-react',
        'tailwind-merge',
        'tailwindcss',
        'daisyui',
      ],
      output: [
        {
          format: 'es',
          entryFileNames: 'index.js',
          chunkFileNames: '[name]-[hash].js',
          preserveModules: true,
          preserveModulesRoot: 'src',
          exports: 'named',
        },
        {
          format: 'cjs',
          entryFileNames: 'index.cjs',
          chunkFileNames: '[name]-[hash].cjs',
          exports: 'named',
        },
      ],
    },
    sourcemap: true,
    emptyOutDir: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
});
