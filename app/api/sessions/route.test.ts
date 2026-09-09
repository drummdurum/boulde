import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClimbingSession: vi.fn(),
  getUserProjects: vi.fn(),
  getUserSessions: vi.fn(),
  getConnectedUsers: vi.fn(),
  getMailRecipients: vi.fn(),
  canInviteUser: vi.fn(),
}));

vi.mock("next/headers", () => ({ cookies: () => ({ get: () => ({ value: "session" }) }) }));
vi.mock("@/lib/auth", () => ({ SESSION_COOKIE: "session", userFromSession: () => Promise.resolve({ id: "host-1" }) }));
vi.mock("@/lib/user-data", () => ({
  createClimbingSession: mocks.createClimbingSession,
  getUserProjects: mocks.getUserProjects,
  getUserSessions: mocks.getUserSessions,
}));
vi.mock("@/lib/social", () => ({ getConnectedUsers: mocks.getConnectedUsers, getMailRecipients: mocks.getMailRecipients }));
vi.mock("@/lib/mail-service", () => ({ requestSessionInvitationEmail: vi.fn() }));
vi.mock("@/lib/preferences", () => ({ canInviteUser: mocks.canInviteUser }));

import { POST } from "./route";

const validInput = { title: "Aftenbouldering", date: "2099-06-12", time: "18:30", location: "Hallen" };
function request(body: unknown) {
  return new Request("http://localhost/api/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/sessions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUserProjects.mockResolvedValue([]);
    mocks.getConnectedUsers.mockResolvedValue([{ id: "connection-1" }]);
    mocks.getMailRecipients.mockResolvedValue([]);
    mocks.canInviteUser.mockResolvedValue(true);
    mocks.createClimbingSession.mockResolvedValue({ id: "session-1", ...validInput });
  });

  it("opretter en session og sender kun accepterede forbindelser videre", async () => {
    const response = await POST(request({ ...validInput, inviteeIds: ["connection-1", "connection-1"] }));
    expect(response.status).toBe(201);
    expect(mocks.createClimbingSession).toHaveBeenCalledWith("host-1", expect.objectContaining({ inviteeIds: ["connection-1"] }));
  });

  it("afviser en følger, som ikke er en accepteret forbindelse", async () => {
    const response = await POST(request({ ...validInput, inviteeIds: ["follower-1"] }));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: expect.stringContaining("accepterede forbindelser") });
    expect(mocks.canInviteUser).not.toHaveBeenCalled();
    expect(mocks.createClimbingSession).not.toHaveBeenCalled();
  });

  it("afviser ugyldige invitationer, datoer og klokkeslæt", async () => {
    for (const body of [
      { ...validInput, inviteeIds: "connection-1" },
      { ...validInput, date: "2099-02-31" },
      { ...validInput, time: "25:70" },
    ]) {
      const response = await POST(request(body));
      expect(response.status).toBe(400);
    }
    expect(mocks.createClimbingSession).not.toHaveBeenCalled();
  });

  it("respekterer modtagerens fravalg af direkte invitationer", async () => {
    mocks.canInviteUser.mockResolvedValue(false);
    const response = await POST(request({ ...validInput, inviteeIds: ["connection-1"] }));
    expect(response.status).toBe(403);
    expect(mocks.createClimbingSession).not.toHaveBeenCalled();
  });
});
