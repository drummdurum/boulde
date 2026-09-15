import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ClimbingSession } from "@/types";
import { SharedSessionPage } from "./SharedSessionPage";

const host = { id: "host", name: "Helle Host", initials: "HH" };
const session: ClimbingSession = {
  id: "session-1", shareId: "share-1", title: "Aftenbouldering",
  date: "2099-06-12", time: "18:30", location: "Boulders Sydhavn",
  host, participants: [host], createdAt: "2099-06-01T10:00:00.000Z",
};
const hiddenDescriptor = Object.getOwnPropertyDescriptor(document, "hidden");

describe("SharedSessionPage polling", () => {
  afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); if (hiddenDescriptor) Object.defineProperty(document, "hidden", hiddenDescriptor); });

  it("pauser i en skjult fane og opdaterer straks, når fanen bliver synlig", async () => {
    vi.useFakeTimers();
    let hidden = false;
    Object.defineProperty(document, "hidden", { configurable: true, get: () => hidden });
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ session }) });
    vi.stubGlobal("fetch", fetchMock);
    render(<SharedSessionPage initialSession={session} />);

    await act(async () => { await vi.advanceTimersByTimeAsync(3000); });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    hidden = true;
    fireEvent(document, new Event("visibilitychange"));
    await act(async () => { await vi.advanceTimersByTimeAsync(9000); });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    hidden = false;
    await act(async () => { fireEvent(document, new Event("visibilitychange")); await Promise.resolve(); });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("lader værten invitere en forbindelse fra sessionsiden", async () => {
    const hostSession = { ...session, viewerRole: "host" as const };
    const fetchMock = vi.fn().mockImplementation(async (_url: string, options?: RequestInit) => options?.method === "POST"
      ? { ok: true, json: async () => ({ invited: 1 }) }
      : { ok: true, json: async () => ({ session: hostSession }) });
    vi.stubGlobal("fetch", fetchMock);
    render(<SharedSessionPage initialSession={hostSession} connections={[{ id: "friend-1", name: "Freja Friend", username: "freja", initials: "FF" }]} />);

    await userEvent.click(screen.getByRole("checkbox", { name: /Freja Friend/ }));
    await userEvent.click(screen.getByRole("button", { name: "Send invitation" }));

    expect(fetchMock).toHaveBeenCalledWith("/api/sessions/share-1/invitation", expect.objectContaining({ method: "POST", body: JSON.stringify({ inviteeIds: ["friend-1"] }) }));
    expect(await screen.findByText("1 invitation sendt.")).toBeInTheDocument();
    expect(screen.queryByText("Vil du med?")).not.toBeInTheDocument();
  });

  it("lader deltagere åbne et synligt projekt fra sessionen", () => {
    render(<SharedSessionPage initialSession={{ ...session, project: { id: "project-1", name: "Cruxet", grade: "7A", visible: true } }} />);

    expect(screen.getByRole("link", { name: /Offentligt projekt · åbn.*Cruxet · 7A/i })).toHaveAttribute("href", "/projekter/project-1");
  });
});
