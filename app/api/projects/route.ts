import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { SESSION_COOKIE, userFromSession } from "@/lib/auth";
import {
  createUserProject,
  getUserProjects,
  setProjectVisibility,
  updateUserProject,
} from "@/lib/user-data";
import type { ClimbingGrade, ProjectStatus } from "@/types";
import { placeById } from "@/lib/places";

const grades = new Set(["5+", "6A", "6B", "6C", "7A", "7A+", "7B", "7C", "8A"]);
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
  if (typeof grade !== "string" || !grades.has(grade))
    return NextResponse.json(
      { error: "Vælg en gyldig grade." },
      { status: 400 },
    );
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
  let image: string | undefined;
  if (imageFile instanceof File && imageFile.size > 0) {
    if (!imageFile.type.startsWith("image/"))
      return NextResponse.json(
        { error: "Vælg en gyldig billedfil." },
        { status: 400 },
      );
    if (imageFile.size > 8 * 1024 * 1024)
      return NextResponse.json(
        { error: "Billedet må højst fylde 8 MB." },
        { status: 400 },
      );
    const extension =
      imageFile.type
        .split("/")[1]
        ?.replace("jpeg", "jpg")
        .replace(/[^a-z0-9]/gi, "") || "jpg";
    const filename = `${randomBytes(12).toString("hex")}.${extension}`;
    const uploadDirectory = path.join(
      process.cwd(),
      "public",
      "uploads",
      "projects",
    );
    await mkdir(uploadDirectory, { recursive: true });
    await writeFile(
      path.join(uploadDirectory, filename),
      Buffer.from(await imageFile.arrayBuffer()),
    );
    image = `/api/uploads/projects/${filename}`;
  }
  const visible =
    body.get("visible") === "on" || body.get("visible") === "true";
  return NextResponse.json(
    {
      project: await createUserProject(user.id, {
        name,
        place,
        grade: grade as ClimbingGrade,
        note: typeof note === "string" ? note : "",
        image,
        visible,
        progress,
        status: status as ProjectStatus,
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
    const note = body.get("note");
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
      !statuses.has(status)
    )
      return NextResponse.json(
        { error: "Vælg gyldigt fremskridt og status." },
        { status: 400 },
      );
    let image: string | undefined;
    if (imageFile instanceof File && imageFile.size > 0) {
      if (
        !imageFile.type.startsWith("image/") ||
        imageFile.size > 8 * 1024 * 1024
      )
        return NextResponse.json(
          { error: "Billedet skal være en billedfil på højst 8 MB." },
          { status: 400 },
        );
      const extension =
        imageFile.type
          .split("/")[1]
          ?.replace("jpeg", "jpg")
          .replace(/[^a-z0-9]/gi, "") || "jpg";
      const filename = `${randomBytes(12).toString("hex")}.${extension}`;
      const uploadDirectory = path.join(
        process.cwd(),
        "public",
        "uploads",
        "projects",
      );
      await mkdir(uploadDirectory, { recursive: true });
      await writeFile(
        path.join(uploadDirectory, filename),
        Buffer.from(await imageFile.arrayBuffer()),
      );
      image = `/api/uploads/projects/${filename}`;
    }
    const project = await updateUserProject(user.id, id, {
      progress,
      status: status as ProjectStatus,
      note: typeof note === "string" ? note : "",
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
