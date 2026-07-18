"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  forceCenter, forceCollide, forceLink, forceManyBody, forceSimulation,
  type SimulationLinkDatum, type SimulationNodeDatum,
} from "d3-force";
import { X } from "lucide-react";
import type { GraphEdge, GraphNode } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge } from "./ui/badge";

interface SimNode extends SimulationNodeDatum, GraphNode {}
interface SimLink extends SimulationLinkDatum<SimNode> { relation: string }

const KIND_COLOR: Record<string, string> = {
  PERSON: "rgb(56 88 134)",   // lapis
  THEME: "rgb(107 128 98)",   // sage
  CONCEPT: "rgb(158 122 34)", // gilt
  EVENT: "rgb(146 94 62)",
  PLACE: "rgb(120 104 140)",
  VERSE: "rgb(96 108 122)",
  BOOK: "rgb(70 84 100)",
};

const KIND_R: Record<string, number> = {
  PERSON: 26, THEME: 22, CONCEPT: 20, EVENT: 22, PLACE: 18, VERSE: 14, BOOK: 22,
};

const kindColor = (k: string) => KIND_COLOR[k] ?? "rgb(96 108 122)";
const kindR = (k: string) => KIND_R[k] ?? 18;
const verseRefOf = (n: GraphNode) => (n.kind === "VERSE" ? n.id.split(":")[1] : undefined);

