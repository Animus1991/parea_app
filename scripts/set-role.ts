/**
 * Give a user a role (custom claim) that the server enforces.
 *
 *   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json \
 *     npm run set-role -- --uid <firebase uid> --role moderator
 *
 * Roles: member (clears), organizer, moderator, admin.
 * The user sees the new role after their ID token refreshes (sign out and in,
 * or within an hour).
 */
import { readFileSync } from 'node:fs';
import { parseServiceAccount, setUserRole, ROLES } from '../server/roleAdmin.ts';
import type { Role } from '../server/auth.ts';

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}

async function main() {
  const uid = arg('uid');
  const role = arg('role') as Role | undefined;
  const credentials = arg('credentials') ?? process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!uid || !role || !credentials) {
    console.error(`Usage: npm run set-role -- --uid <uid> --role <${ROLES.join('|')}> [--credentials <service-account.json>]`);
    process.exit(2);
  }
  const serviceAccount = parseServiceAccount(readFileSync(credentials, 'utf8'));
  const claims = await setUserRole({ serviceAccount, uid, role, fetchImpl: fetch });
  console.warn(`Role "${role}" set for ${uid} in ${serviceAccount.project_id}:`, claims);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
