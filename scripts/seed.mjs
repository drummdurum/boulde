import { readFile } from "node:fs/promises";
import { scryptSync } from "node:crypto";
import neo4j from "neo4j-driver";

if (!process.env.NEO4J_URI) { const env = await readFile(new URL("../.env.local", import.meta.url), "utf8"); for (const line of env.split(/\r?\n/)) { const index = line.indexOf("="); if (index > 0) process.env[line.slice(0, index)] ??= line.slice(index + 1); } }
const { NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD, NEO4J_DATABASE = "neo4j" } = process.env;
if (!NEO4J_URI || !NEO4J_USERNAME || !NEO4J_PASSWORD) throw new Error("Neo4j-konfiguration mangler.");

const people = [
  ["Test Klatrer", "testklatrer", "København"], ["Alma Noor", "almanoor", "Malmö"],
  ["Jonas Vester", "jonasvester", "Aarhus"], ["Freja Madsen", "frejam", "Odense"],
  ["Emil Holm", "emilholm", "Aalborg"], ["Sofie Lund", "sofielund", "Roskilde"],
  ["Malik Jensen", "malikj", "København"], ["Clara Berg", "claraberg", "Helsingør"],
  ["Noah Friis", "noahfriis", "Silkeborg"], ["Ida Storm", "idastorm", "Vejle"],
  ["Lucas Tran", "lucastran", "Malmö"], ["Anna Skov", "annaskov", "Bornholm"],
  ["Oscar Dahl", "oscardahl", "Aarhus"], ["Maja Lind", "majalind", "København"],
  ["Elias Frost", "eliasfrost", "Odense"], ["Nora Bak", "norabak", "Aalborg"],
  ["Aksel Winther", "akselw", "Roskilde"], ["Liv Hauge", "livhauge", "Vejle"],
  ["William Koch", "williamkoch", "Silkeborg"], ["Ella Nygaard", "ellanygaard", "Helsingør"],
].map(([name, username, location], index) => ({
  id: `test-user-${String(index + 1).padStart(2, "0")}`,
  name, username, location,
  email: index === 0 ? "test@boulde.local" : `${username}@test.boulde.local`,
  passwordHash: `boulde-test-seed:${scryptSync("Test1234!", "boulde-test-seed", 64).toString("hex")}`,
}));

const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USERNAME, NEO4J_PASSWORD));
try {
  await driver.executeQuery(
    `UNWIND $people AS person
     MERGE (u:User {email: person.email})
     ON CREATE SET u.id = person.id, u.createdAt = datetime()
     SET u.name = person.name, u.username = person.username, u.location = person.location,
         u.passwordHash = person.passwordHash, u.testData = true`,
    { people }, { database: NEO4J_DATABASE, routing: "WRITE" },
  );
  await driver.executeQuery(
    `UNWIND range(0, size($people) - 1) AS index
     MATCH (from:User {email: $people[index].email})
     MATCH (next:User {email: $people[(index + 1) % size($people)].email})
     MATCH (nextAgain:User {email: $people[(index + 2) % size($people)].email})
     MERGE (from)-[:FOLLOWS]->(next)
     MERGE (from)-[:FOLLOWS]->(nextAgain)`,
    { people }, { database: NEO4J_DATABASE, routing: "WRITE" },
  );
  console.log(`${people.length} testpersoner er seedet i Neo4j. Login: test@boulde.local / Test1234!`);
} finally { await driver.close(); }
