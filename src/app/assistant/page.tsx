import { AssistantChat } from "@/components/assistant-chat";

export const metadata = { title: "Study assistant · Lumen" };

export default function AssistantPage() {
  return (
    <div className="pt-10">
      <div className="mx-auto mb-6 max-w-3xl px-6">
        <p className="eyebrow mb-1">Ask Scripture</p>
        <h1 className="font-scripture text-3xl">Study assistant</h1>
      </div>
      <AssistantChat />
    </div>
  );
}
