import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AuthNavigation } from "./AuthNavigation";

const push = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh }) }));

const user = { name: "Maja Lind", username: "majalind", initials: "ML", role: "user" as const };

describe("AuthNavigation", () => {
  afterEach(() => { cleanup(); vi.restoreAllMocks(); push.mockReset(); refresh.mockReset(); });

  it("viser layoutets bruger uden at hente /api/auth/me", () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    render(<AuthNavigation initialUser={user} />);

    expect(screen.getByText("Maja Lind")).toBeInTheDocument();
    expect(screen.getByText("@majalind")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("bevarer admin-linket", () => {
    render(<AuthNavigation initialUser={{ ...user, role: "admin" }} />);
    expect(screen.getByRole("link", { name: /Godkend steder/ })).toHaveAttribute("href", "/admin/steder");
  });

  it("logger ud og opdaterer server-layoutet", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 200 }));
    render(<AuthNavigation initialUser={user} />);

    await userEvent.click(screen.getByRole("button", { name: "Log ud" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/login"));
    expect(fetchMock).toHaveBeenCalledWith("/api/auth/logout", { method: "POST" });
    expect(refresh).toHaveBeenCalledOnce();
  });
});
