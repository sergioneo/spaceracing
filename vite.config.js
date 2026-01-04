import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        port: 3000,
        open: true,
        hmr: {
            overlay: true
        }
    },
    // Handle client-side routing
    appType: 'spa'
});

