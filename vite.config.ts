import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    plugins: [sveltekit()],
    server: {
        host: true,
        port: 5178,
        strictPort: true
    },
    preview: {
        host: true,
        port: 5178,
        strictPort: true
    },
    test: {
        include: ['src/**/*.{test,spec}.{js,ts}']
    }
});
