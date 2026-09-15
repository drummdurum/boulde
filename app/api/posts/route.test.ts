import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createUserPost: vi.fn(),
  getUserPosts: vi.fn(),
  preparePostMedia: vi.fn(),
  uploadPostMediaContent: vi.fn(),
  completePostMedia: vi.fn(),
}));

vi.mock("next/headers", () => ({ cookies: () => ({ get: () => ({ value: "session" }) }) }));
vi.mock("@/lib/auth", () => ({ SESSION_COOKIE: "session", userFromSession: () => Promise.resolve({ id: "user-1" }) }));
vi.mock("@/lib/user-data", () => ({ createUserPost: mocks.createUserPost, getUserPosts: mocks.getUserPosts }));
vi.mock("@/lib/media-service", () => ({
  preparePostMedia: mocks.preparePostMedia,
  uploadPostMediaContent: mocks.uploadPostMediaContent,
  completePostMedia: mocks.completePostMedia,
}));

import { POST } from "./route";

describe("POST /api/posts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.preparePostMedia.mockResolvedValue({ mediaId: "media-1" });
    mocks.completePostMedia.mockResolvedValue({ id: "media-1", postId: "post-id" });
    mocks.createUserPost.mockImplementation(async (_user, input) => ({ ...input }));
  });

  it("gemmer et billede i medieservicen og gemmer den permanente proxy-URL", async () => {
    const form = new FormData();
    form.set("description", "Mit opslag");
    form.set("media", new Blob([new Uint8Array([1, 2, 3])], { type: "image/png" }), "billede.png");
    mocks.completePostMedia.mockImplementation(async (_mediaId, _size) => ({ id: "media-1", postId: mocks.preparePostMedia.mock.calls[0][0].postId }));

    const response = await POST({ formData: async () => form } as Request);

    expect(response.status).toBe(201);
    expect(mocks.preparePostMedia).toHaveBeenCalledWith(expect.objectContaining({ ownerId: "user-1", contentType: "image/png", size: 3 }));
    expect(mocks.uploadPostMediaContent).toHaveBeenCalledWith("media-1", expect.any(Blob));
    const postId = mocks.preparePostMedia.mock.calls[0][0].postId;
    expect(mocks.createUserPost).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ id: postId, media: `/api/posts/${postId}/media/media-1`, isVideo: false }));
  });

  it("opretter ikke opslaget, hvis medielageret fejler", async () => {
    mocks.preparePostMedia.mockRejectedValueOnce(new Error("storage unavailable"));
    const form = new FormData();
    form.set("description", "Mit opslag");
    form.set("media", new Blob([new Uint8Array([1])], { type: "image/png" }), "billede.png");

    const response = await POST({ formData: async () => form } as Request);

    expect(response.status).toBe(503);
    expect(mocks.createUserPost).not.toHaveBeenCalled();
  });
});
