FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN NEO4J_URI=neo4j://neo4j:7687 NEO4J_USERNAME=neo4j NEO4J_PASSWORD=build-placeholder AUTH_SECRET=build-placeholder npm run build

FROM node:22-alpine AS migration
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY database ./database
COPY scripts ./scripts
CMD ["/bin/sh", "-c", "node scripts/migrate.mjs && node scripts/seed.mjs"]

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
COPY --from=build /app/database ./database
COPY --from=build /app/scripts ./scripts
RUN mkdir -p /app/public/uploads/projects /app/public/uploads/posts \
    && chown -R node:node /app/public/uploads
USER node
EXPOSE 3000
CMD ["/bin/sh", "-c", "node scripts/migrate.mjs && exec node server.js"]
