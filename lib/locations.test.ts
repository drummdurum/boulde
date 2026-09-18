import { describe, expect, it, vi } from "vitest";
import neo4j from "neo4j-driver";

const mocks = vi.hoisted(() => ({ executeQuery: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: mocks, database: "neo4j", neo4jNumber: (value: number | { toNumber(): number }) => typeof value === "number" ? value : value.toNumber() }));
import { getPublicProjectsAtLocation } from "./locations";

describe("offentlige kortprojekter", () => {
  it("sender kun almindelige data til kortet, også når Neo4j gemmer datoer og heltal som klasser", async () => {
    const props = { id: "p1", name: "Grøn 1", location: "Sydhavn", grade: "6A", colorGrade: "Grøn", status: "Ny", lastAttempt: "Test", visible: true, attempts: neo4j.int(3), progress: neo4j.int(20), mapSlot: neo4j.int(1), mapArea: "kaosvaeg-90", mapX: neo4j.int(8), mapY: neo4j.int(20), createdAt: neo4j.types.DateTime.fromStandardDate(new Date()), note: "Privat note" };
    mocks.executeQuery.mockResolvedValue({ records: [{ get: (key: string) => ({ properties: key === "p" ? props : { id: "u1", name: "Alma", username: "alma" } }) }] });
    const [project] = await getPublicProjectsAtLocation({ id: "sydhavn", name: "Boulders Sydhavn" } as Parameters<typeof getPublicProjectsAtLocation>[0]);
    expect(project).toMatchObject({ attempts: 3, progress: 20, mapSlot: 1, note: "", mapPlacement: { areaId: "kaosvaeg-90", x: 8, y: 20 } });
    expect(project).not.toHaveProperty("createdAt");
    expect(project).not.toHaveProperty("mapX");
    expect(JSON.parse(JSON.stringify(project))).toMatchObject({ owner: { name: "Alma" }, mapSlot: 1 });
  });
});
