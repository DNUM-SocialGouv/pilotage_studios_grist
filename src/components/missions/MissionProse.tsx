import { Link } from "react-router-dom";
import {
  parseMissionProse,
  parseMissionProseInlines,
  type MissionProseHeadingLevel,
  type MissionProseInline,
} from "../../utils/missionProseFormat.ts";

type MissionProseInlinesProps = {
  inlines: MissionProseInline[];
  /** Fermeture drawer / analytics — ne remplace pas la navigation `Link`. */
  onInternalLinkClick?: (path: string) => void;
};

function MissionProseInlines({
  inlines,
  onInternalLinkClick,
}: MissionProseInlinesProps) {
  return (
    <>
      {inlines.map((part, i) => {
        if (part.type === "link") {
          if (part.kind === "internal") {
            return (
              <Link
                key={i}
                className="fr-link"
                to={part.href}
                onClick={() => onInternalLinkClick?.(part.href)}
              >
                {part.label}
              </Link>
            );
          }
          return (
            <a
              key={i}
              className="fr-link"
              href={part.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {part.label}
            </a>
          );
        }
        if (part.type === "bold") {
          return <strong key={i}>{part.value}</strong>;
        }
        if (part.type === "code") {
          return (
            <code key={i} className="mission-fiche-prose__code">
              {part.value}
            </code>
          );
        }
        return <span key={i}>{part.value}</span>;
      })}
    </>
  );
}

/** Titres Markdown : sémantique h3–h6 (la fiche a déjà un h1/h2), style modéré. */
function headingTag(level: MissionProseHeadingLevel): "h3" | "h4" | "h5" | "h6" {
  if (level <= 2) {
    return "h3";
  }
  if (level === 3) {
    return "h4";
  }
  if (level === 4) {
    return "h5";
  }
  return "h6";
}

function ProseTable({
  headers,
  rows,
  onInternalLinkClick,
}: {
  headers: MissionProseInline[][];
  rows: MissionProseInline[][][];
  onInternalLinkClick?: (path: string) => void;
}) {
  return (
    <div className="fr-table fr-table--sm fr-table--no-caption fr-table--multiline mission-fiche-prose__table">
      <div className="fr-table__wrapper">
        <div className="fr-table__container">
          <div className="fr-table__content">
            <table>
              <caption className="fr-sr-only">Tableau</caption>
              <thead>
                <tr>
                  {headers.map((cell, j) => (
                    <th key={j} scope="col">
                      <MissionProseInlines
                        inlines={cell}
                        onInternalLinkClick={onInternalLinkClick}
                      />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, r) => (
                  <tr key={r}>
                    {row.map((cell, c) => (
                      <td key={c}>
                        <MissionProseInlines
                          inlines={cell}
                          onInternalLinkClick={onInternalLinkClick}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export type MissionProseProps = {
  value: string;
  /**
   * Cliqué sur un lien interne (path `/…`) — ex. fermer le drawer ticket.
   * La navigation reste gérée par React Router (`Link`), pas `window.location`.
   */
  onInternalLinkClick?: (path: string) => void;
  /**
   * Résumé / une ligne : liens + gras + code inline, sans blocs (titres, listes…).
   */
  inline?: boolean;
  className?: string;
};

/** Texte narratif : titres, paragraphes, listes, tableaux, code, gras, liens Markdown. */
export function MissionProse({
  value,
  onInternalLinkClick,
  inline = false,
  className,
}: MissionProseProps) {
  if (inline) {
    const inlines = parseMissionProseInlines(value);
    return (
      <span className={className ?? "mission-fiche-prose mission-fiche-prose--inline"}>
        <MissionProseInlines
          inlines={inlines}
          onInternalLinkClick={onInternalLinkClick}
        />
      </span>
    );
  }

  const blocks = parseMissionProse(value);
  if (blocks.length === 0) {
    return null;
  }

  return (
    <div className={className ?? "mission-fiche-prose"}>
      {blocks.map((block, i) => {
        if (block.type === "heading") {
          const Tag = headingTag(block.level);
          return (
            <Tag
              key={i}
              className={`mission-fiche-prose__heading mission-fiche-prose__heading--${block.level}`}
            >
              <MissionProseInlines
                inlines={block.inlines}
                onInternalLinkClick={onInternalLinkClick}
              />
            </Tag>
          );
        }
        if (block.type === "list") {
          const ListTag = block.ordered ? "ol" : "ul";
          return (
            <ListTag
              key={i}
              className={`mission-fiche-prose__list${block.ordered ? " mission-fiche-prose__list--ordered" : ""}`}
            >
              {block.items.map((item, j) => (
                <li key={j}>
                  <MissionProseInlines
                    inlines={item}
                    onInternalLinkClick={onInternalLinkClick}
                  />
                </li>
              ))}
            </ListTag>
          );
        }
        if (block.type === "table") {
          return (
            <ProseTable
              key={i}
              headers={block.headers}
              rows={block.rows}
              onInternalLinkClick={onInternalLinkClick}
            />
          );
        }
        if (block.type === "code") {
          return (
            <pre key={i} className="mission-fiche-prose__pre">
              <code>{block.value}</code>
            </pre>
          );
        }
        return (
          <p key={i} className="fr-mb-2w">
            <MissionProseInlines
              inlines={block.inlines}
              onInternalLinkClick={onInternalLinkClick}
            />
          </p>
        );
      })}
    </div>
  );
}
