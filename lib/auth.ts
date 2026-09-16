import "server-only";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cache } from "react";
import { database, db } from "@/lib/db";

export const SESSION_COOKIE = "boulde_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30;
export const SESSION_COOKIE_SECURE = process.env.AUTH_COOKIE_SECURE === "true" || (process.env.AUTH_COOKIE_SECURE !== "false" && process.env.NODE_ENV === "production");
type StoredUser = { id: string; name: string; email: string; username: string; location: string; passwordHash: string; bio?: string; avatar?: string; coverImage?: string; role?: "user" | "admin"; createdAt: { toString(): string } | string };
export type PublicUser = { id: string; name: string; email: string; username: string; location: string; role: "user" | "admin"; createdAt: string; initials: string; bio?: string; avatar?: string; coverImage?: string };
const secret = process.env.AUTH_SECRET || "boulde-local-development-secret-change-me";

function publicUser(user: StoredUser): PublicUser { return { id: user.id, name: user.name, email: user.email, username: user.username, location: user.location, bio: user.bio, avatar: user.avatar, coverImage: user.coverImage, role: user.role === "admin" ? "admin" : "user", createdAt: user.createdAt.toString(), initials: user.name.split(/\s+/).map(part => part[0]).join("").slice(0, 2).toUpperCase() }; }
function hashPassword(password: string) { const salt = randomBytes(16).toString("hex"); return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`; }
function passwordMatches(password: string, stored: string) { const [salt, key] = stored.split(":"); if (!salt || !key) return false; const storedBuffer = Buffer.from(key, "hex"); const suppliedBuffer = scryptSync(password, salt, storedBuffer.length); return storedBuffer.length === suppliedBuffer.length && timingSafeEqual(storedBuffer, suppliedBuffer); }
export async function registerUser(input: { name: string; email: string; username: string; location: string; password: string }) {
  const email = input.email.trim().toLowerCase(); const username = input.username.trim().toLowerCase();
  try {
    const result = await db.executeQuery(`CREATE (u:User { id: $id, name: $name, email: $email, username: $username, location: $location, passwordHash: $passwordHash, role: $role, createdAt: datetime() }) RETURN u`, { id: randomBytes(12).toString("hex"), name: input.name.trim(), email, username, location: input.location.trim(), passwordHash: hashPassword(input.password), role: email === "sedrumm@gmail.com" ? "admin" : "user" }, { database, routing: "WRITE" });
    return publicUser(result.records[0].get("u").properties as StoredUser);
  } catch (error) {
    if ((error as { code?: string }).code === "Neo.ClientError.Schema.ConstraintValidationFailed") { const existing = await db.executeQuery("MATCH (u:User) WHERE u.email = $email OR u.username = $username RETURN u.email AS email LIMIT 1", { email, username }, { database }); if (existing.records[0]?.get("email") === email) throw new Error("Der findes allerede en bruger med den e-mail."); throw new Error("Brugernavnet er allerede taget."); }
    throw error;
  }
}
export async function authenticateUser(email: string, password: string) { const result = await db.executeQuery("MATCH (u:User {email: $email}) RETURN u", { email: email.trim().toLowerCase() }, { database }); const user = result.records[0]?.get("u").properties as StoredUser | undefined; return user && passwordMatches(password, user.passwordHash) ? publicUser(user) : null; }
export function createSession(userId: string) { const payload = Buffer.from(JSON.stringify({ userId, expiresAt: Date.now() + SESSION_MAX_AGE * 1000 })).toString("base64url"); const signature = createHmac("sha256", secret).update(payload).digest("base64url"); return `${payload}.${signature}`; }
async function lookupUserFromSession(token?: string) {
  if (!token) return null; const [payload, signature] = token.split("."); if (!payload || !signature) return null;
  const expected = createHmac("sha256", secret).update(payload).digest(); const supplied = Buffer.from(signature, "base64url"); if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null;
  try { const session = JSON.parse(Buffer.from(payload, "base64url").toString()) as { userId: string; expiresAt: number }; if (session.expiresAt < Date.now()) return null; const result = await db.executeQuery("MATCH (u:User {id: $id}) RETURN u", { id: session.userId }, { database }); const user = result.records[0]?.get("u").properties as StoredUser | undefined; return user ? publicUser(user) : null; } catch { return null; }
}

// React scopes this memoization to the current server render. Layouts and pages can
// therefore ask for the same session user without repeating the Neo4j lookup.
export const userFromSession = cache(lookupUserFromSession);

export async function updateUserProfile(userId: string, input: { name: string; username: string; location: string; bio: string; avatar?: string; coverImage?: string }) {
  const result = await db.executeQuery(`MATCH (u:User {id: $userId})
    SET u.name = $name, u.username = $username, u.location = $location, u.bio = $bio,
        u.avatar = coalesce($avatar, u.avatar), u.coverImage = coalesce($coverImage, u.coverImage)
    RETURN u`, { userId, ...input, avatar: input.avatar || null, coverImage: input.coverImage || null }, { database, routing: "WRITE" });
  return publicUser(result.records[0].get("u").properties as StoredUser);
}
