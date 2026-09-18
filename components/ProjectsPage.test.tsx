import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
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
  it("vælger hallens kort, sender placeringen og rydder den ved skift af hal", async () => {
    const request = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ media: [], problems: [] }), text: async () => JSON.stringify({ project: { ...project, id: "created-project" } }) });
    vi.stubGlobal("fetch", request);
    const user = userEvent.setup();
    render(<ProjectsPage initialProjects={[project]} />);
    await user.click(screen.getAllByRole("button", { name: "Nyt projekt" })[0]);
    const hall = screen.getByLabelText(/Sted/);
    await user.selectOptions(hall, "gym-6");
    const walls = screen.getByRole("group", { name: "Vælg væg" });
    await user.click(within(walls).getByRole("button", { name: "Skibet · venstre øverst" }));
    expect(screen.getByLabelText("Projektets placering")).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText(/Problem på væggen/), "1");
    await user.type(screen.getByLabelText("Projektnavn"), "Ny linje");
    await user.click(screen.getByRole("button", { name: "Opret projekt" }));
    const sent = request.mock.calls.find(call => call[1]?.method === "POST")![1].body as FormData;
    expect(sent.get("placeId")).toBe("gym-6");
    expect(sent.get("mapArea")).toBe("skibet-left-upper");
    expect(Number(sent.get("mapX"))).toBeCloseTo(387 / 1072 * 100);
    await user.click(screen.getAllByRole("button", { name: "Nyt projekt" })[0]);
    await user.selectOptions(screen.getByLabelText(/Sted/), "gym-6");
    await user.click(within(screen.getByRole("group", { name: "Vælg væg" })).getByRole("button", { name: "Skibet · venstre øverst" }));
    await user.selectOptions(screen.getByLabelText(/Sted/), "gym-1");
    expect(screen.queryByLabelText("Projektets placering")).not.toBeInTheDocument();
    expect(screen.getByText(/Der er endnu ikke et vægkort/)).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText(/Sted/), "gym-6");
    expect(screen.queryByLabelText("Projektets placering")).not.toBeInTheDocument();
  });
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

  it("synkroniserer 100 procent og gennemført i formularen", async () => {
    const user = userEvent.setup();
    render(<ProjectsPage initialProjects={[project]} />);
    await user.click(screen.getAllByRole("button", { name: "Nyt projekt" })[0]);
    const progress = screen.getByRole("slider", {
      name: "Fremskridt i procent",
    });
    const status = screen.getByLabelText("Status");

    fireEvent.change(progress, { target: { value: "100" } });
    expect(status).toHaveValue("Gennemført");

    fireEvent.change(progress, { target: { value: "50" } });
    await user.selectOptions(status, "Gennemført");
    expect(progress).toHaveValue("100");
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
      screen.getByText("Mine forbindelser"),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Opret dit første projekt" }),
    );
    expect(
      screen.getAllByRole("dialog", { name: "Opret projekt" }),
    ).not.toHaveLength(0);
  });

  it("viser forbindelser og aktive linjer over det valgte projekt", () => {
    const { container } = render(
      <ProjectsPage
        initialProjects={[project]}
        connectionProjects={[
          {
            ...project,
            id: "connection-project",
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
      Array.from(container.querySelectorAll("[data-projects-section]")).map(
        (section) => section.getAttribute("data-projects-section"),
      ),
    ).toEqual(["connections", "active-lines", "selected-project"]);
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
              image: "/api/projects/project-1/media/bbbbbbbbbbbbbbbbbbbbbbbb",
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
            image: "/api/projects/project-1/media/aaaaaaaaaaaaaaaaaaaaaaaa",
          },
        ]}
      />,
    );
    expect(
      screen.getAllByAltText("Projektet Testlinjen ved Kjugekull")[0],
    ).toHaveAttribute(
      "src",
      "/api/projects/project-1/media/aaaaaaaaaaaaaaaaaaaaaaaa",
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
    expect(screen.queryByText(/Fik fat i slutgrebet/)).not.toBeInTheDocument();
  });
});
