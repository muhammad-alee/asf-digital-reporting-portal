import { eq } from "drizzle-orm";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getDb } from "@/db";
import { roles, users } from "@/db/schema";
import { hasPermission, type Permission, type Role } from "@/lib/auth/permissions";

export type Actor = { id: string; role: Role; airportId: string | null; displayName: string };

export async function currentActor(): Promise<Actor | null> {
  const identity = await getChatGPTUser();
  if (!identity) return null;
  const db = getDb();
  const rows = await db
    .select({ id: users.id, role: roles.code, airportId: users.airportId, displayName: users.displayName })
    .from(users)
    .innerJoin(roles, eq(users.roleId, roles.id))
    .where(eq(users.id, identity.userId))
    .limit(1);
  const actor = rows[0];
  return actor ? { ...actor, role: actor.role as Role } : null;
}

export async function requirePermission(permission: Permission): Promise<Actor> {
  const actor = await currentActor();
  if (!actor) throw new Response("Authentication required", { status: 401 });
  if (!hasPermission(actor.role, permission)) throw new Response("Not authorized", { status: 403 });
  return actor;
}
