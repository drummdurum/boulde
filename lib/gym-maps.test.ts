import { describe, expect, it } from "vitest";
import { gymMapForPlace, validMapPlacement } from "./gym-maps";

describe("Sydhavns sektioner", () => {
  const map = gymMapForPlace("boulders-kbh-sydhavn")!;
  it("fordeler gamle placeringer til sektioner på begge sider af Skibet", () => {
    expect(map.resolveSection("skibet", 410, 300)).toBe("skibet-left-upper");
    expect(map.resolveSection("skibet", 500, 300)).toBe("skibet-right-upper");
    expect(map.resolveSection("skibet", 395, 550)).toBe("skibet-left-lower");
    expect(map.resolveSection("skibet", 475, 550)).toBe("skibet-right-lower");
    expect(map.resolveSection("kaosvaeg", 90, 200)).toBe("kaosvaeg-90");
    expect(map.resolveSection("kaosvaeg", 90, 350)).toBe("kaosvaeg-80");
    expect(map.resolveSection("kaosvaeg", 90, 480)).toBe("kaosvaeg-60");
    expect(map.resolveSection("kaosvaeg", 90, 610)).toBe("kaosvaeg-bottom");
    expect(map.resolveSection("overhang", 550, 80)).toBe("overhang-middle");
    expect(map.resolveSection("center-wall", 715, 550)).toBe("center-wall-lower");
  });
  it("tillader kun klatresektioner ved oprettelse", () => {
    expect(map.areas).toHaveLength(14);
    expect(validMapPlacement("boulders-kbh-sydhavn", { areaId: "center-wall-upper", x: 67, y: 40 })).toBe(true);
    expect(validMapPlacement("boulders-kbh-sydhavn", { areaId: "boundary", x: 72, y: 40 })).toBe(false);
    expect(map.areas.filter(area => area.id.startsWith("center-wall")).every(area => !area.path.includes("L779 642"))).toBe(true);
  });
});

describe("Valbys sektioner", () => {
  const map = gymMapForPlace("boulders-valby")!;
  it("har syv klikbare vægge og holder konteksten uden for projektområderne", () => {
    expect(map.areas).toHaveLength(7);
    expect(map.areas.map(area => area.id)).toEqual([
      "valby-left-upper", "valby-left-middle", "valby-left-lower",
      "valby-right-upper", "valby-right-middle", "valby-center", "valby-overhang",
    ]);
    expect(validMapPlacement("boulders-valby", { areaId: "valby-overhang", x: 70, y: 78 })).toBe(true);
    expect(validMapPlacement("boulders-valby", { areaId: "center-obstacle", x: 40, y: 35 })).toBe(false);
  });
});

describe("Amagers sektioner", () => {
  const map = gymMapForPlace("boulders-amager")!;
  it("bruger de 14 navngivne vægge fra hallens kort", () => {
    expect(map.areas).toHaveLength(14);
    expect(map.areas.map(area => area.name)).toEqual([
      "Kilter", "Tag + Slab", "Campus", "Lynet", "Ø'en", "Ø'to", "Comp 1", "Comp 2",
      "Toppen", "Enden", "Klippen", "Dybet", "Kids", "Slab",
    ]);
    expect(validMapPlacement("boulders-amager", { areaId: "amager-comp-two", x: 79, y: 42 })).toBe(true);
    expect(validMapPlacement("boulders-amager", { areaId: "changing-rooms", x: 85, y: 80 })).toBe(false);
  });
});
