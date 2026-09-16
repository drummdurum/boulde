import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, updateUserProfile, userFromSession } from "@/lib/auth";
import { uploadProfileImage } from "@/lib/media-service";

export async function PATCH(request: Request) {
  const user = await userFromSession(cookies().get(SESSION_COOKIE)?.value);
  if (!user) return NextResponse.json({ error: "Du skal være logget ind." }, { status: 401 });
  const form = await request.formData();
  const name = form.get("name"); const username = form.get("username");
  const location = form.get("location"); const bio = form.get("bio");
  if (typeof name !== "string" || !name.trim() || name.trim().length > 100 || typeof username !== "string" || !/^[a-zA-Z0-9_]{3,24}$/.test(username))
    return NextResponse.json({ error: "Udfyld navn og et brugernavn på 3–24 tegn med bogstaver, tal eller _." }, { status: 400 });
  if (typeof location !== "string" || location.length > 100 || typeof bio !== "string" || bio.length > 500)
    return NextResponse.json({ error: "By må højst være 100 tegn, og beskrivelsen højst 500 tegn." }, { status: 400 });
  const avatar = form.get("avatar"); const cover = form.get("cover");
  for (const file of [avatar, cover]) {
    if (file instanceof Blob && file.size > 0 && (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 8 * 1024 * 1024))
      return NextResponse.json({ error: "Vælg et JPG-, PNG- eller WebP-billede på højst 8 MB." }, { status: 400 });
  }
  try {
    let avatarUrl: string | undefined; let coverUrl: string | undefined;
    try {
      if (avatar instanceof Blob && avatar.size > 0) avatarUrl = await uploadProfileImage(user.id, avatar, "avatar");
      if (cover instanceof Blob && cover.size > 0) coverUrl = await uploadProfileImage(user.id, cover, "cover");
    } catch (error) {
      console.error("Profile image upload failed", error);
      return NextResponse.json({ error: "Billedet kunne ikke gemmes i medielageret. Prøv igen." }, { status: 503 });
    }
    const updated = await updateUserProfile(user.id, { name: name.trim(), username: username.toLowerCase(), location: location.trim(), bio: bio.trim(), avatar: avatarUrl, coverImage: coverUrl });
    return NextResponse.json({ user: updated });
  } catch (error) {
    if ((error as { code?: string }).code === "Neo.ClientError.Schema.ConstraintValidationFailed")
      return NextResponse.json({ error: "Brugernavnet er allerede taget." }, { status: 409 });
    console.error("Profile update failed", error);
    return NextResponse.json({ error: "Profilen kunne ikke gemmes. Prøv igen." }, { status: 500 });
  }
}
