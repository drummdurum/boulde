import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MediaUploadModal } from "./ProjectMedia";

const project = { id: "project-media", name: "Videolinjen", location: "Kjugekull", grade: "7A" as const, attempts: 0, lastAttempt: "Aldrig", note: "", status: "Ny" as const, progress: 0, visible: true };

describe("MediaUploadModal", () => {
  afterEach(() => { vi.unstubAllGlobals(); });
  it("uploader en video direkte og bekræfter metadata bagefter", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ key: "projects/project-media/video.mp4", uploadUrl: "https://storage.test/upload" }) })
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ media: { id: "media-1" } }) });
    vi.stubGlobal("fetch", fetchMock); const onSaved = vi.fn(); const user = userEvent.setup();
    render(<MediaUploadModal project={project} onClose={() => {}} onSaved={onSaved} />);
    const video = new File([new Uint8Array([0, 0, 0, 20, 102, 116, 121, 112])], "forsøg.mp4", { type: "video/mp4" });
    await user.upload(screen.getByLabelText("Vælg video"), video);
    await user.type(screen.getByRole("textbox", { name: /Note/ }), "Hælen holdt");
    await user.click(screen.getByRole("button", { name: "Gem forsøg" }));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(fetchMock).toHaveBeenNthCalledWith(2, "https://storage.test/upload", expect.objectContaining({ method: "PUT", body: video }));
    expect(fetchMock).toHaveBeenNthCalledWith(3, "/api/projects/project-media/media", expect.objectContaining({ body: expect.stringContaining('"action":"complete"') }));
  });
});
