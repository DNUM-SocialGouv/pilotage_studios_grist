import { useEffect, useId, useState } from "react";

type MermaidDiagramProps = {
  /** Source Mermaid (flowchart, etc.). */
  chart: string;
  /** Légende visible + alternative textuelle pour l’accessibilité. */
  caption: string;
  className?: string;
};

let mermaidReady = false;

async function getMermaid() {
  const mermaid = (await import("mermaid")).default;
  if (!mermaidReady) {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      theme: "neutral",
      fontFamily: "Marianne, arial, sans-serif",
    });
    mermaidReady = true;
  }
  return mermaid;
}

/**
 * Schéma Mermaid rendu côté client (SVG) avec légende accessible.
 * Chargement lazy de la lib pour ne pas alourdir le boot du widget.
 * En cas d’échec de rendu : texte de la légende seul (pas de crash page).
 */
export function MermaidDiagram({ chart, caption, className }: MermaidDiagramProps) {
  const reactId = useId().replace(/:/g, "");
  const [svg, setSvg] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const renderId = `mermaid-${reactId}-${Math.random().toString(36).slice(2, 8)}`;
    void getMermaid()
      .then((mermaid) => mermaid.render(renderId, chart.trim()))
      .then(({ svg: rendered }) => {
        if (!cancelled) {
          setSvg(rendered);
          setFailed(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSvg(null);
          setFailed(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [chart, reactId]);

  return (
    <figure className={className ? `regles-metier-diagram ${className}` : "regles-metier-diagram"}>
      {svg ? (
        <div
          className="regles-metier-diagram__svg"
          role="img"
          aria-label={caption}
          // SVG produit par Mermaid (source contrôlée dans le dépôt).
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : (
        <p className="fr-text--sm fr-mb-1w" role="status">
          {failed
            ? "Schéma indisponible pour le moment — voir la légende ci-dessous."
            : "Chargement du schéma…"}
        </p>
      )}
      <figcaption className="fr-text--sm fr-mt-1w">{caption}</figcaption>
    </figure>
  );
}
