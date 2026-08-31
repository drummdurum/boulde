import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProjectsPage } from "./ProjectsPage";

const project = { id: "project-test", name: "Testlinjen", location: "Kjugekull", grade: "7A" as const, attempts: 0, lastAttempt: "Ikke forsøgt endnu", note: "", status: "Ny" as const, progress: 0, visible: false };

describe("ProjectsPage", () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it("åbner upload af billede og video", async () => {
    const user = userEvent.setup();
    render(<ProjectsPage initialProjects={[project]} />);
    await user.click(screen.getAllByRole("button", { name: "Nyt forsøg" })[0]);
    expect(screen.getByRole("dialog", { name: "Nyt forsøg" })).toBeInTheDocument();
    expect(screen.getByLabelText("Vælg billede")).toHaveAttribute("accept", "image/jpeg,image/png,image/webp");
    expect(screen.getByLabelText("Vælg video")).toHaveAttribute("accept", "video/mp4,video/webm");
    expect(screen.getByRole("button", { name: "Gem forsøg" })).toBeDisabled();
  });

  it("kan gøre et privat projekt synligt for forbindelser", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ project: { ...project, visible: true } }) }));
    const user = userEvent.setup();
    render(<ProjectsPage initialProjects={[project]} />);
    await user.click(screen.getAllByRole("button", { name: "Gør synligt" })[0]);
    expect(await screen.findAllByText("Synligt for forbindelser")).not.toHaveLength(0);
    expect(fetch).toHaveBeenCalledWith("/api/projects", expect.objectContaining({ method: "PATCH" }));
  });

  it("starter projektoprettelsen med kamera eller billedvalg", async () => {
    const user = userEvent.setup();
    render(<ProjectsPage initialProjects={[project]} />);
    await user.click(screen.getAllByRole("button", { name: "Nyt projekt" })[0]);
    expect(screen.getByLabelText("Tag projektbillede")).toHaveAttribute("capture", "environment");
    expect(screen.getByLabelText("Vælg projektbillede")).toHaveAttribute("accept", "image/*");
  });
});
