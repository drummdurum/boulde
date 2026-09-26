import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { gymMapForPlace, validMapPlacement } from "@/lib/gym-maps";

type Fixture = { id: string; areaId: string; mapX: number; mapY: number; colorGrade: string; owner: string };
const cases = [
  { slug: "boulders-kbh-sydhavn", file: "gym-map-test-data.json", total: 42 },
  { slug: "boulders-valby", file: "gym-map-test-data-valby.json", total: 21 },
  { slug: "boulders-amager", file: "gym-map-test-data-amager.json", total: 42 },
];

describe.each(cases)("korttestdata for $slug", ({ slug, file, total }) => {
  const fixtures = JSON.parse(readFileSync(path.join(__dirname, file), "utf8")) as Fixture[];
  const map = gymMapForPlace(slug)!;

  it("har tre projekter i hver sektion og højst to af samme farve", () => {
    expect(fixtures).toHaveLength(total);
    expect(new Set(fixtures.map(item => item.id)).size).toBe(total);
    for (const area of map.areas) {
      const projects = fixtures.filter(item => item.areaId === area.id);
      expect(projects).toHaveLength(3);
      expect(projects.filter(item => item.colorGrade === "Grøn")).toHaveLength(2);
      expect(projects.filter(item => item.colorGrade === "Blå")).toHaveLength(1);
      expect(new Set(projects.map(item => item.owner)).size).toBe(3);
      expect(projects.every(item => validMapPlacement(slug, { areaId: item.areaId, x: item.mapX, y: item.mapY }))).toBe(true);
    }
  });
});
