import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
	root: fileURLToPath(new URL('./playground', import.meta.url)),
	plugins: [react()],
	server: { open: true }
});
