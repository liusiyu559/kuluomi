import { defineConfig, loadEnv } from 'vite'; // 👈 增加了 loadEnv
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // 👈 这一行是关键：手动加载当前环境的变量
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    base: './', // 👈 别忘了这个，防止白屏
    define: {
      // 👈 重点：从 env 对象里取值，并做多重备份
      'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY),
      'process.env.NODE_ENV': JSON.stringify(mode)
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      target: 'esnext'
    },
    server: {
      port: 3000,
    }
  };
});