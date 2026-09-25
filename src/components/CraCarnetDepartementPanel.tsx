import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { TableShell } from "./FinanceRecap";
import { StatutBadge } from "./StatutBadge";
import type { CarnetDepartementMissionGroup } from "../utils/craCarnetDepartement";
import { formatMontantEur } from "../utils/formatMontant";
import type { CraTotaux } from "../utils/suiviMensuel";

export function countCarnetDepartementPrestations(
  groups: CarnetDepartementMissionGroup[],
): number {
  return groups.reduce((sum, g) => sum + g.prestations.length, 0);
}

export function totauxForCarnetPrestations(
  enfantIds: number[],
  craByEnfantId: Map<number, CraTotaux>,
): CraTotaux {
  let jours = 0;
  let ttc = 0;
  let count = 0;
  for (const id of enfantIds) {
    const t = craByEnfantId.get(id);
    if (!t) {
      continue;
    }
    jours += t.jours;
    ttc += t.ttc;
    count += t.count;
  }
  return { jours, ttc, count };
}

function formatTtcEngage(totaux: CraTotaux | undefined): string {
  if (!totaux || totaux.count === 0) {
    return "—";
  }
  return formatMontantEur(totaux.ttc);
}

type CraCarnetDepartementPanelProps = {
  equipeLabel: string;
  tabId: "en-cours" | "passees";
  groups: CarnetDepartementMissionGroup[];
  craByEnfantId: Map<number, CraTotaux>;
};

/**
 * Contenu onglet Mon carnet — vue Admin / Resp. (liste lecture département).
 */
export function CraCarnetDepartementPanel({
  equipeLabel,
  tabId,
  groups,
  craByEnfantId,
}: CraCarnetDepartementPanelProps) {
  const prestaCount = countCarnetDepartementPrestations(groups);
  const bandeauTotaux = totauxForCarnetPrestations(
    groups.flatMap((g) => g.prestations.map((p) => p.enfantId)),
    craByEnfantId,
  );

  const metaCells: { label: string; value: ReactNode }[] = [
    { label: "Missions", value: String(groups.length) },
    {
      label:
        tabId === "en-cours" ? "Prestations en cours" : "Prestations passées",
      value: String(prestaCount),
    },
    { label: "Lignes CRA", value: String(bandeauTotaux.count) },
    { label: "TTC engagé", value: formatTtcEngage(bandeauTotaux) },
  ];

  return (
    <>
      <div
        className="fr-grid-row equipe-fiche-meta-bandeau cra-carnet__meta fr-mb-3w"
        role="group"
        aria-label="Indicateurs du périmètre département"
        aria-live="polite"
      >
        {metaCells.map((cell) => (
          <div
            key={cell.label}
            className="fr-col-12 fr-col-sm-6 fr-col-md-3 equipe-fiche-meta-bandeau__cell"
          >
            <div className="fr-text--xs fr-mb-1v equipe-fiche-meta-bandeau__label">
              {cell.label}
            </div>
            <div className="fr-text--sm fr-mb-0 fr-text--bold">{cell.value}</div>
          </div>
        ))}
      </div>

      {groups.length === 0 ? (
        <Alert
          severity="info"
          title={
            tabId === "en-cours"
              ? "Aucune mission en cours dans votre département"
              : "Aucune prestation passée dans votre département"
          }
          description={
            tabId === "en-cours"
              ? `Aucune prestation active n’est staffée sur le département « ${equipeLabel} ». Vérifiez le staffing sur Missions.`
              : "Quand des prestations de votre département seront terminées, elles apparaîtront ici."
          }
        />
      ) : (
        groups.map((group) => {
          const groupTotaux = totauxForCarnetPrestations(
            group.prestations.map((p) => p.enfantId),
            craByEnfantId,
          );
          return (
            <section
              key={group.missionId}
              className="cra-carnet__chapter fr-mb-4w"
            >
              <div className="cra-carnet__chapter-head fr-mb-2w">
                <div className="cra-carnet__chapter-title">
                  <h3 className="fr-h5 fr-mb-0">
                    <Link to={`/missions/${group.missionId}`}>
                      {group.missionLibelle}
                    </Link>
                  </h3>
                  <StatutBadge statut={group.missionStatut} />
                  <span className="fr-text--xs fr-hint-text cra-carnet__chapter-summary">
                    {groupTotaux.count} CRA · {group.prestations.length} presta
                    {group.prestations.length > 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              <TableShell size="sm" className="fr-mb-0 cra-carnet__dept-table">
                <table>
                  <caption className="fr-sr-only">
                    Prestations du département pour {group.missionLibelle}
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Prestation</th>
                      <th scope="col">Intervenant</th>
                      <th scope="col">Statut</th>
                      <th scope="col" className="fr-cell--right">
                        CRA
                      </th>
                      <th scope="col" className="fr-cell--right">
                        TTC engagé
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.prestations.map((presta) => {
                      const totaux = craByEnfantId.get(presta.enfantId);
                      return (
                        <tr key={presta.enfantId}>
                          <td>{presta.prestationLibelle}</td>
                          <td>{presta.intervenantNom}</td>
                          <td>
                            <StatutBadge statut={presta.statut} />
                          </td>
                          <td className="fr-cell--right">
                            {String(totaux?.count ?? 0)}
                          </td>
                          <td className="fr-cell--right">
                            {formatTtcEngage(totaux)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </TableShell>
            </section>
          );
        })
      )}
    </>
  );
}
