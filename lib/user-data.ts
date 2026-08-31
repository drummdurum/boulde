import "server-only";
import { randomBytes } from "crypto";
import { database, db, neo4jNumber } from "@/lib/db";
import { createReadUrl } from "@/lib/storage";
import type { ClimbingGrade, ClimbingProject, ClimbingSession, ClimbingType, Post, ProjectFeedItem, ProjectMedia, User } from "@/types";

type PostNode = { id: string; description: string; route: string; location: string; grade: ClimbingGrade; climbingType: ClimbingType; image: string; imageAlt: string; likes: number; completed: boolean; isVideo: boolean; createdAt: { toString(): string } | string };
type ProjectNode = { id: string; name: string; location: string; grade: ClimbingGrade; attempts: number; lastAttempt: string; note: string; status: ClimbingProject["status"]; progress: number; visible?: boolean; image?: string; placeSlug?: string };
type SessionNode = { id: string; shareId: string; title: string; date: string; time: string; location: string; createdAt: { toString(): string } | string };
function publicPost(row: PostNode, user: User): Post { return { id: row.id, author: user, description: row.description, route: row.route, location: row.location, grade: row.grade, type: row.climbingType, image: row.image, imageAlt: row.imageAlt, likes: neo4jNumber(row.likes), completed: row.completed, isVideo: row.isVideo, createdAt: new Intl.DateTimeFormat("da-DK", { dateStyle: "medium" }).format(new Date(row.createdAt.toString())), comments: [] }; }
function publicProject(row: ProjectNode): ClimbingProject { return { id: row.id, name: row.name, location: row.location, grade: row.grade, attempts: neo4jNumber(row.attempts), lastAttempt: row.lastAttempt, note: row.note, status: row.status, progress: neo4jNumber(row.progress), visible: row.visible === true, image: row.image, placeSlug: row.placeSlug }; }
export async function getUserPosts(user: User) { const result = await db.executeQuery("MATCH (:User {id: $userId})-[:CREATED]->(p:Post) RETURN p ORDER BY p.createdAt DESC", { userId: user.id }, { database }); return result.records.map(record => publicPost(record.get("p").properties as PostNode, user)); }
export async function createUserPost(user: User, input: { description: string; route: string; location: string; grade: ClimbingGrade; type: ClimbingType }) {
  const result = await db.executeQuery(`MATCH (u:User {id: $userId}) CREATE (u)-[:CREATED]->(p:Post { id: $id, description: $description, route: $route, location: $location, grade: $grade, climbingType: $type, image: $image, imageAlt: $imageAlt, likes: 0, completed: false, isVideo: false, createdAt: datetime() }) RETURN p`, { userId: user.id, id: randomBytes(12).toString("hex"), description: input.description.trim(), route: input.route.trim(), location: input.location.trim(), grade: input.grade, type: input.type, image: "/images/nordic-boulder.png", imageAlt: `Klatring ved ${input.location.trim()}` }, { database, routing: "WRITE" });
  return publicPost(result.records[0].get("p").properties as PostNode, user);
}
export async function getUserProjects(userId: string) { const result = await db.executeQuery("MATCH (:User {id: $userId})-[:WORKS_ON]->(p:Project) RETURN p ORDER BY p.createdAt DESC", { userId }, { database }); return result.records.map(record => publicProject(record.get("p").properties as ProjectNode)); }
export async function createUserProject(userId: string, input: { name: string; place: { id: string; slug: string; name: string; street: string; postalCode: string; city: string; image: string }; grade: ClimbingGrade; note: string; image?: string; visible?: boolean }) {
  const result = await db.executeQuery(`MATCH (u:User {id: $userId}) MERGE (place:Place {id: $placeId}) SET place.slug = $placeSlug, place.name = $location, place.street = $street, place.postalCode = $postalCode, place.city = $city, place.image = $placeImage CREATE (u)-[:WORKS_ON]->(p:Project { id: $id, name: $name, location: $location, placeSlug: $placeSlug, grade: $grade, note: $note, image: $image, visible: $visible, attempts: 0, lastAttempt: 'Ikke forsøgt endnu', status: 'Ny', progress: 0, createdAt: datetime() })-[:AT_PLACE]->(place) RETURN p`, { userId, id: randomBytes(12).toString("hex"), name: input.name.trim(), placeId: input.place.id, placeSlug: input.place.slug, location: input.place.name, street: input.place.street, postalCode: input.place.postalCode, city: input.place.city, placeImage: input.place.image, grade: input.grade, note: input.note.trim(), image: input.image || input.place.image, visible: input.visible === true }, { database, routing: "WRITE" });
  return publicProject(result.records[0].get("p").properties as ProjectNode);
}
export async function setProjectVisibility(userId: string, projectId: string, visible: boolean) {
  const result = await db.executeQuery("MATCH (:User {id: $userId})-[:WORKS_ON]->(p:Project {id: $projectId}) SET p.visible = $visible RETURN p", { userId, projectId, visible }, { database, routing: "WRITE" });
  return result.records[0] ? publicProject(result.records[0].get("p").properties as ProjectNode) : null;
}
export async function getVisibleConnectionProjects(userId: string) {
  const result = await db.executeQuery(`MATCH (:User {id: $userId})-[:FOLLOWS]->(owner:User)-[:WORKS_ON]->(p:Project {visible: true})
    RETURN p, owner ORDER BY p.createdAt DESC`, { userId }, { database });
  return result.records.map(record => { const project = publicProject(record.get("p").properties as ProjectNode); const owner = record.get("owner").properties as { id: string; name: string; username: string }; return { ...project, note: "", owner: { ...owner, initials: initials(owner.name) } }; });
}
export async function getFollowingProjectFeed(userId: string): Promise<ProjectFeedItem[]> {
  const result = await db.executeQuery(`MATCH (:User {id: $userId})-[:FOLLOWS]->(owner:User)-[:WORKS_ON]->(p:Project {visible: true})
    OPTIONAL MATCH (p)-[:HAS_MEDIA]->(m:ProjectMedia)
    WITH owner, p, m ORDER BY m.createdAt DESC
    WITH owner, p, collect(m)[0..4] AS media
    RETURN owner, p, media ORDER BY p.createdAt DESC LIMIT 30`, { userId }, { database });
  return Promise.all(result.records.map(async record => {
    const project = publicProject(record.get("p").properties as ProjectNode);
    const owner = record.get("owner").properties as { id: string; name: string; username: string };
    const mediaNodes = (record.get("media") as Array<{ properties: Omit<ProjectMedia, "projectId" | "url"> & { storageKey?: string; publicUrl?: string; createdAt: { toString(): string } | string } }>).filter(Boolean);
    const media = await Promise.all(mediaNodes.map(async node => { const item = node.properties; return { id: item.id, projectId: project.id, type: item.type, contentType: item.contentType, size: neo4jNumber(item.size), note: item.note, createdAt: item.createdAt.toString(), url: item.publicUrl || (item.storageKey ? await createReadUrl(item.storageKey) : "") }; }));
    const createdAt = (record.get("p").properties.createdAt as { toString(): string } | string | undefined)?.toString() || "";
    return { project: { ...project, note: "", owner: { ...owner, initials: initials(owner.name) } }, media, createdAt };
  }));
}
export async function userOwnsProject(userId: string, projectId: string) { const result = await db.executeQuery("MATCH (:User {id: $userId})-[:WORKS_ON]->(:Project {id: $projectId}) RETURN count(*) > 0 AS allowed", { userId, projectId }, { database }); return result.records[0]?.get("allowed") === true; }
export async function canViewProject(userId: string, projectId: string) { const result = await db.executeQuery(`MATCH (owner:User)-[:WORKS_ON]->(p:Project {id: $projectId}) RETURN owner.id = $userId OR p.visible = true AS allowed`, { userId, projectId }, { database }); return result.records[0]?.get("allowed") === true; }
export async function getProjectForViewer(userId: string, projectId: string) { const result = await db.executeQuery(`MATCH (owner:User)-[:WORKS_ON]->(p:Project {id: $projectId}) WITH owner, p, owner.id = $userId AS owns WHERE owns OR p.visible = true RETURN p, owner, owns`, { userId, projectId }, { database }); const record = result.records[0]; if (!record) return null; const project = publicProject(record.get("p").properties as ProjectNode); const owner = record.get("owner").properties as { id: string; name: string; username: string }; return { ...project, note: record.get("owns") ? project.note : "", owner: { ...owner, initials: initials(owner.name) } }; }
export async function createProjectMedia(userId: string, projectId: string, input: { key: string; contentType: string; size: number; note: string }) {
  const result = await db.executeQuery(`MATCH (u:User {id: $userId})-[:WORKS_ON]->(p:Project {id: $projectId}) CREATE (p)-[:HAS_MEDIA]->(m:ProjectMedia {id: $id, storageKey: $key, contentType: $contentType, size: $size, note: $note, type: $type, createdAt: datetime()}) SET p.attempts = coalesce(p.attempts, 0) + 1, p.lastAttempt = toString(date()) RETURN m`, { userId, projectId, id: randomBytes(12).toString("hex"), key: input.key, contentType: input.contentType, size: input.size, note: input.note.trim(), type: input.contentType.startsWith("video/") ? "video" : "image" }, { database, routing: "WRITE" });
  return result.records[0]?.get("m").properties as { id: string } | undefined;
}
export async function getProjectMedia(projectId: string) { const result = await db.executeQuery("MATCH (:Project {id: $projectId})-[:HAS_MEDIA]->(m:ProjectMedia) RETURN m ORDER BY m.createdAt DESC", { projectId }, { database }); return result.records.map(record => { const item = record.get("m").properties as Omit<ProjectMedia, "projectId" | "url"> & { storageKey?: string; publicUrl?: string; createdAt: { toString(): string } | string }; return { ...item, size: neo4jNumber(item.size) }; }); }

