import "server-only";
import { randomBytes } from "crypto";
import { database, db, neo4jNumber } from "@/lib/db";
import { listProjectMedia } from "@/lib/media-service";
import type {
  ClimbingGrade,
  ClimbingProject,
  ClimbingSession,
  ClimbingType,
  Post,
  ProjectFeedItem,
  User,
} from "@/types";

type PostNode = {
  id: string;
  description: string;
  route?: string;
  location?: string;
  grade?: ClimbingGrade;
  climbingType?: ClimbingType;
  image?: string;
  imageAlt?: string;
  likes: number;
  completed: boolean;
  isVideo: boolean;
  createdAt: { toString(): string } | string;
};
type ProjectNode = {
  id: string;
  name: string;
  location: string;
  grade: ClimbingGrade;
  colorGrade?: ClimbingProject["colorGrade"];
  attempts: number;
  lastAttempt: string;
  note: string;
  status: ClimbingProject["status"];
  progress: number;
  visible?: boolean;
  image?: string;
  placeSlug?: string;
  mapArea?: string;
  mapX?: number;
  mapY?: number;
  mapProblemId?: string;
  mapSlot?: number;
  removedAt?: string;
};
type SessionNode = {
  id: string;
  shareId: string;
  title: string;
  date: string;
  time: string;
  location: string;
  createdAt: { toString(): string } | string;
};
type SessionRecord = { get(key: string): unknown };
function publicPost(row: PostNode, user: User): Post {
  return {
    id: row.id,
    author: user,
    description: row.description,
    route: row.route,
    location: row.location,
    grade: row.grade,
    type: row.climbingType,
    image: row.image,
    imageAlt: row.imageAlt,
    likes: neo4jNumber(row.likes),
    completed: row.completed,
    isVideo: row.isVideo,
    createdAt: new Intl.DateTimeFormat("da-DK", { dateStyle: "medium" }).format(
      new Date(row.createdAt.toString()),
    ),
    comments: [],
  };
}
function publicProject(row: ProjectNode): ClimbingProject {
  return {
    id: row.id,
    name: row.name,
    location: row.location,
    grade: row.grade,
    colorGrade: row.colorGrade,
    attempts: neo4jNumber(row.attempts),
    lastAttempt: row.lastAttempt,
    note: row.note,
    status: row.status,
    progress: neo4jNumber(row.progress),
    visible: row.visible === true,
    image: row.image,
    placeSlug: row.placeSlug,
    mapPlacement: row.mapArea && row.mapX != null && row.mapY != null
      ? { areaId: row.mapArea, x: neo4jNumber(row.mapX), y: neo4jNumber(row.mapY) } : undefined,
    mapProblemId: row.mapProblemId,
    mapSlot: row.mapSlot != null ? neo4jNumber(row.mapSlot) as 1 | 2 : undefined,
    removedAt: row.removedAt?.toString(),
  };
}
export async function getUserPosts(user: User) {
  const result = await db.executeQuery(
    "MATCH (:User {id: $userId})-[:CREATED]->(p:Post) RETURN p ORDER BY p.createdAt DESC LIMIT 100",
    { userId: user.id },
    { database },
  );
  return result.records.map((record) =>
    publicPost(record.get("p").properties as PostNode, user),
  );
}
export async function createUserPost(
  user: User,
  input: { id?: string; description: string; media?: string; isVideo?: boolean },
) {
  const result = await db.executeQuery(
    `MATCH (u:User {id: $userId}) CREATE (u)-[:CREATED]->(p:Post { id: $id, description: $description, image: $image, imageAlt: $imageAlt, likes: 0, completed: false, isVideo: $isVideo, createdAt: datetime() }) RETURN p`,
    {
      userId: user.id,
      id: input.id || randomBytes(12).toString("hex"),
      description: input.description.trim(),
      image: input.media || null,
      imageAlt: input.media ? "Medie vedhæftet opslag" : null,
      isVideo: input.isVideo === true,
    },
    { database, routing: "WRITE" },
  );
  return publicPost(result.records[0].get("p").properties as PostNode, user);
}

