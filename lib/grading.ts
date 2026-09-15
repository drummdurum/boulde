import type { ClimbingColor, ClimbingGrade } from "@/types";

export const climbingGrades: ClimbingGrade[] = ["5+", "6A", "6B", "6C", "7A", "7A+", "7B", "7C", "8A"];
export const climbingColors: ClimbingColor[] = ["Grøn", "Gul", "Orange", "Blå", "Lilla", "Rød", "Sort", "Pink"];

export const climbingColorStyles: Record<ClimbingColor, string> = {
  Grøn: "#4f7358", Gul: "#e7c84b", Orange: "#d98235", Blå: "#3f6fa8",
  Lilla: "#74528f", Rød: "#b94b45", Sort: "#242620", Pink: "#d95e91",
};
