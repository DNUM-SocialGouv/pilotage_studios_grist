import {
  parseMissionProse,
  type MissionProseHeadingLevel,
  type MissionProseInline,
} from "../../utils/missionProseFormat.ts";

function MissionProseInlines({ inlines }: { inlines: MissionProseInline[] }) {
  return (
    <>
      {inlines.map((part, i) => {
        if (part.type === "link") {
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
}: {
  headers: MissionProseInline[][];
  rows: MissionProseInline[][][];
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
                      <MissionProseInlines inlines={cell} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, r) => (
                  <tr key={r}>
                    {row.map((cell, c) => (
                      <td key={c}>
                        <MissionProseInlines inlines={cell} />
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

/** Texte narratif : titres, paragraphes, listes, tableaux, gras, liens Markdown http(s). */
export function MissionProse({ value }: { value: string }) {
  const blocks = parseMissionProse(value);
  if (blocks.length === 0) {
    return null;
  }

  return (
    <div className="mission-fiche-prose">
      {blocks.map((block, i) => {
        if (block.type === "heading") {
          const Tag = headingTag(block.level);
          return (
            <Tag
              key={i}
              className={`mission-fiche-prose__heading mission-fiche-prose__heading--${block.level}`}
            >
              <MissionProseInlines inlines={block.inlines} />
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
                  <MissionProseInlines inlines={item} />
                </li>
              ))}
            </ListTag>
          );
        }
        if (block.type === "table") {
          return (
            <ProseTable key={i} headers={block.headers} rows={block.rows} />
          );
        }
        return (
          <p key={i} className="fr-mb-2w">
            <MissionProseInlines inlines={block.inlines} />
          </p>
        );
      })}
    </div>
  );
}