export function KnowledgeGraph({ nodes, edges }: { nodes: GraphNode[]; edges: GraphEdge[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [sim, setSim] = useState<{ nodes: SimNode[]; links: SimLink[] } | null>(null);
  const [selected, setSelected] = useState<SimNode | null>(null);
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  const drag = useRef<{ node?: SimNode; panning?: boolean; px: number; py: number }>({ px: 0, py: 0 });
  const W = 900, H = 620;

  useEffect(() => {
    const ns: SimNode[] = nodes.map((n) => ({ ...n }));
    const ls: SimLink[] = edges.map((e) => ({ source: e.src, target: e.dst, relation: e.relation }));
    const simulation = forceSimulation(ns)
      .force("link", forceLink<SimNode, SimLink>(ls).id((d) => d.id).distance(110).strength(0.5))
      .force("charge", forceManyBody().strength(-320))
      .force("center", forceCenter(W / 2, H / 2))
      .force("collide", forceCollide<SimNode>().radius((d) => kindR(d.kind) + 14))
      .stop();
    for (let i = 0; i < 300; i++) simulation.tick();
    setSim({ nodes: ns, links: ls });
  }, [nodes, edges]);

  const connections = useMemo(() => {
    if (!selected) return [];
    return edges
      .filter((e) => e.src === selected.id || e.dst === selected.id)
      .map((e) => {
        const otherId = e.src === selected.id ? e.dst : e.src;
        const other = nodes.find((n) => n.id === otherId);
        return other ? { other, label: e.relation, outgoing: e.src === selected.id } : null;
      })
      .filter(Boolean) as { other: GraphNode; label: string; outgoing: boolean }[];
  }, [selected, edges, nodes]);

  function toWorld(clientX: number, clientY: number) {
    const rect = svgRef.current!.getBoundingClientRect();
    const sx = ((clientX - rect.left) / rect.width) * W;
    const sy = ((clientY - rect.top) / rect.height) * H;
    return { x: (sx - view.x) / view.k, y: (sy - view.y) / view.k };
  }

  function onPointerDown(e: React.PointerEvent, node?: SimNode) {
    (e.target as Element).setPointerCapture(e.pointerId);
    const p = toWorld(e.clientX, e.clientY);
    drag.current = node ? { node, px: p.x, py: p.y } : { panning: true, px: e.clientX, py: e.clientY };
  }
  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (d.node && sim) {
      const p = toWorld(e.clientX, e.clientY);
      d.node.x = p.x; d.node.y = p.y;
      setSim({ ...sim });
    } else if (d.panning) {
      setView((v) => ({ ...v, x: v.x + (e.clientX - d.px) * (W / svgRef.current!.getBoundingClientRect().width), y: v.y + (e.clientY - d.py) * (H / svgRef.current!.getBoundingClientRect().height) }));
      drag.current = { ...d, px: e.clientX, py: e.clientY };
    }
  }
  function onPointerUp() { drag.current = { px: 0, py: 0 }; }
  function onWheel(e: React.WheelEvent) {
    const factor = e.deltaY < 0 ? 1.12 : 0.9;
    setView((v) => {
      const k = Math.min(3, Math.max(0.4, v.k * factor));
      return { ...v, k };
    });
  }

  if (!sim) return <div className="mx-auto h-[620px] max-w-6xl animate-pulse rounded-2xl bg-surface" />;

  return (
    <div className="relative mx-auto max-w-6xl overflow-hidden rounded-2xl border border-line bg-surface shadow-soft">
      <div className="absolute left-4 top-4 z-10 flex flex-wrap gap-1.5 rounded-full border border-line bg-ground/90 px-3 py-1.5 text-xs backdrop-blur">
        {(["PERSON", "THEME", "CONCEPT", "EVENT", "VERSE"] as const).map((k) => (
          <span key={k} className="inline-flex items-center gap-1 text-muted">
            <span className="h-2 w-2 rounded-full" style={{ background: KIND_COLOR[k] }} /> {k.toLowerCase()}
          </span>
        ))}
      </div>
      <p className="absolute bottom-3 left-4 z-10 text-xs text-muted">Scroll to zoom · drag canvas to pan · drag nodes to arrange · click to explore</p>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="h-[620px] w-full cursor-grab touch-none active:cursor-grabbing"
        role="application"
        aria-label="Interactive knowledge graph of biblical people, themes, and passages"
        onPointerDown={(e) => onPointerDown(e)}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onWheel={onWheel}
      >
        <g transform={`translate(${view.x} ${view.y}) scale(${view.k})`}>
          {sim.links.map((l, i) => {
            const s = l.source as SimNode, t = l.target as SimNode;
            const active = selected && (s.id === selected.id || t.id === selected.id);
            return (
              <g key={i} opacity={selected && !active ? 0.18 : 1}>
                <line x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke={active ? "rgb(158 122 34)" : "rgb(148 158 168)"} strokeOpacity={active ? 0.7 : 0.35} strokeWidth={active ? 1.6 : 1} />
                {view.k >= 0.9 && (
                  <text x={((s.x ?? 0) + (t.x ?? 0)) / 2} y={((s.y ?? 0) + (t.y ?? 0)) / 2 - 4} textAnchor="middle" className="fill-muted" fontSize={8.5} opacity={active ? 0.9 : 0.5}>
                    {l.relation}
                  </text>
                )}
              </g>
            );
          })}
          {sim.nodes.map((n) => {
            const r = kindR(n.kind);
            const isSel = selected?.id === n.id;
            const dimmed = selected && !isSel && !connections.some((c) => c.other.id === n.id);
            return (
              <g
                key={n.id}
                transform={`translate(${n.x} ${n.y})`}
                opacity={dimmed ? 0.25 : 1}
                className="cursor-pointer"
                onPointerDown={(e) => { e.stopPropagation(); onPointerDown(e, n); }}
                onClick={(e) => { e.stopPropagation(); setSelected(n); }}
                role="button"
                aria-label={`${n.kind.toLowerCase()}: ${n.label}`}
              >
                {isSel && <circle r={r + 7} fill="none" stroke="rgb(208 172 78)" strokeOpacity={0.55} strokeWidth={2.5} />}
                <circle r={r} fill={kindColor(n.kind)} fillOpacity={0.92} stroke="rgb(255 255 255)" strokeOpacity={0.35} />
                <text textAnchor="middle" dy={r + 13} fontSize={10.5} className="fill-ink" fontWeight={isSel ? 600 : 400}>
                  {n.label}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {selected && (
        <aside className="absolute inset-y-0 right-0 z-20 w-80 max-w-[85vw] overflow-y-auto border-l border-line bg-ground/95 p-5 backdrop-blur" aria-label={`Details for ${selected.label}`}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <Badge tone="muted" className="mb-1.5 capitalize">{selected.kind.toLowerCase()}</Badge>
              <h2 className="font-scripture text-2xl">{selected.label}</h2>
            </div>
            <button aria-label="Close panel" onClick={() => setSelected(null)} className="rounded-full p-1 text-muted hover:bg-surface hover:text-ink">
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-ink/90">{selected.summary}</p>
          {verseRefOf(selected) && (
            <Link href={`/read/${verseRefOf(selected)!.split("-").slice(0, -2).join("-")}/${verseRefOf(selected)!.split("-").at(-2)}?focus=${verseRefOf(selected)}`} className="mt-2 inline-block text-sm text-lapis hover:underline">
              Open in reader →
            </Link>
          )}
          {selected.kind !== "VERSE" && (
            <Link href={`/search?q=${encodeURIComponent(selected.label)}`} className="mt-2 inline-block text-sm text-lapis hover:underline">
              Search related passages →
            </Link>
          )}
          <h3 className="eyebrow mb-2 mt-5">Connections</h3>
          <ul className="space-y-2">
            {connections.map((c, i) => (
              <li key={i} className="text-sm">
                <button
                  onClick={() => setSelected(sim.nodes.find((n) => n.id === c.other.id) ?? null)}
                  className="text-left"
                >
                  <span className={cn("text-muted")}>{c.outgoing ? `${c.label} → ` : `← ${c.label} `}</span>
                  <span className="font-medium text-lapis hover:underline">{c.other.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </div>
  );
}
