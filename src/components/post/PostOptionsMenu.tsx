"use client";

import { Modal } from "@/components/ui/Modal";
import type { Post } from "@/lib/types";
import { cn } from "@/lib/utils";

type Action = { label: string; onClick: () => void; danger?: boolean };

export function PostOptionsMenu({
  open,
  onClose,
  post,
  onEdit,
  onDelete,
  onToggleComments,
  onReport,
  onCopyLink,
}: {
  open: boolean;
  onClose: () => void;
  post: Post;
  onEdit: () => void;
  onDelete: () => void;
  onToggleComments: () => void;
  onReport: () => void;
  onCopyLink: () => void;
}) {
  const actions: Action[] = post.isMine
    ? [
        { label: "Edit caption", onClick: onEdit },
        { label: post.commentsDisabled ? "Turn on commenting" : "Turn off commenting", onClick: onToggleComments },
        { label: "Copy link", onClick: onCopyLink },
        { label: "Delete post", onClick: onDelete, danger: true },
      ]
    : [
        { label: "Report", onClick: onReport, danger: true },
        { label: "Copy link", onClick: onCopyLink },
        { label: "Go to post", onClick: onCopyLink },
      ];

  return (
    <Modal open={open} onClose={onClose} hideClose className="sm:max-w-xs">
      <div className="p-2">
        {actions.map((a) => (
          <button
            key={a.label}
            onClick={() => {
              a.onClick();
              onClose();
            }}
            className={cn(
              "press w-full rounded-xl px-4 py-3.5 text-center text-sm font-semibold hover:bg-surface-2",
              a.danger ? "text-danger" : "text-text"
            )}
          >
            {a.label}
          </button>
        ))}
        <button onClick={onClose} className="press mt-1 w-full rounded-xl px-4 py-3.5 text-center text-sm text-muted hover:bg-surface-2">
          Cancel
        </button>
      </div>
    </Modal>
  );
}
