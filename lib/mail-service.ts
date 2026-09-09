import "server-only";

type WelcomeEmailInput = {
  id: string;
  email: string;
  name: string;
};

export async function requestWelcomeEmail(user: WelcomeEmailInput) {
  const serviceUrl = process.env.MAIL_SERVICE_URL || "http://localhost:3101";
  const apiKey = process.env.MAIL_SERVICE_API_KEY || "local-development-key-boulde-00000000";
  const response = await fetch(`${serviceUrl}/emails/welcome`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": apiKey },
    body: JSON.stringify({ userId: user.id, recipient: user.email, data: { name: user.name } }),
    signal: AbortSignal.timeout(3_000),
    cache: "no-store"
  });

  if (!response.ok) throw new Error(`Mailservicen svarede med HTTP ${response.status}.`);
  return response.json() as Promise<{ jobId: string; status: "QUEUED" }>;
}

type SessionInvitationEmailInput = {
  eventId: string; userId: string; recipient: string;
  data: { recipientName: string; hostName: string; sessionTitle: string; date: string; time: string; location: string; sessionUrl: string };
};
type ConnectionRequestEmailInput = {
  eventId: string; userId: string; recipient: string;
  data: { recipientName: string; senderName: string; connectionsUrl: string };
};

async function requestEmail(path: string, payload: SessionInvitationEmailInput | ConnectionRequestEmailInput) {
  const serviceUrl = process.env.MAIL_SERVICE_URL || "http://localhost:3101";
  const apiKey = process.env.MAIL_SERVICE_API_KEY || "local-development-key-boulde-00000000";
  const response = await fetch(`${serviceUrl}${path}`, {
    method: "POST", headers: { "content-type": "application/json", "x-api-key": apiKey },
    body: JSON.stringify(payload), signal: AbortSignal.timeout(3_000), cache: "no-store"
  });
  if (!response.ok) throw new Error(`Mailservicen svarede med HTTP ${response.status}.`);
  return response.json() as Promise<{ jobId: string; status: "QUEUED" }>;
}

export function requestSessionInvitationEmail(input: SessionInvitationEmailInput) {
  return requestEmail("/emails/session-invitation", input);
}

export function requestConnectionRequestEmail(input: ConnectionRequestEmailInput) {
  return requestEmail("/emails/connection-request", input);
}
