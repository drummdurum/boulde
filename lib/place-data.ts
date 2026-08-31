import "server-only";
import { database, db } from "@/lib/db";
import { placeBySlug as staticPlaceBySlug, places as staticPlaces, type Place } from "@/lib/places";

type PlaceNode = Place;
function fromNode(node: PlaceNode): Place { return { id: node.id, slug: node.slug, name: node.name, street: node.street, postalCode: node.postalCode, city: node.city, type: node.type || "Bouldering", image: node.image || "/images/nordic-boulder.png", imageAlt: node.imageAlt || `Klatring hos ${node.name}` }; }
export async function getPlaces(): Promise<Place[]> { const result = await db.executeQuery("MATCH (p:Place) WHERE p.status = 'Godkendt' RETURN p ORDER BY p.name", {}, { database }); const dynamic = result.records.map(record => fromNode(record.get("p").properties as PlaceNode)); const ids = new Set(staticPlaces.map(place => place.id)); return [...staticPlaces, ...dynamic.filter(place => !ids.has(place.id))].sort((a, b) => a.name.localeCompare(b.name, "da")); }
export async function getPlaceBySlug(slug: string) { const builtIn = staticPlaceBySlug(slug); if (builtIn) return builtIn; const result = await db.executeQuery("MATCH (p:Place {slug: $slug, status: 'Godkendt'}) RETURN p LIMIT 1", { slug }, { database }); const node = result.records[0]?.get("p")?.properties as PlaceNode | undefined; return node ? fromNode(node) : undefined; }
