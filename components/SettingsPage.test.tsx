import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SettingsPage } from "./SettingsPage";

describe("SettingsPage", () => {
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

  it("gemmer hvem der må sende direkte invitationer", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    render(<SettingsPage initialPolicy="connections" />);

    await userEvent.click(screen.getByText("Ingen", { exact: true }));

    expect(await screen.findByText("Indstillingen er gemt.")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/settings", expect.objectContaining({
      method: "PATCH",
      body: JSON.stringify({ sessionInvitePolicy: "none" }),
    }));
  });

  it("ruller valget tilbage hvis det ikke kan gemmes", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    render(<SettingsPage initialPolicy="connections" />);

    await userEvent.click(screen.getByRole("radio", { name: /^Alle/ }));

    await waitFor(() => expect(screen.getByRole("radio", { name: /Kun forbindelser/ })).toBeChecked());
    expect(screen.queryByText("Indstillingen er gemt.")).not.toBeInTheDocument();
  });
});
