import "server-only";
import { randomBytes } from "crypto";
import { database, db, neo4jNumber } from "@/lib/db";
import type { ClimbingLocation, ClimbingProject } from "@/types";

type DateValue = { toString(): string } | string;
type LocationNode = ClimbingLocation & { createdAt?: DateValue; updatedAt?: DateValue };
type ProjectNode = Omit<ClimbingProject, "owner"> & { mapArea?: string; mapX?: number; mapY?: number };

function locationFromNode(node: LocationNode): ClimbingLocation {
  return { id: node.id, name: node.name, region: node.region, address: node.address, hours: node.hours, hoursNote: node.hoursNote, status: node.status, type: node.type, chain: node.chain, country: node.country, imageUrl: node.imageUrl, mapsUrl: node.mapsUrl, instagramUrl: node.instagramUrl, facebookUrl: node.facebookUrl, email: node.email, phone: node.phone };
}

export async function getClimbingLocations() {
  const result = await db.executeQuery("MATCH (l:ClimbingLocation) RETURN l ORDER BY l.region, l.name", {}, { database });
  return result.records.map(record => locationFromNode(record.get("l").properties as LocationNode));
}

export async function getClimbingLocation(id: string) {
  const result = await db.executeQuery("MATCH (l:ClimbingLocation {id: $id}) RETURN l", { id }, { database });
  const node = result.records[0]?.get("l")?.properties as LocationNode | undefined;
  return node ? locationFromNode(node) : null;
}

export async function getPublicProjectsAtLocation(location: ClimbingLocation) {
  const result = await db.executeQuery(`MATCH (owner:User)-[:WORKS_ON]->(p:Project {visible: true})
    WHERE (p.placeSlug = $placeSlug OR toLower(trim(p.location)) IN [toLower($name), toLower($shortName), toLower($id)]) AND p.removedAt IS NULL
    RETURN p, owner ORDER BY p.createdAt DESC`, { name: location.name, shortName: location.name.replace(/^Boulders\s+/i, ""), id: location.id, placeSlug: location.id === "sydhavn" ? "boulders-kbh-sydhavn" : location.placeSlug ?? null }, { database });
  return result.records.map(record => {
    const p = record.get("p").properties as ProjectNode;
    const owner = record.get("owner").properties as { id: string; name: string; username: string };
    return {
      id: p.id, name: p.name, location: p.location, grade: p.grade,
      colorGrade: p.colorGrade, status: p.status, lastAttempt: p.lastAttempt,
      image: p.image, placeSlug: p.placeSlug, mapProblemId: p.mapProblemId,
      mapSlot: p.mapSlot == null ? undefined : neo4jNumber(p.mapSlot) as 1 | 2,
      mapPlacement: p.mapArea && p.mapX != null && p.mapY != null ? { areaId: p.mapArea, x: neo4jNumber(p.mapX), y: neo4jNumber(p.mapY) } : undefined,
      attempts: neo4jNumber(p.attempts), progress: neo4jNumber(p.progress), visible: true, note: "",
      owner: { id: owner.id, name: owner.name, username: owner.username, initials: owner.name.split(/\s+/).map(part => part[0]).join("").slice(0, 2).toUpperCase() },
    } satisfies ClimbingProject;
  });
}

export async function createLocationRequest(userId: string, input: { name: string; address: string; website: string; note: string }) {
  const result = await db.executeQuery(`MATCH (u:User {id: $userId})
    CREATE (u)-[:REQUESTED]->(r:LocationRequest {id: $id, name: $name, address: $address, website: $website, note: $note, status: 'pending', createdAt: datetime()})
    RETURN r.id AS id`, { userId, id: randomBytes(12).toString("hex"), name: input.name.trim(), address: input.address.trim(), website: input.website.trim(), note: input.note.trim() }, { database, routing: "WRITE" });
  return result.records[0]?.get("id") as string | undefined;
}
