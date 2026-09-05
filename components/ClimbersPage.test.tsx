import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { SocialUser } from "@/lib/social";
import { ClimbersPage } from "./ClimbersPage";

const climber: SocialUser = { id: "other", name: "Test Klatrer", username: "test", location: "København", initials: "TK", followed: false, followerCount: 2, connectionStatus: "none" };

describe("ClimbersPage forbindelser", () => {
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

  it("sender en forbindelsesanmodning uden at følge brugeren", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ connectionStatus: "outgoing" }) });
    vi.stubGlobal("fetch", fetchMock);
    render(<ClimbersPage initialUsers={[climber]} />);

    await userEvent.click(screen.getByRole("button", { name: "Opret forbindelse med Test Klatrer" }));

    expect(await screen.findByRole("button", { name: "Annullér forbindelsesanmodning til Test Klatrer" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Følg Test Klatrer" })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/users/other/connection", expect.objectContaining({ method: "POST" }));
  });

  it("kan acceptere en indgående anmodning", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ connectionStatus: "connected" }) });
    vi.stubGlobal("fetch", fetchMock);
    render(<ClimbersPage initialUsers={[{ ...climber, connectionStatus: "incoming" }]} />);

    await userEvent.click(screen.getByRole("button", { name: "Acceptér forbindelse med Test Klatrer" }));

    expect(await screen.findByRole("button", { name: "Fjern forbindelse med Test Klatrer" })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/users/other/connection", expect.objectContaining({ method: "PATCH", body: JSON.stringify({ action: "accept" }) }));
  });

  it("kan afvise en indgående anmodning", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ connectionStatus: "none" }) });
    vi.stubGlobal("fetch", fetchMock);
    render(<ClimbersPage initialUsers={[{ ...climber, connectionStatus: "incoming" }]} />);

    await userEvent.click(screen.getByRole("button", { name: "Afvis forbindelse med Test Klatrer" }));

    expect(await screen.findByRole("button", { name: "Opret forbindelse med Test Klatrer" })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/users/other/connection", expect.objectContaining({
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reject" }),
    }));
  });

  it("kan annullere en udgående anmodning", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ connectionStatus: "none" }) });
    vi.stubGlobal("fetch", fetchMock);
    render(<ClimbersPage initialUsers={[{ ...climber, connectionStatus: "outgoing" }]} />);

    await userEvent.click(screen.getByRole("button", { name: "Annullér forbindelsesanmodning til Test Klatrer" }));

    expect(await screen.findByRole("button", { name: "Opret forbindelse med Test Klatrer" })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/users/other/connection", expect.objectContaining({ method: "DELETE" }));
  });

  it("kan fjerne en eksisterende forbindelse", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ connectionStatus: "none" }) });
    vi.stubGlobal("fetch", fetchMock);
    render(<ClimbersPage initialUsers={[{ ...climber, connectionStatus: "connected" }]} />);

    await userEvent.click(screen.getByRole("button", { name: "Fjern forbindelse med Test Klatrer" }));

    expect(await screen.findByRole("button", { name: "Opret forbindelse med Test Klatrer" })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/users/other/connection", expect.objectContaining({ method: "DELETE" }));
  });

  it("viser API-fejlen og bevarer forbindelsesstatus når handlingen fejler", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Du kan ikke sende denne anmodning." }),
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<ClimbersPage initialUsers={[climber]} />);

    await userEvent.click(screen.getByRole("button", { name: "Opret forbindelse med Test Klatrer" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Du kan ikke sende denne anmodning.");
    expect(screen.getByRole("button", { name: "Opret forbindelse med Test Klatrer" })).toBeEnabled();
    expect(screen.queryByRole("button", { name: "Annullér forbindelsesanmodning til Test Klatrer" })).not.toBeInTheDocument();
  });
});
