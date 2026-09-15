import type { ClimbingLocation, ClimbingProject } from "@/types";

function normalized(value: string | undefined) {
  return value?.trim().toLocaleLowerCase("da-DK") ?? "";
}

export function isProjectAtLocation(
  project: Pick<ClimbingProject, "location" | "placeSlug">,
  location: Pick<ClimbingLocation, "name" | "placeSlug">,
) {
  if (project.placeSlug && location.placeSlug) {
    return normalized(project.placeSlug) === normalized(location.placeSlug);
  }
  return normalized(project.location) === normalized(location.name);
}
