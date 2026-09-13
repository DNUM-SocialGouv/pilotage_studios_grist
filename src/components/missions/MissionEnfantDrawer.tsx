import {
  forwardRef,
  useCallback,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Select } from "@codegouvfr/react-dsfr/Select";
import type { MissionEnfant } from "../../types.ts";
import { extractGristReferenceId } from "../../utils/gristReferences.ts";
import {
  buildMissionEnfantCreateFields,
  buildMissionEnfantPatch,
  DEFAULT_MISSION_ENFANT_STATUT,
  emptyMissionEnfantForm,
  missionEnfantToFormValues,
  type MissionEnfantFormValues,
} from "../../utils/missionEnfantFormFields.ts";
import {
  createMissionEnfantRecord,
  updateMissionEnfantRecord,
} from "../../utils/missionGristWrite.ts";
import { DsfrSelectRichMulti } from "../dsfr/DsfrSelectRichMulti.tsx";
import type { MissionEnfantDrawerHandle } from "./missionEnfantDrawerTypes.ts";

type DrawerMode = "create" | "edit";

const formSchema = z.object({
  Libelle: z.string(),
  Intervenant: z.string().trim().min(1, "L’intervenant est obligatoire"),
  Jours_envisages: z.string(),
  Statut: z.string(),
  Date_de_debut: z.string(),
});

export type MissionEnfantDrawerProps = {
  statutOptions: string[];
  intervenantOptions: { id: number; label: string }[];
  onRecordsChanged: () => Promise<void>;
};

export const MissionEnfantDrawer = forwardRef<
  MissionEnfantDrawerHandle,
  MissionEnfantDrawerProps
