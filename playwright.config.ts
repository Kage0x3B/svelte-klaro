import { defineConfig } from '@playwright/test';

export default defineConfig({
    webServer: {
        command: 'pnpm build && pnpm preview',
        port: 5178
    },
    testDir: 'tests',
    testMatch: /(.+\.)?(test|spec)\.[jt]s/
});