function initials(name: string) { return name.split(/\s+/).map(part => part[0]).join("").slice(0, 2).toUpperCase(); }
export async function createClimbingSession(userId: string, input: { title: string; date: string; time: string; location: string; projectId?: string }) {
  const result = await db.executeQuery(`MATCH (u:User {id: $userId})
    OPTIONAL MATCH (u)-[:WORKS_ON]->(p:Project {id: $projectId})
    CREATE (u)-[:HOSTS]->(s:ClimbingSession {id: $id, shareId: $shareId, title: $title, date: $date, time: $time, location: $location, createdAt: datetime()})
    FOREACH (_ IN CASE WHEN p IS NULL THEN [] ELSE [1] END | CREATE (s)-[:FOR_PROJECT]->(p))
    RETURN s`, { userId, projectId: input.projectId || null, id: randomBytes(12).toString("hex"), shareId: randomBytes(9).toString("base64url"), title: input.title.trim(), date: input.date, time: input.time, location: input.location.trim() }, { database, routing: "WRITE" });
  return getSharedSession(result.records[0].get("s").properties.shareId);
}
export async function getSharedSession(shareId: string): Promise<ClimbingSession | null> {
  const result = await db.executeQuery(`MATCH (host:User)-[:HOSTS]->(s:ClimbingSession {shareId: $shareId})
    OPTIONAL MATCH (s)-[:FOR_PROJECT]->(p:Project)
    OPTIONAL MATCH (s)<-[:JOINS]-(guest:SessionGuest)
    RETURN s, p, host, collect(guest {.*}) AS guests`, { shareId }, { database });
  const record = result.records[0]; if (!record) return null;
  const session = record.get("s").properties as SessionNode; const projectNode = record.get("p") as { properties: ProjectNode } | null; const host = record.get("host").properties as { id: string; name: string };
  const guests = (record.get("guests") as Array<{ id?: string; name?: string }>).filter(guest => guest.id && guest.name).map(guest => ({ id: guest.id!, name: guest.name!, initials: initials(guest.name!) }));
  const project = projectNode?.properties;
  return { id: session.id, shareId: session.shareId, title: session.title, date: session.date, time: session.time, location: session.location, createdAt: session.createdAt.toString(), ...(project ? { project: { id: project.id, name: project.name, grade: project.grade } } : {}), host: { id: host.id, name: host.name, initials: initials(host.name) }, participants: [{ id: host.id, name: host.name, initials: initials(host.name) }, ...guests] };
}
export async function getUserSessions(userId: string) {
  const result = await db.executeQuery("MATCH (:User {id: $userId})-[:HOSTS]->(s:ClimbingSession) RETURN s.shareId AS shareId ORDER BY s.date, s.time", { userId }, { database });
  return Promise.all(result.records.map(record => getSharedSession(record.get("shareId") as string))) as Promise<Array<ClimbingSession | null>>;
}
export async function joinSharedSession(shareId: string, name: string) {
  const normalized = name.trim();
  const result = await db.executeQuery(`MATCH (s:ClimbingSession {shareId: $shareId})
    MERGE (g:SessionGuest {sessionId: s.id, normalizedName: toLower($name)})
    ON CREATE SET g.id = $id, g.name = $name, g.createdAt = datetime()
    MERGE (g)-[:JOINS]->(s) RETURN s.shareId AS shareId`, { shareId, name: normalized, id: randomBytes(12).toString("hex") }, { database, routing: "WRITE" });
  return result.records.length ? getSharedSession(shareId) : null;
}
