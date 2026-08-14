"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PostCard } from "@/components/post/PostCard";
import { Spinner, EmptyState } from "@/components/ui/misc";
import { api } from "@/lib/client";
import type { Post } from "@/lib/types";

export default function PostPermalink({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ post: Post }>(`/api/posts/${params.id}`)
      .then((r) => setPost(r.post))
      .catch(() => setPost(null))
      .finally(() => setLoading(false));
  }, [params.id]);

  return (
    <div className="mx-auto max-w-[540px] px-0 py-4 sm:px-4 sm:py-6">
      <button onClick={() => router.back()} className="press mb-4 ml-4 flex items-center gap-2 text-sm text-muted hover:text-text sm:ml-0">
        <ArrowLeft size={18} /> Back
      </button>
      {loading ? (
        <div className="grid place-items-center py-20"><Spinner /></div>
      ) : post ? (
        <PostCard post={post} onDeleted={() => router.push("/")} />
      ) : (
        <EmptyState title="Post unavailable" hint="It may have been deleted or is private." />
      )}
    </div>
  );
}