>(function MissionEnfantDrawer(
  { statutOptions, intervenantOptions, onRecordsChanged },
  ref,
) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const initialFormRef = useRef<MissionEnfantFormValues>(emptyMissionEnfantForm());
  const masterIdRef = useRef<number | undefined>(undefined);

  const [mode, setMode] = useState<DrawerMode>("create");
  const [editing, setEditing] = useState<MissionEnfant | null>(null);
  const [submitError, setSubmitError] = useState<string>();
  const [infoMessage, setInfoMessage] = useState<string>();
  const [isSuccess, setIsSuccess] = useState(false);
  const [savePending, setSavePending] = useState(false);

  const { register, handleSubmit, reset, control, formState } =
    useForm<MissionEnfantFormValues>({
      resolver: zodResolver(formSchema),
      defaultValues: emptyMissionEnfantForm(),
    });

  const intervenantWatch = useWatch({ control, name: "Intervenant" }) ?? "";
  const intervenantOk = intervenantWatch.trim().length > 0;

  const statutChoices = useMemo(() => {
    const set = new Set<string>([DEFAULT_MISSION_ENFANT_STATUT]);
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

  const intervenantRows = useMemo(() => {
    const rows = [...intervenantOptions];
    if (editing) {
      const iid = extractGristReferenceId(editing.Intervenant);
      if (iid != null && iid !== 0 && !rows.some((r) => r.id === iid)) {
        rows.push({ id: iid, label: `Intervenant #${iid}` });
      }
    }
    rows.sort((a, b) => a.label.localeCompare(b.label, "fr", { sensitivity: "base" }));
    return rows;
  }, [intervenantOptions, editing]);

  const intervenantSelectOptions = useMemo(
    () => intervenantRows.map((o) => ({ value: String(o.id), label: o.label })),
    [intervenantRows],
  );

  const openCreate = useCallback(
    (masterId: number) => {
      masterIdRef.current = masterId;
      setMode("create");
      setEditing(null);
      setSubmitError(undefined);
      setInfoMessage(undefined);
      setIsSuccess(false);
      const empty = emptyMissionEnfantForm();
      initialFormRef.current = empty;
      reset(empty);
      dialogRef.current?.showModal();
    },
    [reset],
  );

  const openEdit = useCallback(
    (enfant: MissionEnfant) => {
      masterIdRef.current = undefined;
      setMode("edit");
      setEditing(enfant);
      setSubmitError(undefined);
      setInfoMessage(undefined);
      setIsSuccess(false);
      const values = missionEnfantToFormValues(enfant);
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
    setEditing(null);
    masterIdRef.current = undefined;
  };

  useImperativeHandle(ref, () => ({ openCreate, openEdit, close }), [
    openCreate,
    openEdit,
    close,
  ]);

  const title = mode === "edit" ? "Modifier la prestation" : "Nouvelle prestation";
  const description =
    mode === "edit"
      ? "Met à jour le staffing de cette prestation (titre, intervenant, jours, statut, date de début)."
      : "Ajoute une prestation rattachée à cette mission.";
  const primaryLabel =
    mode === "edit" ? "Enregistrer les modifications" : "Créer la prestation";

  const refreshAfterWrite = async (): Promise<boolean> => {
    try {
      await onRecordsChanged();
      return true;
    } catch {
      return false;
    }
  };

  const intervenantLabelFor = (intervenantIdStr: string): string => {
    const id = Number.parseInt(intervenantIdStr.trim(), 10);
    if (!Number.isFinite(id) || id === 0) {
      return "";
    }
    return intervenantRows.find((o) => o.id === id)?.label?.trim() ?? "";
  };

  const submitForm = async (values: MissionEnfantFormValues) => {
    setSubmitError(undefined);
    setInfoMessage(undefined);
    setIsSuccess(false);
    setSavePending(true);

    try {
      const ivLabel = intervenantLabelFor(values.Intervenant);

      if (mode === "edit") {
        if (editing == null) {
          return;
        }
        const patch = buildMissionEnfantPatch(values, initialFormRef.current, ivLabel);
        if (Object.keys(patch).length === 0) {
          setInfoMessage("Aucun changement détecté par rapport aux valeurs initiales.");
          return;
        }
        await updateMissionEnfantRecord(editing.id, patch);
        const refreshed = await refreshAfterWrite();
        setIsSuccess(true);
        initialFormRef.current = { ...values };
        setEditing((prev) => (prev ? ({ ...prev, ...patch } as MissionEnfant) : null));
        if (!refreshed) {
          setInfoMessage(
            "Modifications enregistrées dans Grist. La liste n’a pas pu être rafraîchie — rechargez la page si besoin.",
          );
        }
        return;
      }

      const masterId = masterIdRef.current;
      if (masterId == null || !Number.isFinite(masterId) || masterId <= 0) {
        setSubmitError("Mission parente introuvable.");
        return;
      }

      await createMissionEnfantRecord(
        buildMissionEnfantCreateFields({
          masterId,
          values,
          intervenantLabel: ivLabel,
        }),
      );
      const refreshed = await refreshAfterWrite();
      setIsSuccess(true);
      if (!refreshed) {
        setInfoMessage(
          "Prestation créée dans Grist. La liste n’a pas pu être rafraîchie — rechargez la page si besoin.",
        );
      } else {
        close();
      }
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
                  description="La prestation a été mise à jour dans Grist."
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
                        label="Titre de la prestation"
                        hintText="Vide → nom de l’intervenant."
                        nativeInputProps={register("Libelle")}
                      />
                    </div>
                    <div className="fr-col-12">
                      <Controller
                        name="Intervenant"
                        control={control}
                        render={({ field }) => (
                          <DsfrSelectRichMulti
                            label="Intervenant *"
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
                      {formState.errors.Intervenant ? (
                        <p className="fr-error-text" role="alert">
                          {formState.errors.Intervenant.message}
                        </p>
                      ) : null}
                    </div>
                    <div className="fr-col-12 fr-col-md-6">
                      <Input
                        label="Jours envisagés"
                        nativeInputProps={{
                          ...register("Jours_envisages"),
                          inputMode: "decimal",
                        }}
                      />
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
                    <div className="fr-col-12 fr-col-md-6">
                      <Input
                        label="Date de début"
                        nativeInputProps={{
                          ...register("Date_de_debut"),
                          type: "date",
                        }}
                      />
                    </div>
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
                        disabled={savePending || !intervenantOk}
                      >
                        {savePending ? "Enregistrement…" : primaryLabel}
                      </button>
                    </div>
                  </div>
                </fieldset>
              </form>
            </div>
          </div>
        </div>
      </div>
    </dialog>
  );
});

MissionEnfantDrawer.displayName = "MissionEnfantDrawer";
