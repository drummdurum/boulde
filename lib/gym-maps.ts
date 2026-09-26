import { copenhagenSouthAreas, copenhagenSouthContext, copenhagenSouthSection } from "@/components/gym-map/copenhagen-south";
import { valbyAreas, valbyContext } from "@/components/gym-map/valby";
import { amagerAreas, amagerContext } from "@/components/gym-map/amager";

export interface MapPlacement { areaId: string; x: number; y: number }
export interface MapProblemSummary extends MapPlacement { id: string; colorGrade: import("@/types").ClimbingColor; slot: 1 | 2 }

export function gymMapForPlace(slug: "boulders-kbh-sydhavn"): { name: string; areas: typeof copenhagenSouthAreas; context: typeof copenhagenSouthContext; resolveSection: typeof copenhagenSouthSection };
export function gymMapForPlace(slug?: string): { name: string; areas: typeof copenhagenSouthAreas; context: typeof copenhagenSouthContext; resolveSection?: typeof copenhagenSouthSection } | undefined;
export function gymMapForPlace(slug?: string) {
  if (slug === "boulders-kbh-sydhavn") return { name: "Boulders KBH Sydhavn", areas: copenhagenSouthAreas, context: copenhagenSouthContext, resolveSection: copenhagenSouthSection };
  if (slug === "boulders-valby") return { name: "Boulders Valby", areas: valbyAreas, context: valbyContext };
  if (slug === "boulders-amager") return { name: "Boulders Amager", areas: amagerAreas, context: amagerContext };
  return undefined;
}

export function validMapPlacement(slug: string, value: MapPlacement) {
  const map = gymMapForPlace(slug);
  return Boolean(map?.areas.some(area => area.id === value.areaId)) &&
    Number.isFinite(value.x) && Number.isFinite(value.y) &&
    value.x >= 0 && value.x <= 100 && value.y >= 0 && value.y <= 100;
}
