import { act, fireEvent, render } from "@testing-library/react";
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
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); if (hiddenDescriptor) Object.defineProperty(document, "hidden", hiddenDescriptor); });

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
});
