import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ClimbingSession, SessionInvitee } from "@/types";
import { SessionsPage } from "./SessionsPage";

const host = { id: "host", name: "Helle Host", initials: "HH" };
const connection: SessionInvitee = { id: "friend", name: "Freja Friend", username: "freja", initials: "FF" };
const pendingSession: ClimbingSession = {
  id: "session-1",
  shareId: "share-1",
  title: "Aftenbouldering",
  date: "2099-06-12",
  time: "18:30",
  location: "Boulders Sydhavn",
  host,
  participants: [host],
  viewerRole: "invitee",
  invitationStatus: "pending",
  createdAt: "2099-06-01T10:00:00.000Z",
};

describe("SessionsPage invitationer", () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it("sender de valgte forbindelsers id'er, når en session oprettes", async () => {
    const createdSession = { ...pendingSession, id: "created", shareId: "created-share", viewerRole: "host" as const, invitationStatus: undefined };
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ session: createdSession }) });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<SessionsPage initialSessions={[]} projects={[]} connections={[connection]} />);

    await user.click(screen.getByRole("button", { name: "Ny session" }));
    await user.type(screen.getByLabelText("Titel"), "Aftenbouldering");
    await user.type(screen.getByLabelText("Dato"), "2099-06-12");
    await user.type(screen.getByLabelText("Tid"), "18:30");
    await user.type(screen.getByLabelText("Sted"), "Boulders Sydhavn");
    await user.click(screen.getByRole("checkbox", { name: /Freja Friend/ }));
    await user.click(screen.getByRole("button", { name: "Opret session og invitér" }));

    expect(fetchMock).toHaveBeenCalledOnce();
    const [, options] = fetchMock.mock.calls[0];
    expect(fetchMock).toHaveBeenCalledWith("/api/sessions", expect.objectContaining({ method: "POST" }));
    expect(JSON.parse(options.body)).toMatchObject({
      title: "Aftenbouldering",
      date: "2099-06-12",
      time: "18:30",
      location: "Boulders Sydhavn",
      inviteeIds: ["friend"],
    });
    expect(await screen.findByRole("heading", { name: "Aftenbouldering" })).toBeInTheDocument();
  });

  it("opdaterer sessionen efter accept af en afventende invitation", async () => {
    const accepted = { ...pendingSession, invitationStatus: "accepted" as const, participants: [...pendingSession.participants, { id: "viewer", name: "Viggo Viewer", initials: "VV" }] };
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ session: accepted }) });
    vi.stubGlobal("fetch", fetchMock);
    render(<SessionsPage initialSessions={[pendingSession]} projects={[]} connections={[]} />);

    await userEvent.click(screen.getByRole("button", { name: "Acceptér" }));

    expect(fetchMock).toHaveBeenCalledWith("/api/sessions/share-1/invitation", expect.objectContaining({ method: "PATCH", body: JSON.stringify({ status: "accepted" }) }));
    expect(await screen.findByText("2 med")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Acceptér" })).not.toBeInTheDocument();
  });

  it("viser afslået status efter afslag på en afventende invitation", async () => {
    const declined = { ...pendingSession, invitationStatus: "declined" as const };
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ session: declined }) });
    vi.stubGlobal("fetch", fetchMock);
    render(<SessionsPage initialSessions={[pendingSession]} projects={[]} connections={[]} />);

    await userEvent.click(screen.getByRole("button", { name: "Afslå" }));

    expect(fetchMock).toHaveBeenCalledWith("/api/sessions/share-1/invitation", expect.objectContaining({ method: "PATCH", body: JSON.stringify({ status: "declined" }) }));
    expect(await screen.findByText("Du har afslået invitationen")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Afslå" })).not.toBeInTheDocument();
  });

  it("viser stadig oprettelsesflowet uden forbindelser", async () => {
    render(<SessionsPage initialSessions={[]} projects={[]} connections={[]} />);

    await userEvent.click(screen.getByRole("button", { name: "Opret session" }));

    expect(screen.getByRole("dialog", { name: "Ny session" })).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: /Invitér forbindelser/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Opret session og invitér" })).toBeInTheDocument();
  });
});
