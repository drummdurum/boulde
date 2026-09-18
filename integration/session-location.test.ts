import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { database, db } from "@/lib/db";
import { updateClimbingSession } from "@/lib/user-data";

afterAll(async () => { await db.close(); });

describe("sessionens projekter ved skift af hal", () => {
  it("fjerner forkerte tilknytninger, bevarer projekterne og projekter i den nye hal", async () => {
    const runId = randomUUID();
    const hostId = `host-${runId}`; const shareId = `session-${runId}`;
    const oldId = `old-${runId}`; const newId = `new-${runId}`;
    try {
      await db.executeQuery(`CREATE (host:User {id: $hostId, name: 'Testvært', testRun: $runId})
        CREATE (host)-[:HOSTS]->(s:ClimbingSession {id: $shareId, shareId: $shareId, title: 'Testsession', date: '2026-10-01', time: '18:00', location: 'Gammel hal', createdAt: datetime(), testRun: $runId})
        CREATE (host)-[:WORKS_ON]->(old:Project {id: $oldId, name: 'Gammelt projekt', location: 'Gammel hal', grade: '6B', status: 'Ny', testRun: $runId})
        CREATE (host)-[:WORKS_ON]->(new:Project {id: $newId, name: 'Nyt projekt', location: 'Ny hal', grade: '6A', status: 'Ny', testRun: $runId})
        CREATE (s)-[:FOR_PROJECT]->(old)
        CREATE (s)-[:SESSION_PROJECT]->(old)
        CREATE (s)-[:SESSION_PROJECT]->(new)`, { hostId, shareId, oldId, newId, runId }, { database, routing: "WRITE" });

      const session = await updateClimbingSession(hostId, shareId, { title: "Ny titel", date: "2026-10-02", time: "19:00", location: "Ny hal" });
      expect(session).toMatchObject({ title: "Ny titel", date: "2026-10-02", time: "19:00", location: "Ny hal" });
      expect(session?.project).toBeUndefined();
      expect(session?.projects?.map(p => p.id)).toEqual([newId]);
      const remaining = await db.executeQuery("MATCH (p:Project {testRun: $runId}) RETURN p.id AS id ORDER BY id", { runId }, { database });
      expect(remaining.records.map(row => row.get("id")).sort()).toEqual([oldId, newId].sort());

      // Saving again keeps valid links and does not reintroduce old ones.
      const again = await updateClimbingSession(hostId, shareId, { title: "Ny titel", date: "2026-10-02", time: "19:00", location: "Ny hal" });
      expect(again?.projects?.map(p => p.id)).toEqual([newId]);
    } finally {
      await db.executeQuery("MATCH (n {testRun: $runId}) DETACH DELETE n", { runId }, { database, routing: "WRITE" });
    }
  });
});
