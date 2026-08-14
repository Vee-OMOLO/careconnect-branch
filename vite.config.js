import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Lets you open the app on your phone over the same Wi-Fi.
    // Note: geolocation needs HTTPS or localhost, so live tracking
    // will not prompt over a plain http://192.168.x.x address.
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
