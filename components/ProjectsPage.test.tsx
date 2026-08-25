import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ProjectsPage } from "./ProjectsPage";
const project = { id: "project-test", name: "Testlinjen", location: "Kjugekull", grade: "7A" as const, attempts: 0, lastAttempt: "Ikke forsøgt endnu", note: "", status: "Ny" as const, progress: 0 };
describe("ProjectsPage", () => { it("åbner en visuel forsøgslog med billede og video", async () => { const user = userEvent.setup(); render(<ProjectsPage initialProjects={[project]} />); await user.click(screen.getAllByRole("button", { name: "Nyt forsøg" })[0]); expect(screen.getByRole("dialog", { name: "Hvad gjorde du?" })).toBeInTheDocument(); expect(screen.getByLabelText("Tag eller vælg et billede")).toHaveAttribute("accept", "image/*"); expect(screen.getByLabelText("Vælg en video")).toHaveAttribute("accept", "video/*"); expect(screen.getByRole("button", { name: "Gem forsøg" })).toBeDisabled(); await user.type(screen.getByRole("textbox", { name: "Din note" }), "Hold hoften tættere på væggen"); expect(screen.getByRole("button", { name: "Gem forsøg" })).toBeEnabled(); }); });
