import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EditProfileModal } from "./EditProfileModal";
const user = { id: "user-1", name: "Test Klatrer", username: "testklatrer", initials: "TK", location: "Aarhus", avatar: "/api/profile/user-1/media/old-avatar", coverImage: "/api/profile/user-1/media/old-cover" };
describe("EditProfileModal", () => {
  afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
  it("vælger nye billeder og sender begge filer til profilens API", async () => {
    const actor = userEvent.setup();
    vi.stubGlobal("URL", class extends URL { static createObjectURL = vi.fn(() => "blob:preview"); static revokeObjectURL = vi.fn(); });
    const updated = { ...user, avatar: "/new-avatar", coverImage: "/new-cover" };
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ user: updated }), { status: 200 }));
    const onSaved = vi.fn();
    render(<EditProfileModal user={user} onClose={vi.fn()} onSaved={onSaved} />);
    const avatar = new File(["avatar"], "profil.png", { type: "image/png" });
    const cover = new File(["cover"], "baggrund.png", { type: "image/png" });
    await actor.upload(screen.getByLabelText("Profilbillede", { exact: true }), avatar);
    await actor.upload(screen.getByLabelText("Baggrundsbillede", { exact: true }), cover);
    expect(screen.getByAltText("Forhåndsvisning af profilbillede")).toHaveAttribute("src", "blob:preview");
    expect(screen.getByAltText("Forhåndsvisning af baggrundsbillede")).toHaveAttribute("src", "blob:preview");
    await actor.click(screen.getByRole("button", { name: "Gem profil" }));
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(updated));
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/profile"); expect(init?.method).toBe("PATCH");
    const body = init?.body as FormData;
    for (const [field, original] of [["avatar", avatar], ["cover", cover]] as const) {
      const submitted = body.get(field) as File;
      expect(submitted).toBeInstanceOf(File);
      expect(submitted.name).toBe(original.name);
      expect(submitted.type).toBe(original.type);
      expect(submitted.size).toBe(original.size);
      const read = (file: File) => new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
      expect(await read(submitted)).toBe(await read(original));
    }
  });
  it("viser uploadfejl og holder redigeringen åben", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ error: "Billedlageret er utilgængeligt." }), { status: 503 }));
    const onSaved = vi.fn();
    render(<EditProfileModal user={user} onClose={vi.fn()} onSaved={onSaved} />);
    await userEvent.click(screen.getByRole("button", { name: "Gem profil" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Billedlageret er utilgængeligt.");
    expect(screen.getByRole("dialog")).toBeVisible(); expect(onSaved).not.toHaveBeenCalled();
  });
});
