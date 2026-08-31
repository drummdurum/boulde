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

const climbingLocations = [
  { id: "aarhus-city", name: "Boulders Aarhus City", region: "Jylland", address: "Ankersgade 12C, 8000 Aarhus C", hours: "08:00 – 23:00", mapsUrl: "https://maps.app.goo.gl/SMkpD26p5j75nn2Y8", imageUrl: "https://storage.googleapis.com/boulderscss/gyms/cards/aarhus-city.webp", instagramUrl: "https://www.instagram.com/bouldersaarhuscity", facebookUrl: "https://www.facebook.com/BouldersAarhusCity", email: "aarhusc@boulders.dk", phone: "+4572100019" },
  { id: "aarhus-nord", name: "Boulders Aarhus Nord", region: "Jylland", address: "Graham Bells Vej 18A, 8200 Aarhus N", hours: "10:00 – 22:00", mapsUrl: "https://maps.app.goo.gl/sRT8xMkaZa8EfCAb7", imageUrl: "https://storage.googleapis.com/boulderscss/gyms/cards/aarhus-nord.webp", instagramUrl: "https://www.instagram.com/bouldersaarhusnord/", facebookUrl: "https://www.facebook.com/BouldersAarhusNord", email: "aarhusn@boulders.dk", phone: "+4572100019" },
  { id: "aarhus-syd", name: "Boulders Aarhus Syd", region: "Jylland", address: "Søren Nymarks Vej 6A, 8270 Højbjerg", hours: "10:00 – 22:00", mapsUrl: "https://maps.app.goo.gl/ykPFxA977NuMVYiHA", imageUrl: "https://storage.googleapis.com/boulderscss/gyms/cards/aarhus-syd.webp", instagramUrl: "https://www.instagram.com/bouldersaarhussyd/", facebookUrl: "https://www.facebook.com/bouldersaarhussyd", email: "aarhuss@boulders.dk", phone: "+4572100019" },
  { id: "aarhus-aaby", name: "Boulders Aarhus Aaby", region: "Jylland", address: "Søren Frichs Vej 54, 8230 Aabyhøj", hours: "08:00 – 23:00", mapsUrl: "https://maps.app.goo.gl/gQ9ojNghX4zFGYTy8", imageUrl: "https://storage.googleapis.com/boulderscss/gyms/cards/aarhus-aaby.webp", instagramUrl: "https://www.instagram.com/bouldersaarhusaaby/", facebookUrl: "https://www.facebook.com/people/Boulders-Aarhus-Aaby/61572876531759/", email: "aaby@boulders.dk", phone: "+4572100019" },
  { id: "sydhavn", name: "Boulders Sydhavn", region: "Sjælland", address: "Bådehavnsgade 38, 2450 København", hours: "08:00 – 23:00", mapsUrl: "https://maps.app.goo.gl/VYk9wB4j5iCgHm4m6", imageUrl: "https://storage.googleapis.com/boulderscss/gyms/cards/sydhavn.webp", instagramUrl: "https://www.instagram.com/boulderscphsydhavn/", facebookUrl: "https://www.facebook.com/BouldersCphSydhavn/", email: "cph@boulders.dk", phone: "+4572100019" },
  { id: "valby", name: "Boulders Valby", region: "Sjælland", address: "Pakkerivej 27, 2500 Valby", hours: "09:00 – 22:00", mapsUrl: "https://maps.app.goo.gl/uksPR3vgLqsmZKWW9", imageUrl: "https://storage.googleapis.com/boulderscss/gyms/cards/valby.webp", instagramUrl: "https://www.instagram.com/bouldersvalby/", facebookUrl: "https://www.facebook.com/boulderscphvalby/", email: "valby@boulders.dk", phone: "+4572100019" },
  { id: "hvidovre", name: "Boulders Hvidovre", region: "Sjælland", address: "Strandmarksvej 20, 2650 Hvidovre", hours: "10:00 – 22:00", mapsUrl: "https://maps.app.goo.gl/YMWkJFwph9oNRE3e9", imageUrl: "https://storage.googleapis.com/boulderscss/gyms/cards/hvidovre.webp", instagramUrl: "https://www.instagram.com/bouldershvidovre/", facebookUrl: "https://www.facebook.com/bouldershvidovre/", email: "hvidovre@boulders.dk", phone: "+4572100019" },
  { id: "amager", name: "Boulders Amager", region: "Sjælland", address: "Amager Landevej 233, 2770 Kastrup", hours: "10:00 – 22:00", mapsUrl: "https://maps.app.goo.gl/txYC4v4z1yZHR6pw7", imageUrl: "https://storage.googleapis.com/boulderscss/gyms/cards/amager.webp", instagramUrl: "https://www.instagram.com/bouldersamager/", facebookUrl: "https://www.facebook.com/bouldersamager/", email: "amager@boulders.dk", phone: "+4572100019" },
  { id: "odense", name: "Boulders Odense", region: "Fyn", address: "Wichmandsgade 11, 5000 Odense C", hours: "10:00 – 22:00", mapsUrl: "https://maps.app.goo.gl/Dt2HbrRTWj44D2EN8", imageUrl: "https://storage.googleapis.com/boulderscss/gyms/cards/odense.webp", instagramUrl: "https://www.instagram.com/bouldersodense/", facebookUrl: "https://www.facebook.com/BouldersOdense", email: "odense@boulders.dk", phone: "+4572100019" },
  { id: "vanlose", name: "Boulders Vanløse", region: "Sjælland", address: "Vanløse Torv 1, Krone 2720 Vanløse", hours: "08:00 – 23:00", mapsUrl: "https://www.google.com/maps/dir/?api=1&destination=Jyllingevej+44,2720+Vanløse", imageUrl: "https://storage.googleapis.com/boulderscss/gyms/cards/vanlose.webp", instagramUrl: "https://www.instagram.com/bouldersvanloese/", facebookUrl: "https://www.facebook.com/bouldersvanloese", email: "hej@boulders.dk", phone: "+4572100019" },
  { id: "aalborg", name: "Boulders Aalborg", region: "Jylland", address: "Skjernvej 4A, 9220 Aalborg", hours: "10:00 – 22:00", mapsUrl: "https://maps.app.goo.gl/17Y9Hvyy57EC1Kjv5", imageUrl: "https://storage.googleapis.com/boulderscss/gyms/cards/aalborg.webp", instagramUrl: "https://www.instagram.com/bouldersaalborg/", facebookUrl: "https://www.facebook.com/bouldersaalborg", email: "aalborg@boulders.dk", phone: "+4522274941" },
].map(location => ({ ...location, chain: "Boulders", type: "Bouldering", country: "Danmark", hoursNote: "hver dag", status: "open" }));

