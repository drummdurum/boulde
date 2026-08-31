import { describe, expect, it } from "vitest";
import { isPlainSerializable, toPlainData } from "@/lib/serialization";

class DriverValue { constructor(public readonly low: number, public readonly high: number) {} }

describe("serverprops til klientkomponenter", () => {
  it("konverterer klasser og objekter uden prototype rekursivt", () => {
    const withoutPrototype = Object.assign(Object.create(null), { note: "Brugerens tekst" });
    const result = toPlainData({ project: { progress: new DriverValue(82, 0), media: [withoutPrototype] } });

    expect(isPlainSerializable(result)).toBe(true);
    expect(Object.getPrototypeOf(result.project.progress)).toBe(Object.prototype);
    expect(Object.getPrototypeOf(result.project.media[0])).toBe(Object.prototype);
    expect(result).toEqual({ project: { progress: { low: 82, high: 0 }, media: [{ note: "Brugerens tekst" }] } });
  });

  it("afviser rå klasseinstanser som Next.js ikke kan serialisere", () => {
    expect(isPlainSerializable({ value: new DriverValue(1, 0) })).toBe(false);
  });
});
