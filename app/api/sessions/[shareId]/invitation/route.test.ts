import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ respondToSessionInvitation: vi.fn(), inviteConnectionsToSession: vi.fn(), getSharedSession: vi.fn(), getConnectedUsers: vi.fn(), getMailRecipients: vi.fn(), canInviteUser: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: () => ({ get: () => ({ value: "session" }) }) }));
vi.mock("@/lib/auth", () => ({ SESSION_COOKIE: "session", userFromSession: () => Promise.resolve({ id: "invitee-1" }) }));
vi.mock("@/lib/user-data", () => ({ respondToSessionInvitation: mocks.respondToSessionInvitation, inviteConnectionsToSession: mocks.inviteConnectionsToSession, getSharedSession: mocks.getSharedSession }));
vi.mock("@/lib/social", () => ({ getConnectedUsers: mocks.getConnectedUsers, getMailRecipients: mocks.getMailRecipients }));
vi.mock("@/lib/preferences", () => ({ canInviteUser: mocks.canInviteUser }));
vi.mock("@/lib/mail-service", () => ({ requestSessionInvitationEmail: vi.fn() }));

import { PATCH, POST } from "./route";

describe("PATCH /api/sessions/:shareId/invitation", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.getMailRecipients.mockResolvedValue([]); mocks.getSharedSession.mockResolvedValue(null); });

  it("accepterer en invitation for den aktuelle modtager", async () => {
    mocks.respondToSessionInvitation.mockResolvedValue({ id: "session-1", invitationStatus: "accepted", invitationReadAt: "2099-01-01T10:00:00Z" });
    const response = await PATCH(new Request("http://localhost", { method: "PATCH", body: JSON.stringify({ status: "accepted" }) }), { params: { shareId: "share-1" } });
    expect(response.status).toBe(200);
    expect(mocks.respondToSessionInvitation).toHaveBeenCalledWith("invitee-1", "share-1", "accepted");
    expect(await response.json()).toMatchObject({ session: { invitationStatus: "accepted", invitationReadAt: expect.any(String) } });
  });

  it("afviser ukendte svar uden at ændre invitationen", async () => {
    const response = await PATCH(new Request("http://localhost", { method: "PATCH", body: JSON.stringify({ status: "maybe" }) }), { params: { shareId: "share-1" } });
    expect(response.status).toBe(400);
    expect(mocks.respondToSessionInvitation).not.toHaveBeenCalled();
  });

  it("lader værten invitere en accepteret forbindelse til en eksisterende session", async () => {
    mocks.getConnectedUsers.mockResolvedValue([{ id: "friend-1" }]);
    mocks.canInviteUser.mockResolvedValue(true);
    mocks.inviteConnectionsToSession.mockResolvedValue(true);
    const response = await POST(new Request("http://localhost", { method: "POST", body: JSON.stringify({ inviteeIds: ["friend-1"] }) }), { params: { shareId: "share-1" } });
    expect(response.status).toBe(200);
    expect(mocks.inviteConnectionsToSession).toHaveBeenCalledWith("invitee-1", "share-1", ["friend-1"]);
  });

  it("afviser invitation af en bruger, der ikke er en forbindelse", async () => {
    mocks.getConnectedUsers.mockResolvedValue([]);
    const response = await POST(new Request("http://localhost", { method: "POST", body: JSON.stringify({ inviteeIds: ["follower-1"] }) }), { params: { shareId: "share-1" } });
    expect(response.status).toBe(400);
    expect(mocks.inviteConnectionsToSession).not.toHaveBeenCalled();
  });
});
