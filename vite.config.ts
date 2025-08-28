
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8081,
    headers: {
      // Allow iframe embedding
      'X-Frame-Options': 'SAMEORIGIN',
      // Enable CORS for iframe communication
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Allow-Credentials': 'true',
      // Content Security Policy for iframe support
      'Content-Security-Policy': "frame-ancestors 'self' https://*.lovable.app https://localhost:* http://localhost:*",
    },
    // Proxy configuration for development
    proxy: {
      '/api': {
        target: process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321',
        changeOrigin: true,
        secure: false,
      }
    },
    // Enable iframe embedding in development
    fs: {
      allow: ['..']
    }
  },
  preview: {
    port: 8081,
    host: "::",
    headers: {
      // Same headers for preview mode
      'X-Frame-Options': 'SAMEORIGIN',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Content-Security-Policy': "frame-ancestors 'self' https://*.lovable.app https://localhost:* http://localhost:*",
    }
  },
  build: {
    // Optimize for iframe usage
    rollupOptions: {
      output: {
        // Ensure consistent chunk naming for iframe loading
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        // Optimize chunk splitting for iframe
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-select', '@radix-ui/react-toast'],
          utils: ['@tanstack/react-query', 'date-fns', 'clsx']
        }
      }
    },
    // Ensure compatibility with iframe environments
    target: 'es2015',
    sourcemap: mode === 'development',
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    // Make environment variables available at build time
    __IFRAME_MODE__: JSON.stringify(process.env.VITE_IS_IFRAME_MODE === 'true'),
    __PARENT_ORIGIN__: JSON.stringify(process.env.VITE_PARENT_ORIGIN || '*'),
  },
  // Optimize dependencies for iframe usage
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@tanstack/react-query',
      '@supabase/supabase-js'
    ],
    exclude: ['@vite/client', '@vite/env']
  }
}));
