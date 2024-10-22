import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: 'src', // Set the root directory to `src/`
  plugins: [react()],
  build: {
    outDir: '../dist', // Output compiled files to `dist/` in the project root
  },
});
