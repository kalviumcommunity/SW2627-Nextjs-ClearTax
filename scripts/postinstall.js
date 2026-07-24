const { execSync } = require('child_process');

console.log('[Postinstall] Running monorepo postinstall hook...');

if (process.env.VERCEL) {
  console.log('[Postinstall] Vercel environment detected. Skipping backend Prisma generate for frontend deployment.');
  process.exit(0);
}

try {
  console.log('[Postinstall] Running prisma:generate for server workspace...');
  execSync('npm run prisma:generate --workspace=server', { stdio: 'inherit' });
  console.log('[Postinstall] Prisma client generated successfully.');
} catch (err) {
  console.warn('[Postinstall] Warning: Failed to run prisma generate. Continuing to allow build configurations to proceed.', err.message);
  process.exit(0);
}
