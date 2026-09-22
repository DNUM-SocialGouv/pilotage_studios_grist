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

/** Texte narratif mission : titres, paragraphes, listes, gras, liens Markdown http(s). */
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
          return (
            <ul key={i} className="mission-fiche-prose__list">
              {block.items.map((item, j) => (
                <li key={j}>
                  <MissionProseInlines inlines={item} />
                </li>
              ))}
            </ul>
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
