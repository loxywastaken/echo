"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, Trash2, Send } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Avatar } from "@/components/ui/Avatar";
import { Spinner, VerifiedBadge, EmptyState } from "@/components/ui/misc";
import { RichText } from "@/components/RichText";
import type { Comment, Post } from "@/lib/types";
import { api } from "@/lib/client";
import { useToast } from "@/context/ToastContext";
import { timeAgo, cn } from "@/lib/utils";

export function CommentsModal({
  open,
  onClose,
  post,
  onCountChange,
}: {
  open: boolean;
  onClose: () => void;
  post: Post;
  onCountChange?: (n: number) => void;
}) {
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    api
      .get<{ comments: Comment[] }>(`/api/posts/${post.id}/comments`)
      .then((r) => setComments(r.comments))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, post.id]);

  const total = comments.reduce((n, c) => n + 1 + (c.replies?.length ?? 0), 0);

  async function send() {
    if (!text.trim()) return;
    setSending(true);
    try {
      const { comment } = await api.post<{ comment: Comment }>(`/api/posts/${post.id}/comments`, {
        body: text,
        parentId: replyTo?.id,
      });
      if (replyTo) {
        setComments((cs) =>
          cs.map((c) => (c.id === replyTo.id ? { ...c, replies: [...(c.replies ?? []), comment], replyCount: c.replyCount + 1 } : c))
        );
      } else {
        setComments((cs) => [comment, ...cs]);
      }
      onCountChange?.(total + 1);
      setText("");
      setReplyTo(null);
    } catch (e: any) {
      toast(e?.message || "Could not post comment", "error");
    } finally {
      setSending(false);
    }
  }

  async function del(c: Comment, parentId?: string) {
    await api.del(`/api/comments/${c.id}`).catch(() => {});
    setComments((cs) =>
      parentId
        ? cs.map((p) => (p.id === parentId ? { ...p, replies: p.replies?.filter((r) => r.id !== c.id) } : p))
        : cs.filter((x) => x.id !== c.id)
    );
    onCountChange?.(Math.max(0, total - 1));
  }

  return (
    <Modal open={open} onClose={onClose} title={`Comments`} className="sm:max-w-lg h-[85vh] sm:h-[80vh]">
      <div className="flex h-full flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto thin-scrollbar px-4 py-4">
          {loading ? (
            <div className="grid place-items-center py-16">
              <Spinner />
            </div>
          ) : post.commentsDisabled ? (
            <EmptyState title="Comments are off" hint="The author turned off commenting for this post." />
          ) : comments.length === 0 ? (
            <EmptyState title="No comments yet" hint="Be the first to share your thoughts." />
          ) : (
            comments.map((c) => (
              <CommentRow key={c.id} comment={c} onReply={setReplyTo} onDelete={del} postOwner={post.isMine} />
            ))
          )}
        </div>

        {!post.commentsDisabled && (
          <div className="border-t border-border p-3">
            {replyTo && (
              <div className="mb-2 flex items-center justify-between rounded-lg bg-surface-2 px-3 py-1.5 text-xs text-muted">
                Replying to @{replyTo.author.username}
                <button onClick={() => setReplyTo(null)} className="text-faint hover:text-text">
                  Cancel
                </button>
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Add a comment…"
                className="input-base flex-1"
              />
              <button
                onClick={send}
                disabled={!text.trim() || sending}
                className="press grid h-10 w-10 place-items-center rounded-xl bg-accent-gradient text-white disabled:opacity-40"
              >
                <Send size={17} />
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

function CommentRow({
  comment,
  onReply,
  onDelete,
  postOwner,
  parentId,
}: {
  comment: Comment;
  onReply: (c: Comment) => void;
  onDelete: (c: Comment, parentId?: string) => void;
  postOwner: boolean;
  parentId?: string;
}) {
  const [liked, setLiked] = useState(comment.likedByMe);
  const [count, setCount] = useState(comment.likeCount);

  async function like() {
    setLiked((v) => !v);
    setCount((c) => (liked ? c - 1 : c + 1));
    await api.post(`/api/comments/${comment.id}/like`).catch(() => {});
  }

  return (
    <div className="flex gap-3">
      <Link href={`/${comment.author.username}`}>
        <Avatar src={comment.author.avatar} name={comment.author.displayName} size={34} />
      </Link>
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-snug">
          <Link href={`/${comment.author.username}`} className="mr-1.5 font-semibold hover:underline">
            {comment.author.username}
          </Link>
          {comment.author.isVerified && <VerifiedBadge size={12} className="mb-0.5 mr-1 inline" />}
          <RichText text={comment.body} />
        </p>
        <div className="mt-1 flex items-center gap-4 text-xs text-faint">
          <span>{timeAgo(comment.createdAt)}</span>
          {count > 0 && <span>{count} likes</span>}
          <button onClick={() => onReply(comment)} className="font-semibold hover:text-muted">
            Reply
          </button>
          {(comment.isMine || postOwner) && (
            <button onClick={() => onDelete(comment, parentId)} className="hover:text-danger">
              <Trash2 size={13} />
            </button>
          )}
        </div>

        {comment.replies?.map((r) => (
          <div key={r.id} className="mt-3">
            <CommentRow comment={r} onReply={onReply} onDelete={onDelete} postOwner={postOwner} parentId={comment.id} />
          </div>
        ))}
      </div>
      <button onClick={like} className="press self-start pt-1" aria-label="Like comment">
        <Heart size={14} className={cn(liked ? "fill-danger text-danger" : "text-faint hover:text-text")} />
      </button>
    </div>
  );
}
