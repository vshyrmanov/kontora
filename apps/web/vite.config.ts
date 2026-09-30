import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // у розробці фронт і API на одному origin — без CORS і з відносним /api
    proxy: { '/api': 'http://localhost:4000' },
  },
});
