import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Converted to ESM JavaScript to avoid Windows temp-path resolution issues when transpiling TS configs
export default defineConfig({
	plugins: [react()],
	root: '.',
	build: {
		outDir: 'dist',
	},
	server: {
		port: 5174,
		host: true,
	},
})