export async function userOwnsPost(userId: string, postId: string) {
  const result = await db.executeQuery(
    "MATCH (:User {id: $userId})-[:CREATED]->(:Post {id: $postId}) RETURN count(*) > 0 AS owns",
    { userId, postId },
    { database },
  );
  return result.records[0]?.get("owns") === true;
}
export async function getUserProjects(userId: string) {
  const result = await db.executeQuery(
    "MATCH (:User {id: $userId})-[:WORKS_ON]->(p:Project) RETURN p ORDER BY p.createdAt DESC LIMIT 100",
    { userId },
    { database },
  );
  return result.records.map((record) =>
    publicProject(record.get("p").properties as ProjectNode),
  );
}
export async function createUserProject(
  userId: string,
  input: {
    id?: string;
    name: string;
    place: {
      id: string;
      slug: string;
      name: string;
      street: string;
      postalCode: string;
      city: string;
      image: string;
    };
    grade: ClimbingGrade;
    colorGrade?: ClimbingProject["colorGrade"];
    note: string;
    image?: string;
    attempt?: boolean;
    visible?: boolean;
    progress?: number;
    status?: ClimbingProject["status"];
    mapPlacement?: ClimbingProject["mapPlacement"];
    mapSlot?: 1 | 2;
  },
) {
  if (input.mapPlacement && (!input.colorGrade || ![1, 2].includes(input.mapSlot ?? 0))) throw new Error("Vælg farve og problem 1 eller 2 på væggen.");
  const mapped = Boolean(input.mapPlacement);
  const problemId = mapped ? `${input.place.slug}:${input.mapPlacement!.areaId}:${input.colorGrade}:${input.mapSlot}` : null;
  const result = await db.executeQuery(
    `MATCH (u:User {id: $userId})
     MERGE (place:Place {id: $placeId})
     SET place.slug = $placeSlug, place.name = $location, place.street = $street, place.postalCode = $postalCode, place.city = $city, place.image = $placeImage
     ${mapped ? `MERGE (b:MapProblem {id: $problemId})
       ON CREATE SET b.placeSlug = $placeSlug, b.areaId = $mapArea, b.colorGrade = $colorGrade, b.slot = $mapSlot, b.mapX = $mapX, b.mapY = $mapY, b.createdAt = datetime()
       WITH u, place, b WHERE b.removedAt IS NULL` : ''}
     CREATE (u)-[:WORKS_ON]->(p:Project {id: $id, name: $name, location: $location, placeSlug: $placeSlug, grade: $grade, colorGrade: $colorGrade, note: $note, image: $image, visible: $visible, attempts: 0, lastAttempt: 'Ikke forsøgt endnu', status: $status, progress: $progress,
       mapArea: $mapArea, mapX: ${mapped ? 'b.mapX' : '$mapX'}, mapY: ${mapped ? 'b.mapY' : '$mapY'}, mapProblemId: $problemId, mapSlot: $mapSlot, createdAt: datetime()})-[:AT_PLACE]->(place)
     ${mapped ? 'CREATE (p)-[:ON_PROBLEM]->(b)' : ''}
     RETURN p`,
    {
      userId,
      id: input.id || randomBytes(12).toString("hex"),
      name: input.name.trim(),
      placeId: input.place.id,
      placeSlug: input.place.slug,
      location: input.place.name,
      street: input.place.street,
      postalCode: input.place.postalCode,
      city: input.place.city,
      placeImage: input.place.image,
      grade: input.grade,
      colorGrade: input.colorGrade || null,
      note: input.note.trim(),
      image: input.image || input.place.image,
      visible: input.visible === true,
      progress: input.progress ?? 0,
      status: input.status || "Ny",
      problemId,
      mapSlot: input.mapSlot ?? null,
      mapArea: input.mapPlacement?.areaId ?? null,
      mapX: input.mapPlacement?.x ?? null,
      mapY: input.mapPlacement?.y ?? null,
    },
    { database, routing: "WRITE" },
  );
  return publicProject(result.records[0].get("p").properties as ProjectNode);
}
export async function setProjectVisibility(
  userId: string,
  projectId: string,
  visible: boolean,
) {
  const result = await db.executeQuery(
    "MATCH (:User {id: $userId})-[:WORKS_ON]->(p:Project {id: $projectId}) SET p.visible = $visible RETURN p",
    { userId, projectId, visible },
    { database, routing: "WRITE" },
  );
  return result.records[0]
    ? publicProject(result.records[0].get("p").properties as ProjectNode)
    : null;
}
export async function updateUserProject(
  userId: string,
  projectId: string,
  input: {
    progress: number;
    status: ClimbingProject["status"];
    grade: ClimbingGrade;
    note: string;
    colorGrade?: ClimbingProject["colorGrade"];
    image?: string;
    attempt?: boolean;
  },
) {
  const result = await db.executeQuery(
    `MATCH (:User {id: $userId})-[:WORKS_ON]->(p:Project {id: $projectId})
    WHERE p.mapProblemId IS NULL OR $colorGrade IS NULL OR p.colorGrade = $colorGrade
    SET p.progress = $progress, p.status = $status, p.note = $note, p.grade = $grade,
        p.colorGrade = CASE WHEN $colorGrade IS NULL THEN p.colorGrade ELSE $colorGrade END,
        p.image = CASE WHEN $image IS NULL THEN p.image ELSE $image END,
        p.updatedAt = datetime(),
        p.attempts = coalesce(p.attempts, 0) + CASE WHEN $attempt THEN 1 ELSE 0 END,
        p.lastAttempt = CASE WHEN $attempt THEN toString(date()) ELSE p.lastAttempt END
    RETURN p`,
    {
      userId,
      projectId,
      progress: input.progress,
      status: input.status,
      grade: input.grade,
      note: input.note.trim(),
      colorGrade: input.colorGrade || null,
      image: input.image || null,
      attempt: input.attempt === true,
    },
    { database, routing: "WRITE" },
  );
  return result.records[0]
    ? publicProject(result.records[0].get("p").properties as ProjectNode)
    : null;
}
export async function getVisibleConnectionProjects(userId: string) {
  const result = await db.executeQuery(
    `MATCH (:User {id: $userId})-[:FOLLOWS]->(owner:User)-[:WORKS_ON]->(p:Project {visible: true})
    RETURN p, owner ORDER BY p.createdAt DESC`,
    { userId },
    { database },
  );
  return result.records.map((record) => {
    const project = publicProject(record.get("p").properties as ProjectNode);
    const owner = record.get("owner").properties as {
      id: string;
      name: string;
      username: string;
    };
    return {
      ...project,
      note: "",
      owner: {
        id: owner.id,
        name: owner.name,
        username: owner.username,
        initials: initials(owner.name),
      },
    };
  });
}
export async function getFollowingProjectFeed(
  userId: string,
): Promise<ProjectFeedItem[]> {
  const result = await db.executeQuery(
    `MATCH (:User {id: $userId})-[:FOLLOWS]->(owner:User)-[:WORKS_ON]->(p:Project {visible: true})
    RETURN owner, p ORDER BY p.createdAt DESC LIMIT 30`,
    { userId },
    { database },
  );
  return Promise.all(
    result.records.map(async (record) => {
      const project = publicProject(record.get("p").properties as ProjectNode);
      const owner = record.get("owner").properties as {
        id: string;
        name: string;
        username: string;
      };
      const media = (await listProjectMedia(project.id)).slice(0, 4);
      const createdAt =
        (
          record.get("p").properties.createdAt as
            { toString(): string } | string | undefined
        )?.toString() || "";
      return {
        project: {
          ...project,
          note: "",
          owner: {
            id: owner.id,
            name: owner.name,
            username: owner.username,
            initials: initials(owner.name),
          },
        },
        media,
        createdAt,
      };
    }),
  );
}
export async function userOwnsProject(userId: string, projectId: string) {
  const result = await db.executeQuery(
    "MATCH (:User {id: $userId})-[:WORKS_ON]->(:Project {id: $projectId}) RETURN count(*) > 0 AS allowed",
    { userId, projectId },
    { database },
  );
  return result.records[0]?.get("allowed") === true;
}
export async function canViewProject(userId: string, projectId: string) {
  const result = await db.executeQuery(
    `MATCH (owner:User)-[:WORKS_ON]->(p:Project {id: $projectId}) RETURN owner.id = $userId OR p.visible = true AS allowed`,
    { userId, projectId },
    { database },
  );
  return result.records[0]?.get("allowed") === true;
}
export async function getProjectForViewer(userId: string, projectId: string) {
  const result = await db.executeQuery(
    `MATCH (owner:User)-[:WORKS_ON]->(p:Project {id: $projectId}) WITH owner, p, owner.id = $userId AS owns WHERE owns OR p.visible = true RETURN p, owner, owns`,
    { userId, projectId },
    { database },
  );
  const record = result.records[0];
  if (!record) return null;
  const project = publicProject(record.get("p").properties as ProjectNode);
  const owner = record.get("owner").properties as {
    id: string;
    name: string;
    username: string;
  };
  return {
    ...project,
    note: record.get("owns") ? project.note : "",
    owner: { ...owner, initials: initials(owner.name) },
  };
}
export async function registerProjectMedia(
  userId: string,
  projectId: string,
  mediaId: string,
) {
  const result = await db.executeQuery(
    `MATCH (:User {id: $userId})-[:WORKS_ON]->(p:Project {id: $projectId}) MERGE (p)-[:HAS_MEDIA]->(m:ProjectMedia {id: $mediaId}) SET p.attempts = coalesce(p.attempts, 0) + 1, p.lastAttempt = toString(date()) RETURN m`,
    { userId, projectId, mediaId },
    { database, routing: "WRITE" },
  );
  return result.records[0]?.get("m") !== undefined;
}
function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
function publicSession(
  record: SessionRecord,
  viewerId?: string,
): ClimbingSession {
  const session = (record.get("s") as { properties: SessionNode }).properties;
  const projectNode = record.get("p") as { properties: ProjectNode } | null;
  const host = (
    record.get("host") as { properties: { id: string; name: string } }
  ).properties;
  const guests = (record.get("guests") as Array<{ id?: string; name?: string }>)
    .filter((guest) => guest.id && guest.name)
    .map((guest) => ({
      id: guest.id!,
      name: guest.name!,
      initials: initials(guest.name!),
    }));
  const accepted = (
    record.get("accepted") as Array<{ id?: string; name?: string }>
  )
    .filter((user) => user.id && user.name)
    .map((user) => ({
      id: user.id!,
      name: user.name!,
      initials: initials(user.name!),
    }));
  const project = projectNode?.properties;
  const invitationStatus = record.get("invitationStatus") as
    ClimbingSession["invitationStatus"] | null;
  const invitationReadAt = record.get("invitationReadAt") as string | null;
  return {
    id: session.id,
    shareId: session.shareId,
    title: session.title,
    date: session.date,
    time: session.time,
    location: session.location,
    createdAt: session.createdAt.toString(),
    ...(project
      ? {
          project: { id: project.id, name: project.name, grade: project.grade, colorGrade: project.colorGrade, visible: project.visible === true },
        }
      : {}),
    host: { id: host.id, name: host.name, initials: initials(host.name) },
    participants: [
      { id: host.id, name: host.name, initials: initials(host.name) },
      ...accepted,
      ...guests,
    ],
    ...(viewerId === host.id
      ? { viewerRole: "host" as const }
      : invitationStatus
        ? {
            viewerRole: "invitee" as const,
            invitationStatus,
            ...(invitationReadAt ? { invitationReadAt } : {}),
          }
        : {}),
  };
}
export async function createClimbingSession(
  userId: string,
  input: {
    title: string;
    date: string;
    time: string;
    location: string;
    projectId?: string;
    inviteeIds?: string[];
  },
) {
  const result = await db.executeQuery(
    `MATCH (u:User {id: $userId})
    OPTIONAL MATCH (u)-[:WORKS_ON]->(p:Project {id: $projectId})
    CREATE (u)-[:HOSTS]->(s:ClimbingSession {id: $id, shareId: $shareId, title: $title, date: $date, time: $time, location: $location, createdAt: datetime()})
    FOREACH (_ IN CASE WHEN p IS NULL THEN [] ELSE [1] END | CREATE (s)-[:FOR_PROJECT]->(p))
    RETURN s`,
    {
      userId,
      projectId: input.projectId || null,
      id: randomBytes(12).toString("hex"),
      shareId: randomBytes(9).toString("base64url"),
      title: input.title.trim(),
      date: input.date,
      time: input.time,
      location: input.location.trim(),
    },
    { database, routing: "WRITE" },
  );
  const shareId = result.records[0].get("s").properties.shareId as string;
  const inviteeIds = Array.from(new Set(input.inviteeIds || []));
  if (inviteeIds.length)
    await db.executeQuery(
      `MATCH (host:User {id: $userId})-[:HOSTS]->(s:ClimbingSession {shareId: $shareId})
    UNWIND $inviteeIds AS inviteeId
    MATCH (host)-[:CONNECTED_WITH]-(invitee:User {id: inviteeId})
    MERGE (invitee)-[invitation:INVITED_TO]->(s)
    ON CREATE SET invitation.status = 'pending', invitation.invitedAt = datetime()`,
      { userId, shareId, inviteeIds },
      { database, routing: "WRITE" },
    );
  return getSharedSession(shareId, userId);
}
export async function getSharedSession(
  shareId: string,
  viewerId?: string,
): Promise<ClimbingSession | null> {
  const result = await db.executeQuery(
    `MATCH (host:User)-[:HOSTS]->(s:ClimbingSession {shareId: $shareId})
    OPTIONAL MATCH (s)-[:FOR_PROJECT]->(p:Project)
    OPTIONAL MATCH (s)<-[:JOINS]-(guest:SessionGuest)
    WITH s, p, host, collect(guest {.*}) AS guests
    OPTIONAL MATCH (accepted:User)-[:INVITED_TO {status: 'accepted'}]->(s)
    WITH s, p, host, guests, collect(accepted {.*}) AS accepted
    OPTIONAL MATCH (viewer:User {id: $viewerId})-[invitation:INVITED_TO]->(s)
    RETURN s, p, host, guests, accepted, invitation.status AS invitationStatus,
      toString(invitation.readAt) AS invitationReadAt`,
    { shareId, viewerId: viewerId || null },
    { database },
  );
  const record = result.records[0];
  if (!record) return null;
  const session = publicSession(record, viewerId);
  if (session.viewerRole) {
    const projects = await db.executeQuery(`MATCH (:ClimbingSession {shareId: $shareId})-[:SESSION_PROJECT]->(p:Project)<-[:WORKS_ON]-(owner:User)
      RETURN p, owner ORDER BY p.name`, { shareId }, { database });
    session.projects = projects.records.map(row => {
      const p = row.get("p").properties as ProjectNode;
      const owner = row.get("owner").properties as { id: string; name: string };
      return { id: p.id, name: p.name, grade: p.grade, colorGrade: p.colorGrade, ownerId: owner.id, ownerName: owner.name };
    });
  }
  return session;
}

