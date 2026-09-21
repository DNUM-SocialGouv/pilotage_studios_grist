import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { CallOut } from "@codegouvfr/react-dsfr/CallOut";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { Tabs } from "@codegouvfr/react-dsfr/Tabs";
import { Tag } from "@codegouvfr/react-dsfr/Tag";
import { EquipeAvatar } from "../components/equipe/EquipeAvatar";
import { tdEquipeTag } from "../components/EquipeTags";
import { useGristPa } from "../GristPaContext";
import { useCraRevueEquipeData } from "../hooks/useCraRevueEquipeData";
import { NothingHerePage } from "../security/NothingHerePage";
import {
  craDeclarerDefaultMonthKey,
  craDeclarerMonthOptions,
} from "../utils/craDeclarer";
import {
  buildCraRevueEquipeSaveRows,
  buildRealiseRevueEquipeFields,
  craRevueEquipeTeamKpis,
  filterEquipeMembersByDepartement,
  filterSuiviForIntervenantMonth,
  initCraRevueEquipeDrafts,
  suiviSansBdc,
  type CraRevueEquipeDraft,
} from "../utils/craRevueEquipe";
import { labelMissionCra, missionsByIdFromRows } from "../utils/craList";
import { formatMontantEur } from "../utils/formatMontant";
import { extractGristReferenceId } from "../utils/gristReferences";
import { updateRealiseRecord } from "../utils/realiseGristWrite";
import type { EquipeMember, MissionEnfant, SuiviMensuel } from "../types";

function formatJoursAffichage(n: number): string {
  if (!Number.isFinite(n) || n === 0) {
    return "0";
  }
  return String(Math.round(n * 10) / 10).replace(".", ",");
}

function memberTabLabel(m: EquipeMember, sansBdc: number): string {
  const name = m.Prenom_Nom?.trim() || `Intervenant #${m.id}`;
  return sansBdc > 0 ? `${name} (${sansBdc})` : name;
}

