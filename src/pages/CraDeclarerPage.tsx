import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { CallOut } from "@codegouvfr/react-dsfr/CallOut";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { Tabs } from "@codegouvfr/react-dsfr/Tabs";
import { useAclProfil } from "../AclProfilContext";
import { EquipeAvatar } from "../components/equipe/EquipeAvatar";
import { tdEquipeTag } from "../components/EquipeTags";
import { TableShell } from "../components/FinanceRecap";
import { StatutBadge } from "../components/StatutBadge";
import { useGristPa } from "../GristPaContext";
import { useCraDeclarerData } from "../hooks/useCraDeclarerData";
import { NothingHerePage } from "../security/NothingHerePage";
import { aggregateCraByEnfantId } from "../utils/craByMission";
import {
  craCarnetDepartementGroups,
  type CarnetDepartementMissionGroup,
} from "../utils/craCarnetDepartement";
import {
  buildCraDeclarerSaveRows,
  buildRealiseDeclarerFields,
  craDeclarerDefaultMonthKey,
  craDeclarerMonthOptions,
  craDeclarerPrestationGroups,
  craDeclarerPrestationRowsFlat,
  craDeclarerTotalHt,
  initCraDeclarerDrafts,
  parseCraDeclarerJours,
  periodeTimestampForMonthKey,
  type CraDeclarerDraft,
} from "../utils/craDeclarer";
import { isMonCarnetManagerRole } from "../utils/droitsPagesThemes";
import { equipeMontantLisible } from "../utils/equipeList";
import { formatMontantEur } from "../utils/formatMontant";
import {
  createRealiseRecord,
  updateRealiseRecord,
} from "../utils/realiseGristWrite";
import type { CraTotaux } from "../utils/suiviMensuel";

type CarnetTabId = "en-cours" | "passees";

function sumDraftJours(drafts: CraDeclarerDraft[]): number {
  let total = 0;
  for (const d of drafts) {
    try {
      const n = parseCraDeclarerJours(d.nbJours);
      if (n != null) {
        total += n;
      }
    } catch {
      // champ invalide : ignore pour le total affiché
    }
  }
  return total;
}

function formatJoursAffichage(n: number): string {
  if (!Number.isFinite(n) || n === 0) {
    return "0";
  }
  return String(Math.round(n * 10) / 10).replace(".", ",");
}

function countPrestations(groups: CarnetDepartementMissionGroup[]): number {
  return groups.reduce((sum, g) => sum + g.prestations.length, 0);
}

