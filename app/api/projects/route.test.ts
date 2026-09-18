import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  updateUserProject: vi.fn(),
  setProjectVisibility: vi.fn(),
  getUserProjects: vi.fn(),
  createUserProject: vi.fn(),
  placeById: vi.fn(),
  userOwnsProject: vi.fn(),
  uploadProjectCover: vi.fn(),
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
vi.mock("@/lib/media-service", () => ({ uploadProjectCover: mocks.uploadProjectCover }));

import { PATCH, POST } from "./route";

describe("projektets hovedbillede", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.placeById.mockReturnValue({ id: "place-1", name: "Hallen" });
    mocks.userOwnsProject.mockResolvedValue(true);
    mocks.uploadProjectCover.mockImplementation(async (_owner, id) => `/api/projects/${id}/media/media-1`);
    mocks.createUserProject.mockImplementation(async (_owner, input) => input);
    mocks.updateUserProject.mockImplementation(async (_owner, id, input) => ({ id, ...input }));
  });
  function imageForm() {
    const form = new FormData();
    form.set("name", "Projektet");
    form.set("placeId", "place-1");
    form.set("id", "project-1");
    form.set("grade", "6B");
    form.set("progress", "0");
    form.set("status", "Ny");
    form.set("image", new Blob([new Uint8Array([1, 2, 3])], { type: "image/png" }), "projekt.png");
    return { formData: async () => form, headers: new Headers({ "content-type": "multipart/form-data" }) } as Request;
  }
  it("sender hovedbilledet til media-servicen ved oprettelse", async () => {
    const response = await POST(imageForm());
    expect(response.status).toBe(201);
    const [, projectId, file] = mocks.uploadProjectCover.mock.calls[0];
    expect(file).toBeInstanceOf(Blob);
    expect(mocks.createUserProject).toHaveBeenCalledWith("user-1", expect.objectContaining({ id: projectId, image: `/api/projects/${projectId}/media/media-1` }));
  });
  it("sender et nyt hovedbillede til media-servicen ved opdatering", async () => {
    const response = await PATCH(imageForm());
    expect(response.status).toBe(200);
    expect(mocks.userOwnsProject).toHaveBeenCalledWith("user-1", "project-1");
    expect(mocks.uploadProjectCover).toHaveBeenCalledWith("user-1", "project-1", expect.any(Blob));
    expect(mocks.updateUserProject).toHaveBeenCalledWith("user-1", "project-1", expect.objectContaining({ image: "/api/projects/project-1/media/media-1" }));
  });
  it("uploader ikke et billede til en anden brugers projekt", async () => {
    mocks.userOwnsProject.mockResolvedValue(false);
    expect((await PATCH(imageForm())).status).toBe(404);
    expect(mocks.uploadProjectCover).not.toHaveBeenCalled();
    expect(mocks.updateUserProject).not.toHaveBeenCalled();
  });
  it("gemmer ikke projektet hvis medie-uploaden fejler", async () => {
    mocks.uploadProjectCover.mockRejectedValueOnce(new Error("storage unavailable"));
    expect((await POST(imageForm())).status).toBe(503);
    expect(mocks.createUserProject).not.toHaveBeenCalled();
  });
});

describe("POST /api/projects", () => {
  it("validerer placering mod hallens kort før projektet gemmes", async () => {
    mocks.placeById.mockReturnValue({ id: "gym-6", slug: "boulders-kbh-sydhavn" });
    mocks.createUserProject.mockImplementation(async (_owner, input) => input);
    const form = new FormData();
    for (const [key, value] of Object.entries({ name: "Skibsprojekt", placeId: "gym-6", grade: "6B", progress: "0", status: "Ny", colorGrade: "Grøn", mapSlot: "1", mapArea: "skibet-left-upper", mapX: "42.3", mapY: "57.8" })) form.set(key, value);
    const request = () => ({ formData: async () => form }) as Request;
    expect((await POST(request())).status).toBe(201);
    expect(mocks.createUserProject).toHaveBeenCalledWith("user-1", expect.objectContaining({ mapPlacement: { areaId: "skibet-left-upper", x: 42.3, y: 57.8 } }));
    mocks.createUserProject.mockClear();
    for (const badX of ["", "101", "NaN", "Infinity"]) {
      form.set("mapX", badX);
      expect((await POST(request())).status).toBe(400);
    }
    form.set("mapX", "42.3");
    for (const badSlot of ["", "0", "3"]) {
      form.set("mapSlot", badSlot);
      expect((await POST(request())).status).toBe(400);
    }
    form.set("mapSlot", "1");
    mocks.placeById.mockReturnValue({ id: "gym-1", slug: "boulders-aarhus-city" });
    expect((await POST(request())).status).toBe(400);
    expect(mocks.createUserProject).not.toHaveBeenCalled();
  });
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

  it("kan oprette uden billede når den globale File-constructor mangler", async () => {
    vi.stubGlobal("File", undefined);
    mocks.placeById.mockReturnValue({ id: "place-1", name: "Hallen" });
    mocks.createUserProject.mockResolvedValue({ id: "project-1" });
    const form = new FormData();
    form.set("name", "Projektet");
    form.set("placeId", "place-1");
    form.set("grade", "6B");
    form.set("progress", "0");
    form.set("status", "Ny");

    const response = await POST(
      new Request("http://localhost/api/projects", { method: "POST", body: form }),
    );

    expect(response.status).toBe(201);
    vi.unstubAllGlobals();
  });

  it("sætter status til gennemført ved 100 procent", async () => {
    mocks.placeById.mockReturnValue({ id: "place-1", name: "Hallen" });
    mocks.createUserProject.mockResolvedValue({ id: "project-1" });
    const form = new FormData();
    form.set("name", "Projektet");
    form.set("placeId", "place-1");
    form.set("grade", "6B");
    form.set("progress", "100");
    form.set("status", "Tæt på");
    form.set("grade", "7A");
    form.set("colorGrade", "Lilla");
    await POST(new Request("http://localhost/api/projects", { method: "POST", body: form }));
    expect(mocks.createUserProject).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({ progress: 100, status: "Gennemført" }),
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
    form.set("grade", "7A");
    form.set("colorGrade", "Lilla");
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
      { progress: 70, status: "Tæt på", grade: "7A", colorGrade: "Lilla", note: "Næsten der", image: undefined },
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

  it("sætter fremskridt til 100 ved status gennemført", async () => {
    mocks.updateUserProject.mockResolvedValue({ id: "project-1" });
    const form = new FormData();
    form.set("id", "project-1");
    form.set("progress", "70");
    form.set("status", "Gennemført");
    form.set("grade", "6B");
    form.set("colorGrade", "Blå");
    await PATCH(new Request("http://localhost/api/projects", { method: "PATCH", body: form }));
    expect(mocks.updateUserProject).toHaveBeenCalledWith(
      "user-1",
      "project-1",
      expect.objectContaining({ progress: 100, status: "Gennemført" }),
    );
  });
});
