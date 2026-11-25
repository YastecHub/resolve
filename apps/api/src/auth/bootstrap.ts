import { newId } from '../common/ids.js';
import type { PrismaClient } from '../generated/prisma/client.js';

/** Creates the first admin from ADMIN_EMAIL / ADMIN_STAFF_ID when nobody can sign in yet. */
export async function ensureBootstrapAdmin(
  prisma: Pick<PrismaClient, 'staff' | 'accessEvent' | '$transaction'>,
  env: NodeJS.ProcessEnv = process.env,
): Promise<boolean> {
  const email = env.ADMIN_EMAIL?.trim().toLowerCase();
  const staffId = env.ADMIN_STAFF_ID?.trim();
  if (!email || !staffId) return false;
  if ((await prisma.staff.count()) > 0) return false;
  await prisma.$transaction([
    prisma.staff.create({
      data: {
        id: newId('usr'),
        staffId,
        email,
        name: env.ADMIN_NAME?.trim() || 'Administrator',
        role: 'admin',
        status: 'invited',
        invitedBy: 'bootstrap',
      },
    }),
    prisma.accessEvent.create({
      data: {
        id: newId('acc'),
        actorEmail: 'system',
        action: 'invited',
        targetEmail: email,
        detail: 'bootstrap admin',
      },
    }),
  ]);
  return true;
}
