import { readFile } from "node:fs/promises";
import { scryptSync } from "node:crypto";
import neo4j from "neo4j-driver";

if (!process.env.NEO4J_URI) {
  const env = await readFile(new URL("../.env.local", import.meta.url), "utf8");
  for (const line of env.split(/\r?\n/)) {
    const index = line.indexOf("=");
    if (index > 0) process.env[line.slice(0, index)] ??= line.slice(index + 1);
  }
}
const projects = JSON.parse(await readFile(new URL("./gym-map-test-data.json", import.meta.url), "utf8"));
const people = ["alma", "jonas", "freja"].map(name => ({ id: `map-test-user-${name}`, username: `korttest_${name}`, name: `Korttest ${name[0].toUpperCase()}${name.slice(1)}`, email: `korttest_${name}@test.boulde.local`, passwordHash: `boulde-map-seed:${scryptSync("Test1234!", "boulde-map-seed", 64).toString("hex")}` }));
const counts = new Map();
for (const p of projects) {
  const key = `${p.areaId}:${p.colorGrade}`;
  const slot = (counts.get(key) ?? 0) + 1;
  if (slot > 2) throw new Error(`For mange testproblemer i ${key}`);
  counts.set(key, slot);
  p.mapSlot = slot;
  p.problemId = `boulders-kbh-sydhavn:${p.areaId}:${p.colorGrade}:${slot}`;
}
const driver = neo4j.driver(process.env.NEO4J_URI, neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD));
const database = process.env.NEO4J_DATABASE || "neo4j";
try {
  await driver.executeQuery("CREATE CONSTRAINT map_problem_id IF NOT EXISTS FOR (b:MapProblem) REQUIRE b.id IS UNIQUE", {}, { database, routing: "WRITE" });
  await driver.executeQuery(`UNWIND $people AS person
    MERGE (u:User {email: person.email})
    ON CREATE SET u.id = person.id, u.name = person.name, u.username = person.username, u.passwordHash = person.passwordHash, u.location = 'København', u.testData = true, u.createdAt = datetime()`, { people }, { database, routing: "WRITE" });
  await driver.executeQuery(`UNWIND $projects AS item
    MATCH (u:User {email: 'korttest_' + item.owner + '@test.boulde.local'})
    MERGE (b:MapProblem {id: item.problemId})
    ON CREATE SET b.placeSlug = 'boulders-kbh-sydhavn', b.areaId = item.areaId, b.colorGrade = item.colorGrade, b.slot = item.mapSlot, b.mapX = item.mapX, b.mapY = item.mapY, b.testData = true, b.createdAt = datetime()
    WITH u, b, item WHERE b.removedAt IS NULL
    MERGE (p:Project {id: item.id})
    ON CREATE SET p.name = item.name, p.location = 'Boulders KBH Sydhavn', p.placeSlug = 'boulders-kbh-sydhavn', p.grade = item.grade, p.colorGrade = item.colorGrade, p.status = item.status, p.progress = item.progress, p.attempts = 3, p.lastAttempt = 'Testdata', p.note = 'Testprojekt til vægkortet', p.image = '/images/nordic-boulder.png', p.visible = true, p.testData = true, p.createdAt = datetime(), p.mapArea = item.areaId, p.mapX = b.mapX, p.mapY = b.mapY, p.mapSlot = item.mapSlot, p.mapProblemId = b.id
    MERGE (u)-[:WORKS_ON]->(p)
    MERGE (p)-[:ON_PROBLEM]->(b)
    MERGE (place:Place {id: 'gym-6'})
    ON CREATE SET place.name = 'Boulders KBH Sydhavn', place.slug = 'boulders-kbh-sydhavn'
    MERGE (p)-[:AT_PLACE]->(place)`, { projects }, { database, routing: "WRITE" });
  await driver.executeQuery(`UNWIND $people AS person
    MATCH (u:User {email: person.email})
    UNWIND $people AS other WITH u, person, other WHERE person.email <> other.email
    MATCH (target:User {email: other.email})
    MERGE (u)-[follow:FOLLOWS]->(target) ON CREATE SET follow.testData = true`, { people }, { database, routing: "WRITE" });
  console.log("3 korttestbrugere og 42 testprojekter er oprettet. Testbrugerne følger hinanden til dashboard-test. Eksisterende data bevares. Login: korttest_alma@test.boulde.local / Test1234!");
} finally { await driver.close(); }
