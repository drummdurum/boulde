"use client";

import type { ClimbingProject } from "@/types";
import { gymMapForPlace } from "@/lib/gym-maps";
import { GymMap } from "./GymMap";

export function PlaceGymMap({ placeSlug, projects = [], placement }: { placeSlug?: string; projects?: ClimbingProject[]; placement?: ClimbingProject["mapPlacement"] }) {
  const map = gymMapForPlace(placeSlug);
  return map ? <GymMap {...map} projects={projects} placement={placement} /> : null;
}
