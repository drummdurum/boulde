import "server-only";
import { randomBytes } from "crypto";
import { database, db, neo4jNumber } from "@/lib/db";
import type { ClimbingGrade, ClimbingProject, ClimbingType, Post, User } from "@/types";

type PostNode = { id: string; description: string; route: string; location: string; grade: ClimbingGrade; climbingType: ClimbingType; image: string; imageAlt: string; likes: number; completed: boolean; isVideo: boolean; createdAt: { toString(): string } | string };
type ProjectNode = { id: string; name: string; location: string; grade: ClimbingGrade; attempts: number; lastAttempt: string; note: string; status: ClimbingProject["status"]; progress: number };
function publicPost(row: PostNode, user: User): Post { return { id: row.id, author: user, description: row.description, route: row.route, location: row.location, grade: row.grade, type: row.climbingType, image: row.image, imageAlt: row.imageAlt, likes: neo4jNumber(row.likes), completed: row.completed, isVideo: row.isVideo, createdAt: new Intl.DateTimeFormat("da-DK", { dateStyle: "medium" }).format(new Date(row.createdAt.toString())), comments: [] }; }
function publicProject(row: ProjectNode): ClimbingProject { return { id: row.id, name: row.name, location: row.location, grade: row.grade, attempts: neo4jNumber(row.attempts), lastAttempt: row.lastAttempt, note: row.note, status: row.status, progress: neo4jNumber(row.progress) }; }
export async function getUserPosts(user: User) { const result = await db.executeQuery("MATCH (:User {id: $userId})-[:CREATED]->(p:Post) RETURN p ORDER BY p.createdAt DESC", { userId: user.id }, { database }); return result.records.map(record => publicPost(record.get("p").properties as PostNode, user)); }
export async function createUserPost(user: User, input: { description: string; route: string; location: string; grade: ClimbingGrade; type: ClimbingType }) {
  const result = await db.executeQuery(`MATCH (u:User {id: $userId}) CREATE (u)-[:CREATED]->(p:Post { id: $id, description: $description, route: $route, location: $location, grade: $grade, climbingType: $type, image: $image, imageAlt: $imageAlt, likes: 0, completed: false, isVideo: false, createdAt: datetime() }) RETURN p`, { userId: user.id, id: randomBytes(12).toString("hex"), description: input.description.trim(), route: input.route.trim(), location: input.location.trim(), grade: input.grade, type: input.type, image: "/images/nordic-boulder.png", imageAlt: `Klatring ved ${input.location.trim()}` }, { database, routing: "WRITE" });
  return publicPost(result.records[0].get("p").properties as PostNode, user);
}
export async function getUserProjects(userId: string) { const result = await db.executeQuery("MATCH (:User {id: $userId})-[:WORKS_ON]->(p:Project) RETURN p ORDER BY p.createdAt DESC", { userId }, { database }); return result.records.map(record => publicProject(record.get("p").properties as ProjectNode)); }
export async function createUserProject(userId: string, input: { name: string; location: string; grade: ClimbingGrade; note: string }) {
  const result = await db.executeQuery(`MATCH (u:User {id: $userId}) CREATE (u)-[:WORKS_ON]->(p:Project { id: $id, name: $name, location: $location, grade: $grade, note: $note, attempts: 0, lastAttempt: 'Ikke forsøgt endnu', status: 'Ny', progress: 0, createdAt: datetime() }) RETURN p`, { userId, id: randomBytes(12).toString("hex"), name: input.name.trim(), location: input.location.trim(), grade: input.grade, note: input.note.trim() }, { database, routing: "WRITE" });
  return publicProject(result.records[0].get("p").properties as ProjectNode);
}
