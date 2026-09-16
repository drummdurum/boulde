import "server-only";
import type { ProjectMedia } from "@/types";

const serviceUrl = (process.env.MEDIA_SERVICE_URL || "http://localhost:3102").trim().replace(/\/+$/, "");
const apiKey = process.env.MEDIA_SERVICE_API_KEY || "local-media-development-key";

type ServiceMedia = Omit<ProjectMedia, "projectId"> & { resourceId: string };

async function prepareMedia(input: { ownerId: string; resourceType: "project" | "post"; resourceId: string; contentType: string; size: number; note?: string }) {
  return mediaRequest("/media/uploads", { method: "POST", body: JSON.stringify({ ...input, note: input.note || "" }) }) as Promise<{ mediaId: string; uploadUrl: string; expiresIn: number }>;
}

async function serviceMediaForProject(projectId: string): Promise<ServiceMedia[]> {
  const result = await mediaRequest(`/media?resourceType=project&resourceId=${encodeURIComponent(projectId)}`) as { media: ServiceMedia[] };
  return result.media;
}

async function mediaRequest(path: string, init?: RequestInit) {
  const response = await fetch(`${serviceUrl}${path}`, {
    ...init,
    headers: { "content-type": "application/json", "x-api-key": apiKey, ...init?.headers },
    signal: init?.signal ?? AbortSignal.timeout(5_000),
    cache: "no-store"
  });
  if (response.status === 204) return undefined;
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    throw new Error(`Media-servicen svarede med HTTP ${response.status} og ${contentType || "ukendt indholdstype"} på ${path}. Kontrollér MEDIA_SERVICE_URL, inklusive porten; endpointet skal returnere JSON.`);
  }
  let body;
  try {
    body = await response.json();
  } catch {
    throw new Error(`Media-servicen returnerede ugyldig JSON (HTTP ${response.status}) på ${path}.`);
  }
  if (!response.ok) throw new Error(body?.error || `Media-servicen svarede med HTTP ${response.status}.`);
  return body;
}

export async function prepareProjectMedia(input: { ownerId: string; projectId: string; contentType: string; size: number; note?: string }) {
  return prepareMedia({ ...input, resourceType: "project", resourceId: input.projectId });
}

export async function preparePostMedia(input: { ownerId: string; postId: string; contentType: string; size: number }) {
  return prepareMedia({ ...input, resourceType: "post", resourceId: input.postId });
}

export async function completeProjectMedia(mediaId: string, size: number) {
  const result = await mediaRequest(`/media/${encodeURIComponent(mediaId)}/complete`, { method: "POST", body: JSON.stringify({ size }) }) as { media: ServiceMedia };
  return { ...result.media, projectId: result.media.resourceId };
}

export async function uploadProjectMediaContent(mediaId: string, file: Blob) {
  await mediaRequest(`/media/${encodeURIComponent(mediaId)}/content`, {
    method: "POST",
    headers: { "content-type": file.type },
    body: file,
    signal: AbortSignal.timeout(30_000),
  });
}

export async function uploadProjectCover(ownerId: string, projectId: string, file: Blob) {
  const prepared = await prepareProjectMedia({ ownerId, projectId, contentType: file.type, size: file.size });
  await uploadProjectMediaContent(prepared.mediaId, file);
  const media = await completeProjectMedia(prepared.mediaId, file.size);
  if (media.projectId !== projectId) throw new Error("Mediet tilhører ikke projektet.");
  return `/api/projects/${encodeURIComponent(projectId)}/media/${encodeURIComponent(media.id)}`;
}

export const uploadPostMediaContent = uploadProjectMediaContent;

export async function completePostMedia(mediaId: string, size: number) {
  const result = await mediaRequest(`/media/${encodeURIComponent(mediaId)}/complete`, { method: "POST", body: JSON.stringify({ size }) }) as { media: ServiceMedia };
  return { ...result.media, postId: result.media.resourceId };
}

export async function listProjectMedia(projectId: string): Promise<ProjectMedia[]> {
  const media = await serviceMediaForProject(projectId);
  return media.map(item => ({
    ...item,
    projectId: item.resourceId,
    url: `/api/projects/${encodeURIComponent(projectId)}/media/${encodeURIComponent(item.id)}`,
  }));
}

export async function downloadProjectMedia(projectId: string, mediaId: string) {
  const media = (await serviceMediaForProject(projectId)).find(item => item.id === mediaId);
  if (!media?.url) return null;
  const response = await fetch(media.url, {
    cache: "no-store",
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`Objektlageret svarede med HTTP ${response.status}.`);
  return {
    body: await response.arrayBuffer(),
    contentType: media.contentType,
  };
}

export async function downloadPostMedia(postId: string, mediaId: string) {
  const result = await mediaRequest(`/media?resourceType=post&resourceId=${encodeURIComponent(postId)}`) as { media: ServiceMedia[] };
  const media = result.media.find(item => item.id === mediaId);
  if (!media?.url) return null;
  const response = await fetch(media.url, { cache: "no-store", signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`Objektlageret svarede med HTTP ${response.status}.`);
  return { body: await response.arrayBuffer(), contentType: media.contentType };
}
