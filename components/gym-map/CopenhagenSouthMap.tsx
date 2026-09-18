"use client";

import { GymMap } from "./GymMap";
import { copenhagenSouthAreas, copenhagenSouthContext, copenhagenSouthSection } from "./copenhagen-south";
import type { ClimbingProject } from "@/types";

export function CopenhagenSouthMap({ projects = [], placement }: { projects?: ClimbingProject[]; placement?: ClimbingProject["mapPlacement"] }) {
  return <GymMap name="Boulders KBH Sydhavn" areas={copenhagenSouthAreas} context={copenhagenSouthContext} resolveSection={copenhagenSouthSection} projects={projects} placement={placement} />;
}
