import type { GymMapArea } from "./copenhagen-south";

// Area names and relative positions follow the wall map photographed in the gym.
export const amagerAreas: GymMapArea[] = [
  { id: "amager-kilter", name: "Kilter", path: "M150 30 L150 85 L365 85 L365 30", label: { x: 258, y: 62 }, placementPoint: { x: 258, y: 85 } },
  { id: "amager-tag-slab", name: "Tag + Slab", path: "M440 30 L505 55 L600 78 L700 120 L815 132 L900 125", label: { x: 660, y: 58 }, placementPoint: { x: 660, y: 104 } },
  { id: "amager-campus", name: "Campus", path: "M55 105 L55 165", label: { x: 110, y: 137 }, placementPoint: { x: 55, y: 137 } },
  { id: "amager-lynet", name: "Lynet", path: "M52 175 L115 195 L135 275 L135 330 L92 355", label: { x: 205, y: 275 }, placementPoint: { x: 132, y: 275 } },
  { id: "amager-island-one", name: "Ø'en", path: "M400 190 L455 165 L525 168 L515 285 L468 282 L435 255", label: { x: 365, y: 225 }, shortLabel: "Ø'en", placementPoint: { x: 430, y: 210 } },
  { id: "amager-island-two", name: "Ø'to", path: "M525 168 L575 170 L585 285 L515 285", label: { x: 635, y: 235 }, shortLabel: "Ø'to", placementPoint: { x: 575, y: 225 } },
  { id: "amager-comp-one", name: "Comp 1", path: "M900 125 L830 135 L865 150 L835 195 L885 215 L820 260", label: { x: 950, y: 195 }, shortLabel: "Comp 1", placementPoint: { x: 850, y: 180 } },
  { id: "amager-comp-two", name: "Comp 2", path: "M820 260 L842 305 L845 350 L935 350", label: { x: 940, y: 300 }, shortLabel: "Comp 2", placementPoint: { x: 840, y: 305 } },
  { id: "amager-toppen", name: "Toppen", path: "M60 395 L115 415 L105 465 L135 545", label: { x: 205, y: 470 }, placementPoint: { x: 115, y: 465 } },
  { id: "amager-enden", name: "Enden", path: "M430 430 L670 430 L720 440 L435 475", label: { x: 495, y: 415 }, placementPoint: { x: 540, y: 447 } },
  { id: "amager-klippen", name: "Klippen", path: "M435 475 L575 490 L750 465 L720 440", label: { x: 720, y: 495 }, placementPoint: { x: 625, y: 477 } },
  { id: "amager-dybet", name: "Dybet", path: "M135 545 L130 590 L165 610 L150 650", label: { x: 220, y: 585 }, placementPoint: { x: 145, y: 590 } },
  { id: "amager-kids", name: "Kids", path: "M150 650 L210 675 L165 705 L65 715", label: { x: 250, y: 690 }, placementPoint: { x: 170, y: 680 } },
  { id: "amager-slab", name: "Slab", path: "M700 540 L655 565 L625 640 L655 705", label: { x: 760, y: 650 }, placementPoint: { x: 645, y: 630 } },
];

// Doors, reception and changing facilities help orientation but are not walls.
export const amagerContext = [
  { path: "M810 520 L865 500 L940 500 L940 680 L875 680 M760 535 L760 718", kind: "boundary" as const },
  { path: "M385 670 L385 735 L545 735 L545 670 L525 655 L405 655 Z", kind: "boundary" as const },
  { path: "M55 375 L210 375 M390 375 L650 375 M800 375 L940 375", kind: "separator" as const },
];
