import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FollowingProjectCard } from "@/components/FollowingProjectCard";
import type { ProjectFeedItem } from "@/types";

const item: ProjectFeedItem = {
  createdAt: "2026-08-31T09:00:00Z",
  project: { id: "project-1", name: "Testprojekt", location: "Boulders Valby", grade: "6B", attempts: 2, lastAttempt: "2026-08-31", note: "", status: "Arbejder på den", progress: 50, visible: true, owner: { id: "user-1", name: "Test Klatrer", username: "test", initials: "TK" } },
  media: [{ id: "media-1", projectId: "project-1", type: "video", contentType: "video/mp4", size: 100, note: "Et godt forsøg", url: "/video/test.mp4", createdAt: "2026-08-31T09:00:00Z" }],
};

describe("FollowingProjectCard video", () => {
  it("viser browserkontroller uden at billedteksten blokerer klik", () => {
    const { container } = render(<FollowingProjectCard item={item} />);
    const video = screen.getByLabelText("Video fra Testprojekt");
    expect(video).toHaveAttribute("controls");
    expect(video).toHaveAttribute("playsinline");
    expect(container.querySelector("figcaption")).toHaveClass("pointer-events-none");
  });
});
