if (process.env.NODE_ENV === 'production' || process.env.DEMO_MODE === 'false') throw new Error('Database reset is disabled in production.');
const { execFileSync } = require('node:child_process');
execFileSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['prisma', 'migrate', 'reset', '--force'], { stdio: 'inherit' });
