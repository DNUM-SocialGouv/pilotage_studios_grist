import type { RoadmapDiagram, RoadmapFlowEdge } from "../../content/publicRoadmap";

type RoadmapFlowDiagramProps = {
  diagram: RoadmapDiagram;
};

function groupEdgesByFrom(edges: RoadmapFlowEdge[]): { from: string; edges: RoadmapFlowEdge[] }[] {
  const order: string[] = [];
  const map = new Map<string, RoadmapFlowEdge[]>();
  for (const edge of edges) {
    const list = map.get(edge.from);
    if (list) {
      list.push(edge);
    } else {
      map.set(edge.from, [edge]);
      order.push(edge.from);
    }
  }
  return order.map((from) => ({ from, edges: map.get(from) ?? [] }));
}

/**
 * Schéma structurel vertical (étapes + liens) — HTML/CSS, sans Mermaid.
 */
export function RoadmapFlowDiagram({ diagram }: RoadmapFlowDiagramProps) {
  const nodeById = new Map(diagram.nodes.map((n) => [n.id, n]));

  if (diagram.edges.length === 0) {
    return (
      <div className="roadmap-flow">
        <ol className="roadmap-flow__steps">
          {diagram.nodes.map((node, index) => (
            <li key={node.id} className="roadmap-flow__step">
              <span className="roadmap-flow__step-index" aria-hidden="true">
                {index + 1}
              </span>
              <span className="roadmap-flow__step-label">{node.label}</span>
            </li>
          ))}
        </ol>
      </div>
    );
  }

  const groups = groupEdgesByFrom(diagram.edges);

  return (
    <div className="roadmap-flow">
      <ul className="roadmap-flow__links">
        {groups.map((group) => {
          const fromLabel = nodeById.get(group.from)?.label ?? group.from;
          return (
            <li key={group.from} className="roadmap-flow__link">
              <div className="roadmap-flow__link-from">{fromLabel}</div>
              <ul className="roadmap-flow__targets">
                {group.edges.map((edge, index) => {
                  const to = nodeById.get(edge.to)?.label ?? edge.to;
                  return (
                    <li
                      key={`${edge.from}-${edge.to}-${edge.label ?? ""}-${index}`}
                      className="roadmap-flow__target"
                    >
                      <span className="roadmap-flow__link-arrow">
                        <span aria-hidden="true">↓</span>
                        {edge.label ? (
                          <span className="roadmap-flow__link-via"> {edge.label}</span>
                        ) : null}
                      </span>
                      <div className="roadmap-flow__link-to">{to}</div>
                    </li>
                  );
                })}
              </ul>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
