import {
  forwardRef,
  useCallback,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
} from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { PORTAGE_PORTEUR_MALT } from "../../utils/portageProjet.ts";
import {
  PORTAGE_STATUT_SUGGESTIONS,
  buildPortageProjetCreateFields,
  buildPortageProjetPatch,
  emptyPortageProjetForm,
  portageDateOrderMessage,
  type PortageProjetAdminRow,
  type PortageProjetFormField,
  type PortageProjetFormValues,
} from "../../utils/portageProjetFormFields.ts";
import {
  createPortageProjetRecord,
  updatePortageProjetRecord,
} from "../../utils/portageProjetGristWrite.ts";

const formSchema = z
  .object({
    Nom_du_projet: z.string().trim().min(1, "Le nom du projet est obligatoire"),
    Statut: z.string(),
    Porteur: z.string(),
    Financeur: z.string(),
    Equipe: z.string(),
    Freelance: z.string(),
    Responsable_du_projet: z.string(),
    Bon_de_commande: z.string(),
    Date_de_debut: z.string(),
    Date_de_fin: z.string(),
  })
  .superRefine((values, ctx) => {
    const message = portageDateOrderMessage(values.Date_de_debut, values.Date_de_fin);
    if (message) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["Date_de_fin"],
        message,
      });
    }
  });

export type PortageProjetFormDrawerHandle = {
  openCreate: () => void;
  openEdit: (row: PortageProjetAdminRow) => void;
  close: () => void;
};

export type PortageOption = { value: string; label: string };

export type PortageProjetFormDrawerProps = {
  personOptions: PortageOption[];
  bdcOptions: PortageOption[];
  statutSuggestions: string[];
  porteurSuggestions: string[];
  financeurSuggestions: string[];
  equipeSuggestions: string[];
  onRecordsChanged: () => Promise<void>;
  onRequestDelete: (row: PortageProjetAdminRow) => void;
};

const INVALID_HINT =
  "Valeur à corriger : elle n’est pas réécrite tant que vous n’en choisissez pas une nouvelle.";

function textOptions(values: readonly string[], current: string): PortageOption[] {
  const options = values.map((value) => ({ value, label: value }));
  const extra = current.trim();
  if (!extra || options.some((option) => option.value === extra)) {
    return options;
  }
  return [{ value: extra, label: extra }, ...options];
}

function withCurrentOption(options: PortageOption[], current: string): PortageOption[] {
  const value = current.trim();
  if (!value || options.some((option) => option.value === value)) {
    return options;
  }
  return [{ value, label: `Référence #${value}` }, ...options];
}

function mergeSuggestions(base: readonly string[], extras: readonly string[]): string[] {
  const set = new Set<string>();
  for (const value of [...base, ...extras]) {
    const text = value.trim();
    if (text) {
      set.add(text);
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));
}

export const PortageProjetFormDrawer = forwardRef<
  PortageProjetFormDrawerHandle,
  PortageProjetFormDrawerProps
