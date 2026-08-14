import { MessagesClient } from "@/components/messages/MessagesClient";

export const dynamic = "force-dynamic";

export default function ConversationPage({ params }: { params: { id: string } }) {
  return <MessagesClient activeId={params.id} />;
}
