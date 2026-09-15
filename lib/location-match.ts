import type { ClimbingProject } from "@/types";

function normalized(value: string | undefined) {
  return value?.trim().toLocaleLowerCase("da-DK") ?? "";
}

export function isProjectAtLocation(
  project: Pick<ClimbingProject, "location" | "placeSlug">,
  location: { name: string; placeSlug?: string; slug?: string },
) {
  const locationSlug = location.placeSlug ?? location.slug;
  if (project.placeSlug && locationSlug) {
    return normalized(project.placeSlug) === normalized(locationSlug);
  }
  return normalized(project.location) === normalized(location.name);
}
