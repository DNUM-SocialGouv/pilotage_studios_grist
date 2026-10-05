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
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Select } from "@codegouvfr/react-dsfr/Select";
import type { BDC, PlanActivite } from "../../types.ts";
import { DsfrSelectRichMulti } from "../dsfr/DsfrSelectRichMulti.tsx";
import {
  bdcToEditFormValues,
  buildBdcPaSelectOptions,
  buildBdcUpdateFields,
  collectBdcEquipeOptions,
  collectBdcFinanceurOptions,
  collectBdcPlateformeOptions,
  collectBdcStatutOptions,
  emptyBdcEditForm,
  parseMontantTtc,
  type BdcEditFormValues,
} from "../../utils/bdcFormFields.ts";
import { updateBdcRecord } from "../../utils/bdcGristWrite.ts";

const formSchema = z
  .object({
    Nom_BdC: z.string().trim().min(1, "Le nom du bon de commande est obligatoire"),
    Statut: z.string().trim().min(1, "Le statut est obligatoire"),
    Montant_TTC: z.string(),
    Financeur: z.string(),
    BdC_Chorus: z.string(),
    PA: z.string(),
    Equipe2: z.array(z.string()),
    Plateforme: z.string(),
    SOFIANE: z.string(),
  })
  .superRefine((values, ctx) => {
    if (parseMontantTtc(values.Montant_TTC) === "invalid") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["Montant_TTC"],
        message: "Indiquez un montant TTC positif ou zéro",
      });
    }
  });

export type BdcFormDrawerHandle = {
  openEdit: (bdc: BDC) => void;
  close: () => void;
};

export type BdcFormDrawerProps = {
  plans: PlanActivite[];
  bdcList: BDC[];
  onRecordsChanged: () => Promise<void>;
  onSaved?: () => void;
};

