import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { SESSION_COOKIE, userFromSession } from "@/lib/auth";
import {
  createUserProject,
  getUserProjects,
  setProjectVisibility,
  updateUserProject,
  userOwnsProject,
} from "@/lib/user-data";
import type { ClimbingColor, ClimbingGrade, ProjectStatus } from "@/types";
import { climbingColors, climbingGrades } from "@/lib/grading";
import { placeById } from "@/lib/places";

import { uploadProjectCover } from "@/lib/media-service";

const grades = new Set(climbingGrades);
const colors = new Set(climbingColors);
async function currentUser() {
  return userFromSession(cookies().get(SESSION_COOKIE)?.value);
}

export async function GET() {
  const user = await currentUser();
  return user
    ? NextResponse.json({ projects: await getUserProjects(user.id) })
    : NextResponse.json({ error: "Du skal være logget ind." }, { status: 401 });
}
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user)
    return NextResponse.json(
      { error: "Du skal være logget ind." },
      { status: 401 },
    );
  const body = await request.formData();
  const name = body.get("name");
  const placeId = body.get("placeId");
  const grade = body.get("grade");
  const colorGrade = body.get("colorGrade");
  const note = body.get("note");
  const progressValue = body.get("progress");
  const status = body.get("status");
  const imageFile = body.get("image");
  const place = typeof placeId === "string" ? placeById(placeId) : undefined;
  if (typeof name !== "string" || !name.trim() || !place)
    return NextResponse.json(
      { error: "Udfyld projektnavn og vælg et gyldigt sted." },
      { status: 400 },
    );
  if (typeof grade !== "string" || !grades.has(grade as ClimbingGrade))
    return NextResponse.json(
      { error: "Vælg en gyldig grade." },
      { status: 400 },
    );
  if (colorGrade !== null && (typeof colorGrade !== "string" || !colors.has(colorGrade as ClimbingColor)))
    return NextResponse.json({ error: "Vælg en gyldig Boulders-farve." }, { status: 400 });
  const progress =
    typeof progressValue === "string" ? Number(progressValue) : 0;
  const statuses = new Set(["Ny", "Arbejder på den", "Tæt på", "Gennemført"]);
  if (
    !Number.isInteger(progress) ||
    progress < 0 ||
    progress > 100 ||
    typeof status !== "string" ||
    !statuses.has(status)
  )
    return NextResponse.json(
      { error: "Vælg gyldigt fremskridt og status." },
      { status: 400 },
    );
  const normalizedProgress = status === "Gennemført" ? 100 : progress;
  const normalizedStatus =
    normalizedProgress === 100 ? "Gennemført" : (status as ProjectStatus);
  const projectId = randomBytes(12).toString("hex");
  let image: string | undefined;
  if (imageFile instanceof Blob && imageFile.size > 0) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(imageFile.type))
      return NextResponse.json(
        { error: "Vælg en gyldig billedfil." },
        { status: 400 },
      );
    if (imageFile.size > 8 * 1024 * 1024)
      return NextResponse.json(
        { error: "Billedet må højst fylde 8 MB." },
        { status: 400 },
      );
    try {
      image = await uploadProjectCover(user.id, projectId, imageFile);
    } catch (error) {
      console.error("Project cover upload failed", error);
      return NextResponse.json({ error: "Billedet kunne ikke gemmes i medielageret." }, { status: 503 });
    }
  }
  const visible =
    body.get("visible") === "on" || body.get("visible") === "true";
  return NextResponse.json(
    {
      project: await createUserProject(user.id, {
        id: projectId,
        name,
        place,
        grade: grade as ClimbingGrade,
        colorGrade: typeof colorGrade === "string" ? colorGrade as ClimbingColor : undefined,
        note: typeof note === "string" ? note : "",
        image,
        visible,
        progress: normalizedProgress,
        status: normalizedStatus,
      }),
    },
    { status: 201 },
  );
}

export async function PATCH(request: Request) {
  const user = await currentUser();
  if (!user)
    return NextResponse.json(
      { error: "Du skal være logget ind." },
      { status: 401 },
    );
  if (request.headers.get("content-type")?.includes("multipart/form-data")) {
    const body = await request.formData();
    const id = body.get("id");
    const progressValue = body.get("progress");
    const status = body.get("status");
    const grade = body.get("grade");
    const note = body.get("note");
    const colorGrade = body.get("colorGrade");
    const imageFile = body.get("image");
    const progress =
      typeof progressValue === "string" ? Number(progressValue) : NaN;
    const statuses = new Set(["Ny", "Arbejder på den", "Tæt på", "Gennemført"]);
    if (
      typeof id !== "string" ||
      !Number.isInteger(progress) ||
      progress < 0 ||
      progress > 100 ||
      typeof status !== "string" ||
      typeof grade !== "string" ||
      !grades.has(grade as ClimbingGrade) ||
      (colorGrade !== null && (typeof colorGrade !== "string" || !colors.has(colorGrade as ClimbingColor))) ||
      !statuses.has(status)
    )
      return NextResponse.json(
        { error: "Vælg gyldigt fremskridt og status." },
        { status: 400 },
      );
    const normalizedProgress = status === "Gennemført" ? 100 : progress;
    const normalizedStatus =
      normalizedProgress === 100 ? "Gennemført" : (status as ProjectStatus);
    let image: string | undefined;
    if (imageFile instanceof Blob && imageFile.size > 0) {
      if (
        !["image/jpeg", "image/png", "image/webp"].includes(imageFile.type) ||
        imageFile.size > 8 * 1024 * 1024
      )
        return NextResponse.json(
          { error: "Billedet skal være en billedfil på højst 8 MB." },
          { status: 400 },
        );
      if (!await userOwnsProject(user.id, id))
        return NextResponse.json({ error: "Projektet blev ikke fundet." }, { status: 404 });
      try {
        image = await uploadProjectCover(user.id, id, imageFile);
      } catch (error) {
        console.error("Project cover upload failed", error);
        return NextResponse.json({ error: "Billedet kunne ikke gemmes i medielageret." }, { status: 503 });
      }
    }
    const project = await updateUserProject(user.id, id, {
      progress: normalizedProgress,
      status: normalizedStatus,
      grade: grade as ClimbingGrade,
      note: typeof note === "string" ? note : "",
      colorGrade: typeof colorGrade === "string" ? colorGrade as ClimbingColor : undefined,
      image,
      ...(body.get("attempt") === "true" ? { attempt: true } : {}),
    });
    return project
      ? NextResponse.json({ project })
      : NextResponse.json(
          { error: "Projektet blev ikke fundet." },
          { status: 404 },
        );
  }
  const body = await request.json();
  if (typeof body.id !== "string" || typeof body.visible !== "boolean")
    return NextResponse.json({ error: "Ugyldig synlighed." }, { status: 400 });
  const project = await setProjectVisibility(user.id, body.id, body.visible);
  return project
    ? NextResponse.json({ project })
    : NextResponse.json(
        { error: "Projektet blev ikke fundet." },
        { status: 404 },
      );
}
