import type { ReactNode } from "react";
import { ReferentielTilesGrid } from "./ProduitReferentielTiles";
import { MissionProse } from "./missions/MissionProse";
import type { ProduitSdpc } from "../types";
import {
  PRODUIT_REFERENTIEL_GROUPE_LABELS,
  fieldsForGroupe,
  formatReferentielField,
  isDictField,
  isFinDeVieField,
  isHomologationField,
  isRgaaField,
  type ProduitReferentielDisplayValue,
  type ProduitReferentielFieldDef,
} from "../utils/produitReferentiel";

type TileItem = {
  key: string;
  label: string;
  value: ProduitReferentielDisplayValue;
  wide?: boolean;
};

function toTiles(
  produit: ProduitSdpc,
  fields: readonly ProduitReferentielFieldDef[],
): TileItem[] {
  return fields.map((field) => ({
    key: String(field.key),
    label: field.label,
    value: formatReferentielField(produit, field),
    wide: field.kind === "longtext" || field.kind === "urls",
  }));
}

function SectionHeading({
  id,
  titre,
  sousTitre,
}: {
  id: string;
  titre: string;
  sousTitre: string;
}) {
  return (
    <div className="produit-infos-section__heading fr-mb-2w">
      <h3 className="fr-h6 fr-mb-1v" id={id}>
        {titre}
      </h3>
      <p className="fr-text--sm fr-hint-text fr-mb-0">{sousTitre}</p>
    </div>
  );
}

function SubHeading({ children }: { children: ReactNode }) {
  return <p className="fr-text--sm fr-mb-1w fr-text--bold">{children}</p>;
}

function PresentationSection({ produit }: { produit: ProduitSdpc }) {
  const fields = fieldsForGroupe("presentation");
  const byKey = new Map(fields.map((f) => [f.key, f]));
  const nomField = byKey.get("Produit");
  const nomCompletField = byKey.get("Description");
  const foncField = byKey.get("Fonctionnalites_et_contexte");

  const nom = nomField ? formatReferentielField(produit, nomField) : { kind: "empty" as const };
  const nomComplet = nomCompletField
    ? formatReferentielField(produit, nomCompletField)
    : { kind: "empty" as const };
  const fonc = foncField
    ? formatReferentielField(produit, foncField)
    : { kind: "empty" as const };
  const longDesc = produit.Description_longue?.trim();

  const hasContent =
    nom.kind !== "empty" ||
    nomComplet.kind !== "empty" ||
    fonc.kind !== "empty" ||
    Boolean(longDesc);

  if (!hasContent) {
    return null;
  }

  const meta = PRODUIT_REFERENTIEL_GROUPE_LABELS.presentation;

  return (
    <section
      className="produit-infos-section"
      aria-labelledby="produit-infos-presentation"
    >
      <SectionHeading
        id="produit-infos-presentation"
        titre={meta.titre}
        sousTitre={meta.sousTitre}
      />
      <div className="produit-infos-presentation">
        {nom.kind === "text" ? (
          <p className="fr-text--lg fr-text--bold fr-mb-1w">{nom.text}</p>
        ) : null}
        {nomComplet.kind === "text" ? (
          <p className="fr-text--sm fr-mb-2w fr-hint-text">{nomComplet.text}</p>
        ) : null}
        {fonc.kind === "longtext" ? (
          <div className={longDesc ? "fr-mb-2w" : undefined}>
            <p className="fr-text--xs fr-mb-1v fr-hint-text">
              Fonctionnalités et contexte
            </p>
            <MissionProse value={fonc.text} />
          </div>
        ) : null}
        {longDesc ? (
          <div>
            <p className="fr-text--xs fr-mb-1v fr-hint-text">Description longue</p>
            <MissionProse value={longDesc} />
          </div>
        ) : null}
      </div>
    </section>
  );
}

