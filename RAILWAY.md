# Railway deployment

Deploy this repository as the `web` service in the same Railway project and environment as the media service, MongoDB, Neo4j and the storage bucket. Railway detects the root `Dockerfile` automatically.

## Service settings

- Generate a public domain.
- Set the healthcheck path to `/api/health`.
- Keep the Dockerfile start command. It applies the idempotent Neo4j schema migration before starting Next.js; it does not seed test data.
- Do not attach a volume to the web service. User media is stored through the media service.

## Variables

Set these in the `web` service. Use Railway reference variables for services in the same project where possible.

```dotenv
AUTH_SECRET=<long-random-secret>
AUTH_COOKIE_SECURE=true
APP_URL=https://${{web.RAILWAY_PUBLIC_DOMAIN}}
NEO4J_URI=neo4j://<neo4j-private-domain>:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=<neo4j-password>
NEO4J_DATABASE=neo4j
MAIL_SERVICE_URL=https://bouldemailservice-production.up.railway.app
MAIL_SERVICE_API_KEY=<same-key-as-the-mail-service>
MEDIA_SERVICE_URL=http://${{media.RAILWAY_PRIVATE_DOMAIN}}:${{media.PORT}}
MEDIA_SERVICE_API_KEY=${{shared.MEDIA_SERVICE_API_KEY}}
```

`PORT` is injected by Railway and must not be hardcoded. The container listens on Railway's value automatically.

## Neo4j

Add Neo4j from Railway's template marketplace or use an external Neo4j Aura database. For a Railway-hosted Neo4j service, attach a persistent volume to `/data` and use its private domain from the web service. Keep the database in the same Railway project/environment to avoid public database traffic.

After deployment, verify:

1. `GET https://<web-domain>/api/health` returns `status: ok`.
2. Registration succeeds and a welcome email is delivered.
3. A media upload can be completed and viewed.

