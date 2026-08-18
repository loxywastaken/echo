"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, MapPin } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { VerifiedBadge } from "@/components/ui/misc";
import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { RichText } from "@/components/RichText";
import { MediaCarousel } from "./MediaCarousel";
import { CommentsModal } from "./CommentsModal";
import { PostOptionsMenu } from "./PostOptionsMenu";
import { ReportModal } from "@/components/ReportModal";
import type { Post } from "@/lib/types";
import { api } from "@/lib/client";
import { useToast } from "@/context/ToastContext";
import { cn, formatCount, timeAgo } from "@/lib/utils";

export function PostCard({ post: initial, onDeleted }: { post: Post; onDeleted?: (id: string) => void }) {
  const { toast } = useToast();
  const [post, setPost] = useState(initial);
  const [liked, setLiked] = useState(initial.likedByMe);
  const [likeCount, setLikeCount] = useState(initial.likeCount);
  const [saved, setSaved] = useState(initial.savedByMe);
  const [commentCount, setCommentCount] = useState(initial.commentCount);
  const [burst, setBurst] = useState(false);
  const [expand, setExpand] = useState(false);

  const [comments, setComments] = useState(false);
  const [options, setOptions] = useState(false);
  const [report, setReport] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [caption, setCaption] = useState(initial.caption);

  async function toggleLike(fromDouble = false) {
    if (fromDouble && liked) {
      setBurst(true);
      setTimeout(() => setBurst(false), 700);
      return;
    }
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => c + (next ? 1 : -1));
    if (next) {
      setBurst(true);
      setTimeout(() => setBurst(false), 700);
    }
    try {
      const r = await api.post(`/api/posts/${post.id}/like`);
      setLiked(r.liked);
      setLikeCount(r.likeCount);
    } catch {
      setLiked(!next);
      setLikeCount((c) => c + (next ? -1 : 1));
    }
  }

  async function toggleSave() {
    const next = !saved;
    setSaved(next);
    try {
      await api.post(`/api/posts/${post.id}/save`);
      toast(next ? "Saved" : "Removed from saved", "success");
    } catch {
      setSaved(!next);
    }
  }

  function share() {
    const url = `${location.origin}/p/${post.id}`;
    navigator.clipboard?.writeText(url).then(
      () => toast("Link copied to clipboard", "success"),
      () => toast(url, "info")
    );
  }

  async function saveCaption() {
    try {
      const { post: updated } = await api.patch<{ post: Post }>(`/api/posts/${post.id}`, { caption });
      setPost(updated);
      setEditing(false);
      toast("Caption updated", "success");
    } catch (e: any) {
      toast(e?.message || "Could not update", "error");
    }
  }

  async function toggleComments() {
    try {
      const { post: updated } = await api.patch<{ post: Post }>(`/api/posts/${post.id}`, {
        commentsDisabled: !post.commentsDisabled,
      });
      setPost(updated);
      toast(updated.commentsDisabled ? "Commenting turned off" : "Commenting turned on", "success");
    } catch {
      toast("Could not update", "error");
    }
  }

  async function del() {
    setDeleting(true);
    try {
      await api.del(`/api/posts/${post.id}`);
      onDeleted?.(post.id);
      toast("Post deleted", "success");
    } catch {
      toast("Could not delete", "error");
      setDeleting(false);
      setConfirmDel(false);
    }
  }

  return (
    <article className="border-b border-border pb-3 sm:card sm:mb-5 sm:overflow-hidden sm:pb-0">
      {/* header */}
      <header className="flex items-center gap-3 px-3 py-3 sm:px-4">
        <Link href={`/${post.author.username}`}>
          <Avatar src={post.author.avatar} name={post.author.displayName} size={38} ring={post.isClip ? null : undefined} />
        </Link>
        <div className="min-w-0 flex-1 leading-tight">
          <div className="flex items-center gap-1">
            <Link href={`/${post.author.username}`} className="truncate text-sm font-semibold hover:underline">
              {post.author.username}
            </Link>
            {post.author.isVerified && <VerifiedBadge size={14} type={post.author.badgeType || "blue"} />}
            <span className="text-faint">Â·</span>
            <span className="shrink-0 text-xs text-faint">{timeAgo(post.createdAt)}</span>
          </div>
          {post.location && (
            <span className="flex items-center gap-0.5 text-xs text-muted">
              <MapPin size={11} /> {post.location}
            </span>
          )}
        </div>
        <button onClick={() => setOptions(true)} className="press text-muted hover:text-text" aria-label="Options">
          <MoreHorizontal size={22} />
        </button>
      </header>

      {/* media */}
      <div className="relative">
        <MediaCarousel media={post.media} onDoubleTap={() => toggleLike(true)} />
        {burst && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <Heart size={96} className="animate-heart-pop fill-white text-white drop-shadow-lg" />
          </div>
        )}
      </div>

      {/* actions */}
      <div className="flex items-center gap-4 px-3 pt-3 sm:px-4">
        <button onClick={() => toggleLike()} className="press" aria-label="Like">
          <Heart size={25} className={cn(liked ? "fill-danger text-danger" : "text-text hover:text-muted")} />
        </button>
        <button onClick={() => setComments(true)} className="press" aria-label="Comment">
          <MessageCircle size={24} className="text-text hover:text-muted" />
        </button>
        <button onClick={share} className="press" aria-label="Share">
          <Send size={23} className="text-text hover:text-muted" />
        </button>
        <button onClick={toggleSave} className="press ml-auto" aria-label="Save">
          <Bookmark size={24} className={cn(saved ? "fill-text text-text" : "text-text hover:text-muted")} />
        </button>
      </div>

      {/* counts + caption */}
      <div className="space-y-1 px-3 pt-2 text-sm sm:px-4">
        {likeCount > 0 && <p className="font-semibold">{formatCount(likeCount)} {likeCount === 1 ? "like" : "likes"}</p>}
        {(post.caption || caption) && (
          <p className={cn(!expand && "line-clamp-3")}>
            <Link href={`/${post.author.username}`} className="mr-1.5 font-semibold hover:underline">
              {post.author.username}
            </Link>
            <RichText text={caption} />
            {!expand && caption.length > 120 && (
              <button onClick={() => setExpand(true)} className="ml-1 text-faint">more</button>
            )}
          </p>
        )}
        {post.taggedUsers.length > 0 && (
          <p className="text-xs text-faint">
            With {post.taggedUsers.map((u) => `@${u.username}`).join(", ")}
          </p>
        )}
        {commentCount > 0 && (
          <button onClick={() => setComments(true)} className="block text-faint hover:text-muted">
            View {commentCount === 1 ? "1 comment" : `all ${formatCount(commentCount)} comments`}
          </button>
        )}
        {post.commentsDisabled && <p className="text-xs text-faint">Comments are turned off</p>}
      </div>

      {/* modals */}
      <CommentsModal open={comments} onClose={() => setComments(false)} post={{ ...post, caption }} onCountChange={setCommentCount} />
      <PostOptionsMenu
        open={options}
        onClose={() => setOptions(false)}
        post={post}
        onEdit={() => setEditing(true)}
        onDelete={() => setConfirmDel(true)}
        onToggleComments={toggleComments}
        onReport={() => setReport(true)}
        onCopyLink={share}
      />
      <ReportModal open={report} onClose={() => setReport(false)} targetType="post" targetId={post.id} />
      <ConfirmModal
        open={confirmDel}
        onClose={() => setConfirmDel(false)}
        onConfirm={del}
        loading={deleting}
        danger
        title="Delete this post?"
        message="This can't be undone."
        confirmLabel="Delete"
      />
      <Modal open={editing} onClose={() => setEditing(false)} title="Edit caption" className="sm:max-w-md">
        <div className="space-y-3 p-4">
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={5}
            className="input-base resize-none"
            placeholder="Write a captionâ¦"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => { setCaption(post.caption); setEditing(false); }}>Cancel</Button>
            <Button variant="primary" onClick={saveCaption}>Save</Button>
          </div>
        </div>
      </Modal>
    </article>
  );
}
