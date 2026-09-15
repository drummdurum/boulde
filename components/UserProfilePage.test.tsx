import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { ClimbingProject, User } from "@/types";
import { UserProfilePage } from "./UserProfilePage";

const user: User = { id: "user-1", name: "Test Klatrer", username: "test", initials: "TK", location: "Aarhus" };
const project = (id: string, grade: ClimbingProject["grade"], location: string, status: ClimbingProject["status"], placeSlug?: string, colorGrade?: ClimbingProject["colorGrade"]): ClimbingProject => ({
  id, name: `Projekt ${id}`, location, placeSlug, grade, colorGrade, status,
  attempts: 1, lastAttempt: "2026-09-15", note: "", progress: status === "Gennemført" ? 100 : 50, visible: false,
});

describe("UserProfilePage statistik", () => {
  afterEach(cleanup);

  it("viser højeste grade og unikke klatresteder fra gennemførte projekter", () => {
    render(<UserProfilePage
      user={user}
      createdAt="2026-01-01T00:00:00.000Z"
      posts={[]}
      projects={[
        project("1", "6B", "Boulders Sydhavn", "Gennemført", "boulders-kbh-sydhavn", "Blå"),
        project("2", "7A+", "Boulders KBH Sydhavn", "Gennemført", "boulders-kbh-sydhavn", "Rød"),
        project("3", "8A", "Boulders Aarhus City", "Arbejder på den", "boulders-aarhus-city", "Pink"),
        project("4", "7A", "Boulders Odense", "Gennemført", "boulders-odense", "Lilla"),
      ]}
      followCounts={{ followers: 0, following: 0 }}
    />);

    const stats = screen.getByRole("region", { name: "Profilstatistik" });
    expect(within(stats).getByText("Højeste grade").closest("article")).toHaveTextContent("7A+");
    expect(within(stats).getByText("Højeste farve").closest("article")).toHaveTextContent("Rød");
    expect(within(stats).getByText("Klatresteder").closest("article")).toHaveTextContent("2");
    expect(within(stats).getByText("Gennemførte").closest("article")).toHaveTextContent("3");
  });

  it("viser tomme værdier uden gennemførte projekter", () => {
    render(<UserProfilePage user={user} createdAt="2026-01-01T00:00:00.000Z" posts={[]} projects={[project("1", "8A", "Boulders Aarhus", "Ny")]} followCounts={{ followers: 0, following: 0 }} />);

    const stats = screen.getByRole("region", { name: "Profilstatistik" });
    expect(within(stats).getByText("Højeste grade").closest("article")).toHaveTextContent("—");
    expect(within(stats).getByText("Højeste farve").closest("article")).toHaveTextContent("—");
    expect(within(stats).getByText("Klatresteder").closest("article")).toHaveTextContent("0");
  });
});
