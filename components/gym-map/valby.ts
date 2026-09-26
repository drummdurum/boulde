import type { GymMapArea } from "./copenhagen-south";

// The red strokes in the source sketch divide sections. Only black wall lines
// are selectable climbing surfaces.
export const valbyAreas: GymMapArea[] = [
  { id: "valby-left-upper", name: "Venstre væg · øverst", path: "M86 49 L60 78 L46 125 L36 159 L95 220 L87 260 L87 275", label: { x: 160, y: 160 }, shortLabel: "Øverst", placementPoint: { x: 63, y: 185 } },
  { id: "valby-left-middle", name: "Venstre væg · midten", path: "M87 275 L86 320 L96 367 L112 415 L76 481", label: { x: 172, y: 365 }, shortLabel: "Midten", placementPoint: { x: 99, y: 375 } },
  { id: "valby-left-lower", name: "Venstre væg · nederst", path: "M76 481 L70 490 L78 577 L154 611 L172 670 L112 729 L36 738", label: { x: 225, y: 650 }, shortLabel: "Nederst", placementPoint: { x: 135, y: 605 } },
  { id: "valby-right-upper", name: "Højre væg · øverst", path: "M750 41 L738 184", label: { x: 840, y: 115 }, shortLabel: "Øverst", placementPoint: { x: 744, y: 112 } },
  { id: "valby-right-middle", name: "Højre væg · midten", path: "M738 184 L733 219 L758 252 L775 364 L749 398 L660 383", label: { x: 860, y: 300 }, shortLabel: "Midten", placementPoint: { x: 763, y: 310 } },
  { id: "valby-center", name: "Midtervæg", path: "M660 383 L580 389 L546 406 L537 466 L608 494", label: { x: 500, y: 355 }, shortLabel: "Midtervæg", placementPoint: { x: 568, y: 420 } },
  { id: "valby-overhang", name: "Overhæng", path: "M608 494 L708 500 L742 541 L742 618 L639 653 L639 696 L672 738", label: { x: 820, y: 590 }, shortLabel: "Overhæng", note: "Overhæng ifølge skitsen", placementPoint: { x: 742, y: 575 } },
];

export const valbyContext = [
  { path: "M36 602 L36 24 L852 24 L852 602", kind: "boundary" as const },
  { path: "M307 245 L529 245 L529 296 L307 296 Z", kind: "boundary" as const },
  { path: "M64 282 L129 261 M36 491 L103 474 M724 202 L765 160 M655 355 L660 415 M588 517 L630 474", kind: "separator" as const },
];
