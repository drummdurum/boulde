import { readFile } from "node:fs/promises";
import neo4j from "neo4j-driver";
import { climbingLocations } from "./climbing-locations.mjs";

if (!process.env.NEO4J_URI) {
  const env = await readFile(new URL("../.env.local", import.meta.url), "utf8");
  for (const line of env.split(/\r?\n/)) {
    const index = line.indexOf("=");
    if (index > 0) process.env[line.slice(0, index)] ??= line.slice(index + 1);
  }
}

const { NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD, NEO4J_DATABASE = "neo4j" } = process.env;
if (!NEO4J_URI || !NEO4J_USERNAME || !NEO4J_PASSWORD) throw new Error("Neo4j-konfiguration mangler.");

const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USERNAME, NEO4J_PASSWORD));
try {
  await driver.executeQuery(
    `UNWIND $locations AS location
     MERGE (l:ClimbingLocation {id: location.id})
     ON CREATE SET l.createdAt = datetime()
     SET l += location, l.updatedAt = datetime()`,
    { locations: climbingLocations },
    { database: NEO4J_DATABASE, routing: "WRITE" },
  );
  console.log(`${climbingLocations.length} klatrecentre er seedet i Neo4j.`);
} finally {
  await driver.close();
}
