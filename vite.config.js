import { defineConfig } from 'vite';
/**
 * @type {import('vite').UserConfig}
 */
export default defineConfig(({ command, mode }) => ({
    build: {
        chunkSizeWarningLimit: 1000000,
        outDir: 'build'
    }
}));