const testProjects = [
  { id: "feed-project-alma-01", ownerEmail: "almanoor@test.boulde.local", name: "Den blå balance", location: "Boulders Valby", placeSlug: "boulders-valby", grade: "6B", status: "Tæt på", progress: 82, attempts: 9, lastAttempt: "2026-08-30", note: "Rolig venstre fod og hoften helt ind til væggen.", image: "/images/efraimstochter-bouldering-1138486_1920.jpg", media: [
    ["feed-media-alma-01", "image", "image/jpeg", "/images/efraimstochter-bouldering-1138486_1920.jpg", "Fandt endelig balancen i cruxet."],
    ["feed-media-alma-02", "video", "video/mp4", "/video/333699_medium.mp4", "Næsten helt igennem på dagens sidste forsøg."],
  ] },
  { id: "feed-project-jonas-01", ownerEmail: "jonasvester@test.boulde.local", name: "Kompressionshjørnet", location: "Boulders Aarhus City", placeSlug: "boulders-aarhus-city", grade: "7A", status: "Arbejder på den", progress: 58, attempts: 14, lastAttempt: "2026-08-29", note: "Skift højre tå før det lange flyt.", image: "/images/makamuki0-scaler-1175471_1920.jpg", media: [
    ["feed-media-jonas-01", "image", "image/jpeg", "/images/makamuki0-scaler-1175471_1920.jpg", "Ny beta på midtersektionen."],
    ["feed-media-jonas-02", "video", "video/mp4", "/video/357413_medium.mp4", "Test af den nye fodsekvens."],
  ] },
  { id: "feed-project-freja-01", ownerEmail: "frejam@test.boulde.local", name: "Orange overhæng", location: "Boulders Odense", placeSlug: "boulders-odense", grade: "6C", status: "Gennemført", progress: 100, attempts: 7, lastAttempt: "2026-08-28", note: "Sendt med hælkrog og et roligt sidste flyt.", image: "/images/maxmann-climb-2805903_1920.jpg", media: [
    ["feed-media-freja-01", "image", "image/jpeg", "/images/maxmann-climb-2805903_1920.jpg", "Topgrebet efter syv forsøg!"],
    ["feed-media-freja-02", "video", "video/mp4", "/video/939-141966814_medium.mp4", "Hele sendet fra start til top."],
  ] },
  { id: "feed-project-emil-01", ownerEmail: "emilholm@test.boulde.local", name: "Teknikpladen", location: "Boulders Aalborg", placeSlug: "boulders-aalborg", grade: "6A", status: "Ny", progress: 25, attempts: 3, lastAttempt: "2026-08-27", note: "Små skridt og vægten over venstre fod.", image: "/images/mekobi-bouldering-5021582_1920.jpg", media: [
    ["feed-media-emil-01", "image", "image/jpeg", "/images/mekobi-bouldering-5021582_1920.jpg", "Første session på pladen."],
    ["feed-media-emil-02", "image", "image/jpeg", "/images/422737-climbing-wall-486020_1920.jpg", "Oversigt over linjen og de små fødder."],
  ] },
].map(project => ({ ...project, visible: true }));

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
  await driver.executeQuery(
    `UNWIND $locations AS location
     MERGE (l:ClimbingLocation {id: location.id})
     ON CREATE SET l.createdAt = datetime()
     SET l += location, l.updatedAt = datetime()`,
    { locations: climbingLocations }, { database: NEO4J_DATABASE, routing: "WRITE" },
  );
  await driver.executeQuery(
    `MATCH (viewer:User {email: 'sedrumm@gmail.com'})
     UNWIND $ownerEmails AS ownerEmail
     MATCH (owner:User {email: ownerEmail})
     MERGE (viewer)-[:FOLLOWS]->(owner)`,
    { ownerEmails: testProjects.map(project => project.ownerEmail) }, { database: NEO4J_DATABASE, routing: "WRITE" },
  );
  await driver.executeQuery(
    `UNWIND $projects AS project
     MATCH (owner:User {email: project.ownerEmail})
     MERGE (p:Project {id: project.id})
     ON CREATE SET p.createdAt = datetime()
     SET p.name = project.name, p.location = project.location, p.placeSlug = project.placeSlug,
         p.grade = project.grade, p.status = project.status, p.progress = project.progress,
         p.attempts = project.attempts, p.lastAttempt = project.lastAttempt, p.note = project.note,
         p.image = project.image, p.visible = true, p.testData = true
     MERGE (owner)-[:WORKS_ON]->(p)
     WITH p, project
     UNWIND project.media AS media
     MERGE (m:ProjectMedia {id: media[0]})
     ON CREATE SET m.createdAt = datetime()
     SET m.type = media[1], m.contentType = media[2], m.publicUrl = media[3],
         m.note = media[4], m.size = 0, m.testData = true
     MERGE (p)-[:HAS_MEDIA]->(m)`,
    { projects: testProjects }, { database: NEO4J_DATABASE, routing: "WRITE" },
  );
  console.log(`${people.length} testpersoner, ${climbingLocations.length} klatrecentre og ${testProjects.length} feed-projekter er seedet i Neo4j. Login: test@boulde.local / Test1234!`);
} finally { await driver.close(); }
