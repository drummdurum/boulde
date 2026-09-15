import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ClimbingProject, ClimbingSession, User } from "@/types";
import { Dashboard } from "./Dashboard";

const user: User = { id: "invitee", name: "Ida Invitee", username: "ida", initials: "II", location: "Aarhus" };
const invitation: ClimbingSession = {
  id: "session-1", shareId: "share-1", title: "Tirsdagstræning", date: "2099-06-12", time: "18:30", location: "Hallen",
  host: { id: "host", name: "Helle Host", initials: "HH" }, participants: [{ id: "host", name: "Helle Host", initials: "HH" }],
  viewerRole: "invitee", invitationStatus: "pending", createdAt: "2099-06-01T10:00:00Z",
};

describe("Dashboard sessioninvitationer", () => {
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

  it("viser invitationen med sessionlink og fjerner notifikationen efter accept", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ sessions: [invitation] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ session: { ...invitation, invitationStatus: "accepted", invitationReadAt: "2099-06-01T10:05:00Z" } }) });
    vi.stubGlobal("fetch", fetchMock);
    render(<Dashboard user={user} initialPosts={[]} initialProjects={[]} invitations={[invitation]} />);

    expect(screen.getByRole("heading", { name: "Sessioninvitationer" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Åbn" })).toHaveAttribute("href", "/session/share-1");
    await userEvent.click(screen.getByRole("button", { name: "Acceptér" }));

    await waitFor(() => expect(screen.queryByRole("heading", { name: "Sessioninvitationer" })).not.toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledWith("/api/sessions/share-1/invitation", expect.objectContaining({ body: JSON.stringify({ status: "accepted" }) }));
  });

  it("tæller gennemførte klatringer og unikke besøgte steder", () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ sessions: [] }) }));
    const projects: ClimbingProject[] = [
      { id: "p1", name: "Blå", location: "Boulders Aarhus", grade: "6A", attempts: 3, lastAttempt: "2026-09-01", note: "", status: "Gennemført", progress: 100, visible: false },
      { id: "p2", name: "Rød", location: "Boulders Aarhus", grade: "6B", attempts: 1, lastAttempt: "2026-09-02", note: "", status: "Arbejder på den", progress: 40, visible: false },
      { id: "p3", name: "Grøn", location: "Boulders Sydhavn", grade: "5+", attempts: 0, lastAttempt: "Ikke forsøgt endnu", note: "", status: "Gennemført", progress: 100, visible: false },
      { id: "p4", name: "Gul", location: "Odense Boulders", grade: "6A", attempts: 0, lastAttempt: "Ikke forsøgt endnu", note: "", status: "Ny", progress: 0, visible: false },
    ];
    render(<Dashboard user={user} initialPosts={[]} initialProjects={projects} />);

    expect(screen.getByText("Gennemførte klatringer").closest("article")).toHaveTextContent("2");
    expect(screen.getByText("Klatresteder besøgt").closest("article")).toHaveTextContent("2");
    expect(screen.getByRole("link", { name: "Klatresteder" })).toHaveAttribute("href", "/klatresteder");
  });
});
