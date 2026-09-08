import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CreatePostModal } from "./CreatePostModal";
describe("CreatePostModal", () => {
  afterEach(cleanup);
  it("kan lukkes med Escape", async () => { const onClose = vi.fn(); render(<CreatePostModal open onClose={onClose} />); expect(screen.getByRole("dialog")).toBeInTheDocument(); await userEvent.keyboard("{Escape}"); expect(onClose).toHaveBeenCalledOnce(); });
  it("opretter frie opslag uden krav om klatredata", () => {
    render(<CreatePostModal open onClose={vi.fn()} />);
    expect(screen.getByLabelText("Hvad vil du dele?")).toBeRequired();
    expect(screen.queryByLabelText("Rute")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Grade")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Vælg billede til opslag")).toBeInTheDocument();
    expect(screen.getByLabelText("Vælg video til opslag")).toBeInTheDocument();
  });
});
