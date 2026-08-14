import { ProfileClient } from "@/components/profile/ProfileClient";

export const dynamic = "force-dynamic";

export default function ProfilePage({ params }: { params: { username: string } }) {
  return <ProfileClient username={params.username.toLowerCase()} />;
}
