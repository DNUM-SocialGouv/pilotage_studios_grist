import { MermaidDiagram } from "../../components/MermaidDiagram";
import { GuideAdminCallout } from "../../components/GuideAdminCallout";

const CRA_CHART = `
flowchart LR
  D[Déclaration — Mon carnet]
  R[Revue équipe]
  B[Rattachement BDC]
  D --> R --> B
`;

export function ReglesMetierCraPage() {
  return (
    <article>
      <h2 className="fr-h4">CRA / réalisations</h2>

      <section className="fr-mb-3w" aria-labelledby="en-clair-cra">
        <h3 className="fr-h6" id="en-clair-cra">
          En clair
        </h3>
        <p>
          Une <strong>réalisation</strong> (ligne de CRA — compte rendu d’activité) décrit le
          travail d’une personne sur une prestation pour un mois donné : jours, description,
          et éventuellement rattachement à un bon de commande.
        </p>
      </section>

      <section className="fr-mb-3w" aria-labelledby="regle-cra">
        <h3 className="fr-h6" id="regle-cra">
          Règle en une phrase
        </h3>
        <p className="fr-text--lg">
          <strong>Une réalisation = une personne × une prestation × un mois.</strong>
        </p>
      </section>

      <section className="fr-mb-3w" aria-labelledby="schema-cra">
        <h3 className="fr-h6" id="schema-cra">
          Schéma — du carnet à la revue
        </h3>
        <MermaidDiagram
          chart={CRA_CHART}
          caption="Flux métier : le freelance déclare dans Mon carnet ; le responsable revoit l’équipe ; le CRA est rattaché à un bon de commande."
        />
      </section>

      <section className="fr-mb-3w" aria-labelledby="qui-fait-quoi-cra">
        <h3 className="fr-h6" id="qui-fait-quoi-cra">
          Qui fait quoi
        </h3>
        <ul>
          <li>
            <strong>Freelance</strong> : déclare ses jours et sa description dans{" "}
            <strong>Mon carnet</strong> (prestations où il ou elle intervient).
          </li>
          <li>
            <strong>Responsable de département</strong> (et Admin) : ouvre{" "}
            <strong>Revue CRA équipe</strong> pour ajuster jours / description et rattacher
            un bon de commande — uniquement pour les personnes du même département.
          </li>
          <li>
            <strong>Liste Prestation / CRA</strong> (sous Budget) : vue transversale de
            lecture, typiquement pour le pilotage Admin.
          </li>
        </ul>
      </section>

      <GuideAdminCallout>
        <p className="fr-mb-0">
          Sur une fiche mission, un Admin peut aussi modifier ou dupliquer une ligne de CRA
          sous une prestation. La revue équipe reste le parcours principal pour qualifier et
          rattacher au BDC. Le sujet des tarifs journaliers (TJM) est traité à part — hors
          de ce guide.
        </p>
      </GuideAdminCallout>
    </article>
  );
}
