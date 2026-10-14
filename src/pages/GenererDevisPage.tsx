import { useMemo, useState } from "react";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { DevisOpteamisPreview } from "../components/devis/DevisOpteamisPreview";
import { DsfrSelectRichMulti } from "../components/dsfr/DsfrSelectRichMulti";
import { UO_LOT4_PACKAGED } from "../data/uoLot4Referentiel";
import {
  computeChiffrageForPorteur,
  findUoTarifForPorteur,
  formatChiffrageForPorteur,
  formatEuro,
  getUoGrilleForPorteur,
} from "../data/uoTarifsByPorteur";
import { useGristPa } from "../GristPaContext";
import { NothingHerePage } from "../security/NothingHerePage";
import {
  collectBdcEquipeOptions,
  collectBdcFinanceurOptions,
  mergeChoiceOptions,
} from "../utils/bdcFormFields";
import {
  computeDecoupePv,
  countMonthsInPeriod,
  formatDecoupePvMarkdown,
} from "../utils/devisPorteurs/decoupePv";
import {
  copyOpteamisDevis,
  formatEquipesSelection,
  formatUoConcernees,
  type DevisCopyFormat,
} from "../utils/devisPorteurs/opteamis";
import {
  DEVIS_PROFIL_MAX_SELECTION,
  DEVIS_PROFIL_TEMPLATES,
  mergeDevisProfilTemplates,
} from "../utils/devisPorteurs/templates";
import {
  DEVIS_PORTEURS,
  DEVIS_PORTEUR_V1_ID,
  EMPTY_OPTEAMIS_DEVIS_FIELDS,
  type DevisPorteurId,
  type OpteamisDevisFields,
} from "../utils/devisPorteurs/types";

type PageStep = "porteur" | "formulaire" | "apercu";

function buildUoOptions(porteurId: DevisPorteurId) {
  return UO_LOT4_PACKAGED.map((uo) => {
    const tarif = findUoTarifForPorteur(porteurId, uo.code);
    const prix = tarif
      ? ` — ${formatEuro(tarif.prixHt)} HT / ${formatEuro(tarif.prixTtc)} TTC`
      : "";
    return {
      value: uo.code,
      label: `${uo.code} — ${uo.label}${prix}`,
    };
  });
}

/**
 * Outil Admin : assembler un texte de devis (porteur → formulaire → aperçu / copie).
 * Pas de PDF, pas d’IA, pas d’écriture Grist — lecture choix BDC uniquement.
 */
