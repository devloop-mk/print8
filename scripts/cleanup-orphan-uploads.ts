/**
 * Manual orphan upload cleanup (same logic as the cron API route).
 *
 * Usage:
 *   npx tsx scripts/cleanup-orphan-uploads.ts
 *   npx tsx scripts/cleanup-orphan-uploads.ts --dry-run
 */
import { cleanupOrphanUploads } from '../src/lib/upload/cleanup-orphans';

const dryRun = process.argv.includes('--dry-run');

const result = await cleanupOrphanUploads({ dryRun });
console.log(JSON.stringify(result, null, 2));
