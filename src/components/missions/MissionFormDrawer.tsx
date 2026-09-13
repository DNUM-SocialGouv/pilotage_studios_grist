import {
  forwardRef,
  useCallback,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Select } from "@codegouvfr/react-dsfr/Select";
import type { Mission } from "../../types.ts";
import { extractGristReferenceId } from "../../utils/gristReferences.ts";
import { buildMissionEnfantCreateFields } from "../../utils/missionEnfantFormFields.ts";
import {
  buildMissionCreateFields,
  buildMissionPatch,
  emptyMissionCreateForm,
  missionToFormValues,
  type MissionFormValues,
} from "../../utils/missionFormFields.ts";
import {
  createMissionEnfantRecord,
  createMissionRecord,
  updateMissionRecord,
} from "../../utils/missionGristWrite.ts";
import { DsfrSelectRichMulti } from "../dsfr/DsfrSelectRichMulti.tsx";

const DEFAULT_STATUT = "A instruire";

type DrawerMode = "create" | "edit";

const formSchema = z.object({
  Nom_de_la_mission: z.string().trim().min(1, "Le nom de la mission est obligatoire"),
  Produit_SDPC: z.string(),
  Statut: z.string(),
  prestationIntervenant: z.string(),
  prestationLibelle: z.string(),
  prestationJoursEnvisages: z.string(),
});

export type MissionFormDrawerHandle = {
  openCreate: () => void;
  openEdit: (mission: Mission) => void;
  close: () => void;
};

export type MissionFormDrawerProps = {
  statutOptions: string[];
  produitOptions: { id: number; label: string }[];
  intervenantOptions: { id: number; label: string }[];
  onRecordsChanged: () => Promise<void>;
};

