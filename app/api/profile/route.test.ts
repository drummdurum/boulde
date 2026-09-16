import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ userFromSession: vi.fn(), updateUserProfile: vi.fn(), uploadProfileImage: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: () => ({ get: () => ({ value: "session" }) }) }));
vi.mock("@/lib/auth", () => ({ SESSION_COOKIE: "session", userFromSession: mocks.userFromSession, updateUserProfile: mocks.updateUserProfile }));
vi.mock("@/lib/media-service", () => ({ uploadProfileImage: mocks.uploadProfileImage }));
import { PATCH } from "./route";

describe("profilens billeder", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.userFromSession.mockResolvedValue({ id: "user-1" });
    mocks.uploadProfileImage.mockImplementation(async (_id, _file, kind) => `/api/profile/user-1/media/${kind}-new`);
    mocks.updateUserProfile.mockImplementation(async (_id, input) => input);
  });
  function request(files = true) {
    const form = new FormData();
    form.set("name", "Test Klatrer"); form.set("username", "testklatrer");
    form.set("location", "Aarhus"); form.set("bio", "Jeg elsker bouldering");
    if (files) {
      form.set("avatar", new Blob([new Uint8Array([1, 2])], { type: "image/png" }), "profil.png");
      form.set("cover", new Blob([new Uint8Array([3, 4])], { type: "image/png" }), "baggrund.png");
    }
    return { form, request: { formData: async () => form } as Request };
  }
  it("uploader profilbillede og baggrundsbillede og gemmer deres stier", async () => {
    expect((await PATCH(request().request)).status).toBe(200);
    expect(mocks.uploadProfileImage).toHaveBeenCalledWith("user-1", expect.any(Blob), "avatar");
    expect(mocks.uploadProfileImage).toHaveBeenCalledWith("user-1", expect.any(Blob), "cover");
    expect(mocks.updateUserProfile).toHaveBeenCalledWith("user-1", expect.objectContaining({ avatar: "/api/profile/user-1/media/avatar-new", coverImage: "/api/profile/user-1/media/cover-new", bio: "Jeg elsker bouldering" }));
  });
  it("redigerer teksten uden at overskrive eksisterende billeder", async () => {
    expect((await PATCH(request(false).request)).status).toBe(200);
    expect(mocks.uploadProfileImage).not.toHaveBeenCalled();
    expect(mocks.updateUserProfile).toHaveBeenCalledWith("user-1", expect.objectContaining({ avatar: undefined, coverImage: undefined }));
  });
  it("afviser ugyldige filer før upload", async () => {
    const input = request(); input.form.set("cover", new Blob(["text"], { type: "text/plain" }), "fil.txt");
    expect((await PATCH(input.request)).status).toBe(400);
    expect(mocks.uploadProfileImage).not.toHaveBeenCalled();
    expect(mocks.updateUserProfile).not.toHaveBeenCalled();
  });
  it("gemmer ikke profilen hvis billedlageret fejler", async () => {
    mocks.uploadProfileImage.mockRejectedValueOnce(new Error("storage unavailable"));
    expect((await PATCH(request().request)).status).toBe(503);
    expect(mocks.updateUserProfile).not.toHaveBeenCalled();
  });
  it("kræver login", async () => {
    mocks.userFromSession.mockResolvedValue(null);
    expect((await PATCH(request().request)).status).toBe(401);
    expect(mocks.uploadProfileImage).not.toHaveBeenCalled();
  });
});
