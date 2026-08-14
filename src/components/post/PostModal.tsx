"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/misc";
import { PostCard } from "./PostCard";
import type { Post } from "@/lib/types";
import { api } from "@/lib/client";

export function PostModal({
  post: initial,
  postId,
  open,
  onClose,
  onDeleted,
}: {
  post?: Post;
  postId?: string;
  open: boolean;
  onClose: () => void;
  onDeleted?: (id: string) => void;
}) {
  const [post, setPost] = useState<Post | null>(initial ?? null);
  const [loading, setLoading] = useState(!initial);

  useEffect(() => {
    if (initial) {
      setPost(initial);
      return;
    }
    if (open && postId) {
      setLoading(true);
      api
        .get<{ post: Post }>(`/api/posts/${postId}`)
        .then((r) => setPost(r.post))
        .catch(() => setPost(null))
        .finally(() => setLoading(false));
    }
  }, [open, postId, initial]);

  return (
    <Modal open={open} onClose={onClose} title="Post" className="sm:max-w-xl">
      {loading ? (
        <div className="grid place-items-center py-20">
          <Spinner />
        </div>
      ) : post ? (
        <div className="p-0 sm:p-3">
          <PostCard
            post={post}
            onDeleted={(id) => {
              onDeleted?.(id);
              onClose();
            }}
          />
        </div>
      ) : (
        <p className="py-16 text-center text-sm text-muted">This post is unavailable.</p>
      )}
    </Modal>
  );
}
