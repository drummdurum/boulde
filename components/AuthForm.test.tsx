import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AuthForm } from "./AuthForm";

const push = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh }) }));

describe("AuthForm", () => {
  afterEach(() => { cleanup(); vi.restoreAllMocks(); push.mockReset(); refresh.mockReset(); });

  it("logger ind og sender brugeren til dashboardet", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ user: { name: "Maja" } }), { status: 200, headers: { "Content-Type": "application/json" } }));
    render(<AuthForm mode="login" />);
    await userEvent.type(screen.getByLabelText("E-mail"), "maja@example.dk");
    await userEvent.type(screen.getByLabelText("Adgangskode"), "hemmelig123");
    await userEvent.click(screen.getByRole("button", { name: "Log ind" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/"));
    expect(fetchMock).toHaveBeenCalledWith("/api/auth/login", expect.objectContaining({ method: "POST", body: JSON.stringify({ email: "maja@example.dk", password: "hemmelig123" }) }));
    expect(refresh).toHaveBeenCalledOnce();
  });

  it("viser API-fejl ved en afvist oprettelse", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ error: "Brugernavnet er allerede taget." }), { status: 409, headers: { "Content-Type": "application/json" } }));
    render(<AuthForm mode="register" />);
    await userEvent.type(screen.getByLabelText("Navn"), "Maja Lind");
    await userEvent.type(screen.getByLabelText("Brugernavn"), "majalind");
    await userEvent.type(screen.getByLabelText("E-mail"), "maja@example.dk");
    await userEvent.type(screen.getByLabelText("Adgangskode"), "hemmelig123");
    await userEvent.click(screen.getByRole("button", { name: "Opret bruger" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Brugernavnet er allerede taget.");
    expect(push).not.toHaveBeenCalled();
  });
});
