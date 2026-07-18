import { KnowledgeGraph } from "@/components/knowledge-graph";
import { getGraph } from "@/lib/graph";

export const metadata = { title: "Knowledge graph · Lumen" };

export default function GraphPage() {
  const { nodes, edges } = getGraph();
  return (
    <div className="px-6 pb-16 pt-10">
      <div className="mx-auto mb-6 max-w-6xl">
        <p className="eyebrow mb-1">Explore connections</p>
        <h1 className="font-scripture text-3xl">Knowledge graph</h1>
        <p className="mt-1 max-w-xl text-sm text-muted">
          People, themes, events, and passages — and the relationships between them. Click any node to see its story and follow the thread.
        </p>
      </div>
      <KnowledgeGraph nodes={nodes} edges={edges} />
    </div>
  );
}
