import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { FeedPost } from "./FeedPost";
const post = { id: "post-test", author: { id: "user-test", name: "Test Klatrer", username: "testklatrer", initials: "TK", location: "København" }, createdAt: "nu", location: "Kjugekull", route: "Testlinjen", description: "Et testopslag", type: "Boulder" as const, grade: "6C" as const, image: "/images/nordic-boulder.png", imageAlt: "Testklatring", likes: 41, comments: [] };
afterEach(cleanup);
describe("FeedPost", () => { it("kan like, gemme og åbne kommentarer", async () => { const user = userEvent.setup(); render(<FeedPost post={post} />); const like = screen.getByRole("button", { name: "41" }); await user.click(like); expect(screen.getByRole("button", { name: "42" })).toHaveAttribute("aria-pressed", "true"); await user.click(screen.getByRole("button", { name: "Gem opslag" })); expect(screen.getByRole("button", { name: "Fjern fra gemte opslag" })).toHaveAttribute("aria-pressed", "true"); await user.click(screen.getByRole("button", { name: "0" })); expect(screen.getByText("Vær den første til at skrive en kommentar.")).toBeInTheDocument(); }); });

it("henter beskyttede opslagsbilleder direkte med brugerens session", () => {
  const image = "/api/posts/post-test/media/media-test";
  render(<FeedPost post={{ ...post, image }} />);

  expect(screen.getByRole("img", { name: "Testklatring" })).toHaveAttribute("src", image);
});
