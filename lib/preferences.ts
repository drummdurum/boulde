import "server-only";
import { database, db } from "@/lib/db";

export type SessionInvitePolicy = "everyone" | "following" | "connections" | "none";

export async function getSessionInvitePolicy(userId: string): Promise<SessionInvitePolicy> {
  const result = await db.executeQuery(
    "MATCH (u:User {id: $userId}) RETURN coalesce(u.sessionInvitePolicy, 'connections') AS policy",
    { userId },
    { database },
  );
  const policy = result.records[0]?.get("policy");
  return policy === "everyone" || policy === "following" || policy === "none" ? policy : "connections";
}

export async function setSessionInvitePolicy(userId: string, policy: SessionInvitePolicy) {
  await db.executeQuery(
    "MATCH (u:User {id: $userId}) SET u.sessionInvitePolicy = $policy",
    { userId, policy },
    { database, routing: "WRITE" },
  );
}

export async function canInviteUser(senderId: string, recipientId: string) {
  if (senderId === recipientId) return false;
  const policy = await getSessionInvitePolicy(recipientId);
  if (policy === "none") return false;
  if (policy === "everyone") return true;
  const relationship = policy === "following"
    ? "MATCH (:User {id: $recipientId})-[:FOLLOWS]->(:User {id: $senderId}) RETURN true AS allowed"
    : "MATCH (:User {id: $recipientId})-[:CONNECTED_WITH]-(:User {id: $senderId}) RETURN true AS allowed";
  const result = await db.executeQuery(relationship, { senderId, recipientId }, { database });
  return result.records[0]?.get("allowed") === true;
}
