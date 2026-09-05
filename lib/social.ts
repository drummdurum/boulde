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
  connectionStatus: "none" | "outgoing" | "incoming" | "connected";
};

function initials(name: string) { return name.split(/\s+/).map(part => part[0]).join("").slice(0, 2).toUpperCase(); }

export type ConnectedUser = Pick<SocialUser, "id" | "name" | "username" | "initials">;

export async function getConnectedUsers(userId: string): Promise<ConnectedUser[]> {
  const result = await db.executeQuery(
    `MATCH (:User {id: $userId})-[:CONNECTED_WITH]-(other:User)
     RETURN DISTINCT other ORDER BY toLower(other.name)`,
    { userId }, { database },
  );
  return result.records.map(record => {
    const user = record.get("other").properties as { id: string; name: string; username: string };
    return { id: user.id, name: user.name, username: user.username, initials: initials(user.name) };
  });
}

export async function findUsers(currentUserId: string, query = ""): Promise<SocialUser[]> {
  const result = await db.executeQuery(
    `MATCH (viewer:User {id: $currentUserId}), (other:User)
     WHERE other <> viewer AND ($query = '' OR toLower(other.name) CONTAINS $query OR toLower(other.username) CONTAINS $query)
     WITH viewer, other, EXISTS { MATCH (viewer)-[:FOLLOWS]->(other) } AS followed
     ORDER BY followed DESC, toLower(other.name) LIMIT 50
     RETURN other, followed, COUNT { MATCH (:User)-[:FOLLOWS]->(other) } AS followerCount,
       CASE
         WHEN EXISTS { MATCH (viewer)-[:CONNECTED_WITH]-(other) } THEN 'connected'
         WHEN EXISTS { MATCH (other)-[:REQUESTS_CONNECTION]->(viewer) } THEN 'incoming'
         WHEN EXISTS { MATCH (viewer)-[:REQUESTS_CONNECTION]->(other) } THEN 'outgoing'
         ELSE 'none'
       END AS connectionStatus
     ORDER BY followed DESC, toLower(other.name)`,
    { currentUserId, query: query.trim().toLowerCase() },
    { database },
  );
  return result.records.map(record => {
    const properties = record.get("other").properties as { id: string; name: string; username: string; location: string };
    return { id: properties.id, name: properties.name, username: properties.username, location: properties.location, initials: initials(properties.name), followed: record.get("followed"), followerCount: neo4jNumber(record.get("followerCount")), connectionStatus: record.get("connectionStatus") };
  });
}

export async function requestConnection(currentUserId: string, targetUserId: string) {
  if (currentUserId === targetUserId) throw new Error("Du kan ikke oprette forbindelse til dig selv.");
  const result = await db.executeQuery(
    `MATCH (viewer:User {id: $currentUserId}), (other:User {id: $targetUserId})
     OPTIONAL MATCH (viewer)-[connected:CONNECTED_WITH]-(other)
     OPTIONAL MATCH (viewer)-[outgoing:REQUESTS_CONNECTION]->(other)
     OPTIONAL MATCH (other)-[incoming:REQUESTS_CONNECTION]->(viewer)
     WITH viewer, other, connected, outgoing, incoming
     WHERE connected IS NULL AND outgoing IS NULL AND incoming IS NULL
     CREATE (viewer)-[:REQUESTS_CONNECTION {createdAt: datetime()}]->(other)
     RETURN other.id AS id`,
    { currentUserId, targetUserId }, { database, routing: "WRITE" },
  );
  if (!result.records.length) throw new Error("Brugeren findes ikke, eller der findes allerede en forbindelsesanmodning.");
}

export async function acceptConnection(currentUserId: string, targetUserId: string) {
  const result = await db.executeQuery(
    `MATCH (viewer:User {id: $currentUserId})<-[request:REQUESTS_CONNECTION]-(other:User {id: $targetUserId})
     DELETE request
     CREATE (viewer)-[:CONNECTED_WITH {createdAt: datetime()}]->(other)
     RETURN other.id AS id`,
    { currentUserId, targetUserId }, { database, routing: "WRITE" },
  );
  if (!result.records.length) throw new Error("Forbindelsesanmodningen findes ikke længere.");
}

export async function rejectConnection(currentUserId: string, targetUserId: string) {
  await db.executeQuery(
    `MATCH (:User {id: $currentUserId})<-[request:REQUESTS_CONNECTION]-(:User {id: $targetUserId}) DELETE request`,
    { currentUserId, targetUserId }, { database, routing: "WRITE" },
  );
}

export async function removeConnection(currentUserId: string, targetUserId: string) {
  await db.executeQuery(
    `MATCH (viewer:User {id: $currentUserId}), (other:User {id: $targetUserId})
     OPTIONAL MATCH (viewer)-[request:REQUESTS_CONNECTION]-(other)
     OPTIONAL MATCH (viewer)-[connected:CONNECTED_WITH]-(other)
     DELETE request, connected`,
    { currentUserId, targetUserId }, { database, routing: "WRITE" },
  );
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
     RETURN COUNT { MATCH (:User)-[:FOLLOWS]->(u) } AS followers,
       COUNT { MATCH (u)-[:FOLLOWS]->(:User) } AS following`,
    { userId }, { database },
  );
  const record = result.records[0];
  return { followers: record ? neo4jNumber(record.get("followers")) : 0, following: record ? neo4jNumber(record.get("following")) : 0 };
}
