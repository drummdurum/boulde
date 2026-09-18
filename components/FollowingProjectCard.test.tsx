import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { FollowingProjectCard } from "@/components/FollowingProjectCard";
import type { ProjectFeedItem } from "@/types";

const item: ProjectFeedItem = {
  createdAt: "2026-08-31T09:00:00Z",
  project: { id: "project-1", name: "Testprojekt", location: "Boulders Valby", grade: "6B", attempts: 2, lastAttempt: "2026-08-31", note: "", status: "Arbejder på den", progress: 50, visible: true, owner: { id: "user-1", name: "Test Klatrer", username: "test", initials: "TK" } },
  media: [{ id: "media-1", projectId: "project-1", type: "video", contentType: "video/mp4", size: 100, note: "Et godt forsøg", url: "/video/test.mp4", createdAt: "2026-08-31T09:00:00Z" }],
};

describe("FollowingProjectCard video", () => {
  afterEach(cleanup);
  beforeAll(() => {
    HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
    HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
  });
  it("åbner hallens kort fra projektnavnet med gemt placering og link til projektet", () => {
    render(<FollowingProjectCard item={{ ...item, project: { ...item.project, placeSlug: "boulders-kbh-sydhavn", location: "Boulders KBH Sydhavn", mapPlacement: { areaId: "skibet-left-upper", x: 38, y: 40 } } }} />);
    fireEvent.click(screen.getByRole("button", { name: "Se placering for Testprojekt" }));
    const dialog = screen.getByRole("dialog", { name: "Testprojekt" });
    expect(within(dialog).getByRole("link", { name: "Åbn projekt" })).toHaveAttribute("href", "/projekter/project-1");
    const marker = within(dialog).getByLabelText("Projektets placering").querySelector("circle");
    expect(marker).toHaveAttribute("cx", String(38 * 1072 / 100));
    expect(marker).toHaveAttribute("cy", String(40 * 740 / 100));
    fireEvent(dialog, new Event("cancel", { cancelable: true }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Se placering på kort" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Luk kort" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("linker projekter uden kortplacering direkte til projektet", () => {
    render(<FollowingProjectCard item={item} />);
    expect(screen.getByRole("link", { name: "Testprojekt" })).toHaveAttribute("href", "/projekter/project-1");
    expect(screen.queryByRole("button", { name: "Se placering på kort" })).not.toBeInTheDocument();
  });
  it("viser browserkontroller uden at billedteksten blokerer klik", () => {
    const { container } = render(<FollowingProjectCard item={item} />);
    const video = screen.getByLabelText("Video fra Testprojekt");
    expect(video).toHaveAttribute("controls");
    expect(video).toHaveAttribute("playsinline");
    expect(video).toHaveAttribute("preload", "none");
    expect(container.querySelector("figcaption")).toHaveClass("pointer-events-none");
  });

  it("lazy-loader og dekoder billeder asynkront", () => {
    render(<FollowingProjectCard item={{ ...item, media: [{ ...item.media[0], id: "image-1", type: "image", contentType: "image/jpeg", url: "/images/test.jpg" }] }} />);
    const image = screen.getByRole("img", { name: "Et godt forsøg" });
    expect(image).toHaveAttribute("loading", "lazy");
    expect(image).toHaveAttribute("decoding", "async");
  });
});
