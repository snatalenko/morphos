import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
	root: fileURLToPath(new URL('./playground', import.meta.url)),
	plugins: [
		react(),
		{
			name: 'playground-dev-entry',
			apply: 'serve',
			transformIndexHtml(html) {
				return html.replace('./dist/index.js', './main.tsx');
			}
		}
	],
	base: './',
	build: {
		outDir: 'dist',
		emptyOutDir: true,
		rollupOptions: {
			input: fileURLToPath(new URL('./playground/main.tsx', import.meta.url)),
			output: {
				entryFileNames: 'index.js',
				chunkFileNames: '[name].js',
				assetFileNames: '[name][extname]',
				format: 'es'
			}
		}
	},
	server: { open: true }
});