>(function PortageProjetFormDrawer(
  {
    personOptions,
    bdcOptions,
    statutSuggestions,
    porteurSuggestions,
    financeurSuggestions,
    equipeSuggestions,
    onRecordsChanged,
    onRequestDelete,
  },
  ref,
) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const financeurListId = useId();
  const equipeListId = useId();

  const [mode, setMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<PortageProjetAdminRow | null>(null);
  const [submitError, setSubmitError] = useState<string>();
  const [savePending, setSavePending] = useState(false);

  const { register, handleSubmit, reset, formState } = useForm<PortageProjetFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: emptyPortageProjetForm(),
  });

  const invalid = editing?.invalid ?? new Set<PortageProjetFormField>();

  const close = useCallback(() => {
    dialogRef.current?.close();
    setSubmitError(undefined);
    setSavePending(false);
  }, []);

  const openCreate = useCallback(() => {
    setMode("create");
    setEditing(null);
    setSubmitError(undefined);
    reset(emptyPortageProjetForm());
    dialogRef.current?.showModal();
  }, [reset]);

  const openEdit = useCallback(
    (row: PortageProjetAdminRow) => {
      setMode("edit");
      setEditing(row);
      setSubmitError(undefined);
      reset(row.values);
      dialogRef.current?.showModal();
    },
    [reset],
  );

  useImperativeHandle(ref, () => ({ openCreate, openEdit, close }), [
    close,
    openCreate,
    openEdit,
  ]);

  const statutChoices = useMemo(
    () => mergeSuggestions(PORTAGE_STATUT_SUGGESTIONS, statutSuggestions),
    [statutSuggestions],
  );
  const porteurChoices = useMemo(
    () => mergeSuggestions([PORTAGE_PORTEUR_MALT], porteurSuggestions),
    [porteurSuggestions],
  );
  const financeurChoices = useMemo(
    () => mergeSuggestions([], financeurSuggestions),
    [financeurSuggestions],
  );
  const equipeChoices = useMemo(
    () => mergeSuggestions([], equipeSuggestions),
    [equipeSuggestions],
  );

  const hintFor = (field: PortageProjetFormField, base?: string) => {
    if (!invalid.has(field)) {
      return base;
    }
    return base ? `${base} ${INVALID_HINT}` : INVALID_HINT;
  };

  const submitForm = async (values: PortageProjetFormValues) => {
    setSubmitError(undefined);
    setSavePending(true);
    try {
      if (mode === "edit") {
        if (editing == null) {
          setSubmitError("Édition incohérente : fermez le panneau et réessayez.");
          return;
        }
        const patch = buildPortageProjetPatch(values, editing.values, editing.invalid);
        await updatePortageProjetRecord(editing.id, patch);
      } else {
        await createPortageProjetRecord(buildPortageProjetCreateFields(values));
      }
      try {
        await onRecordsChanged();
      } catch {
        // L’écriture a réussi ; la liste se rechargera à la prochaine ouverture.
      }
      close();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSavePending(false);
    }
  };

  const isEdit = mode === "edit";
  const title = isEdit ? "Modifier le projet de portage" : "Nouveau projet de portage";

  return (
    <dialog
      ref={dialogRef}
      className="pilotage-drawer-dialog pilotage-drawer-dialog--sm"
      aria-labelledby={titleId}
      onClose={() => {
        setSubmitError(undefined);
        setSavePending(false);
      }}
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
                    Un projet chez un porteur, relié à une personne et, si besoin, à un bon de
                    commande. Le porteur « {PORTAGE_PORTEUR_MALT} » le propose dans le choix
                    Projet Malt d’une prestation.
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
                        label="Nom du projet *"
                        hintText={hintFor("Nom_du_projet")}
                        nativeInputProps={register("Nom_du_projet")}
                        state={formState.errors.Nom_du_projet ? "error" : "default"}
                        stateRelatedMessage={formState.errors.Nom_du_projet?.message}
                      />
                    </div>
                    <div className="fr-col-12 fr-col-md-6">
                      <PersonOrBdcSelect
                        label="Statut"
                        hint={hintFor("Statut")}
                        emptyLabel="Aucun statut"
                        options={textOptions(statutChoices, editing?.values.Statut ?? "")}
                        nativeSelectProps={register("Statut")}
                      />
                    </div>
                    <div className="fr-col-12 fr-col-md-6">
                      <PersonOrBdcSelect
                        label="Porteur"
                        hint={hintFor(
                          "Porteur",
                          `« ${PORTAGE_PORTEUR_MALT} » pour le choix Projet Malt.`,
                        )}
                        emptyLabel="Aucun porteur"
                        options={textOptions(porteurChoices, editing?.values.Porteur ?? "")}
                        nativeSelectProps={register("Porteur")}
                      />
                    </div>
                    <div className="fr-col-12 fr-col-md-6">
                      <Input
                        label="Financeur"
                        hintText={hintFor("Financeur")}
                        nativeInputProps={{
                          ...register("Financeur"),
                          list: financeurListId,
                        }}
                      />
                      <datalist id={financeurListId}>
                        {financeurChoices.map((value) => (
                          <option key={value} value={value} />
                        ))}
                      </datalist>
                    </div>
                    <div className="fr-col-12 fr-col-md-6">
                      <Input
                        label="Équipe"
                        hintText={hintFor("Equipe")}
                        nativeInputProps={{
                          ...register("Equipe"),
                          list: equipeListId,
                        }}
                      />
                      <datalist id={equipeListId}>
                        {equipeChoices.map((value) => (
                          <option key={value} value={value} />
                        ))}
                      </datalist>
                    </div>
                    <div className="fr-col-12 fr-col-md-6">
                      <PersonOrBdcSelect
                        label="Personne"
                        hint={hintFor("Freelance")}
                        emptyLabel="Aucune personne"
                        options={withCurrentOption(personOptions, editing?.values.Freelance ?? "")}
                        nativeSelectProps={register("Freelance")}
                      />
                    </div>
                    <div className="fr-col-12 fr-col-md-6">
                      <PersonOrBdcSelect
                        label="Responsable"
                        hint={hintFor("Responsable_du_projet")}
                        emptyLabel="Aucun responsable"
                        options={withCurrentOption(
                          personOptions,
                          editing?.values.Responsable_du_projet ?? "",
                        )}
                        nativeSelectProps={register("Responsable_du_projet")}
                      />
                    </div>
                    <div className="fr-col-12">
                      <PersonOrBdcSelect
                        label="Bon de commande"
                        hint={hintFor("Bon_de_commande")}
                        emptyLabel="Aucun bon de commande"
                        options={withCurrentOption(bdcOptions, editing?.values.Bon_de_commande ?? "")}
                        nativeSelectProps={register("Bon_de_commande")}
                      />
                    </div>
                    <div className="fr-col-12 fr-col-md-6">
                      <Input
                        label="Date de début"
                        hintText={hintFor("Date_de_debut")}
                        nativeInputProps={{
                          type: "date",
                          ...register("Date_de_debut"),
                        }}
                      />
                    </div>
                    <div className="fr-col-12 fr-col-md-6">
                      <Input
                        label="Date de fin"
                        hintText={hintFor("Date_de_fin")}
                        nativeInputProps={{
                          type: "date",
                          ...register("Date_de_fin"),
                        }}
                        state={formState.errors.Date_de_fin ? "error" : "default"}
                        stateRelatedMessage={formState.errors.Date_de_fin?.message}
                      />
                    </div>
                  </div>

                  <div className="fr-mt-3w fr-grid-row fr-grid-row--gutters fr-grid-row--middle">
                    <div className="fr-col">
                      {isEdit && editing ? (
                        <button
                          type="button"
                          className="fr-btn fr-btn--tertiary fr-icon-delete-line fr-btn--icon-left"
                          disabled={savePending}
                          onClick={() => onRequestDelete(editing)}
                        >
                          Supprimer
                        </button>
                      ) : null}
                    </div>
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
                      <button type="submit" className="fr-btn" disabled={savePending}>
                        {savePending
                          ? "Enregistrement…"
                          : isEdit
                            ? "Enregistrer"
                            : "Créer le projet"}
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

function PersonOrBdcSelect({
  label,
  hint,
  emptyLabel,
  options,
  nativeSelectProps,
}: {
  label: string;
  hint?: string;
  emptyLabel: string;
  options: PortageOption[];
  nativeSelectProps: ComponentProps<typeof Select>["nativeSelectProps"];
}) {
  return (
    <Select label={label} hint={hint} nativeSelectProps={nativeSelectProps}>
      <option value="">{emptyLabel}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </Select>
  );
}
