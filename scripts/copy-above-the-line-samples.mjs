import { cpSync } from 'node:fs';
cpSync(new URL('../samples', import.meta.url), new URL('../dist/samples', import.meta.url), { recursive: true });

cpSync(new URL('../assets/screenshot.png', import.meta.url), new URL('../dist/assets/screenshot.png', import.meta.url));
