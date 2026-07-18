import graphData from "@/data/graph.json";
import type { GraphEdge, GraphNode } from "@/lib/types";

const data = graphData as { nodes: GraphNode[]; edges: GraphEdge[] };

export function getGraph(focus?: string, depth = 2): { nodes: GraphNode[]; edges: GraphEdge[] } {
  if (!focus) return data;
  const keep = new Set<string>([focus]);
  let frontier = new Set<string>([focus]);
  for (let d = 0; d < depth; d++) {
    const next = new Set<string>();
    for (const e of data.edges) {
      if (frontier.has(e.src) && !keep.has(e.dst)) next.add(e.dst);
      if (frontier.has(e.dst) && !keep.has(e.src)) next.add(e.src);
    }
    next.forEach((n) => keep.add(n));
    frontier = next;
  }
  return {
    nodes: data.nodes.filter((n) => keep.has(n.id)),
    edges: data.edges.filter((e) => keep.has(e.src) && keep.has(e.dst)),
  };
}