export function CraRevueEquipePage() {
  const pa = useGristPa();
  const enabled =
    !pa.untrustedEmbed && !pa.outsideGrist && !pa.loading && !pa.error;
  const data = useCraRevueEquipeData(enabled);

  const [monthKey, setMonthKey] = useState(craDeclarerDefaultMonthKey);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<CraRevueEquipeDraft[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveOk, setSaveOk] = useState<string | null>(null);

  const monthOptions = useMemo(() => craDeclarerMonthOptions(), []);

  const teamMembers = useMemo(() => {
    if (!data.manager) {
      return [];
    }
    return filterEquipeMembersByDepartement(
      data.members,
      data.manager.equipeLabel,
      data.manager.id,
    );
  }, [data.manager, data.members]);

  const kpis = useMemo(
    () => craRevueEquipeTeamKpis(teamMembers, data.suivi, monthKey),
    [teamMembers, data.suivi, monthKey],
  );

  const selectedMember =
    teamMembers.find((m) => m.id === selectedMemberId) ?? teamMembers[0] ?? null;

  const selectedRows = useMemo(() => {
    if (!selectedMember) {
      return [] as SuiviMensuel[];
    }
    return filterSuiviForIntervenantMonth(data.suivi, selectedMember.id, monthKey);
  }, [data.suivi, selectedMember, monthKey]);

  const sourceById = useMemo(() => {
    const map = new Map<number, SuiviMensuel>();
    for (const s of selectedRows) {
      map.set(s.id, s);
    }
    return map;
  }, [selectedRows]);

  const missionsById = useMemo(
    () => missionsByIdFromRows(data.missions),
    [data.missions],
  );

  const enfantsById = useMemo(() => {
    const map = new Map<number, MissionEnfant>();
    for (const e of data.missionEnfants) {
      map.set(e.id, e);
    }
    return map;
  }, [data.missionEnfants]);

  const intervenantsById = useMemo(() => {
    const map = new Map<number, string>();
    for (const m of data.members) {
      map.set(m.id, m.Prenom_Nom?.trim() || `Intervenant #${m.id}`);
    }
    return map;
  }, [data.members]);

  const bdcOptions = useMemo(() => {
    return pa.bdcList
      .slice()
      .sort((a, b) =>
        (a.Nom_BdC ?? "").localeCompare(b.Nom_BdC ?? "", "fr", {
          sensitivity: "base",
        }),
      )
      .map((b) => ({
        value: String(b.id),
        label: b.Nom_BdC?.trim() || `BDC #${b.id}`,
      }));
  }, [pa.bdcList]);

  useEffect(() => {
    if (teamMembers.length === 0) {
      setSelectedMemberId(null);
      return;
    }
    if (
      selectedMemberId == null ||
      !teamMembers.some((m) => m.id === selectedMemberId)
    ) {
      setSelectedMemberId(teamMembers[0]!.id);
    }
  }, [teamMembers, selectedMemberId]);

  useEffect(() => {
    setDrafts(initCraRevueEquipeDrafts(selectedRows));
    setSaveOk(null);
    setSaveError(null);
  }, [selectedRows, monthKey, selectedMember?.id]);

  const updateDraft = (realiseId: number, patch: Partial<CraRevueEquipeDraft>) => {
    setDrafts((prev) =>
      prev.map((d) => (d.realiseId === realiseId ? { ...d, ...patch } : d)),
    );
    setSaveOk(null);
    setSaveError(null);
  };

  const metaCells: { label: string; value: ReactNode }[] = [
    {
      label: "Collègues avec saisie",
      value: String(kpis.freelanceCount),
    },
    {
      label: "Jours saisis (équipe)",
      value: `${formatJoursAffichage(kpis.joursTotal)} j`,
    },
    {
      label: "CRA sans BDC",
      value: String(kpis.sansBdcCount),
    },
    {
      label: "Total HT indicatif",
      value: kpis.totalHt != null ? formatMontantEur(kpis.totalHt) : "—",
    },
  ];

  const onSave = async () => {
    setSaving(true);
    setSaveError(null);
    setSaveOk(null);
    try {
      const rows = buildCraRevueEquipeSaveRows(drafts, sourceById);
      if (rows.length === 0) {
        throw new Error("Rien à enregistrer : aucune modification détectée.");
      }
      let updated = 0;
      let failedId: number | null = null;
      try {
        for (const row of rows) {
          failedId = row.realiseId;
          await updateRealiseRecord(
            row.realiseId,
            buildRealiseRevueEquipeFields({
              nbJours: row.nbJours,
              taches: row.taches,
              bdcId: row.bdcId,
            }),
          );
          updated += 1;
        }
        failedId = null;
        setSaveOk(
          `${updated} ligne${updated > 1 ? "s" : ""} mise${updated > 1 ? "s" : ""} à jour.`,
        );
        await data.reload();
      } catch (err) {
        const detail =
          err instanceof Error ? err.message : "Enregistrement impossible.";
        if (updated > 0) {
          await data.reload();
          throw new Error(
            `${updated} ligne${updated > 1 ? "s" : ""} enregistrée${updated > 1 ? "s" : ""}${failedId != null ? `, puis échec sur #${failedId}` : ""} : ${detail}`,
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
        Ouverture de la revue d’équipe…
      </p>
    );
  }

  if (data.status === "error" || !data.manager) {
    return (
      <Alert
        severity="error"
        title="Revue impossible"
        description={
          data.error ??
          "Impossible d’identifier votre fiche Équipe pour déterminer votre département."
        }
      />
    );
  }

  if (!data.manager.equipeLabel.trim()) {
    return (
      <Alert
        severity="info"
        title="Pas de département sur votre fiche"
        description="Cette page est réservée aux managers rattachés à un département (colonne Équipe). Les admins sans équipe n’y ont pas accès — demandez à un Owner de renseigner votre département si vous devez valider des CRA."
      />
    );
  }

  const tabs = teamMembers.map((m) => {
    const rows = filterSuiviForIntervenantMonth(data.suivi, m.id, monthKey);
    const sans = rows.filter(suiviSansBdc).length;
    return {
      tabId: String(m.id),
      label: memberTabLabel(m, sans),
    };
  });

  return (
    <div className="fr-container fr-container--fluid fr-px-0 cra-carnet">
      <header className="cra-carnet__hero fr-mb-3w">
        <CallOut
          className="cra-carnet__callout"
          colorVariant="blue-cumulus"
          titleAs="h2"
          title="Revue CRA équipe"
          bodyAs="div"
        >
          <div className="cra-carnet__hero-grid">
            <div className="cra-carnet__hero-identity">
              <EquipeAvatar
                avatar={data.manager.avatar}
                memberId={data.manager.id}
                size="lg"
              />
              <div className="cra-carnet__hero-identity-text">
                <p className="fr-h4 fr-mb-1v cra-carnet__hero-name">
                  {data.manager.prenomNom}
                </p>
                {data.manager.equipeLabel ? (
                  <div className="cra-carnet__hero-equipe">
                    {tdEquipeTag(data.manager.equipeLabel, { small: true })}
                  </div>
                ) : null}
              </div>
            </div>

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

      <Alert
        className="fr-mb-2w"
        severity="info"
        title="Périmètre département"
        description="Les Access Rules Grist limitent déjà qui lit ou modifie quelles lignes Realise. Cette page affiche en plus uniquement les collègues du même département que vous."
        small
      />

      <div
        className="fr-grid-row equipe-fiche-meta-bandeau cra-carnet__meta fr-mb-3w"
        role="group"
        aria-label="Indicateurs de l’équipe"
        aria-live="polite"
      >
        {metaCells.map((cell) => (
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

      {teamMembers.length === 0 ? (
        <Alert
          severity="info"
          title="Aucun collègue dans votre département"
          description={`Personne d’autre n’a le département « ${data.manager.equipeLabel} » dans Équipe. Vérifiez les fiches ou le staffing.`}
        />
      ) : (
        <Tabs
          label="Freelances du département"
          className="fr-mb-2w"
          selectedTabId={String(selectedMember?.id ?? teamMembers[0]!.id)}
          onTabChange={(id: string) => {
            const n = Number.parseInt(String(id), 10);
            if (Number.isFinite(n)) {
              setSelectedMemberId(n);
            }
          }}
          tabs={tabs}
        >
          {selectedMember ? (
            <>
              <div className="fr-mb-2w">
                <p className="fr-text--sm fr-mb-1v">
                  <strong>
                    {selectedMember.Prenom_Nom?.trim() ||
                      `Intervenant #${selectedMember.id}`}
                  </strong>
                  {typeof selectedMember.TJM === "number" ? (
                    <> · TJM {formatMontantEur(selectedMember.TJM)}</>
                  ) : null}
                  <> · {selectedRows.length} ligne{selectedRows.length > 1 ? "s" : ""}</>
                </p>
                <Link className="fr-link fr-text--sm" to={`/equipe/${selectedMember.id}`}>
                  Voir la fiche Équipe
                </Link>
              </div>

              {selectedRows.length === 0 ? (
                <Alert
                  severity="info"
                  title="Aucune saisie ce mois"
                  description="Ce collègue n’a pas encore de ligne CRA pour ce mois. La déclaration se fait via « Mon carnet »."
                />
              ) : (
                <ul className="fr-raw-list cra-carnet__entries">
                  {drafts.map((draft) => {
                    const row = sourceById.get(draft.realiseId);
                    if (!row) {
                      return null;
                    }
                    const missionId = extractGristReferenceId(row.Missions);
                    const title = labelMissionCra(
                      row,
                      missionsById,
                      enfantsById,
                      intervenantsById,
                    );
                    const joursInputId = `revue-jours-${draft.realiseId}`;
                    const descInputId = `revue-desc-${draft.realiseId}`;
                    const bdcInputId = `revue-bdc-${draft.realiseId}`;
                    const missingBdc = !draft.bdcId.trim();

                    return (
                      <li key={draft.realiseId} className="cra-carnet__entry fr-mb-2w">
                        <div className="cra-carnet__entry-jours">
                          <Input
                            label="Jours"
                            nativeInputProps={{
                              id: joursInputId,
                              inputMode: "decimal",
                              value: draft.nbJours,
                              onChange: (e) =>
                                updateDraft(draft.realiseId, {
                                  nbJours: e.target.value,
                                }),
                              className: "fr-input cra-carnet__jours-input",
                            }}
                          />
                          <span
                            className="cra-carnet__entry-jours-unit"
                            aria-hidden="true"
                          >
                            j
                          </span>
                        </div>
                        <div className="cra-carnet__entry-body">
                          <div className="cra-carnet__entry-title fr-mb-2w">
                            {missionId != null && missionId > 0 ? (
                              <Link to={`/missions/${missionId}`}>{title}</Link>
                            ) : (
                              <span>{title}</span>
                            )}
                            <div className="cra-carnet__entry-meta">
                              {missingBdc ? (
                                <Tag
                                  as="span"
                                  nativeSpanProps={{}}
                                  className="fr-tag--sm"
                                >
                                  Sans BDC
                                </Tag>
                              ) : null}
                            </div>
                          </div>
                          <Input
                            label="Ce qu’il a fait"
                            textArea
                            nativeTextAreaProps={{
                              id: descInputId,
                              value: draft.taches,
                              onChange: (e) =>
                                updateDraft(draft.realiseId, {
                                  taches: e.target.value,
                                }),
                              rows: 2,
                            }}
                          />
                          <Select
                            className="fr-mt-2w"
                            label="Bon de commande"
                            hint={
                              missingBdc
                                ? "Action principale : rattacher cette ligne à un BDC."
                                : undefined
                            }
                            nativeSelectProps={{
                              id: bdcInputId,
                              value: draft.bdcId,
                              onChange: (e) =>
                                updateDraft(draft.realiseId, {
                                  bdcId: e.target.value,
                                }),
                            }}
                          >
                            <option value="">— Choisir un BDC —</option>
                            {bdcOptions.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </Select>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}

              {selectedRows.length > 0 ? (
                <div className="cra-carnet__footer fr-mt-2w">
                  {saveError ? (
                    <Alert
                      className="fr-mb-2w"
                      severity="error"
                      title="Enregistrement impossible"
                      description={saveError}
                      small
                    />
                  ) : null}
                  {saveOk ? (
                    <Alert
                      className="fr-mb-2w"
                      severity="success"
                      title="Enregistré"
                      description={saveOk}
                      small
                    />
                  ) : null}
                  <Button
                    type="button"
                    onClick={() => void onSave()}
                    disabled={saving || data.isReloading}
                  >
                    {saving ? "Enregistrement…" : "Enregistrer les rattachements"}
                  </Button>
                </div>
              ) : null}
            </>
          ) : null}
        </Tabs>
      )}
    </div>
  );
}
