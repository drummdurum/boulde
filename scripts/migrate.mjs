import { readFile } from "node:fs/promises";
import neo4j from "neo4j-driver";

if (!process.env.NEO4J_URI) { const env = await readFile(new URL("../.env.local", import.meta.url), "utf8"); for (const line of env.split(/\r?\n/)) { const index = line.indexOf("="); if (index > 0) process.env[line.slice(0, index)] ??= line.slice(index + 1); } }
const { NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD, NEO4J_DATABASE = "neo4j" } = process.env;
if (!NEO4J_URI || !NEO4J_USERNAME || !NEO4J_PASSWORD) throw new Error("Neo4j-konfiguration mangler.");
const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USERNAME, NEO4J_PASSWORD));
try {
  await driver.verifyConnectivity();
  const schema = await readFile(new URL("../database/schema.cypher", import.meta.url), "utf8");
  for (const statement of schema.split(";").map(value => value.trim()).filter(Boolean)) await driver.executeQuery(statement, {}, { database: NEO4J_DATABASE, routing: "WRITE" });
  console.log("Neo4j-schema er opdateret.");
} finally { await driver.close(); }
