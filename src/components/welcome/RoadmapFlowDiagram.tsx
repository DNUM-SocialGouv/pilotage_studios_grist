import type { RoadmapDiagram } from "../../content/publicRoadmap";

type RoadmapFlowDiagramProps = {
  diagram: RoadmapDiagram;
};

/**
 * Schéma structurel léger (nœuds + flèches) pour l’onboarding roadmap.
 * Pas de lib Mermaid : HTML/CSS uniquement.
 */
export function RoadmapFlowDiagram({ diagram }: RoadmapFlowDiagramProps) {
  const nodeById = new Map(diagram.nodes.map((n) => [n.id, n]));

  return (
    <div className="roadmap-flow" role="img" aria-label="Schéma du parcours">
      <ol className="roadmap-flow__nodes fr-mb-2w">
        {diagram.nodes.map((node, index) => (
          <li key={node.id} className="roadmap-flow__node">
            <span className="roadmap-flow__node-index" aria-hidden="true">
              {index + 1}
            </span>
            <span className="roadmap-flow__node-label">{node.label}</span>
          </li>
        ))}
      </ol>
      {diagram.edges.length > 0 ? (
        <ul className="roadmap-flow__edges fr-mb-0">
          {diagram.edges.map((edge) => {
            const from = nodeById.get(edge.from)?.label ?? edge.from;
            const to = nodeById.get(edge.to)?.label ?? edge.to;
            return (
              <li key={`${edge.from}-${edge.to}-${edge.label ?? ""}`} className="roadmap-flow__edge">
                <span className="roadmap-flow__edge-from">{from}</span>
                <span className="roadmap-flow__edge-arrow" aria-hidden="true">
                  →
                </span>
                <span className="roadmap-flow__edge-to">{to}</span>
                {edge.label ? (
                  <span className="roadmap-flow__edge-label"> ({edge.label})</span>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
