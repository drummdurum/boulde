import { afterEach, describe, expect, it, vi } from "vitest";
import { requestWelcomeEmail } from "./mail-service";

describe("requestWelcomeEmail", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("sender kun brugerdata til mailservicens velkomst-endpoint", async () => {
    vi.stubEnv("MAIL_SERVICE_URL", "http://mail-service.test");
    vi.stubEnv("MAIL_SERVICE_API_KEY", "test-key");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ jobId: "welcome-user-1", status: "QUEUED" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(requestWelcomeEmail({ id: "user-1", email: "maja@example.dk", name: "Maja" })).resolves.toEqual({
      jobId: "welcome-user-1",
      status: "QUEUED",
    });
    expect(fetchMock).toHaveBeenCalledWith("http://mail-service.test/emails/welcome", expect.objectContaining({
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": "test-key" },
      body: JSON.stringify({ userId: "user-1", recipient: "maja@example.dk", data: { name: "Maja" } }),
    }));
  });

  it("fejler tydeligt når mailservicen afviser jobbet", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 503 }));
    await expect(requestWelcomeEmail({ id: "user-1", email: "maja@example.dk", name: "Maja" })).rejects.toThrow("HTTP 503");
  });
});
