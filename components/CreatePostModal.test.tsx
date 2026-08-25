import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CreatePostModal } from "./CreatePostModal";
describe("CreatePostModal", () => { it("kan lukkes med Escape", async () => { const onClose = vi.fn(); render(<CreatePostModal open onClose={onClose} />); expect(screen.getByRole("dialog")).toBeInTheDocument(); await userEvent.keyboard("{Escape}"); expect(onClose).toHaveBeenCalledOnce(); }); });