function GouvernanceSection({ produit }: { produit: ProduitSdpc }) {
  const all = fieldsForGroupe("gouvernance");
  const finDeVie = all.filter(isFinDeVieField);
  const main = all.filter((f) => !isFinDeVieField(f));
  const mainTiles = toTiles(produit, main);
  const finTiles = toTiles(produit, finDeVie);
  const hasMain = mainTiles.some((t) => t.value.kind !== "empty");
  const hasFin = finTiles.some((t) => t.value.kind !== "empty");
  if (!hasMain && !hasFin) {
    return null;
  }
  const meta = PRODUIT_REFERENTIEL_GROUPE_LABELS.gouvernance;
  return (
    <section
      className="produit-infos-section"
      aria-labelledby="produit-infos-gouvernance"
    >
      <SectionHeading
        id="produit-infos-gouvernance"
        titre={meta.titre}
        sousTitre={meta.sousTitre}
      />
      {hasMain ? <ReferentielTilesGrid items={mainTiles} /> : null}
      {hasFin ? (
        <div className={hasMain ? "fr-mt-3w" : undefined}>
          <SubHeading>Fin de vie</SubHeading>
          <ReferentielTilesGrid items={finTiles} />
        </div>
      ) : null}
    </section>
  );
}

function UsagersSection({ produit }: { produit: ProduitSdpc }) {
  const tiles = toTiles(produit, fieldsForGroupe("usagers"));
  if (tiles.every((t) => t.value.kind === "empty")) {
    return null;
  }
  const meta = PRODUIT_REFERENTIEL_GROUPE_LABELS.usagers;
  return (
    <section
      className="produit-infos-section"
      aria-labelledby="produit-infos-usagers"
    >
      <SectionHeading
        id="produit-infos-usagers"
        titre={meta.titre}
        sousTitre={meta.sousTitre}
      />
      <ReferentielTilesGrid items={tiles} />
    </section>
  );
}

function ConformiteSection({ produit }: { produit: ProduitSdpc }) {
  const all = fieldsForGroupe("conformite");
  const homologation = toTiles(produit, all.filter(isHomologationField));
  const rgaa = toTiles(produit, all.filter(isRgaaField));
  const dict = toTiles(produit, all.filter(isDictField));
  const hasHomo = homologation.some((t) => t.value.kind !== "empty");
  const hasRgaa = rgaa.some((t) => t.value.kind !== "empty");
  const hasDict = dict.some((t) => t.value.kind !== "empty");
  if (!hasHomo && !hasRgaa && !hasDict) {
    return null;
  }
  const meta = PRODUIT_REFERENTIEL_GROUPE_LABELS.conformite;
  return (
    <section
      className="produit-infos-section"
      aria-labelledby="produit-infos-conformite"
    >
      <SectionHeading
        id="produit-infos-conformite"
        titre={meta.titre}
        sousTitre={meta.sousTitre}
      />
      {hasHomo ? (
        <div className="fr-mb-3w">
          <SubHeading>Homologation</SubHeading>
          <ReferentielTilesGrid items={homologation} columns={3} />
        </div>
      ) : null}
      {hasRgaa ? (
        <div className={hasDict ? "fr-mb-3w" : undefined}>
          <SubHeading>Accessibilité (RGAA)</SubHeading>
          <ReferentielTilesGrid items={rgaa} columns={3} />
        </div>
      ) : null}
      {hasDict ? (
        <div>
          <SubHeading>Besoins DICT</SubHeading>
          <ReferentielTilesGrid items={dict} columns={4} dictStyle />
        </div>
      ) : null}
    </section>
  );
}

function TechniqueSection({ produit }: { produit: ProduitSdpc }) {
  const tiles = toTiles(produit, fieldsForGroupe("technique"));
  if (tiles.every((t) => t.value.kind === "empty")) {
    return null;
  }
  const meta = PRODUIT_REFERENTIEL_GROUPE_LABELS.technique;
  return (
    <section
      className="produit-infos-section"
      aria-labelledby="produit-infos-technique"
    >
      <SectionHeading
        id="produit-infos-technique"
        titre={meta.titre}
        sousTitre={meta.sousTitre}
      />
      <ReferentielTilesGrid items={tiles} columns={3} />
    </section>
  );
}

/** Onglet Informations — gabarit A (page document, groupes métier). */
export function ProduitReferentielInfosPanel({ produit }: { produit: ProduitSdpc }) {
  return (
    <div className="produit-infos-panel">
      <PresentationSection produit={produit} />
      <GouvernanceSection produit={produit} />
      <UsagersSection produit={produit} />
      <ConformiteSection produit={produit} />
      <TechniqueSection produit={produit} />
    </div>
  );
}