export function GenererDevisPage() {
  const pa = useGristPa();

  const [step, setStep] = useState<PageStep>("porteur");
  const [porteur, setPorteur] = useState<DevisPorteurId>(DEVIS_PORTEUR_V1_ID);
  const [fields, setFields] = useState<OpteamisDevisFields>(EMPTY_OPTEAMIS_DEVIS_FIELDS);
  const [profilIds, setProfilIds] = useState<string[]>([]);
  const [selectedEquipes, setSelectedEquipes] = useState<string[]>([]);
  const [selectedUoCodes, setSelectedUoCodes] = useState<string[]>([]);
  const [uoQuantites, setUoQuantites] = useState<Record<string, string>>({});
  const [nbPvInput, setNbPvInput] = useState("");
  const [nbPvTouched, setNbPvTouched] = useState(false);
  const [copyOk, setCopyOk] = useState(false);
  const [copyError, setCopyError] = useState<string | undefined>();
  const [copyFormat, setCopyFormat] = useState<DevisCopyFormat>("html");

  const financeurOptions = useMemo(
    () =>
      collectBdcFinanceurOptions(pa.bdcList).map((f) => ({ value: f, label: f })),
    [pa.bdcList],
  );

  const equipeOptions = useMemo(() => {
    const fromBdc = collectBdcEquipeOptions(pa.bdcList);
    const extras = DEVIS_PROFIL_TEMPLATES.map((t) => t.equipeSuggeree).filter(
      (e): e is string => Boolean(e),
    );
    return mergeChoiceOptions(fromBdc, extras).map((e) => ({
      value: e,
      label: e,
    }));
  }, [pa.bdcList]);

  const uoOptions = useMemo(() => buildUoOptions(porteur), [porteur]);
  const grilleMeta = useMemo(() => getUoGrilleForPorteur(porteur)?.meta, [porteur]);

  const quantiteLignes = useMemo(
    () =>
      selectedUoCodes.map((code) => {
        const raw = uoQuantites[code]?.trim().replace(",", ".") ?? "";
        const n = Number.parseFloat(raw);
        return { code, quantite: Number.isFinite(n) && n > 0 ? n : 0 };
      }),
    [selectedUoCodes, uoQuantites],
  );

  const chiffrageCalc = useMemo(
    () => computeChiffrageForPorteur(porteur, quantiteLignes),
    [porteur, quantiteLignes],
  );

  const chiffrageText = useMemo(
    () => formatChiffrageForPorteur(porteur, quantiteLignes),
    [porteur, quantiteLignes],
  );

  const suggestedNbPv = useMemo(() => {
    const n = countMonthsInPeriod(fields.periodeDebut, fields.periodeFin);
    if (n == null) {
      return null;
    }
    return Math.min(n, 36);
  }, [fields.periodeDebut, fields.periodeFin]);

  const effectiveNbPvInput =
    nbPvTouched || nbPvInput.trim() !== ""
      ? nbPvInput
      : suggestedNbPv != null
        ? String(suggestedNbPv)
        : nbPvInput;

  const nbPvParsed = useMemo(() => {
    const raw = effectiveNbPvInput.trim();
    if (!raw) {
      return null;
    }
    const n = Number.parseInt(raw, 10);
    return Number.isInteger(n) && n > 0 ? n : null;
  }, [effectiveNbPvInput]);

  const pvSources = useMemo(
    () =>
      chiffrageCalc.lignes
        .filter((l) => l.quantite > 0)
        .map((l) => ({
          code: l.code,
          quantite: l.quantite,
          prixUnitaireHt: l.prixUnitaireHt,
          prixUnitaireTtc: l.prixUnitaireTtc,
        })),
    [chiffrageCalc.lignes],
  );

  const decoupePvResult = useMemo(() => {
    if (nbPvParsed == null) {
      return null;
    }
    return computeDecoupePv({
      nbPv: nbPvParsed,
      periodeDebut: fields.periodeDebut,
      periodeFin: fields.periodeFin,
      sources: pvSources,
    });
  }, [nbPvParsed, fields.periodeDebut, fields.periodeFin, pvSources]);

  const decoupePvText = useMemo(
    () => (decoupePvResult ? formatDecoupePvMarkdown(decoupePvResult) : ""),
    [decoupePvResult],
  );

  const exportFields = useMemo(
    (): OpteamisDevisFields => ({
      ...fields,
      equipes: formatEquipesSelection(selectedEquipes),
      uoConcernees: formatUoConcernees(selectedUoCodes),
      informationsChiffrage: chiffrageText,
      decoupePv: decoupePvText,
    }),
    [fields, selectedEquipes, selectedUoCodes, chiffrageText, decoupePvText],
  );

  if (pa.untrustedEmbed) {
    return <NothingHerePage />;
  }

  const patchField = (key: keyof OpteamisDevisFields, value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  };

  const applyProfilTemplates = (ids: string[]) => {
    const limited =
      ids.length > DEVIS_PROFIL_MAX_SELECTION
        ? ids.slice(-DEVIS_PROFIL_MAX_SELECTION)
        : ids;
    setProfilIds(limited);
    if (limited.length === 0) {
      return;
    }
    const merged = mergeDevisProfilTemplates(limited);
    setFields((prev) => ({
      ...prev,
      demandeContexte: merged.demandeContexte,
      livrablesAttendus: merged.livrablesAttendus,
    }));
    setSelectedUoCodes(merged.uoCodesSuggeres);
    setUoQuantites((prev) => {
      const next: Record<string, string> = {};
      for (const code of merged.uoCodesSuggeres) {
        next[code] = prev[code] ?? "";
      }
      return next;
    });
    if (merged.equipesSuggerees.length > 0) {
      setSelectedEquipes((prev) => {
        const next = [...prev];
        for (const equipe of merged.equipesSuggerees) {
          if (!next.includes(equipe)) {
            next.push(equipe);
          }
        }
        return next;
      });
    }
  };

  const onUoSelectionChange = (codes: string[]) => {
    setSelectedUoCodes(codes);
    setUoQuantites((prev) => {
      const next: Record<string, string> = {};
      for (const code of codes) {
        next[code] = prev[code] ?? "";
      }
      return next;
    });
  };

  const setQuantiteForUo = (code: string, value: string) => {
    setUoQuantites((prev) => ({ ...prev, [code]: value }));
  };

  const clearCopyFeedback = () => {
    setCopyOk(false);
    setCopyError(undefined);
  };

  const onCopyFormatChange = (format: DevisCopyFormat) => {
    clearCopyFeedback();
    setCopyFormat(format);
  };

  const onCopy = async () => {
    setCopyError(undefined);
    setCopyOk(false);
    try {
      await copyOpteamisDevis(exportFields, copyFormat);
      setCopyOk(true);
    } catch {
      setCopyError("Impossible de copier dans le presse-papier.");
    }
  };

  const porteurDef = DEVIS_PORTEURS.find((p) => p.id === porteur);
  const formDisabled = pa.loading;

  const stepHint =
    step === "porteur"
      ? "Choisissez le porteur et le schéma de rédaction."
      : step === "formulaire"
        ? `${porteurDef?.label ?? porteur} — complétez le contexte et les UO.`
        : "Relisez le texte puis copiez-le pour envoi au porteur.";

  return (
    <div className="fr-container fr-mt-2w fr-mb-4w">
      <h1 className="fr-h3 fr-mb-1w">Générer un devis</h1>
      <p className="fr-text--sm fr-text-mention--grey fr-mb-3w">{stepHint}</p>

      {pa.outsideGrist ? (
        <Alert
          severity="info"
          title="Aperçu hors Grist"
          description="Les listes Financeur et Équipe se remplissent depuis les bons de commande du document. Ouvrez le widget dans Grist pour des choix à jour ; le reste du parcours (textes, UO, copie) fonctionne ici."
          className="fr-mb-3w"
        />
      ) : null}

      {pa.loading ? (
        <p className="fr-text--sm fr-mb-3w" role="status">
          Chargement des listes Financeur / Équipe…
        </p>
      ) : null}

      {pa.error ? (
        <Alert
          severity="warning"
          title="Listes BDC indisponibles"
          description="Vous pouvez quand même rédiger le devis ; Financeur et Équipe pourront être saisis autrement ou laissés vides."
          className="fr-mb-3w"
        />
      ) : null}

      {step === "porteur" ? (
        <div className="fr-flow">
          <p className="fr-text--sm">
            Chaque porteur (groupement) a un format de devis et une grille tarifaire UO
            propres. Les 3 porteurs partagent le même formulaire ; grilles BPU distinctes.
          </p>
          <fieldset className="fr-fieldset">
            <legend className="fr-fieldset__legend fr-text--regular">Porteur</legend>
            {DEVIS_PORTEURS.map((p) => (
              <div key={p.id} className="fr-fieldset__element fr-mb-2w">
                <div className="fr-radio-group">
                  <input
                    type="radio"
                    id={`devis-porteur-${p.id}`}
                    name="devis-porteur"
                    value={p.id}
                    checked={porteur === p.id}
                    disabled={!p.enabled}
                    onChange={() => setPorteur(p.id)}
                  />
                  <label className="fr-label" htmlFor={`devis-porteur-${p.id}`}>
                    {p.label}
                    {!p.enabled ? " (prochainement)" : ""}
                    <span className="fr-hint-text">
                      {p.entreprises.join(" · ")} — {p.description}
                    </span>
                  </label>
                </div>
              </div>
            ))}
          </fieldset>
          <Button
            type="button"
            priority="primary"
            disabled={!porteurDef?.enabled}
            onClick={() => setStep("formulaire")}
          >
            Continuer
          </Button>
        </div>
      ) : null}

      {step === "formulaire" ? (
        <div className="pilotage-devis-layout fr-flow">
          <section
            className="pilotage-devis-form-section"
            aria-labelledby="devis-section-infos"
          >
            <h2 id="devis-section-infos" className="pilotage-devis-form-section__title">
              Infos
            </h2>
            <Input
              label="Nom du projet"
              nativeInputProps={{
                value: fields.nomProjet,
                onChange: (e) => patchField("nomProjet", e.currentTarget.value),
              }}
            />

            <Select
              label="Financeur"
              nativeSelectProps={{
                value: fields.financeur,
                onChange: (e) => patchField("financeur", e.currentTarget.value),
                disabled: formDisabled,
              }}
            >
              <option value="">— Choisir un financeur —</option>
              {financeurOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>

            <DsfrSelectRichMulti
              label="Équipe"
              placeholderWhenEmpty="Aucune équipe"
              pluralEntityLabel="équipes"
              maxInlineSize="100%"
              options={equipeOptions}
              selectedValues={selectedEquipes}
              onSelectedValuesChange={setSelectedEquipes}
              disabled={formDisabled}
            />

            <div className="fr-grid-row fr-grid-row--gutters">
              <div className="fr-col-12 fr-col-md-6">
                <Input
                  label="Date de début"
                  nativeInputProps={{
                    type: "date",
                    value: fields.periodeDebut,
                    onChange: (e) =>
                      patchField("periodeDebut", e.currentTarget.value),
                  }}
                />
              </div>
              <div className="fr-col-12 fr-col-md-6">
                <Input
                  label="Date de fin"
                  nativeInputProps={{
                    type: "date",
                    value: fields.periodeFin,
                    onChange: (e) => patchField("periodeFin", e.currentTarget.value),
                  }}
                />
              </div>
            </div>
          </section>

          <section
            className="pilotage-devis-form-section"
            aria-labelledby="devis-section-generation"
          >
            <h2
              id="devis-section-generation"
              className="pilotage-devis-form-section__title"
            >
              Génération de la demande
            </h2>
            <DsfrSelectRichMulti
              label="Type de prestation"
              hintText="1 ou 2 profils — pré-remplit la demande, les livrables, l’équipe et les UO suggérées. Vous pouvez ensuite modifier les textes."
              placeholderWhenEmpty="Aucun profil"
              pluralEntityLabel="profils"
              maxInlineSize="100%"
              maxSelections={DEVIS_PROFIL_MAX_SELECTION}
              showBulkActions={false}
              options={DEVIS_PROFIL_TEMPLATES.map((t) => ({
                value: t.id,
                label: t.optionLabel,
              }))}
              selectedValues={profilIds}
              onSelectedValuesChange={applyProfilTemplates}
            />

            <div className="fr-input-group">
              <label className="fr-label" htmlFor="devis-demande">
                Demande (contexte)
                <span className="fr-hint-text">
                  Texte pré-rempli selon le(s) type(s) de prestation — éditable
                </span>
              </label>
              <textarea
                id="devis-demande"
                className="fr-input"
                rows={6}
                value={fields.demandeContexte}
                onChange={(e) =>
                  patchField("demandeContexte", e.currentTarget.value)
                }
              />
            </div>

            <div className="fr-input-group">
              <label className="fr-label" htmlFor="devis-livrables">
                Liste des livrables attendus
                <span className="fr-hint-text">
                  Texte pré-rempli selon le(s) type(s) de prestation — éditable
                </span>
              </label>
              <textarea
                id="devis-livrables"
                className="fr-input"
                rows={5}
                value={fields.livrablesAttendus}
                onChange={(e) =>
                  patchField("livrablesAttendus", e.currentTarget.value)
                }
              />
            </div>
          </section>

          <section
            className="pilotage-devis-form-section"
            aria-labelledby="devis-section-chiffrage"
          >
            <h2
              id="devis-section-chiffrage"
              className="pilotage-devis-form-section__title"
            >
              Informations de chiffrage
            </h2>

            <DsfrSelectRichMulti
              label="Unités d'œuvre (CCTP Lot 4)"
              hintText={
                grilleMeta
                  ? `Prix unitaires BPU ${grilleMeta.labelCourt}`
                  : "Sélectionnez un porteur pour afficher les prix BPU."
              }
              placeholderWhenEmpty="Aucune UO"
              pluralEntityLabel="UO"
              maxInlineSize="100%"
              options={uoOptions}
              selectedValues={selectedUoCodes}
              onSelectedValuesChange={onUoSelectionChange}
              searchable
            />

            {selectedUoCodes.length === 0 ? (
              <p className="fr-text--sm fr-mb-0 fr-mt-2w">
                Sélectionnez au moins une unité d’œuvre pour saisir les quantités.
              </p>
            ) : (
              <div className="pilotage-devis-uo-list fr-mt-2w">
                {selectedUoCodes.map((code) => {
                  const tarif = findUoTarifForPorteur(porteur, code);
                  const ligne = chiffrageCalc.lignes.find((l) => l.code === tarif?.code);
                  const inputId = `devis-qty-${code.replace(/\s+/g, "-")}`;
                  const libelleUo = tarif
                    ? tarif.label.replace(/^UO\s+/i, "").trim()
                    : null;
                  return (
                    <div key={code} className="pilotage-devis-uo-row">
                      <div className="pilotage-devis-uo-row__identity">
                        <p className="fr-text--sm fr-mb-0">
                          <strong>{code}</strong>
                        </p>
                        {libelleUo ? (
                          <p className="fr-text--sm fr-mb-0">{libelleUo}</p>
                        ) : null}
                        {tarif ? (
                          <p className="fr-hint-text fr-mb-0">
                            {formatEuro(tarif.prixHt)} HT
                          </p>
                        ) : (
                          <p className="fr-hint-text fr-mb-0">Tarif BPU indisponible</p>
                        )}
                      </div>
                      <div className="pilotage-devis-uo-row__saisie">
                        <div className="fr-input-group fr-mb-1w">
                          <label className="fr-label" htmlFor={inputId}>
                            Quantité
                          </label>
                          <input
                            id={inputId}
                            className="fr-input"
                            type="number"
                            min={0}
                            step="1"
                            inputMode="numeric"
                            placeholder="ex. 18"
                            value={uoQuantites[code] ?? ""}
                            onChange={(e) =>
                              setQuantiteForUo(code, e.currentTarget.value)
                            }
                          />
                        </div>
                        {ligne && ligne.quantite > 0 ? (
                          <div className="pilotage-devis-uo-row__montants">
                            <p className="fr-text--sm fr-mb-0">
                              <strong>{formatEuro(ligne.totalHt)} HT</strong>
                            </p>
                            <p className="fr-hint-text fr-mb-0">
                              {formatEuro(ligne.totalTtc)} TTC
                            </p>
                          </div>
                        ) : (
                          <p className="fr-hint-text fr-mb-0">
                            Saisir une quantité pour afficher le montant.
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
                {chiffrageCalc.lignes.some((l) => l.quantite > 0) ? (
                  <p className="fr-text--sm fr-mb-0 fr-mt-2w">
                    <strong>Total devis :</strong> {formatEuro(chiffrageCalc.totalHt)}{" "}
                    HT · {formatEuro(chiffrageCalc.totalTtc)} TTC
                  </p>
                ) : null}
              </div>
            )}

            <div className="pilotage-devis-pv fr-mt-3w">
              <h3 className="fr-text--md fr-mb-1w">Découpe des PV</h3>
              <p className="fr-hint-text fr-mb-2w">
                Répartition en quantités entières aussi égale que possible (pas de
                demi-UO). Les mois suivent la période du devis (à partir de la date de
                début).
              </p>
              <Input
                label="Nombre de PV"
                hintText={
                  suggestedNbPv != null
                    ? `Suggestion : ${suggestedNbPv} (mois de la période) — détail dans l’aperçu`
                    : "Renseignez la période pour une suggestion automatique — détail dans l’aperçu"
                }
                nativeInputProps={{
                  type: "number",
                  min: 1,
                  max: 36,
                  step: 1,
                  inputMode: "numeric",
                  placeholder: suggestedNbPv != null ? String(suggestedNbPv) : "ex. 4",
                  value: effectiveNbPvInput,
                  onChange: (e) => {
                    setNbPvTouched(true);
                    setNbPvInput(e.currentTarget.value);
                  },
                }}
              />

              {decoupePvResult != null && !decoupePvResult.ok ? (
                <p className="fr-text--sm fr-mb-0 fr-mt-1w">{decoupePvResult.reason}</p>
              ) : null}
            </div>
          </section>

          <div className="fr-btns-group fr-btns-group--inline fr-btns-group--icon-left">
            <Button
              type="button"
              priority="secondary"
              onClick={() => setStep("porteur")}
            >
              Retour
            </Button>
            <Button
              type="button"
              priority="primary"
              onClick={() => {
                clearCopyFeedback();
                setStep("apercu");
              }}
            >
              Aperçu du devis
            </Button>
          </div>
        </div>
      ) : null}

      {step === "apercu" ? (
        <DevisOpteamisPreview
          fields={exportFields}
          copyFormat={copyFormat}
          onCopyFormatChange={onCopyFormatChange}
          onCopy={() => {
            void onCopy();
          }}
          copyOk={copyOk}
          copyError={copyError}
          onDismissCopyOk={() => setCopyOk(false)}
          layout="stack"
          footerActions={
            <div className="fr-btns-group fr-btns-group--inline">
              <Button
                type="button"
                priority="secondary"
                onClick={() => setStep("formulaire")}
              >
                Modifier
              </Button>
            </div>
          }
        />
      ) : null}
    </div>
  );
}
