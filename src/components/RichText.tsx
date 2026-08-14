import Link from "next/link";
import { tokenize } from "@/lib/utils";

/** Renders caption/comment text with #hashtags, @mentions and links made interactive. */
export function RichText({ text, className }: { text: string; className?: string }) {
  const tokens = tokenize(text);
  return (
    <span className={className}>
      {tokens.map((t, i) => {
        if (t.type === "hashtag")
          return (
            <Link key={i} href={`/explore?tag=${t.value.slice(1)}`} className="font-medium text-accent hover:underline">
              {t.value}
            </Link>
          );
        if (t.type === "mention")
          return (
            <Link key={i} href={`/${t.value.slice(1)}`} className="font-medium text-accent hover:underline">
              {t.value}
            </Link>
          );
        if (t.type === "url")
          return (
            <a key={i} href={t.value} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
              {t.value}
            </a>
          );
        return <span key={i}>{t.value}</span>;
      })}
    </span>
  );
}
