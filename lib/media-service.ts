import "server-only";
import type { ProjectMedia } from "@/types";

const serviceUrl = process.env.MEDIA_SERVICE_URL || "http://localhost:3102";
const apiKey = process.env.MEDIA_SERVICE_API_KEY || "local-media-development-key";

type ServiceMedia = Omit<ProjectMedia, "projectId"> & { resourceId: string };

async function mediaRequest(path: string, init?: RequestInit) {
  const response = await fetch(`${serviceUrl}${path}`, {
    ...init,
    headers: { "content-type": "application/json", "x-api-key": apiKey, ...init?.headers },
    signal: AbortSignal.timeout(5_000),
    cache: "no-store"
  });
  const body = response.status === 204 ? undefined : await response.json();
  if (!response.ok) throw new Error(body?.error || `Media-servicen svarede med HTTP ${response.status}.`);
  return body;
}

export async function prepareProjectMedia(input: { ownerId: string; projectId: string; contentType: string; size: number; note?: string }) {
  return mediaRequest("/media/uploads", { method: "POST", body: JSON.stringify({ ownerId: input.ownerId, resourceType: "project", resourceId: input.projectId, contentType: input.contentType, size: input.size, note: input.note || "" }) }) as Promise<{ mediaId: string; uploadUrl: string; expiresIn: number }>;
}

export async function completeProjectMedia(mediaId: string, size: number) {
  const result = await mediaRequest(`/media/${encodeURIComponent(mediaId)}/complete`, { method: "POST", body: JSON.stringify({ size }) }) as { media: ServiceMedia };
  return { ...result.media, projectId: result.media.resourceId };
}

export async function listProjectMedia(projectId: string): Promise<ProjectMedia[]> {
  const result = await mediaRequest(`/media?resourceType=project&resourceId=${encodeURIComponent(projectId)}`) as { media: ServiceMedia[] };
  return result.media.map(media => ({ ...media, projectId: media.resourceId }));
}
