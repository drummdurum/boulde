import { expect, test } from "@playwright/test";
import neo4j from "neo4j-driver";

const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const password = "E2e-hemmelig-123";
const host = { name: "E2E Forbindelsesvært", username: `host_${runId.replace(/-/g, "_")}`.slice(0, 24), email: `host-${runId}@boulde.local`, location: "Aarhus", password };
const invitee = { name: "E2E Invitationsmodtager", username: `guest_${runId.replace(/-/g, "_")}`.slice(0, 24), email: `guest-${runId}@boulde.local`, location: "Odense", password };

test.afterAll(async () => {
  const driver = neo4j.driver(
    process.env.NEO4J_URI || "neo4j://127.0.0.1:7687",
    neo4j.auth.basic(process.env.NEO4J_USERNAME || "neo4j", process.env.NEO4J_PASSWORD || "boulde_local_password"),
  );
  try {
    await driver.executeQuery(
      `MATCH (u:User) WHERE u.email IN $emails
       OPTIONAL MATCH (u)-[:HOSTS]->(s:ClimbingSession)
       WITH collect(DISTINCT u) AS users, collect(DISTINCT s) AS sessions
       FOREACH (session IN sessions | DETACH DELETE session)
       FOREACH (user IN users | DETACH DELETE user)`,
      { emails: [host.email, invitee.email] },
      { database: process.env.NEO4J_DATABASE || "neo4j", routing: "WRITE" },
    );
  } finally { await driver.close(); }
});

test("forbindelse, invitationspolitik og direkte sessioninvitation virker samlet", async ({ browser }) => {
  const hostContext = await browser.newContext();
  const inviteeContext = await browser.newContext();
  const hostPage = await hostContext.newPage();
  const inviteePage = await inviteeContext.newPage();
  try {
    for (const [context, person] of [[hostContext, host], [inviteeContext, invitee]] as const) {
      const response = await context.request.post("/api/auth/register", { data: person });
      expect(response.status()).toBe(201);
    }

    await hostPage.goto("/klatrere");
    await hostPage.getByLabel("Søg efter klatrere").fill(invitee.username);
    await hostPage.getByRole("button", { name: `Opret forbindelse med ${invitee.name}` }).click();
    await expect(hostPage.getByRole("button", { name: `Annullér forbindelsesanmodning til ${invitee.name}` })).toBeVisible();

    await inviteePage.goto("/klatrere");
    await inviteePage.getByLabel("Søg efter klatrere").fill(host.username);
    await inviteePage.getByRole("button", { name: `Acceptér forbindelse med ${host.name}` }).click();
    await expect(inviteePage.getByRole("button", { name: `Fjern forbindelse med ${host.name}` })).toBeVisible();

    const usersResponse = await hostContext.request.get(`/api/users?q=${encodeURIComponent(invitee.username)}`);
    const usersBody = await usersResponse.json();
    const inviteeId = usersBody.users[0].id as string;
    const date = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
    const sessionInput = { title: `Direkte invitation ${runId}`, date, time: "18:30", locationId: "gym-6", inviteeIds: [inviteeId] };

    const blockResponse = await inviteeContext.request.patch("/api/settings", { data: { sessionInvitePolicy: "none" } });
    expect(blockResponse.ok()).toBe(true);
    const forbidden = await hostContext.request.post("/api/sessions", { data: sessionInput });
    expect(forbidden.status()).toBe(403);

    const allowResponse = await inviteeContext.request.patch("/api/settings", { data: { sessionInvitePolicy: "connections" } });
    expect(allowResponse.ok()).toBe(true);
    const created = await hostContext.request.post("/api/sessions", { data: sessionInput });
    expect(created.status()).toBe(201);
    const createdBody = await created.json();

    await inviteeContext.request.post("/api/auth/logout");
    await inviteePage.goto("/login");
    await inviteePage.getByLabel("E-mail").fill(invitee.email);
    await inviteePage.getByLabel("Adgangskode").fill(invitee.password);
    await inviteePage.getByRole("button", { name: "Log ind" }).click();
    await expect(inviteePage).toHaveURL("/");

    const invitations = inviteePage.getByRole("region", { name: "Sessioninvitationer" });
    const card = invitations.getByRole("article").filter({ hasText: sessionInput.title });
    await expect(card.getByText(`Inviteret af ${host.name}`)).toBeVisible();
    await card.getByRole("button", { name: "Acceptér" }).click();
    await expect(card).not.toBeVisible();

    await inviteePage.goto(`/session/${createdBody.session.shareId}`);
    await expect(inviteePage.getByRole("heading", { name: "2 deltagere" })).toBeVisible();
    await expect(inviteePage.getByText(invitee.name, { exact: true })).toBeVisible();

    const sessionsResponse = await inviteeContext.request.get("/api/sessions");
    const sessionsBody = await sessionsResponse.json();
    const received = sessionsBody.sessions.find((session: { title: string }) => session.title === sessionInput.title);
    expect(received).toMatchObject({ viewerRole: "invitee", invitationStatus: "accepted", invitationReadAt: expect.any(String) });
    expect(received.participants.map((person: { name: string }) => person.name)).toEqual(expect.arrayContaining([host.name, invitee.name]));
  } finally {
    await hostContext.close();
    await inviteeContext.close();
  }
});
