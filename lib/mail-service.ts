import "server-only";

type WelcomeEmailInput = {
  id: string;
  email: string;
  name: string;
};

export async function requestWelcomeEmail(user: WelcomeEmailInput) {
  const serviceUrl = process.env.MAIL_SERVICE_URL || "http://localhost:3101";
  const apiKey = process.env.MAIL_SERVICE_API_KEY || "local-development-key";
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
