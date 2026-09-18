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
