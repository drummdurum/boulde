import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { database, db } from "@/lib/db";
import { createUserProject, updateUserProject } from "@/lib/user-data";

afterAll(async () => { await db.close(); });

describe("to fysiske problemer pr. farve og sektion", () => {
  it("deler en plads mellem brugere, afviser plads 3 og bevarer problemets farve", async () => {
    const run = randomUUID();
    const userIds = [`map-u1-${run}`, `map-u2-${run}`];
    const place = { id: `map-place-${run}`, slug: `map-place-${run}`, name: "Testhal", street: "Testvej", postalCode: "1000", city: "Testby", image: "/images/nordic-boulder.png" };
    const input = { name: "Testlinje", place, grade: "6A" as const, colorGrade: "Grøn" as const, note: "", mapPlacement: { areaId: "skibet-left-upper", x: 38, y: 40 }, mapSlot: 1 as const };
    const projectIds: string[] = [];
    try {
      await db.executeQuery("CREATE CONSTRAINT map_problem_id IF NOT EXISTS FOR (b:MapProblem) REQUIRE b.id IS UNIQUE", {}, { database });
      await db.executeQuery("UNWIND $ids AS id CREATE (:User {id: id, name: 'Korttest'})", { ids: userIds }, { database });
      const created = await Promise.all(userIds.map((id, index) => createUserProject(id, { ...input, id: `map-project-${index}-${run}`, mapPlacement: { ...input.mapPlacement, x: 38 + index } })));
      projectIds.push(...created.map(project => project.id));
      expect(created[0].mapProblemId).toBe(created[1].mapProblemId);
      expect(created[0].mapPlacement).toEqual(created[1].mapPlacement);
      const second = await createUserProject(userIds[0], { ...input, mapSlot: 2 });
      projectIds.push(second.id);
      await expect(createUserProject(userIds[0], { ...input, mapSlot: 3 as 1 })).rejects.toThrow("problem 1 eller 2");
      const count = await db.executeQuery("MATCH (b:MapProblem {placeSlug: $slug}) RETURN count(b) AS n", { slug: place.slug }, { database });
      expect(count.records[0].get("n").toNumber()).toBe(2);
      expect(await updateUserProject(userIds[0], created[0].id, { grade: "6A", status: "Ny", progress: 20, note: "", colorGrade: "Blå" })).toBeNull();
    } finally {
      await db.executeQuery("MATCH (n) WHERE n.id IN $ids OR n.placeSlug = $slug DETACH DELETE n", { ids: [...userIds, ...projectIds, place.id, ...userIds.map((_id, i) => `map-project-${i}-${run}`)], slug: place.slug }, { database });
    }
  });
});