export async function addSessionProject(userId: string, shareId: string, projectId: string) {
  const result = await db.executeQuery(`MATCH (u:User {id: $userId}), (s:ClimbingSession {shareId: $shareId})
    WHERE (u)-[:HOSTS]->(s) OR (u)-[:INVITED_TO]->(s)
    MATCH (u)-[:WORKS_ON]->(p:Project {id: $projectId})
    WHERE toLower(trim(p.location)) = toLower(trim(s.location)) AND p.status <> 'Gennemført'
    MERGE (s)-[:SESSION_PROJECT]->(p) RETURN s`, { userId, shareId, projectId }, { database, routing: "WRITE" });
  return result.records.length ? getSharedSession(shareId, userId) : null;
}

export async function updateClimbingSession(userId: string, shareId: string, input: { title: string; date: string; time: string; location: string }) {
  const result = await db.executeQuery(`MATCH (:User {id: $userId})-[:HOSTS]->(s:ClimbingSession {shareId: $shareId})
    SET s.title = $title, s.date = $date, s.time = $time, s.location = $location, s.updatedAt = datetime()
    WITH s
    OPTIONAL MATCH (s)-[link:FOR_PROJECT|SESSION_PROJECT]->(p:Project)
    WHERE toLower(trim(coalesce(p.location, ''))) <> toLower(trim($location))
    WITH s, collect(link) AS invalidLinks
    FOREACH (link IN invalidLinks | DELETE link)
    RETURN s`,
    { userId, shareId, ...input }, { database, routing: "WRITE" });
  return result.records.length ? getSharedSession(shareId, userId) : null;
}
export async function getUserSessions(
  userId: string,
): Promise<ClimbingSession[]> {
  const result = await db.executeQuery(
    `MATCH (u:User {id: $userId})
    MATCH (s:ClimbingSession) WHERE (u)-[:HOSTS]->(s) OR (u)-[:INVITED_TO]->(s)
    MATCH (host:User)-[:HOSTS]->(s)
    OPTIONAL MATCH (s)-[:FOR_PROJECT]->(p:Project)
    OPTIONAL MATCH (s)<-[:JOINS]-(guest:SessionGuest)
    WITH DISTINCT u, s, host, p, collect(DISTINCT guest {.*}) AS guests
    OPTIONAL MATCH (accepted:User)-[:INVITED_TO {status: 'accepted'}]->(s)
    WITH u, s, host, p, guests, collect(DISTINCT accepted {.*}) AS accepted
    OPTIONAL MATCH (u)-[invitation:INVITED_TO]->(s)
    RETURN s, p, host, guests, accepted, invitation.status AS invitationStatus,
      toString(invitation.readAt) AS invitationReadAt
    ORDER BY s.date, s.time`,
    { userId },
    { database },
  );
  return result.records.map((record) => publicSession(record, userId));
}
export async function respondToSessionInvitation(
  userId: string,
  shareId: string,
  status: "accepted" | "declined",
) {
  const result = await db.executeQuery(
    `MATCH (:User {id: $userId})-[invitation:INVITED_TO]->(s:ClimbingSession {shareId: $shareId})
    SET invitation.status = $status, invitation.respondedAt = datetime(), invitation.readAt = datetime()
    RETURN s.shareId AS shareId`,
    { userId, shareId, status },
    { database, routing: "WRITE" },
  );
  return result.records.length ? getSharedSession(shareId, userId) : null;
}
export async function inviteConnectionsToSession(
  hostId: string,
  shareId: string,
  inviteeIds: string[],
) {
  const result = await db.executeQuery(
    `MATCH (host:User {id: $hostId})-[:HOSTS]->(s:ClimbingSession {shareId: $shareId})
    UNWIND $inviteeIds AS inviteeId
    MATCH (host)-[:CONNECTED_WITH]-(invitee:User {id: inviteeId})
    MERGE (invitee)-[invitation:INVITED_TO]->(s)
    ON CREATE SET invitation.status = 'pending', invitation.invitedAt = datetime()
    RETURN count(invitation) AS invitationCount`,
    { hostId, shareId, inviteeIds },
    { database, routing: "WRITE" },
  );
  return result.records.length > 0;
}
export async function joinSharedSession(shareId: string, name: string) {
  const normalized = name.trim();
  const result = await db.executeQuery(
    `MATCH (s:ClimbingSession {shareId: $shareId})
    MERGE (g:SessionGuest {sessionId: s.id, normalizedName: toLower($name)})
    ON CREATE SET g.id = $id, g.name = $name, g.createdAt = datetime()
    MERGE (g)-[:JOINS]->(s) RETURN s.shareId AS shareId`,
    { shareId, name: normalized, id: randomBytes(12).toString("hex") },
    { database, routing: "WRITE" },
  );
  return result.records.length ? getSharedSession(shareId) : null;
}
