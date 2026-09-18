import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CopenhagenSouthMap } from "./CopenhagenSouthMap";
import { GymMap } from "./GymMap";
import { copenhagenSouthAreas } from "./copenhagen-south";

describe("Vægkort", () => {
  it("viser farvede projektprikker, samler fælles problemer og kan åbne projektet", async () => {
    const user = userEvent.setup();
    const project = { id: "marker-1", name: "Grøn balance", location: "Sydhavn", grade: "6A" as const, colorGrade: "Grøn" as const, status: "Ny" as const, progress: 10, attempts: 3, lastAttempt: "I dag", note: "", visible: true, mapProblemId: "shared-green-1", mapPlacement: { areaId: "skibet-left-upper", x: 38, y: 40 }, owner: { id: "u1", name: "Korttest Alma", username: "alma", initials: "KA" } };
    render(<CopenhagenSouthMap projects={[project, { ...project, id: "marker-2", name: "Jonas' balance" }, { ...project, id: "removed", name: "Fjernet", removedAt: "2026-09-18", mapProblemId: "removed" }]} />);
    const map = screen.getByRole("group", { name: /Vægkort over/ });
    expect(within(map).queryByRole("button", { name: /Jonas' balance/ })).not.toBeInTheDocument();
    expect(screen.queryByText("Fjernet")).not.toBeInTheDocument();
    await user.click(within(map).getByRole("button", { name: /Grøn balance/ }));
    expect(screen.getByRole("link", { name: "Åbn projekt" })).toHaveAttribute("href", "/projekter/marker-1");
    expect(screen.getByRole("link", { name: /Jonas' balance/ })).toHaveAttribute("href", "/projekter/marker-2");
  });
  afterEach(cleanup);
  it("omregner klik via SVG-koordinater og viser gemt placering", () => {
    const changed = vi.fn();
    render(<GymMap name="Sydhavn" areas={copenhagenSouthAreas} placement={{ areaId: "skibet-left-upper", x: 40, y: 60 }} onPlacementChange={changed} />);
    const map = screen.getByRole("group", { name: "Vægkort over Sydhavn" });
    expect(within(map).getByRole("button", { name: "Skibet · venstre øverst" })).toHaveAttribute("aria-pressed", "true");
    const transform = vi.fn().mockReturnValue({ x: 428.8, y: 444 });
    Object.defineProperty(map, "getScreenCTM", { value: () => ({ inverse: () => "inverse-matrix" }) });
    Object.defineProperty(map, "createSVGPoint", { value: () => ({ x: 0, y: 0, matrixTransform: transform }) });
    fireEvent.click(within(map).getByRole("button", { name: "Skibet · venstre øverst" }), { clientX: 200, clientY: 300 });
    expect(transform).toHaveBeenCalledWith("inverse-matrix");
    expect(changed).toHaveBeenCalledWith({ areaId: "skibet-left-upper", x: 40, y: 60 });
    fireEvent.click(screen.getByRole("button", { name: "Fjern placering" }));
    expect(changed).toHaveBeenLastCalledWith(undefined);
  });
  it("holder kort og knapper synkroniseret ved valg med mus og tastatur", async () => {
    const user = userEvent.setup();
    render(<CopenhagenSouthMap />);
    const map = screen.getByRole("group", { name: /Vægkort over/ });
    const buttons = screen.getByRole("group", { name: "Vælg væg" });
    const ship = within(map).getByRole("button", { name: "Skibet · venstre øverst" });
    await user.click(ship);
    expect(ship).toHaveAttribute("aria-pressed", "true");
    expect(within(buttons).getByRole("button", { name: "Skibet · venstre øverst" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("heading", { name: "Skibet · venstre øverst" })).toBeInTheDocument();
    const right = within(map).getByRole("button", { name: "Højre væg" });
    right.focus();
    await user.keyboard(" ");
    expect(screen.getByRole("heading", { name: "Højre væg" })).toBeInTheDocument();
    expect(ship).toHaveAttribute("aria-pressed", "false");
    await user.click(within(buttons).getByRole("button", { name: "Venstre væg · 80°" }));
    expect(within(map).getByRole("button", { name: "Venstre væg · 80°" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Vinkel: 80°")).toBeInTheDocument();
  });
});
