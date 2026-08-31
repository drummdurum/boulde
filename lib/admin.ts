import "server-only";
import { database, db } from "@/lib/db";

export type PlaceSuggestion = { id: string; name: string; street: string; postalCode: string; city: string; type: string; note: string; status: string; submittedBy: string; createdAt: string };
export async function getPlaceSuggestions(): Promise<PlaceSuggestion[]> { const result = await db.executeQuery("MATCH (u:User)-[:SUGGESTED]->(s:PlaceSuggestion) RETURN s, u.name AS submittedBy ORDER BY s.createdAt DESC", {}, { database }); return result.records.map(record => { const s = record.get("s").properties; return { id: s.id, name: s.name, street: s.street, postalCode: s.postalCode, city: s.city, type: s.placeType, note: s.note || "", status: s.status, submittedBy: record.get("submittedBy"), createdAt: s.createdAt.toString() }; }); }