function totauxForPrestations(
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

function formatCraCount(count: number): string {
  return String(count);
}

function formatTtcEngage(totaux: CraTotaux | undefined): string {
  if (!totaux || totaux.count === 0) {
    return "—";
  }
  return formatMontantEur(totaux.ttc);
}

export function CraDeclarerPage() {
  const pa = useGristPa();
  const { role } = useAclProfil();
  const enabled =
    !pa.untrustedEmbed && !pa.outsideGrist && !pa.loading && !pa.error;
  const data = useCraDeclarerData(enabled);

  // Standalone sans rôle : vue freelance (saisie) pour les previews locales.
  const managerMode = isMonCarnetManagerRole(role);

  const [monthKey, setMonthKey] = useState(craDeclarerDefaultMonthKey);
  const [drafts, setDrafts] = useState<CraDeclarerDraft[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveOk, setSaveOk] = useState<string | null>(null);
  const [tabId, setTabId] = useState<CarnetTabId>("en-cours");

  const monthOptions = useMemo(() => craDeclarerMonthOptions(), []);

  const freelanceGroups = useMemo(() => {
    if (managerMode || !data.self) {
      return [];
    }
    return craDeclarerPrestationGroups(
      data.self.id,
      data.missionEnfants,
      data.missions,
    );
  }, [managerMode, data.self, data.missionEnfants, data.missions]);

  const flatRows = useMemo(
    () => craDeclarerPrestationRowsFlat(freelanceGroups),
    [freelanceGroups],
  );

  const managerGroupsEnCours = useMemo(() => {
    if (!managerMode || !data.self) {
      return [];
    }
    return craCarnetDepartementGroups(
      data.self.equipeLabel,
      data.missionEnfants,
      data.missions,
      data.intervenants,
      "en-cours",
    );
  }, [
    managerMode,
    data.self,
    data.missionEnfants,
    data.missions,
    data.intervenants,
  ]);

  const managerGroupsPassees = useMemo(() => {
    if (!managerMode || !data.self) {
      return [];
    }
    const all = craCarnetDepartementGroups(
      data.self.equipeLabel,
      data.missionEnfants,
      data.missions,
      data.intervenants,
      "toutes",
    );
    return all
      .map((g) => ({
        ...g,
        prestations: g.prestations.filter((p) => !p.enCours),
      }))
      .filter((g) => g.prestations.length > 0);
  }, [
    managerMode,
    data.self,
    data.missionEnfants,
    data.missions,
    data.intervenants,
  ]);

  const managerActiveGroups =
    tabId === "en-cours" ? managerGroupsEnCours : managerGroupsPassees;
  const managerPrestaCount = countPrestations(managerActiveGroups);

  const craByEnfantId = useMemo(
    () => aggregateCraByEnfantId(data.suivi),
    [data.suivi],
  );

  const managerCraTotaux = useMemo(() => {
    const ids = managerActiveGroups.flatMap((g) =>
      g.prestations.map((p) => p.enfantId),
    );
    return totauxForPrestations(ids, craByEnfantId);
  }, [managerActiveGroups, craByEnfantId]);

  const rowsByEnfantId = useMemo(
    () => new Map(flatRows.map((r) => [r.enfantId, r] as const)),
    [flatRows],
  );

  const totalSaisi = useMemo(() => sumDraftJours(drafts), [drafts]);
  const showTjm = equipeMontantLisible(data.self?.tjm);
  const totalHt = useMemo(
    () => craDeclarerTotalHt(totalSaisi, showTjm ? data.self?.tjm : undefined),
    [totalSaisi, showTjm, data.self?.tjm],
  );

  const freelanceMetaCells: { label: string; value: ReactNode }[] = [
    {
      label: "TJM",
      value: showTjm ? formatMontantEur(data.self!.tjm) : "—",
    },
    {
      label: "Prestations en cours",
      value: String(flatRows.length),
    },
    {
      label: "Jours saisis",
      value: `${formatJoursAffichage(totalSaisi)} j`,
    },
    {
      label: "Total HT",
      value: totalHt != null ? formatMontantEur(totalHt) : "—",
    },
  ];

  const managerMetaCells: { label: string; value: ReactNode }[] = [
    {
      label: "Missions",
      value: String(managerActiveGroups.length),
    },
    {
      label:
        tabId === "en-cours"
          ? "Prestations en cours"
          : "Prestations passées",
      value: String(managerPrestaCount),
    },
    {
      label: "Lignes CRA",
      value: formatCraCount(managerCraTotaux.count),
    },
    {
      label: "TTC engagé",
      value: formatTtcEngage(managerCraTotaux),
    },
  ];

  useEffect(() => {
    if (managerMode || !data.self || data.status !== "ok") {
      setDrafts([]);
      return;
    }
    setDrafts(initCraDeclarerDrafts(flatRows, data.suivi, data.self.id, monthKey));
    setSaveOk(null);
    setSaveError(null);
  }, [managerMode, data.self, data.status, data.suivi, flatRows, monthKey]);

  const updateDraft = (enfantId: number, patch: Partial<CraDeclarerDraft>) => {
    setDrafts((prev) =>
      prev.map((d) => (d.enfantId === enfantId ? { ...d, ...patch } : d)),
    );
    setSaveOk(null);
    setSaveError(null);
  };

  const onSave = async () => {
    if (!data.self || managerMode) {
      return;
    }
    setSaving(true);
    setSaveError(null);
    setSaveOk(null);
    try {
      const rows = buildCraDeclarerSaveRows(drafts, rowsByEnfantId);
      if (rows.length === 0) {
        throw new Error("Rien à enregistrer : indiquez des jours ou une description.");
      }
      const periodeTs = periodeTimestampForMonthKey(monthKey);
      let created = 0;
      let updated = 0;
      let failedLabel: string | null = null;
      try {
        for (const row of rows) {
          const label =
            rowsByEnfantId.get(row.enfantId)?.prestationLibelle ??
            `prestation #${row.enfantId}`;
          failedLabel = label;
          const fields = buildRealiseDeclarerFields({
            intervenantId: data.self.id,
            missionId: row.missionId,
            enfantId: row.enfantId,
            nbJours: row.nbJours,
            taches: row.taches,
            periodeTs,
            equipeLabel: data.self.equipeLabel,
          });
          if (row.existingRealiseId != null) {
            await updateRealiseRecord(row.existingRealiseId, fields);
            updated += 1;
          } else {
            await createRealiseRecord(fields);
            created += 1;
          }
        }
        failedLabel = null;
        setSaveOk(
          `Carnet enregistré : ${created} création${created > 1 ? "s" : ""}, ${updated} mise${updated > 1 ? "s" : ""} à jour.`,
        );
        await data.reload();
      } catch (err) {
        const done = created + updated;
        const detail =
          err instanceof Error ? err.message : "Enregistrement impossible.";
        if (done > 0) {
          await data.reload();
          throw new Error(
            `${done} ligne${done > 1 ? "s" : ""} enregistrée${done > 1 ? "s" : ""}${failedLabel ? `, puis échec sur « ${failedLabel} »` : ""} : ${detail}`,
          );
        }
        throw err instanceof Error ? err : new Error(detail);
      }
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Enregistrement impossible.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (pa.untrustedEmbed || pa.outsideGrist) {
    return <NothingHerePage />;
  }

  if (pa.loading) {
    return (
      <p className="fr-text--sm" role="status">
        Connexion au document…
      </p>
    );
  }

  if (pa.error) {
    return (
      <Alert severity="error" title="Document indisponible" description={pa.error} />
    );
  }

  if (data.status === "loading" || data.status === "idle") {
    return (
      <p className="fr-text--sm" role="status">
        Ouverture de votre carnet…
      </p>
    );
  }

  if (data.status === "error" || !data.self) {
    return (
      <Alert
        severity="error"
        title="Carnet impossible"
        description={
          data.error ??
          "Impossible d’identifier votre fiche Équipe pour ouvrir le carnet."
        }
      />
    );
  }

  if (managerMode && !data.self.equipeLabel.trim()) {
    return (
      <div className="fr-container fr-container--fluid fr-px-0">
        <Alert
          className="fr-mt-2w"
          severity="warning"
          title="Pas de département sur votre fiche"
          description="Cette vue liste les missions du département (colonne Équipe). Demandez à un Owner de renseigner votre département si vous devez suivre le staffing Product, Design, etc."
        />
      </div>
    );
  }

  const calloutTitle = managerMode
    ? `Mon carnet — ${data.self.equipeLabel}`
    : "Mon carnet";

  return (
    <div className="fr-container fr-container--fluid fr-px-0 cra-carnet">
      <header className="cra-carnet__hero fr-mb-3w">
        <CallOut
          className="cra-carnet__callout"
          colorVariant="blue-cumulus"
          titleAs="h2"
          title={calloutTitle}
          bodyAs="div"
        >
          <div className="cra-carnet__hero-grid">
            <div className="cra-carnet__hero-identity">
              <EquipeAvatar
                avatar={data.self.avatar}
                memberId={data.self.id}
                size="lg"
              />
              <div className="cra-carnet__hero-identity-text">
                <p className="fr-h4 fr-mb-1v cra-carnet__hero-name">
                  {data.self.prenomNom}
                </p>
                {data.self.equipeLabel ? (
                  <div className="cra-carnet__hero-equipe">
                    {tdEquipeTag(data.self.equipeLabel, { small: true })}
                  </div>
                ) : null}
              </div>
            </div>

            {!managerMode ? (
              <div className="cra-carnet__hero-aside">
                <Select
                  label="Mois du carnet"
                  nativeSelectProps={{
                    value: monthKey,
                    onChange: (e) => setMonthKey(e.target.value),
                  }}
                >
                  {monthOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </div>
            ) : null}
          </div>
        </CallOut>
      </header>

      {data.refsError ? (
        <Alert
          className="fr-mb-2w"
          severity="warning"
          title="Référentiels partiels"
          description={data.refsError}
          small
        />
      ) : null}

      <Tabs
        label="Sections du carnet"
        className="fr-mb-2w"
        selectedTabId={tabId}
        onTabChange={(id) => {
          if (id === "passees") {
            setTabId("passees");
          } else {
            setTabId("en-cours");
          }
        }}
        tabs={
          managerMode
            ? [
                {
                  tabId: "en-cours",
                  label: `En cours (${countPrestations(managerGroupsEnCours)})`,
                },
                {
                  tabId: "passees",
                  label: `Passées (${countPrestations(managerGroupsPassees)})`,
                },
              ]
            : [
                {
                  tabId: "en-cours",
                  label: `En cours (${flatRows.length})`,
                },
                {
                  tabId: "passees",
                  label: "Passées",
                },
              ]
        }
      >
        {managerMode ? (
          <>
            <div
              className="fr-grid-row equipe-fiche-meta-bandeau cra-carnet__meta fr-mb-3w"
              role="group"
              aria-label="Indicateurs du périmètre département"
              aria-live="polite"
            >
              {managerMetaCells.map((cell) => (
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

            {managerActiveGroups.length === 0 ? (
              <Alert
                severity="info"
                title={
                  tabId === "en-cours"
                    ? "Aucune mission en cours dans votre département"
                    : "Aucune prestation passée dans votre département"
                }
                description={
                  tabId === "en-cours"
                    ? `Aucune prestation active n’est staffée sur le département « ${data.self.equipeLabel} ». Vérifiez le staffing sur Missions.`
                    : "Quand des prestations de votre département seront terminées, elles apparaîtront ici."
                }
              />
            ) : (
              managerActiveGroups.map((group) => {
                const groupTotaux = totauxForPrestations(
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
                          {formatCraCount(groupTotaux.count)} CRA ·{" "}
                          {group.prestations.length} presta
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
                                  {formatCraCount(totaux?.count ?? 0)}
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
        ) : tabId === "en-cours" ? (
          <>
            <div
              className="fr-grid-row equipe-fiche-meta-bandeau cra-carnet__meta fr-mb-3w"
              role="group"
              aria-label="Indicateurs des prestations en cours"
              aria-live="polite"
            >
              {freelanceMetaCells.map((cell) => (
                <div
                  key={cell.label}
                  className="fr-col-12 fr-col-md-3 equipe-fiche-meta-bandeau__cell"
                >
                  <div className="fr-text--xs fr-mb-1v equipe-fiche-meta-bandeau__label">
                    {cell.label}
                  </div>
                  <div className="fr-text--sm fr-mb-0 fr-text--bold">{cell.value}</div>
                </div>
              ))}
            </div>

            {flatRows.length === 0 ? (
              <Alert
                severity="info"
                title="Aucune prestation en cours"
                description="Aucune prestation active n’est rattachée à votre fiche Équipe. Vérifiez le staffing sur Missions, ou contactez un responsable."
              />
            ) : (
              <>
                {freelanceGroups.map((group) => (
                  <section key={group.missionId} className="cra-carnet__chapter fr-mb-4w">
                    <div className="cra-carnet__chapter-head fr-mb-2w">
                      <div className="cra-carnet__chapter-title">
                        <h3 className="fr-h5 fr-mb-0">
                          <Link to={`/missions/${group.missionId}`}>
                            {group.missionLibelle}
                          </Link>
                        </h3>
                        <StatutBadge statut={group.missionStatut} />
                      </div>
                    </div>

                    <ul className="fr-raw-list cra-carnet__entries">
                      {group.prestations.map((presta) => {
                        const draft = drafts.find((d) => d.enfantId === presta.enfantId);
                        if (!draft) {
                          return null;
                        }
                        const joursInputId = `cra-jours-${presta.enfantId}`;
                        const joursValue = draft.nbJours.trim().replace(",", ".");
                        return (
                          <li key={presta.enfantId} className="cra-carnet__entry fr-mb-2w">
                            <div className="cra-carnet__entry-jours">
                              <label className="fr-label fr-sr-only" htmlFor={joursInputId}>
                                Nombre de jours
                              </label>
                              <input
                                id={joursInputId}
                                className="fr-input cra-carnet__jours-input"
                                type="number"
                                inputMode="decimal"
                                min={0}
                                step={0.5}
                                placeholder="0"
                                value={joursValue}
                                onChange={(e) =>
                                  updateDraft(presta.enfantId, {
                                    nbJours: e.target.value,
                                  })
                                }
                              />
                              <span
                                className="cra-carnet__entry-jours-unit"
                                aria-hidden="true"
                              >
                                jours
                              </span>
                            </div>
                            <div className="cra-carnet__entry-body">
                              <div className="cra-carnet__entry-title fr-mb-2w">
                                <p className="fr-text--bold fr-mb-0">
                                  {presta.prestationLibelle}
                                </p>
                                {draft.existingRealiseId != null ? (
                                  <div className="cra-carnet__entry-meta">
                                    <span className="fr-text--xs fr-hint-text">
                                      Déjà saisi ce mois
                                    </span>
                                  </div>
                                ) : null}
                              </div>
                              <Input
                                label="Ce que vous avez fait"
                                hintText="Description courte du mois"
                                textArea
                                nativeTextAreaProps={{
                                  rows: 2,
                                  value: draft.taches,
                                  placeholder:
                                    "Qu’avez-vous fait ce mois sur cette prestation ?",
                                  onChange: (e) =>
                                    updateDraft(presta.enfantId, {
                                      taches: e.target.value,
                                    }),
                                }}
                              />
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                ))}

                {saveError ? (
                  <Alert
                    className="fr-mb-2w"
                    severity="error"
                    title="Enregistrement refusé"
                    description={saveError}
                  />
                ) : null}
                {saveOk ? (
                  <Alert
                    className="fr-mb-2w"
                    severity="success"
                    title="Carnet enregistré"
                    description={saveOk}
                  />
                ) : null}

                <div className="cra-carnet__footer fr-mt-2w">
                  <p className="fr-text--xs fr-hint-text fr-mb-2w">
                    Les saisies restent modifiables tant que vous n’avez pas quitté la
                    page — cliquez pour les écrire dans Grist.
                  </p>
                  <Button
                    type="button"
                    onClick={() => void onSave()}
                    disabled={saving || data.isReloading}
                  >
                    {saving ? "Enregistrement…" : "Publier le carnet"}
                  </Button>
                </div>
              </>
            )}
          </>
        ) : (
          <Alert
            severity="info"
            title="Prestations passées"
            description="La liste des prestations terminées arrivera dans un prochain passage. Pour l’instant, seuls les dossiers en cours sont saisis ici."
          />
        )}
      </Tabs>
    </div>
  );
}
