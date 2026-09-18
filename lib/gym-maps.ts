import { copenhagenSouthAreas, copenhagenSouthContext, copenhagenSouthSection } from "@/components/gym-map/copenhagen-south";

export interface MapPlacement { areaId: string; x: number; y: number }
export interface MapProblemSummary extends MapPlacement { id: string; colorGrade: import("@/types").ClimbingColor; slot: 1 | 2 }

export function gymMapForPlace(slug?: string) {
  return slug === "boulders-kbh-sydhavn"
    ? { name: "Boulders KBH Sydhavn", areas: copenhagenSouthAreas, context: copenhagenSouthContext, resolveSection: copenhagenSouthSection }
    : undefined;
}

export function validMapPlacement(slug: string, value: MapPlacement) {
  const map = gymMapForPlace(slug);
  return Boolean(map?.areas.some(area => area.id === value.areaId)) &&
    Number.isFinite(value.x) && Number.isFinite(value.y) &&
    value.x >= 0 && value.x <= 100 && value.y >= 0 && value.y <= 100;
}
