import { MermaidDiagram } from "../../components/MermaidDiagram";
import { GuideAdminCallout } from "../../components/GuideAdminCallout";

const BUDGET_CHART = `
flowchart TB
  PA[Plan d'activité — enveloppe]
  BDC[Bon de commande — engagement]
  CRA[CRA — consommation]
  PA --> BDC --> CRA
`;

export function ReglesMetierBdcPaPage() {
  return (
    <article>
      <h2 className="fr-h4">Bons de commande & plans d’activité</h2>

      <section className="fr-mb-3w" aria-labelledby="en-clair-budget">
        <h3 className="fr-h6" id="en-clair-budget">
          En clair
        </h3>
        <p>
          Le <strong>plan d’activité</strong> (PA) est l’enveloppe budgétaire d’une activité.
          Le <strong>bon de commande</strong> (BDC) est l’engagement sous cette enveloppe. Les
          CRA consomment le BDC : c’est ainsi que l’on suit le reste à consommer.
        </p>
      </section>

      <section className="fr-mb-3w" aria-labelledby="regle-budget">
        <h3 className="fr-h6" id="regle-budget">
          Règle en une phrase
        </h3>
        <p className="fr-text--lg">
          <strong>Le PA enveloppe → le BDC engage → le CRA consomme.</strong>
        </p>
      </section>

      <section className="fr-mb-3w" aria-labelledby="schema-budget">
        <h3 className="fr-h6" id="schema-budget">
          Schéma — cascade budgétaire
        </h3>
        <MermaidDiagram
          chart={BUDGET_CHART}
          caption="Cascade : le plan d’activité porte l’enveloppe ; les bons de commande engagent ; les CRA consomment."
        />
      </section>

      <section className="fr-mb-3w" aria-labelledby="a-retenir-budget">
        <h3 className="fr-h6" id="a-retenir-budget">
          À retenir
        </h3>
        <ul>
          <li>
            Sans rattachement BDC, une réalisation peut exister mais ne contribue pas
            correctement au suivi de consommation.
          </li>
          <li>
            La fiche BDC montre les dépenses (CRA rattachés) et le lien vers le PA.
          </li>
          <li>
            La fiche PA montre l’enveloppe, l’engagé et le reste à consommer.
          </li>
          <li>
            Ces écrans Budget sont en <strong>lecture</strong> dans le widget pour le
            pilotage — la création des BDC / PA se fait ailleurs (Grist / outils amont).
          </li>
        </ul>
      </section>

      <GuideAdminCallout>
        <p className="fr-mb-0">
          Les menus Plans d’activité, Bons de commande et Prestation / CRA sont en général
          réservés aux Admin via les interrupteurs « Droits des pages ». Un Admin peut
          réactiver un écran pour un autre rôle si besoin métier — sans que cela change les
          verrous de données côté Grist.
        </p>
      </GuideAdminCallout>
    </article>
  );
}
