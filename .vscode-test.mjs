import { defineConfig } from '@vscode/test-cli';

const files = 'out/test/**/*.test.js';

export default defineConfig([
	{ label: 'v1.15', files, version: '1.15.0' },
	{ label: 'v1.20', files, version: '1.20.0' },
	{ label: 'v1.30', files, version: '1.30.0' },
	{ label: 'v1.50', files, version: '1.50.0' },
	{ label: 'v1.70', files, version: '1.70.0' },
	{ label: 'v1.92', files, version: '1.92.2' },
	{ label: 'latest', files, version: 'stable' },
]);
