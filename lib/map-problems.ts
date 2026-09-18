import "server-only";
import { database, db, neo4jNumber } from "@/lib/db";
import type { ClimbingColor } from "@/types";

export async function getMapProblems(placeSlug: string) {
  const result = await db.executeQuery("MATCH (b:MapProblem {placeSlug: $placeSlug}) WHERE b.removedAt IS NULL RETURN b", { placeSlug }, { database });
  return result.records.map(record => {
    const b = record.get("b").properties;
    return { id: String(b.id), areaId: String(b.areaId), colorGrade: b.colorGrade as ClimbingColor, slot: neo4jNumber(b.slot) as 1 | 2, x: neo4jNumber(b.mapX), y: neo4jNumber(b.mapY) };
  });
}
