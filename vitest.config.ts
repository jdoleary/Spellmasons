/// <reference types="vitest" />
import {
    configDefaults,
    defineConfig
} from 'vitest/config'

export default defineConfig({
    test: {
        exclude: [...configDefaults.exclude, 'headless-server-build/**'],
        globalSetup: ['vitest.setup.ts'],
        environment: 'happy-dom',
        server: {
            deps: {
                inline: [
                    '@pixi/filter-adjustmnet',
                    '@pixi/filter-color-overlay',
                    '@pixi/filter-multi-color-replace',
                    '@pixi/filter-outline',
                    '@pixi/core',
                ]
            }
        }
    },
})