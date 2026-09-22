import type { ReactNode } from "react";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { MissionProse } from "./missions/MissionProse";
import type { ProduitReferentielDisplayValue } from "../utils/produitReferentiel";

export function ReferentielFieldValue({
  value,
}: {
  value: ProduitReferentielDisplayValue;
}): ReactNode {
  if (value.kind === "empty") {
    return <span className="fr-text--sm fr-hint-text">Non renseigné</span>;
  }
  if (value.kind === "bool") {
    return (
      <Badge small as="span" severity={value.value ? "success" : "info"} noIcon>
        {value.value ? "Oui" : "Non"}
      </Badge>
    );
  }
  if (value.kind === "tags") {
    return (
      <ul className="fr-badges-group fr-mb-0">
        {value.tags.map((tag) => (
          <li key={tag}>
            <Badge small as="span" noIcon>
              {tag}
            </Badge>
          </li>
        ))}
      </ul>
    );
  }
  if (value.kind === "link") {
    return (
      <a
        className="fr-link"
        href={value.href}
        target="_blank"
        rel="noopener noreferrer"
      >
        {value.label}
      </a>
    );
  }
  if (value.kind === "links") {
    return (
      <ul className="fr-mb-0 fr-pl-0" style={{ listStyle: "none" }}>
        {value.links.map((link) => (
          <li key={link.href}>
            <a
              className="fr-link"
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    );
  }
  if (value.kind === "longtext") {
    return <MissionProse value={value.text} />;
  }
  return (
    <p className="fr-text--sm fr-mb-0" style={{ whiteSpace: "pre-wrap" }}>
      {value.text}
    </p>
  );
}

export function ReferentielTilesGrid({
  items,
}: {
  items: { key: string; label: string; value: ProduitReferentielDisplayValue; wide?: boolean }[];
}) {
  const visible = items.filter((i) => i.value.kind !== "empty");
  if (visible.length === 0) {
    return (
      <p className="fr-text--sm fr-hint-text fr-mb-0">Aucun champ renseigné dans ce thème.</p>
    );
  }
  return (
    <div className="fr-grid-row fr-grid-row--gutters produit-referentiel-grid">
      {visible.map((item) => (
        <div
          key={item.key}
          className={
            item.wide || item.value.kind === "longtext"
              ? "fr-col-12"
              : "fr-col-12 fr-col-md-6"
          }
        >
          <div className="produit-referentiel-tile">
            <div className="fr-text--xs fr-mb-1v produit-referentiel-tile__label">
              {item.label}
            </div>
            <div className="produit-referentiel-tile__value">
              <ReferentielFieldValue value={item.value} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
