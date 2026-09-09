import { afterEach, describe, expect, it, vi } from "vitest";
import { requestConnectionRequestEmail, requestSessionInvitationEmail, requestWelcomeEmail } from "./mail-service";

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

describe("notification email requests", () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

  it("sender sessioninvitationen til det korrekte endpoint", async () => {
    vi.stubEnv("MAIL_SERVICE_URL", "https://mail.example"); vi.stubEnv("MAIL_SERVICE_API_KEY", "secret");
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ jobId: "event-1", status: "QUEUED" }) });
    vi.stubGlobal("fetch", fetchMock);
    const input = { eventId: "event-1", userId: "user-1", recipient: "freja@example.dk", data: { recipientName: "Freja", hostName: "Sebastian", sessionTitle: "Aften", date: "2026-09-12", time: "18:30", location: "Aarhus", sessionUrl: "https://boulde.dk/session/abc" } };
    await requestSessionInvitationEmail(input);
    expect(fetchMock).toHaveBeenCalledWith("https://mail.example/emails/session-invitation", expect.objectContaining({ body: JSON.stringify(input) }));
  });

  it("sender forbindelsesanmodningen til det korrekte endpoint", async () => {
    vi.stubEnv("MAIL_SERVICE_URL", "https://mail.example"); vi.stubEnv("MAIL_SERVICE_API_KEY", "secret");
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ jobId: "event-2", status: "QUEUED" }) });
    vi.stubGlobal("fetch", fetchMock);
    const input = { eventId: "event-2", userId: "user-2", recipient: "freja@example.dk", data: { recipientName: "Freja", senderName: "Sebastian", connectionsUrl: "https://boulde.dk/klatrere" } };
    await requestConnectionRequestEmail(input);
    expect(fetchMock).toHaveBeenCalledWith("https://mail.example/emails/connection-request", expect.objectContaining({ body: JSON.stringify(input) }));
  });
});
