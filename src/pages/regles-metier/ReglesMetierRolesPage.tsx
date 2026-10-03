import { MermaidDiagram } from "../../components/MermaidDiagram";
import { GuideAdminCallout } from "../../components/GuideAdminCallout";

const ROLES_CHART = `
flowchart TB
  S[Partage du document]
  R[Rôle métier]
  E[Écrans visibles]
  S --> R --> E
`;

export function ReglesMetierRolesPage() {
  return (
    <article>
      <h2 className="fr-h4">Qui voit quoi</h2>

      <section className="fr-mb-3w" aria-labelledby="en-clair-roles">
        <h3 className="fr-h6" id="en-clair-roles">
          En clair
        </h3>
        <p>
          Tout le monde n’a pas le même menu ni les mêmes actions. Votre{" "}
          <strong>rôle</strong> (Admin, responsable de département, freelance, invité) et le
          fait d’être invité au document déterminent ce que vous voyez. Le menu est un
          confort : la protection des données sensibles repose aussi sur des règles côté
          document.
        </p>
      </section>

      <section className="fr-mb-3w" aria-labelledby="regle-roles">
        <h3 className="fr-h6" id="regle-roles">
          Règle en une phrase
        </h3>
        <p className="fr-text--lg">
          <strong>
            Partage du document → rôle métier → écrans et actions disponibles.
          </strong>
        </p>
      </section>

      <section className="fr-mb-3w" aria-labelledby="schema-roles">
        <h3 className="fr-h6" id="schema-roles">
          Schéma — trois niveaux simples
        </h3>
        <MermaidDiagram
          chart={ROLES_CHART}
          caption="Trois niveaux : d’abord le partage du document, puis le rôle métier, puis les écrans visibles dans le widget."
        />
      </section>

      <section className="fr-mb-3w" aria-labelledby="roles-exemples">
        <h3 className="fr-h6" id="roles-exemples">
          Exemples concrets
        </h3>
        <ul>
          <li>
            <strong>Freelance</strong> : Mon carnet pour déclarer ; Missions / Équipe /
            Produits en consultation ; Budget souvent masqué.
          </li>
          <li>
            <strong>Responsable de département</strong> : Mon carnet en lecture sur le
            périmètre du département ; Revue CRA équipe pour qualifier les réalisations du
            même département.
          </li>
          <li>
            <strong>Admin</strong> : pilotage large (Budget, Outils, édition missions /
            équipe) + page « Droits des pages » pour ajuster les menus par rôle.
          </li>
          <li>
            <strong>Invité</strong> : accès très restreint — souvent lecture limitée, pas de
            carnet ni de revue.
          </li>
        </ul>
      </section>

      <GuideAdminCallout>
        <p className="fr-mb-0">
          Dans Outils → Droits des pages, vous activez ou désactivez les écrans rôle par
          rôle (interrupteurs). Certains parcours restent fixés par rôle (Mon carnet, Revue
          CRA, Droits des pages elle-même) et n’apparaissent pas comme interrupteurs — pour
          éviter de se couper l’accès Admin.
        </p>
      </GuideAdminCallout>
    </article>
  );
}
