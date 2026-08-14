import { Suspense } from "react";
import { ExploreClient } from "@/components/explore/ExploreClient";
import { Spinner } from "@/components/ui/misc";

export const dynamic = "force-dynamic";

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="grid place-items-center py-24"><Spinner /></div>}>
      <ExploreClient />
    </Suspense>
  );
}
