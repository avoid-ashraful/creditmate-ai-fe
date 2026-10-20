import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const fileEnv = loadEnv(mode, process.cwd(), '');
  const env = { ...process.env, ...fileEnv };
  // Inject only a whitelisted subset of environment variables into the client.
  // Never expose the full process.env (could leak secrets). config/env.ts reads
  // process.env[varName] dynamically, so the whole object must be provided.
  const safeEnv: Record<string, string> = {};
  for (const [key, value] of Object.entries(env)) {
    if (key.startsWith('REACT_APP_') || key === 'NODE_ENV' || key === 'PUBLIC_URL') {
      if (typeof value === 'string') safeEnv[key] = value;
    }
  }
  if (!safeEnv.NODE_ENV) safeEnv.NODE_ENV = mode === 'production' ? 'production' : 'development';

  return {
    plugins: [react()],
    root: '.',
    base: env.PUBLIC_URL || '/',
    publicDir: 'public',
    envPrefix: ['VITE_', 'REACT_APP_'],
    define: {
      'process.env': JSON.stringify(safeEnv),
    },
    resolve: {
      extensions: ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json'],
    },
    server: {
      port: Number(env.PORT || 3000),
      open: false,
    },
    build: {
      outDir: 'build',
      assetsDir: 'static',
      sourcemap: false,
      target: 'es2020',
    },
  };
});