export const MissionFormDrawer = forwardRef<MissionFormDrawerHandle, MissionFormDrawerProps>(
  function MissionFormDrawer(
    { statutOptions, produitOptions, intervenantOptions, onRecordsChanged },
    ref,
  ) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const titleId = useId();
    const navigate = useNavigate();
    const initialFormRef = useRef<MissionFormValues>(emptyMissionCreateForm());

    const [mode, setMode] = useState<DrawerMode>("create");
    const [editing, setEditing] = useState<Mission | null>(null);
    const [submitError, setSubmitError] = useState<string>();
    const [infoMessage, setInfoMessage] = useState<string>();
    const [isSuccess, setIsSuccess] = useState(false);
    const [createdMasterId, setCreatedMasterId] = useState<number>();
    const [prestationWarning, setPrestationWarning] = useState<string>();
    const [savePending, setSavePending] = useState(false);

    const { register, handleSubmit, reset, control, formState } = useForm<MissionFormValues>({
      resolver: zodResolver(formSchema),
      defaultValues: emptyMissionCreateForm(),
    });

    const nomWatch = useWatch({ control, name: "Nom_de_la_mission" }) ?? "";
    const nomOk = nomWatch.trim().length > 0;

    const statutChoices = useMemo(() => {
      const set = new Set<string>([DEFAULT_STATUT]);
      for (const s of statutOptions) {
        if (s.trim()) {
          set.add(s.trim());
        }
      }
      const cur = editing?.Statut?.trim();
      if (cur) {
        set.add(cur);
      }
      return Array.from(set).sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));
    }, [statutOptions, editing?.Statut]);

    const produitRows = useMemo(() => {
      const rows = [...produitOptions];
      if (editing) {
        const pid = extractGristReferenceId(editing.Produit_SDPC);
        if (pid != null && pid !== 0 && !rows.some((r) => r.id === pid)) {
          rows.push({ id: pid, label: `Produit #${pid}` });
        }
      }
      rows.sort((a, b) => a.label.localeCompare(b.label, "fr", { sensitivity: "base" }));
      return rows;
    }, [produitOptions, editing]);

    const intervenantSelectOptions = useMemo(
      () => intervenantOptions.map((o) => ({ value: String(o.id), label: o.label })),
      [intervenantOptions],
    );

    const openCreate = useCallback(() => {
      setMode("create");
      setEditing(null);
      setSubmitError(undefined);
      setInfoMessage(undefined);
      setIsSuccess(false);
      setCreatedMasterId(undefined);
      setPrestationWarning(undefined);
      const empty = emptyMissionCreateForm();
      initialFormRef.current = empty;
      reset(empty);
      dialogRef.current?.showModal();
    }, [reset]);

    const openEdit = useCallback(
      (mission: Mission) => {
        setMode("edit");
        setEditing(mission);
        setSubmitError(undefined);
        setInfoMessage(undefined);
        setIsSuccess(false);
        setCreatedMasterId(undefined);
        setPrestationWarning(undefined);
        const values = missionToFormValues(mission);
        initialFormRef.current = values;
        reset(values);
        dialogRef.current?.showModal();
      },
      [reset],
    );

    const close = useCallback(() => {
      dialogRef.current?.close();
    }, []);

    const onDialogClose = () => {
      setIsSuccess(false);
      setSubmitError(undefined);
      setInfoMessage(undefined);
      setCreatedMasterId(undefined);
      setPrestationWarning(undefined);
      setEditing(null);
    };

    useImperativeHandle(ref, () => ({ openCreate, openEdit, close }), [
      openCreate,
      openEdit,
      close,
    ]);

    const title = mode === "edit" ? "Modifier la mission" : "Nouvelle mission";
    const description =
      mode === "edit"
        ? "Modifie les informations de la mission (nom, produit, statut)."
        : "Crée une mission (statut « A instruire » par défaut). Une première prestation peut être ajoutée dans le même geste.";
    const primaryLabel =
      mode === "edit" ? "Enregistrer les modifications" : "Créer la mission";

    const goToEquipeTab = () => {
      if (editing == null) {
        return;
      }
      close();
      void navigate(`/missions/${editing.id}?onglet=equipe`);
    };

    /** Recharge la liste sans faire échouer un write déjà réussi. */
    const refreshAfterWrite = async (): Promise<boolean> => {
      try {
        await onRecordsChanged();
        return true;
      } catch {
        return false;
      }
    };

    const submitForm = async (values: MissionFormValues) => {
      setSubmitError(undefined);
      setInfoMessage(undefined);
      setIsSuccess(false);
      setCreatedMasterId(undefined);
      setPrestationWarning(undefined);
      setSavePending(true);

      try {
        if (mode === "edit") {
          if (editing == null) {
            return;
          }
          const patch = buildMissionPatch(values, initialFormRef.current);
          if (Object.keys(patch).length === 0) {
            setInfoMessage("Aucun changement détecté par rapport aux valeurs initiales.");
            return;
          }
          await updateMissionRecord(editing.id, patch);
          const refreshed = await refreshAfterWrite();
          setIsSuccess(true);
          initialFormRef.current = { ...values };
          setEditing((prev) => (prev ? ({ ...prev, ...patch } as Mission) : null));
          if (!refreshed) {
            setInfoMessage(
              "Modifications enregistrées dans Grist. La liste n’a pas pu être rafraîchie — rechargez la page si besoin.",
            );
          }
          return;
        }

        let masterId: number;
        try {
          masterId = await createMissionRecord(buildMissionCreateFields(values));
        } catch (e) {
          setSubmitError(e instanceof Error ? e.message : "Erreur inconnue");
          return;
        }

        const intervenantId = Number.parseInt(values.prestationIntervenant.trim(), 10);
        const wantsPrestation = Number.isFinite(intervenantId) && intervenantId !== 0;
        if (wantsPrestation) {
          const ivLabel =
            intervenantOptions.find((o) => o.id === intervenantId)?.label?.trim() ?? "";
          try {
            await createMissionEnfantRecord(
              buildMissionEnfantCreateFields({
                masterId,
                values: {
                  Libelle: values.prestationLibelle,
                  Intervenant: values.prestationIntervenant,
                  Jours_envisages: values.prestationJoursEnvisages,
                  Statut: "En cours",
                  Date_de_debut: "",
                },
                intervenantLabel: ivLabel,
              }),
            );
          } catch (e) {
            const detail = e instanceof Error ? e.message : "Erreur inconnue";
            await refreshAfterWrite();
            setCreatedMasterId(masterId);
            setIsSuccess(true);
            setPrestationWarning(
              `La mission existe déjà. Ajoutez la prestation depuis la fiche (${detail}).`,
            );
            reset(emptyMissionCreateForm());
            return;
          }
        }

        await refreshAfterWrite();
        close();
        void navigate(`/missions/${masterId}`);
      } catch (e) {
        setSubmitError(e instanceof Error ? e.message : "Erreur inconnue");
      } finally {
        setSavePending(false);
      }
    };

    return (
      <dialog
        ref={dialogRef}
        className="pilotage-drawer-dialog pilotage-drawer-dialog--sm"
        aria-labelledby={titleId}
        onClose={onDialogClose}
      >
        <div className="pilotage-drawer-dialog__shell">
          <div className="pilotage-drawer-dialog__scrim" aria-hidden="true" onClick={close} />
          <div className="pilotage-drawer-dialog__panel">
            <div className="pilotage-drawer-dialog__inner">
              <header className="fr-p-3w fr-pb-2w">
                <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--middle">
                  <div className="fr-col">
                    <h2 id={titleId} className="fr-h5 fr-mb-0">
                      {title}
                    </h2>
                    <p className="fr-text--sm fr-text-mention--grey fr-mb-0 fr-mt-1w">
                      {description}
                    </p>
                  </div>
                  <div className="fr-col-auto">
                    <button
                      type="button"
                      className="fr-btn--close fr-btn"
                      title="Fermer"
                      onClick={close}
                    >
                      Fermer
                    </button>
                  </div>
                </div>
              </header>

              <div className="pilotage-drawer-dialog__body fr-px-3w fr-pb-3w fr-pt-0">
                {isSuccess && mode === "edit" ? (
                  <Alert
                    severity="success"
                    title="Modifications enregistrées"
                    description="La mission a été mise à jour dans Grist."
                    className="fr-mb-2w"
                  />
                ) : null}
                {isSuccess && mode === "create" && prestationWarning ? (
                  <Alert
                    severity="success"
                    title="Mission créée"
                    description="La mission a été ajoutée dans Grist. La liste se met à jour automatiquement."
                    className="fr-mb-2w"
                  />
                ) : null}
                {prestationWarning ? (
                  <Alert
                    severity="warning"
                    title="Prestation non enregistrée"
                    description={prestationWarning}
                    className="fr-mb-2w"
                  />
                ) : null}
                {infoMessage ? (
                  <Alert
                    severity="info"
                    title={isSuccess ? "Liste non rafraîchie" : "Aucune modification"}
                    description={infoMessage}
                    className="fr-mb-2w"
                  />
                ) : null}
                {submitError ? (
                  <Alert
                    severity="error"
                    title="Enregistrement impossible"
                    description={submitError}
                    className="fr-mb-2w"
                  />
                ) : null}
                {createdMasterId != null ? (
                  <p className="fr-mb-2w">
                    <Link className="fr-link" to={`/missions/${createdMasterId}`}>
                      Ouvrir la fiche de la mission
                    </Link>
                  </p>
                ) : null}

                {mode === "create" && isSuccess && prestationWarning ? (
                  <div className="fr-mt-3w fr-grid-row fr-grid-row--gutters fr-grid-row--right">
                    <div className="fr-col-auto">
                      <button type="button" className="fr-btn fr-btn--primary" onClick={close}>
                        Fermer
                      </button>
                    </div>
                  </div>
                ) : (
                  <form
                    className="fr-mt-1w"
                    onSubmit={(event) => {
                      void handleSubmit(submitForm)(event);
                    }}
                  >
                    <fieldset className="fr-fieldset" disabled={savePending}>
                      <div className="fr-grid-row fr-grid-row--gutters">
                        <div className="fr-col-12">
                          <Input
                            label="Nom de la mission *"
                            nativeInputProps={register("Nom_de_la_mission")}
                            state={formState.errors.Nom_de_la_mission ? "error" : "default"}
                            stateRelatedMessage={formState.errors.Nom_de_la_mission?.message}
                          />
                        </div>
                        <div className="fr-col-12 fr-col-md-6">
                          <Select
                            label="Produit (SDPC)"
                            nativeSelectProps={register("Produit_SDPC")}
                          >
                            <option value="">—</option>
                            {produitRows.map((p) => (
                              <option key={p.id} value={String(p.id)}>
                                {p.label}
                              </option>
                            ))}
                          </Select>
                        </div>
                        <div className="fr-col-12 fr-col-md-6">
                          <Select label="Statut" nativeSelectProps={register("Statut")}>
                            {statutChoices.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </Select>
                        </div>

                        <div className="fr-col-12">
                          <hr className="fr-hr" />
                        </div>

                        {mode === "edit" ? (
                          <div className="fr-col-12">
                            <h3 className="fr-h6 fr-mb-1v">Prestations</h3>
                            <p className="fr-text--sm fr-mb-1w">
                              Les prestations se gèrent depuis la fiche, onglet Équipe &amp;
                              prestations.
                            </p>
                            <button type="button" className="fr-link" onClick={goToEquipeTab}>
                              Ouvrir l&apos;onglet Équipe &amp; prestations
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="fr-col-12">
                              <h3 className="fr-h6 fr-mb-1v">
                                Première prestation{" "}
                                <span className="fr-text--regular fr-text-mention--grey">
                                  (optionnel)
                                </span>
                              </h3>
                              <p className="fr-text--sm fr-mb-0">
                                Prestation rattachée à cette mission. Vous pourrez aussi ajouter
                                des prestations plus tard depuis la fiche de la mission, onglet «
                                Équipe &amp; prestations ». Renseignez un intervenant pour
                                qu&apos;une prestation soit créée en même temps que la mission.
                              </p>
                            </div>
                            <div className="fr-col-12">
                              <Input
                                label="Titre de la prestation"
                                hintText="Vide → nom de l’intervenant."
                                nativeInputProps={register("prestationLibelle")}
                              />
                            </div>
                            <div className="fr-col-12">
                              <Controller
                                name="prestationIntervenant"
                                control={control}
                                render={({ field }) => (
                                  <DsfrSelectRichMulti
                                    label="Intervenant de la prestation"
                                    hintText="Optionnel — laissez vide pour créer la mission seule."
                                    placeholderWhenEmpty="Rechercher un intervenant…"
                                    options={intervenantSelectOptions}
                                    selectedValues={field.value.trim() ? [field.value] : []}
                                    onSelectedValuesChange={(values) =>
                                      field.onChange(values[0] ?? "")
                                    }
                                    searchable
                                    searchLabel="Rechercher"
                                    searchPlaceholder="Nom…"
                                    showBulkActions={false}
                                    maxSelections={1}
                                    pluralEntityLabel="intervenants"
                                    disabled={savePending}
                                  />
                                )}
                              />
                            </div>
                            <div className="fr-col-12 fr-col-md-6">
                              <Input
                                label="Jours envisagés (prestation)"
                                nativeInputProps={{
                                  ...register("prestationJoursEnvisages"),
                                  inputMode: "decimal",
                                }}
                              />
                            </div>
                          </>
                        )}
                      </div>

                      <div className="fr-mt-3w fr-grid-row fr-grid-row--gutters fr-grid-row--right">
                        <div className="fr-col-auto">
                          <button
                            type="button"
                            className="fr-btn fr-btn--secondary"
                            onClick={close}
                          >
                            Annuler
                          </button>
                        </div>
                        <div className="fr-col-auto">
                          <button
                            type="submit"
                            className="fr-btn fr-btn--primary"
                            disabled={savePending || !nomOk}
                          >
                            {savePending ? "Enregistrement…" : primaryLabel}
                          </button>
                        </div>
                      </div>
                    </fieldset>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </dialog>
    );
  },
);

MissionFormDrawer.displayName = "MissionFormDrawer";
