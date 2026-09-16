/* eslint-disable @next/next/no-img-element -- Authenticated media is fetched through the profile API. */
import type { User } from "@/types";

export function Avatar({ user, size = "md" }: { user: User; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "h-8 w-8 text-[10px]", md: "h-11 w-11 text-xs", lg: "h-14 w-14 text-sm" };
  return <span aria-label={`${user.name}s profilbillede`} role="img" className={`${sizes[size]} grid shrink-0 place-items-center overflow-hidden rounded-full bg-moss font-extrabold text-limestone ring-2 ring-limestone`}>{user.avatar ? <img src={user.avatar} alt="" className="h-full w-full object-cover" /> : user.initials}</span>;
}
