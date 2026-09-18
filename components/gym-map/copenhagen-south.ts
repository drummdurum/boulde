export interface GymMapArea {
  id: string;
  name: string;
  path: string;
  label: { x: number; y: number };
  angle?: string;
  note?: string;
  island?: boolean;
  fillPath?: string;
  shortLabel?: string;
  placementPoint?: { x: number; y: number };
}

// IDs identify physical walls and remain stable when problems are reset.
export const copenhagenSouthAreas: GymMapArea[] = [
  { id: "kaosvaeg-90", name: "Venstre væg · 90°", path: "M79 102 L95 185 L79 260", label: { x: 160, y: 190 }, angle: "90°", placementPoint: { x: 95, y: 185 } },
  { id: "kaosvaeg-80", name: "Venstre væg · 80°", path: "M79 260 L102 410", label: { x: 160, y: 335 }, angle: "80°", placementPoint: { x: 90.5, y: 335 } },
  { id: "kaosvaeg-60", name: "Venstre væg · 60°", path: "M102 410 L72 552", label: { x: 160, y: 490 }, angle: "60°", placementPoint: { x: 87, y: 481 } },
  { id: "kaosvaeg-bottom", name: "Kaosvæg", path: "M72 552 L79 672", label: { x: 160, y: 615 }, placementPoint: { x: 75.5, y: 612 } },
  { id: "overhang-left", name: "Overhæng · venstre", path: "M139 102 L365 95 L376 92.74", label: { x: 245, y: 150 }, shortLabel: "Venstre", placementPoint: { x: 245, y: 98.72 } },
  { id: "overhang-middle", name: "Overhæng · midten", path: "M376 92.74 L545 58 L635 125 L713 119.75", label: { x: 550, y: 170 }, shortLabel: "Overhæng · midten", placementPoint: { x: 545, y: 58 } },
  { id: "overhang-right", name: "Overhæng · højre", path: "M713 119.75 L739 118 L875 80 L957 95", label: { x: 837, y: 155 }, shortLabel: "Højre", placementPoint: { x: 875, y: 80 } },
  { id: "skibet-left-upper", name: "Skibet · venstre øverst", path: "M370.87 403 L372 380 L387 357 L387 282 L402 253 L469 223", fillPath: "M370.87 403 L372 380 L387 357 L387 282 L402 253 L469 223 L439 403 Z", label: { x: 414, y: 320 }, shortLabel: "V1", angle: "90°", placementPoint: { x: 387, y: 310 } },
  { id: "skibet-right-upper", name: "Skibet · højre øverst", path: "M469 223 L529 260 L529 290 L499 373 L507 396 L505.08 403", fillPath: "M469 223 L529 260 L529 290 L499 373 L507 396 L505.08 403 L439 403 Z", label: { x: 495, y: 320 }, shortLabel: "H1", note: "Knæk på midten", placementPoint: { x: 529, y: 275 } },
  { id: "skibet-left-lower", name: "Skibet · venstre nederst", path: "M370.87 403 L365 522 L379 672", fillPath: "M370.87 403 L365 522 L379 672 L424 672 L439 403 Z", label: { x: 399, y: 535 }, shortLabel: "V2", angle: "90°", placementPoint: { x: 365, y: 522 } },
  { id: "skibet-right-lower", name: "Skibet · højre nederst", path: "M505.08 403 L493 447 L514 568 L514 620 L484 672", fillPath: "M505.08 403 L493 447 L514 568 L514 620 L484 672 L424 672 L439 403 Z", label: { x: 475, y: 535 }, shortLabel: "H2", note: "Knæk på midten", placementPoint: { x: 514, y: 568 } },
  { id: "center-wall-upper", name: "Midtervæg · øverst", path: "M708.06 455 L704 372 L704 282 L734 223 L779 223", label: { x: 752, y: 340 }, shortLabel: "Øverst", angle: "90°", placementPoint: { x: 704, y: 330 } },
  { id: "center-wall-lower", name: "Midtervæg · nederst", path: "M708.06 455 L711 515 L719 642", label: { x: 752, y: 560 }, shortLabel: "Nederst", angle: "90°", placementPoint: { x: 712.57, y: 540 } },
  { id: "right-wall", name: "Højre væg", path: "M957 95 L935 297 L942 388 L979 462", label: { x: 916, y: 520 }, angle: "80°", note: "Foreløbigt navn" },
];

// Context and section boundaries have no hit targets and cannot receive projects.
export const copenhagenSouthContext = [
  { path: "M779 223 L779 642", kind: "boundary" as const },
  { path: "M60 260 L98 260 M83 410 L121 410 M53 552 L91 552 M373 76 L379 109 M714 103 L712 137 M944 108 L970 82 M352 403 L522 403 M469 223 L439 403 L424 672 M690 455 L728 455", kind: "separator" as const },
];

// Old projects retain their coordinates; only the displayed section is resolved.
export function copenhagenSouthSection(areaId: string, x: number, y: number) {
  if (areaId === "kaosvaeg") return y < 260 ? "kaosvaeg-90" : y < 410 ? "kaosvaeg-80" : y < 552 ? "kaosvaeg-60" : "kaosvaeg-bottom";
  if (areaId === "overhang") return x < 376 ? "overhang-left" : x < 713 ? "overhang-middle" : "overhang-right";
  if (areaId === "center-wall") return y < 455 ? "center-wall-upper" : "center-wall-lower";
  if (areaId === "skibet") {
    const upper = y < 403;
    const seamX = upper ? 469 - (y - 223) * 30 / 180 : 439 - (y - 403) * 15 / 269;
    return `skibet-${x < seamX ? "left" : "right"}-${upper ? "upper" : "lower"}`;
  }
  return areaId;
}
