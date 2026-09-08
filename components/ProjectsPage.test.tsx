import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProjectsPage } from "./ProjectsPage";

const project = {
  id: "project-test",
  name: "Testlinjen",
  location: "Kjugekull",
  grade: "7A" as const,
  attempts: 0,
  lastAttempt: "Ikke forsøgt endnu",
  note: "",
  status: "Ny" as const,
  progress: 0,
  visible: false,
};

describe("ProjectsPage", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("åbner upload af billede og video", async () => {
    const user = userEvent.setup();
    render(<ProjectsPage initialProjects={[project]} />);
    await user.click(screen.getAllByRole("button", { name: "Nyt forsøg" })[0]);
    expect(
      screen.getByRole("dialog", { name: "Nyt forsøg" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Vælg billede")).toHaveAttribute(
      "accept",
      "image/jpeg,image/png,image/webp",
    );
    expect(screen.getByLabelText("Vælg video")).toHaveAttribute(
      "accept",
      "video/mp4,video/webm",
    );
    expect(screen.getByRole("button", { name: "Gem forsøg" })).toBeEnabled();
  });

  it("kan gøre et privat projekt synligt for forbindelser", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ project: { ...project, visible: true } }),
      }),
    );
    const user = userEvent.setup();
    render(<ProjectsPage initialProjects={[project]} />);
    await user.click(screen.getAllByRole("button", { name: "Gør synligt" })[0]);
    expect(
      await screen.findAllByText("Synligt for forbindelser"),
    ).not.toHaveLength(0);
    expect(fetch).toHaveBeenCalledWith(
      "/api/projects",
      expect.objectContaining({ method: "PATCH" }),
    );
  });

  it("starter projektoprettelsen med kamera eller billedvalg", async () => {
    const user = userEvent.setup();
    render(<ProjectsPage initialProjects={[project]} />);
    await user.click(screen.getAllByRole("button", { name: "Nyt projekt" })[0]);
    expect(screen.getByLabelText("Tag projektbillede")).toHaveAttribute(
      "capture",
      "environment",
    );
    expect(screen.getByLabelText("Vælg projektbillede")).toHaveAttribute(
      "accept",
      "image/*",
    );
    expect(screen.getByLabelText("Fremskridt i procent")).toHaveValue("0");
    expect(screen.getByLabelText("Status")).toHaveValue("Ny");
  });

  it("bevarer opret-knappen når kun fulgte projekter vises", async () => {
    const user = userEvent.setup();
    render(
      <ProjectsPage
        connectionProjects={[
          {
            ...project,
            id: "followed",
            visible: true,
            owner: {
              id: "other",
              name: "Anden Klatrer",
              username: "anden",
              initials: "AK",
            },
          },
        ]}
      />,
    );
    expect(
      screen.getByText("Projekter fra dem, du følger"),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Opret dit første projekt" }),
    );
    expect(
      screen.getAllByRole("dialog", { name: "Opret projekt" }),
    ).not.toHaveLength(0);
  });

  it("viser projektbilledet og opdaterer fremskridt, status og note", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () =>
          JSON.stringify({
            project: {
              ...project,
              image: "/api/uploads/projects/bbbbbbbbbbbbbbbbbbbbbbbb.png",
              progress: 65,
              status: "Tæt på",
              note: "Har fat i slutgrebet",
            },
          }),
      }),
    );
    const user = userEvent.setup();
    render(
      <ProjectsPage
        initialProjects={[
          {
            ...project,
            image: "/api/uploads/projects/aaaaaaaaaaaaaaaaaaaaaaaa.png",
          },
        ]}
      />,
    );
    expect(
      screen.getAllByAltText("Projektet Testlinjen ved Kjugekull")[0],
    ).toHaveAttribute(
      "src",
      "/api/uploads/projects/aaaaaaaaaaaaaaaaaaaaaaaa.png",
    );
    await user.click(
      screen.getAllByRole("button", { name: "Rediger projekt" })[0],
    );
    expect(
      screen.getByRole("dialog", { name: "Rediger projekt" }),
    ).toBeInTheDocument();
    fireEvent.change(
      screen.getByRole("slider", { name: "Fremskridt i procent" }),
      { target: { value: "65" } },
    );
    await user.selectOptions(screen.getByLabelText("Status"), "Tæt på");
    await user.clear(screen.getByLabelText("Note"));
    await user.type(screen.getByLabelText("Note"), "Har fat i slutgrebet");
    await user.click(screen.getByRole("button", { name: "Gem ændringer" }));
    expect(await screen.findAllByText("65%")).not.toHaveLength(0);
    expect(fetch).toHaveBeenCalledWith(
      "/api/projects",
      expect.objectContaining({ method: "PATCH", body: expect.any(FormData) }),
    );
  });

  it("viser ikke opdigtede forsøgsnoter fra demo-data", () => {
    render(<ProjectsPage initialProjects={[{ ...project, attempts: 12 }]} />);
    expect(screen.queryByText("Forsøg #12")).not.toBeInTheDocument();
    expect(
      screen.getAllByText("Dine gemte billeder og videoer vises nedenfor."),
    ).not.toHaveLength(0);
  });
});
