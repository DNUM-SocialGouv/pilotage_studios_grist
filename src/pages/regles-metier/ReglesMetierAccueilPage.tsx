import { Button } from "@codegouvfr/react-dsfr/Button";
import { CallOut } from "@codegouvfr/react-dsfr/CallOut";
import { Link } from "react-router-dom";
import { MermaidDiagram } from "../../components/MermaidDiagram";
import { requestOpenFeedback } from "../../utils/feedbackOpen";
import { GUIDE_BASE, GUIDE_NAV } from "./guideNav";

const OVERVIEW_CHART = `
flowchart LR
  M[Mission]
  P[Prestations]
  C[CRA]
  B[Bon de commande]
  PA[Plan d'activité]
  M --> P
  P --> C
  C -->|consomme| B
  B -->|rattache| PA
`;

export function ReglesMetierAccueilPage() {
  return (
    <article>
      <h2 className="fr-h4">Accueil du guide</h2>

      <section className="fr-mb-3w" aria-labelledby="en-clair-accueil">
        <h3 className="fr-h6" id="en-clair-accueil">
          En clair
        </h3>
        <p>
          Ce guide pose les <strong>règles de base du Pilotage</strong> : comment une mission
          se découpe en prestations, comment le CRA (compte rendu d’activité) consomme un bon
          de commande, et qui voit quoi selon son rôle. Objectif : une lecture fluide pour
          toute l’équipe, sans jargon technique.
        </p>
      </section>

      <section className="fr-mb-3w" aria-labelledby="par-ou-commencer">
        <h3 className="fr-h6" id="par-ou-commencer">
          Par où commencer
        </h3>
        <CallOut
          title="Vous êtes freelance ?"
          titleAs="h4"
          colorVariant="blue-cumulus"
          className="fr-mb-2w"
          bodyAs="div"
        >
          <p className="fr-mb-0">
            Lisez d’abord{" "}
            <Link className="fr-link" to={`${GUIDE_BASE}/missions`}>
              Missions & prestations
            </Link>{" "}
            (environ 2 minutes), puis{" "}
            <Link className="fr-link" to={`${GUIDE_BASE}/cra`}>
              CRA / réalisations
            </Link>
            . La page Budget est{" "}
            <strong>optionnelle</strong> : elle explique la suite, vous n’avez pas besoin
            d’y agir au quotidien.
          </p>
        </CallOut>
        <CallOut
          title="Vous êtes responsable ?"
          titleAs="h4"
          colorVariant="blue-cumulus"
          bodyAs="div"
        >
          <p className="fr-mb-0">
            Même point de départ :{" "}
            <Link className="fr-link" to={`${GUIDE_BASE}/missions`}>
              Missions
            </Link>{" "}
            puis{" "}
            <Link className="fr-link" to={`${GUIDE_BASE}/cra`}>
              CRA
            </Link>{" "}
            (déclaration et revue). Le Budget reste utile pour comprendre le rattachement
            au bon de commande en revue — même si le menu Budget est masqué chez vous.
          </p>
        </CallOut>
      </section>

      <section className="fr-mb-3w" aria-labelledby="comment-lire">
        <h3 className="fr-h6" id="comment-lire">
          Comment lire ce guide
        </h3>
        <ul>
          <li>Chaque page commence par un paragraphe « En clair ».</li>
          <li>Une règle métier = une phrase simple.</li>
          <li>Les schémas montrent les liens entre objets (pas le détail technique).</li>
          <li>
            Les encadrés « Pour les Admin » ajoutent des précisions de pilotage — le reste
            s’adresse à tout le monde.
          </li>
        </ul>
      </section>

      <section className="fr-mb-3w" aria-labelledby="vue-ensemble">
        <h3 className="fr-h6" id="vue-ensemble">
          Vue d’ensemble
        </h3>
        <p>
          Le fil conducteur : une <strong>mission</strong> porte des{" "}
          <strong>prestations</strong> ; chaque mois, les intervenants déclarent un{" "}
          <strong>CRA</strong> ; ce CRA consomme un <strong>bon de commande</strong> (BDC)
          rattaché à un <strong>plan d’activité</strong> (PA).
        </p>
        <MermaidDiagram
          chart={OVERVIEW_CHART}
          caption="Vue d’ensemble : mission → prestations → CRA qui consomme un bon de commande rattaché à un plan d’activité."
        />
      </section>

      <section className="fr-mb-3w" aria-labelledby="sommaire-pages">
        <h3 className="fr-h6" id="sommaire-pages">
          Les pages du guide
        </h3>
        <ul className="fr-raw-list">
          {GUIDE_NAV.slice(1).map((item) => (
            <li key={item.path} className="fr-mb-2w">
              <Link className="fr-link" to={item.path}>
                {item.label}
              </Link>
              <p className="fr-text--sm fr-mb-0 fr-mt-1v">{item.teaser}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="fr-mb-2w" aria-labelledby="feedback-guide">
        <h3 className="fr-h6" id="feedback-guide">
          Donner un retour
        </h3>
        <p>
          Ce guide est une première version. Si une règle est floue, incomplète ou incorrecte,
          dites-le via le bouton « Un retour ? » — l’équipe pourra corriger rapidement.
        </p>
        <Button
          type="button"
          priority="secondary"
          onClick={() => requestOpenFeedback()}
        >
          Donner un retour sur ce guide
        </Button>
      </section>
    </article>
  );
}
