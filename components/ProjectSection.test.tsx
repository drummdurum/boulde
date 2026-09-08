import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ProjectSection } from "./ProjectSection";
const projects = [
  {
    id: "p1",
    name: "Nordlys",
    location: "Kjugekull",
    grade: "7A+" as const,
    attempts: 12,
    lastAttempt: "I går",
    note: "Test",
    status: "Tæt på" as const,
    progress: 82,
    visible: false,
  },
  {
    id: "p2",
    name: "Kalk & kaffe",
    location: "Sydhavn",
    grade: "7A" as const,
    attempts: 7,
    lastAttempt: "I går",
    note: "Test",
    status: "Arbejder på den" as const,
    progress: 55,
    visible: false,
  },
];
describe("ProjectSection", () => {
  it("filtrerer projekter efter status og linker til projekterne", async () => {
    const user = userEvent.setup();
    render(<ProjectSection projects={projects} />);
    expect(screen.getByRole("link", { name: "Se alle" })).toHaveAttribute(
      "href",
      "/projekter",
    );
    expect(screen.getByRole("link", { name: /Nordlys/ })).toHaveAttribute(
      "href",
      "/projekter",
    );
    await user.selectOptions(screen.getByRole("combobox"), "Tæt på");
    expect(screen.getByText("Nordlys")).toBeInTheDocument();
    expect(screen.queryByText("Kalk & kaffe")).not.toBeInTheDocument();
  });
});
