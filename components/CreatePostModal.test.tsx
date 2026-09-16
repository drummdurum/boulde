import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CreatePostModal } from "./CreatePostModal";
describe("CreatePostModal", () => {
  afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
  it("sender det valgte billede sammen med opslagets tekst", async () => {
    const actor = userEvent.setup();
    const onCreated = vi.fn();
    const onClose = vi.fn();
    const post = { id: "post-image", description: "Mit billede" };
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ post }), { status: 201 }));
    vi.stubGlobal("URL", class extends URL {
      static createObjectURL = vi.fn(() => "blob:post-preview");
      static revokeObjectURL = vi.fn();
    });
    render(<CreatePostModal open onClose={onClose} onCreated={onCreated} />);
    const file = new File([new Uint8Array([137, 80, 78, 71])], "opslag.png", { type: "image/png" });
    await actor.type(screen.getByLabelText("Hvad vil du dele?"), "Mit billede");
    await actor.upload(screen.getByLabelText("Vælg billede til opslag"), file);
    expect(screen.getByAltText("Forhåndsvisning af medie")).toHaveAttribute("src", "blob:post-preview");
    await actor.click(screen.getByRole("button", { name: "Gem opslag" }));
    await waitFor(() => expect(onCreated).toHaveBeenCalledWith(post));
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/posts");
    expect(init?.method).toBe("POST");
    const body = init?.body as FormData;
    expect(body.get("description")).toBe("Mit billede");
    expect(body.get("media")).toBe(file);
    expect(onClose).toHaveBeenCalledOnce();
  });
  it("kan lukkes med Escape", async () => { const onClose = vi.fn(); render(<CreatePostModal open onClose={onClose} />); expect(screen.getByRole("dialog")).toBeInTheDocument(); await userEvent.keyboard("{Escape}"); expect(onClose).toHaveBeenCalledOnce(); });
  it("opretter frie opslag uden krav om klatredata", () => {
    render(<CreatePostModal open onClose={vi.fn()} />);
    expect(screen.getByLabelText("Hvad vil du dele?")).toBeRequired();
    expect(screen.queryByLabelText("Rute")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Grade")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Vælg billede til opslag")).toBeInTheDocument();
    expect(screen.getByLabelText("Vælg video til opslag")).toBeInTheDocument();
  });
});
