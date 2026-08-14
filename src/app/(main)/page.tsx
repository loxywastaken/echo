import { StoriesBar } from "@/components/story/StoriesBar";
import { Feed } from "@/components/feed/Feed";
import { RightRail } from "@/components/feed/RightRail";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <div className="mx-auto flex max-w-6xl justify-center gap-10 px-0 sm:px-4">
      <div className="w-full max-w-[600px]">
        <StoriesBar />
        <div className="pt-0 sm:pt-6">
          <Feed />
        </div>
      </div>
      <aside className="hidden w-[300px] shrink-0 lg:block">
        <div className="sticky top-6">
          <RightRail />
        </div>
      </aside>
    </div>
  );
}
