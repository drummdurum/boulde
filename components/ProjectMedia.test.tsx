import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MediaUploadModal, ProjectMediaPanel } from "./ProjectMedia";

const project = {
  id: "project-media",
  name: "Videolinjen",
  location: "Kjugekull",
  grade: "7A" as const,
  attempts: 0,
  lastAttempt: "Aldrig",
  note: "",
  status: "Ny" as const,
  progress: 0,
  visible: true,
};

describe("MediaUploadModal", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });
  it("uploader en video gennem Boulde API'et på samme origin", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ media: { id: "media-1" } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          project: { ...project, progress: 60, status: "Tæt på" },
        }),
      });
    vi.stubGlobal("fetch", fetchMock);
    const onSaved = vi.fn();
    const user = userEvent.setup();
    render(
      <MediaUploadModal
        project={project}
        onClose={() => {}}
        onSaved={onSaved}
      />,
    );
    const video = new File(
      [new Uint8Array([0, 0, 0, 20, 102, 116, 121, 112])],
      "forsøg.mp4",
      { type: "video/mp4" },
    );
    await user.upload(screen.getByLabelText("Vælg video"), video);
    await user.type(
      screen.getByRole("textbox", { name: /Note/ }),
      "Hælen holdt",
    );
    await user.selectOptions(screen.getByLabelText("Status"), "Tæt på");
    fireEvent.change(screen.getByLabelText("Fremskridt i procent"), {
      target: { value: "60" },
    });
    await user.click(screen.getByRole("button", { name: "Gem forsøg" }));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/projects/project-media/media",
      expect.objectContaining({ method: "POST", body: expect.any(FormData) }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/projects",
      expect.objectContaining({ method: "PATCH", body: expect.any(FormData) }),
    );
    expect(fetchMock).not.toHaveBeenCalledWith(
      expect.stringMatching(/^https?:\/\//),
      expect.anything(),
    );
  });
});

describe("ProjectMediaPanel", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("udskyder hentning og dekodning af projektmedier", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          media: [
            { id: "image-1", type: "image", url: "/image.jpg", note: "Cruxet" },
            {
              id: "video-1",
              type: "video",
              url: "/video.mp4",
              note: "Forsøget",
            },
          ],
        }),
      }),
    );
    render(<ProjectMediaPanel projectId="project-media" />);

    const image = await screen.findByRole("img", { name: "Cruxet" });
    expect(image).toHaveAttribute("loading", "lazy");
    expect(image).toHaveAttribute("decoding", "async");
    const video = screen.getByLabelText("Forsøget");
    expect(video).toHaveAttribute("preload", "none");
    expect(video).toHaveAttribute("playsinline");
  });
});
