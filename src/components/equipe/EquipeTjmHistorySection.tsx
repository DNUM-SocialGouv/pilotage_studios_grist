import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { useEquipeTjmForPersonne } from "../../hooks/useEquipeTjmData";
import { formatGristDate } from "../../utils/formatGristDate";
import { formatMontantEur } from "../../utils/formatMontant";
import { isEquipeTjmOpen, type EquipeTjmRow } from "../../utils/equipeTjm";

export type EquipeTjmHistorySectionProps = {
  memberId: number;
  enabled: boolean;
};

function OpenTarifsList({ rows }: { rows: EquipeTjmRow[] }) {
  const open = rows.filter((r) => isEquipeTjmOpen(r));
  if (open.length === 0) {
    return <span className="fr-text-mention--grey">Aucun tarif en vigueur</span>;
  }
  return (
    <ul className="fr-mb-0" style={{ listStyle: "none", paddingLeft: 0 }}>
      {open.map((r) => (
        <li key={r.id} className="fr-mb-1v">
          <strong>{r.Specialite}</strong>
          {" · "}
          {formatMontantEur(r.TJM)}
          {" · depuis "}
          {formatGristDate(r.Date_debut)}
        </li>
      ))}
    </ul>
  );
}

/**
 * Bandeau tarifs ouverts + tableau historique complet (V1).
 */
export function EquipeTjmHistorySection({ memberId, enabled }: EquipeTjmHistorySectionProps) {
  const { status, error, rows } = useEquipeTjmForPersonne(memberId, enabled);

  if (status === "loading" || status === "idle") {
    return (
      <Alert
        severity="info"
        small
        title="Tarifs journaliers"
        description="Chargement…"
        role="status"
        className="fr-mb-4w"
      />
    );
  }

  if (status === "error") {
    return (
      <Alert
        severity="warning"
        small
        title="Tarifs journaliers"
        description={error ?? "Impossible de charger la grille."}
        className="fr-mb-4w"
      />
    );
  }

  return (
    <section className="fr-mb-4w" aria-labelledby="equipe-tjm-history-title">
      <div
        className="fr-grid-row equipe-fiche-meta-bandeau fr-mb-3w"
        role="group"
        aria-label="Tarifs en vigueur"
      >
        <div className="fr-col-12 equipe-fiche-meta-bandeau__cell">
          <div className="fr-text--xs fr-mb-1v equipe-fiche-meta-bandeau__label">
            Tarifs en vigueur
          </div>
          <div className="fr-text--sm fr-mb-0">
            <OpenTarifsList rows={rows} />
          </div>
        </div>
      </div>

      <h2 id="equipe-tjm-history-title" className="fr-h5 fr-mb-2w">
        Historique des tarifs
      </h2>
      {rows.length === 0 ? (
        <p className="fr-text--sm fr-text-mention--grey">
          Aucun tarif enregistré dans la grille. Un Admin peut en ajouter via Modifier.
        </p>
      ) : (
        <div className="fr-table fr-table--no-caption">
          <div className="fr-table__wrapper">
            <div className="fr-table__container">
              <div className="fr-table__content">
                <table>
                  <caption className="fr-sr-only">
                    Historique des tarifs journaliers de la personne
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Spécialité</th>
                      <th scope="col" className="fr-cell--right">
                        TJM
                      </th>
                      <th scope="col">À partir du</th>
                      <th scope="col">Fin</th>
                      <th scope="col">État</th>
                      <th scope="col">Commentaire</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => {
                      const open = isEquipeTjmOpen(r);
                      return (
                        <tr key={r.id}>
                          <td>{r.Specialite}</td>
                          <td className="fr-cell--right">{formatMontantEur(r.TJM)}</td>
                          <td>{formatGristDate(r.Date_debut)}</td>
                          <td>{r.Date_fin != null ? formatGristDate(r.Date_fin) : "—"}</td>
                          <td>
                            <Badge small as="span" severity={open ? "success" : "info"} noIcon>
                              {open ? "En vigueur" : "Clos"}
                            </Badge>
                          </td>
                          <td>{r.Commentaire?.trim() || "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
