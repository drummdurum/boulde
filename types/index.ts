export type ClimbingGrade = "5+" | "6A" | "6B" | "6C" | "7A" | "7A+" | "7B" | "7C" | "8A";
export type ClimbingColor = "Grøn" | "Gul" | "Orange" | "Blå" | "Lilla" | "Rød" | "Sort" | "Pink";
export type ClimbingType = "Boulder" | "Sportsklatring" | "Indendørs";
export type ProjectStatus = "Ny" | "Arbejder på den" | "Tæt på" | "Gennemført";

export interface User {
  id: string; name: string; username: string; initials: string; location: string; avatar?: string; coverImage?: string; bio?: string;
}
export interface Comment {
  id: string; author: User; body: string; createdAt: string;
}
export interface Post {
  id: string; author: User; createdAt: string; description: string;
  location?: string; route?: string; type?: ClimbingType; grade?: ClimbingGrade;
  image?: string; imageAlt?: string; isVideo?: boolean;
  completed?: boolean; likes: number; comments: Comment[]; initiallyLiked?: boolean; initiallySaved?: boolean;
}
export interface ClimbingProject {
  id: string; name: string; location: string; grade: ClimbingGrade; attempts: number;
  colorGrade?: ClimbingColor;
  lastAttempt: string; note: string; status: ProjectStatus; progress: number; visible: boolean;
  image?: string; placeSlug?: string;
  mapPlacement?: { areaId: string; x: number; y: number };
  removedAt?: string;
  mapProblemId?: string;
  mapSlot?: 1 | 2;
  owner?: Pick<User, "id" | "name" | "username" | "initials">;
}
export interface ProjectMedia {
  id: string; projectId: string; type: "image" | "video"; contentType: string;
  size: number; note: string; url: string; createdAt: string;
}
export interface ProjectFeedItem {
  project: ClimbingProject;
  media: ProjectMedia[];
  createdAt: string;
}
export interface ClimbingSpot {
  id: string; name: string; area: string; type: ClimbingType; routes: number; image: string; imageAlt: string;
}
export interface ClimbingLocation {
  id: string; name: string; region: string; address: string; hours: string; hoursNote: string;
  placeSlug?: string;
  status: "open" | "closed"; type: string; chain: string; country: string; imageUrl: string;
  mapsUrl: string; instagramUrl?: string; facebookUrl?: string; email?: string; phone?: string;
}
export interface ClimbingSession {
  projects?: Array<Pick<ClimbingProject, "id" | "name" | "grade" | "colorGrade"> & { ownerId: string; ownerName: string }>;
  id: string; shareId: string; title: string; date: string; time: string; location: string;
  project?: Pick<ClimbingProject, "id" | "name" | "grade" | "colorGrade" | "visible">;
  host: Pick<User, "id" | "name" | "initials">;
  participants: Array<{ id: string; name: string; initials: string }>;
  viewerRole?: "host" | "invitee";
  invitationStatus?: "pending" | "accepted" | "declined";
  invitationReadAt?: string;
  createdAt: string;
}

export type SessionInvitee = Pick<User, "id" | "name" | "username" | "initials">;
