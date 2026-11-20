/**
 * Essai Assistant PARC — chat embarqué pour questions sur les produits du référentiel.
 * Données lues côté serveur d’essai (document Le PARC), pas via fetchTable widget.
 */
import { AssistantChatPanel } from "../components/assistant/AssistantChatPanel";

export function AssistantParcPage() {
  return (
    <div className="fr-container fr-py-3w">
      <h1 className="fr-h3 fr-mb-1w">Assistant PARC</h1>
      <p className="fr-text--sm fr-mb-3w" style={{ maxWidth: "42rem" }}>
        Posez une question avec le <strong>nom</strong> d’un produit du référentiel Le PARC
        (applications et communs numériques). Les réponses s’appuient sur les fiches
        produits en <strong>lecture seule</strong> — sans modifier Grist.
      </p>
      <AssistantChatPanel layout="embedded" domain="parc" />
    </div>
  );
}
