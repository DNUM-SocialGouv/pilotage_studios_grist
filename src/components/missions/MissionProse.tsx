import {
  parseMissionProse,
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

/** Texte narratif mission : paragraphes, listes, gras, liens Markdown http(s). */
export function MissionProse({ value }: { value: string }) {
  const blocks = parseMissionProse(value);
  if (blocks.length === 0) {
    return null;
  }

  return (
    <div className="mission-fiche-prose">
      {blocks.map((block, i) => {
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
