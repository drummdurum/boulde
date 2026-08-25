import "server-only";
import { database, db, neo4jNumber } from "@/lib/db";

export type SocialUser = {
  id: string;
  name: string;
  username: string;
  location: string;
  initials: string;
  followed: boolean;
  followerCount: number;
};

function initials(name: string) { return name.split(/\s+/).map(part => part[0]).join("").slice(0, 2).toUpperCase(); }

export async function findUsers(currentUserId: string, query = ""): Promise<SocialUser[]> {
  const result = await db.executeQuery(
    `MATCH (viewer:User {id: $currentUserId}), (other:User)
     WHERE other <> viewer AND ($query = '' OR toLower(other.name) CONTAINS $query OR toLower(other.username) CONTAINS $query)
     OPTIONAL MATCH (viewer)-[f:FOLLOWS]->(other)
     OPTIONAL MATCH (follower:User)-[:FOLLOWS]->(other)
     RETURN other, f IS NOT NULL AS followed, count(DISTINCT follower) AS followerCount
     ORDER BY followed DESC, toLower(other.name) LIMIT 50`,
    { currentUserId, query: query.trim().toLowerCase() },
    { database },
  );
  return result.records.map(record => {
    const properties = record.get("other").properties as { id: string; name: string; username: string; location: string };
    return { id: properties.id, name: properties.name, username: properties.username, location: properties.location, initials: initials(properties.name), followed: record.get("followed"), followerCount: neo4jNumber(record.get("followerCount")) };
  });
}

export async function followUser(currentUserId: string, targetUserId: string) {
  if (currentUserId === targetUserId) throw new Error("Du kan ikke følge dig selv.");
  const result = await db.executeQuery(
    `MATCH (viewer:User {id: $currentUserId}), (other:User {id: $targetUserId})
     MERGE (viewer)-[:FOLLOWS]->(other) RETURN other.id AS id`,
    { currentUserId, targetUserId },
    { database, routing: "WRITE" },
  );
  if (!result.records.length) throw new Error("Brugeren findes ikke.");
}

export async function unfollowUser(currentUserId: string, targetUserId: string) {
  await db.executeQuery(
    `MATCH (:User {id: $currentUserId})-[f:FOLLOWS]->(:User {id: $targetUserId}) DELETE f`,
    { currentUserId, targetUserId },
    { database, routing: "WRITE" },
  );
}

export async function getFollowCounts(userId: string) {
  const result = await db.executeQuery(
    `MATCH (u:User {id: $userId})
     OPTIONAL MATCH (follower:User)-[:FOLLOWS]->(u)
     WITH u, count(DISTINCT follower) AS followers
     OPTIONAL MATCH (u)-[:FOLLOWS]->(following:User)
     RETURN followers, count(DISTINCT following) AS following`,
    { userId }, { database },
  );
  const record = result.records[0];
  return { followers: record ? neo4jNumber(record.get("followers")) : 0, following: record ? neo4jNumber(record.get("following")) : 0 };
}
