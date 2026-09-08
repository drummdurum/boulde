import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  updateUserProject: vi.fn(),
  setProjectVisibility: vi.fn(),
  getUserProjects: vi.fn(),
  createUserProject: vi.fn(),
  placeById: vi.fn(),
}));
vi.mock("next/headers", () => ({
  cookies: () => ({ get: () => ({ value: "session" }) }),
}));
vi.mock("@/lib/auth", () => ({
  SESSION_COOKIE: "session",
  userFromSession: () => Promise.resolve({ id: "user-1" }),
}));
vi.mock("@/lib/user-data", () => mocks);
vi.mock("@/lib/places", () => ({ placeById: mocks.placeById }));

import { PATCH, POST } from "./route";

describe("POST /api/projects", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("opretter et projekt med valgt startfremskridt og status", async () => {
    const place = {
      id: "place-1",
      slug: "hallen",
      name: "Hallen",
      street: "Vej 1",
      postalCode: "8000",
      city: "Aarhus",
      image: "/place.jpg",
    };
    mocks.placeById.mockReturnValue(place);
    mocks.createUserProject.mockResolvedValue({
      id: "project-1",
      progress: 35,
      status: "Arbejder på den",
    });
    const form = new FormData();
    form.set("name", "Projektet");
    form.set("placeId", "place-1");
    form.set("grade", "6B");
    form.set("progress", "35");
    form.set("status", "Arbejder på den");
    const response = await POST(
      new Request("http://localhost/api/projects", {
        method: "POST",
        body: form,
      }),
    );
    expect(response.status).toBe(201);
    expect(mocks.createUserProject).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({ progress: 35, status: "Arbejder på den" }),
    );
  });
});

describe("PATCH /api/projects", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("opdaterer et ejet projekts fremskridt, status og note", async () => {
    const project = {
      id: "project-1",
      progress: 70,
      status: "Tæt på",
      note: "Næsten der",
    };
    mocks.updateUserProject.mockResolvedValue(project);
    const form = new FormData();
    form.set("id", "project-1");
    form.set("progress", "70");
    form.set("status", "Tæt på");
    form.set("note", "Næsten der");
    const response = await PATCH(
      new Request("http://localhost/api/projects", {
        method: "PATCH",
        body: form,
      }),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ project });
    expect(mocks.updateUserProject).toHaveBeenCalledWith(
      "user-1",
      "project-1",
      { progress: 70, status: "Tæt på", note: "Næsten der", image: undefined },
    );
  });

  it("afviser fremskridt uden for 0 til 100", async () => {
    const form = new FormData();
    form.set("id", "project-1");
    form.set("progress", "105");
    form.set("status", "Tæt på");
    const response = await PATCH(
      new Request("http://localhost/api/projects", {
        method: "PATCH",
        body: form,
      }),
    );
    expect(response.status).toBe(400);
    expect(mocks.updateUserProject).not.toHaveBeenCalled();
  });
});