export const BdcFormDrawer = forwardRef<BdcFormDrawerHandle, BdcFormDrawerProps>(
  function BdcFormDrawer({ plans, bdcList, onRecordsChanged, onSaved }, ref) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const titleId = useId();

    const [editingId, setEditingId] = useState<number | null>(null);
    const [submitError, setSubmitError] = useState<string>();
    const [savePending, setSavePending] = useState(false);

    const { register, handleSubmit, reset, control, formState } = useForm<BdcEditFormValues>({
      resolver: zodResolver(formSchema),
      defaultValues: emptyBdcEditForm(),
    });

    const statutChoices = useMemo(() => collectBdcStatutOptions(), []);
    const plateformeChoices = useMemo(
      () => collectBdcPlateformeOptions(bdcList),
      [bdcList],
    );
    const financeurChoices = useMemo(
      () => collectBdcFinanceurOptions(bdcList),
      [bdcList],
    );
    const equipeChoices = useMemo(() => collectBdcEquipeOptions(bdcList), [bdcList]);
    const paOptions = useMemo(() => buildBdcPaSelectOptions(plans), [plans]);
    const equipeMultiOptions = useMemo(
      () => equipeChoices.map((v) => ({ value: v, label: v })),
      [equipeChoices],
    );

    const openEdit = useCallback(
      (bdc: BDC) => {
        setEditingId(bdc.id);
        setSubmitError(undefined);
        reset(bdcToEditFormValues(bdc));
        dialogRef.current?.showModal();
      },
      [reset],
    );

    const close = useCallback(() => {
      dialogRef.current?.close();
    }, []);

    const onDialogClose = () => {
      setSubmitError(undefined);
      setEditingId(null);
    };

    useImperativeHandle(ref, () => ({ openEdit, close }), [openEdit, close]);

    const refreshAfterWrite = async () => {
      try {
        await onRecordsChanged();
      } catch {
        // Write déjà réussi : la fiche se mettra à jour au prochain chargement.
      }
    };

    const submitForm = async (values: BdcEditFormValues) => {
      setSubmitError(undefined);
      setSavePending(true);
      try {
        if (editingId == null) {
          setSubmitError("Édition incohérente : fermez le panneau et réessayez.");
          return;
        }
        await updateBdcRecord(editingId, buildBdcUpdateFields(values));
        await refreshAfterWrite();
        onSaved?.();
        close();
      } catch (e) {
        setSubmitError(e instanceof Error ? e.message : "Erreur inconnue");
      } finally {
        setSavePending(false);
      }
    };

    const primaryLabel = savePending ? "Enregistrement…" : "Enregistrer";

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
                      Modifier le bon de commande
                    </h2>
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
                          label="Nom du bon de commande *"
                          nativeInputProps={register("Nom_BdC")}
                          state={formState.errors.Nom_BdC ? "error" : "default"}
                          stateRelatedMessage={formState.errors.Nom_BdC?.message}
                        />
                      </div>
                      <div className="fr-col-12 fr-col-md-6">
                        <Select
                          label="Statut *"
                          nativeSelectProps={register("Statut")}
                          state={formState.errors.Statut ? "error" : "default"}
                          stateRelatedMessage={formState.errors.Statut?.message}
                        >
                          {statutChoices.map((v) => (
                            <option key={v} value={v}>
                              {v}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div className="fr-col-12 fr-col-md-6">
                        <Input
                          label="Montant TTC (budget) *"
                          hintText="Budget du bon de commande en euros."
                          nativeInputProps={{
                            inputMode: "decimal",
                            ...register("Montant_TTC"),
                          }}
                          state={formState.errors.Montant_TTC ? "error" : "default"}
                          stateRelatedMessage={formState.errors.Montant_TTC?.message}
                        />
                      </div>
                      <div className="fr-col-12 fr-col-md-6">
                        <Input
                          label="Financeur"
                          hintText={
                            financeurChoices.length > 0
                              ? "Ex. valeurs déjà utilisées sur d’autres BDC."
                              : undefined
                          }
                          nativeInputProps={{
                            list: "bdc-financeur-suggestions",
                            autoComplete: "off",
                            ...register("Financeur"),
                          }}
                        />
                        <datalist id="bdc-financeur-suggestions">
                          {financeurChoices.map((v) => (
                            <option key={v} value={v} />
                          ))}
                        </datalist>
                      </div>
                      <div className="fr-col-12 fr-col-md-6">
                        <Input
                          label="Référence Chorus"
                          nativeInputProps={register("BdC_Chorus")}
                        />
                      </div>
                      <div className="fr-col-12">
                        <Select label="Plan d’activité" nativeSelectProps={register("PA")}>
                          <option value="">— Aucun —</option>
                          {paOptions.map((opt) => (
                            <option key={opt.id} value={String(opt.id)}>
                              {opt.label}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div className="fr-col-12">
                        <Controller
                          name="Equipe2"
                          control={control}
                          render={({ field }) => (
                            <DsfrSelectRichMulti
                              label="Équipe / studio(s)"
                              hintText="Un ou plusieurs studios concernés par ce bon de commande."
                              placeholderWhenEmpty="Sélectionner…"
                              pluralEntityLabel="équipes"
                              options={equipeMultiOptions}
                              selectedValues={field.value}
                              onSelectedValuesChange={field.onChange}
                              disabled={savePending}
                              searchable={equipeMultiOptions.length > 6}
                            />
                          )}
                        />
                      </div>
                      <div className="fr-col-12 fr-col-md-6">
                        <Select label="Plateforme" nativeSelectProps={register("Plateforme")}>
                          <option value="">—</option>
                          {plateformeChoices.map((v) => (
                            <option key={v} value={v}>
                              {v}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div className="fr-col-12 fr-col-md-6">
                        <Input
                          label="Lien Sofiane"
                          hintText="URL ou libellé Sofiane."
                          nativeInputProps={{
                            autoComplete: "off",
                            ...register("SOFIANE"),
                          }}
                        />
                      </div>
                    </div>
                  </fieldset>

                  <div className="fr-mt-3w fr-grid-row fr-grid-row--gutters fr-grid-row--right">
                    <div className="fr-col-auto">
                      <button
                        type="button"
                        className="fr-btn fr-btn--secondary"
                        onClick={close}
                        disabled={savePending}
                      >
                        Annuler
                      </button>
                    </div>
                    <div className="fr-col-auto">
                      <button
                        type="submit"
                        className="fr-btn fr-btn--primary"
                        disabled={savePending}
                      >
                        {primaryLabel}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </dialog>
    );
  },
);
