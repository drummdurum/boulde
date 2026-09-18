import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ userFromSession: vi.fn(), getSharedSession: vi.fn(), getUserProjects: vi.fn(), addSessionProject: vi.fn(), updateClimbingSession: vi.fn(), getPlaces: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: () => ({ get: () => ({ value: "session" }) }) }));
vi.mock("@/lib/auth", () => ({ SESSION_COOKIE: "session", userFromSession: mocks.userFromSession }));
vi.mock("@/lib/user-data", () => ({ ...mocks, joinSharedSession: vi.fn() }));
vi.mock("@/lib/place-data", () => ({ getPlaces: mocks.getPlaces }));
import { POST } from "./projects/route";
import { PATCH } from "./route";
const context = { params: { shareId: "session-1" } };
const request = (body: object) => new Request("http://localhost/api/sessions/session-1", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
describe("sessionens projekter og redigering", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.userFromSession.mockResolvedValue({ id: "user-1" });
    mocks.getSharedSession.mockResolvedValue({ viewerRole: "invitee", location: "Hallen", projects: [] });
    mocks.getUserProjects.mockResolvedValue([{ id: "project-1", location: "Hallen", status: "Ny" }]);
    mocks.addSessionProject.mockResolvedValue({ projects: [{ id: "project-1" }] });
    mocks.getPlaces.mockResolvedValue([{ id: "hall-2", name: "Ny hal" }]);
    mocks.updateClimbingSession.mockResolvedValue({ location: "Ny hal", projects: [] });
  });
  it("lader en inviteret tilføje sit eget projekt i hallen", async () => {
    expect((await POST(request({ projectId: "project-1" }), context)).status).toBe(200);
    expect(mocks.addSessionProject).toHaveBeenCalledWith("user-1", "session-1", "project-1");
  });
  it("afviser projekter fra en anden hal", async () => {
    mocks.getUserProjects.mockResolvedValue([{ id: "project-1", location: "Anden hal", status: "Ny" }]);
    expect((await POST(request({ projectId: "project-1" }), context)).status).toBe(400);
    expect(mocks.addSessionProject).not.toHaveBeenCalled();
  });
  it("afviser en bruger som ikke er inviteret", async () => {
    mocks.getSharedSession.mockResolvedValue({ location: "Hallen" });
    expect((await POST(request({ projectId: "project-1" }), context)).status).toBe(403);
    expect(mocks.addSessionProject).not.toHaveBeenCalled();
  });
  it("afviser andre brugeres projekter", async () => {
    expect((await POST(request({ projectId: "another-project" }), context)).status).toBe(404);
    expect(mocks.addSessionProject).not.toHaveBeenCalled();
  });
  it("lader ikke inviterede redigere sessionen", async () => {
    expect((await PATCH(request({ title: "Ny", date: "2026-10-01", time: "18:00", locationId: "hall-2" }), context)).status).toBe(403);
    expect(mocks.updateClimbingSession).not.toHaveBeenCalled();
  });
  it("lader opretteren skifte hal selvom der er tilknyttede projekter", async () => {
    mocks.getSharedSession.mockResolvedValue({ viewerRole: "host", location: "Hallen", project: { id: "original" }, projects: [{ id: "project-1" }] });
    const response = await PATCH(request({ title: "Ny", date: "2026-10-01", time: "18:00", locationId: "hall-2" }), context);
    expect(response.status).toBe(200);
    expect(mocks.updateClimbingSession).toHaveBeenCalledWith("user-1", "session-1", { title: "Ny", date: "2026-10-01", time: "18:00", location: "Ny hal" });
  });
});
