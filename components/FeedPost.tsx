"use client";
import Image from "next/image";
import { useState } from "react";
import { Bookmark, CheckCircle2, Heart, MapPin, MessageCircle, MoreHorizontal, Play, Send } from "lucide-react";
import type { Post } from "@/types";
import { Avatar } from "./ui/Avatar";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";

export function FeedPost({ post }: { post: Post }) {
  const [liked, setLiked] = useState(Boolean(post.initiallyLiked));
  const [saved, setSaved] = useState(Boolean(post.initiallySaved));
  const [commentsOpen, setCommentsOpen] = useState(false);
  return <article className="overflow-hidden rounded-[26px] border border-line bg-limestone shadow-soft">
    <div className="flex items-center gap-3 p-4 sm:p-5">
      <Avatar user={post.author} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-extrabold text-ink">{post.author.name}</p><p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted"><span>{post.createdAt}</span><span>·</span><MapPin size={12} /><span className="truncate">{post.location}</span></p></div>
      <Button variant="ghost" size="icon" aria-label={`Flere handlinger for ${post.author.name}s opslag`}><MoreHorizontal size={20} /></Button>
    </div>
    <div className="relative aspect-[4/3] overflow-hidden bg-pine">
      <Image src={post.image} alt={post.imageAlt} fill sizes="(max-width: 1024px) 100vw, 600px" className={`object-cover ${post.id === "p3" ? "scale-110 object-left" : ""}`} priority={post.id === "p1"} />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-pine/50 to-transparent" />
      {post.isVideo && <button aria-label="Afspil klatrevideo" className="absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-limestone/90 text-pine shadow-lg transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay"><Play className="ml-1" fill="currentColor" size={25} /></button>}
      {post.completed && <span className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-limestone/95 px-3 py-2 text-xs font-extrabold text-positive"><CheckCircle2 size={16} />Gennemført</span>}
    </div>
    <div className="p-4 sm:p-5">
      <div className="mb-3 flex items-center gap-2"><Badge>{post.type}</Badge><Badge tone="warm">{post.grade}</Badge><span className="ml-auto text-xs font-bold text-muted">{post.route}</span></div>
      <p className="text-sm leading-6 text-ink"><strong className="mr-1">{post.author.username}</strong>{post.description}</p>
      <div className="mt-4 flex items-center border-t border-line pt-3">
        <Button onClick={() => setLiked(!liked)} aria-pressed={liked} variant="ghost" size="sm" className={liked ? "text-clay" : ""}><Heart size={19} fill={liked ? "currentColor" : "none"} />{post.likes + (liked && !post.initiallyLiked ? 1 : !liked && post.initiallyLiked ? -1 : 0)}</Button>
        <Button onClick={() => setCommentsOpen(!commentsOpen)} aria-expanded={commentsOpen} variant="ghost" size="sm"><MessageCircle size={19} />{post.comments.length}</Button>
        <Button onClick={() => setSaved(!saved)} aria-pressed={saved} variant="ghost" size="icon" className="ml-auto" aria-label={saved ? "Fjern fra gemte opslag" : "Gem opslag"}><Bookmark size={19} fill={saved ? "currentColor" : "none"} /></Button>
      </div>
      {commentsOpen && <div className="mt-3 border-t border-line pt-4">
        {post.comments.length > 0 ? post.comments.map(c => <div key={c.id} className="mb-3 flex gap-2"><Avatar user={c.author} size="sm" /><p className="rounded-2xl bg-sand px-3 py-2 text-xs leading-5 text-ink"><strong className="mr-1">{c.author.name}</strong>{c.body}</p></div>) : <p className="mb-3 text-xs text-muted">Vær den første til at skrive en kommentar.</p>}
        <form onSubmit={e => e.preventDefault()} className="flex gap-2"><label className="sr-only" htmlFor={`comment-${post.id}`}>Skriv en kommentar</label><input id={`comment-${post.id}`} className="min-w-0 flex-1 rounded-full border border-line bg-sand px-4 text-sm outline-none focus:border-moss focus:ring-2 focus:ring-moss/20" placeholder="Skriv en kommentar…" /><Button size="icon" aria-label="Send kommentar"><Send size={17} /></Button></form>
      </div>}
    </div>
  </article>;
}
