import { MermaidDiagram } from "../../components/MermaidDiagram";
import { GuideAdminCallout } from "../../components/GuideAdminCallout";

const MISSIONS_CHART = `
flowchart TB
  M[Mission — lot d'accompagnement]
  P1[Prestation A — personne × métier × période]
  P2[Prestation B — personne × métier × période]
  M --> P1
  M --> P2
`;

export function ReglesMetierMissionsPage() {
  return (
    <article>
      <h2 className="fr-h4">Missions & prestations</h2>

      <section className="fr-mb-3w" aria-labelledby="en-clair-missions">
        <h3 className="fr-h6" id="en-clair-missions">
          En clair
        </h3>
        <p>
          Une <strong>mission</strong> est un lot d’accompagnement (contexte, produit,
          statut). Une <strong>prestation</strong> décrit qui intervient, sur quel métier, et
          sur quelle période — c’est la composition concrète de l’équipe sous la mission.
        </p>
      </section>

      <section className="fr-mb-3w" aria-labelledby="regle-missions">
        <h3 className="fr-h6" id="regle-missions">
          Règle en une phrase
        </h3>
        <p className="fr-text--lg">
          <strong>Une prestation = une personne × un métier × une période</strong>, rattachée
          à une mission.
        </p>
      </section>

      <section className="fr-mb-3w" aria-labelledby="schema-missions">
        <h3 className="fr-h6" id="schema-missions">
          Schéma
        </h3>
        <MermaidDiagram
          chart={MISSIONS_CHART}
          caption="Une mission regroupe plusieurs prestations ; chaque prestation porte une personne, un métier et une période."
        />
      </section>

      <section className="fr-mb-3w" aria-labelledby="a-retenir-missions">
        <h3 className="fr-h6" id="a-retenir-missions">
          À retenir
        </h3>
        <ul>
          <li>
            La mission porte le <strong>contexte</strong> (demande, enjeux, documents) et le
            produit concerné.
          </li>
          <li>
            Les prestations portent <strong>qui intervient</strong> : intervenant, jours
            prévus, statut, date de début.
          </li>
          <li>
            Les réalisations mensuelles (CRA) se rattachent d’abord à une{" "}
            <strong>prestation</strong>, pas seulement à la mission.
          </li>
          <li>
            Une même mission peut mélanger plusieurs métiers (par exemple Design et Product).
          </li>
          <li>
            Création et modification des missions et prestations :{" "}
            <strong>Admin uniquement</strong>.
          </li>
        </ul>
      </section>

      <GuideAdminCallout>
        <p className="fr-mb-0">
          Création et modification des missions / prestations dans le widget : réservées aux
          Admin. Les autres rôles consultent la liste et la fiche pour le contexte et le
          suivi.
        </p>
      </GuideAdminCallout>
    </article>
  );
}
