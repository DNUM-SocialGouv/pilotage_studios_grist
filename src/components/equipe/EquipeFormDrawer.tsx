import {
  forwardRef,
  useCallback,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Select } from "@codegouvfr/react-dsfr/Select";
import type { EquipeMember } from "../../types.ts";
import {
  DEFAULT_EQUIPE_STATUT,
  EQUIPE_ROLE_ACL_CHOICES,
  buildEquipeCreateFields,
  buildEquipeUpdateFields,
  emptyEquipeCreateForm,
  memberToEquipeFormValues,
  parseOptionalTjm,
  type EquipeCreateFormValues,
} from "../../utils/equipeFormFields.ts";
import { createEquipeRecord, updateEquipeRecord } from "../../utils/equipeGristWrite.ts";

const formSchema = z
  .object({
    Prenom_Nom: z.string().trim().min(1, "Le prénom et le nom sont obligatoires"),
    E_mail: z
      .string()
      .trim()
      .min(1, "L’e-mail est obligatoire")
      .email("Indiquez un e-mail valide"),
    Equipe: z.string(),
    Specialite: z.string(),
    Statut: z.string(),
    Portage: z.string(),
    Ordinateur2: z.string(),
    Mode_recrutement: z.string(),
    Role_ACL: z.string(),
    TJM: z.string(),
  })
  .superRefine((values, ctx) => {
    if (parseOptionalTjm(values.TJM) === "invalid") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["TJM"],
        message: "Indiquez un montant positif ou laissez vide",
      });
    }
  });

export type EquipeFormDrawerHandle = {
  openCreate: () => void;
  openEdit: (member: EquipeMember) => void;
  close: () => void;
};

export type EquipeFormDrawerProps = {
  equipeOptions: string[];
  specialiteOptions: string[];
  statutOptions: string[];
  portageOptions: string[];
  ordinateurOptions: string[];
  modeRecrutementOptions: string[];
  onRecordsChanged: () => Promise<void>;
};

function mergeChoiceOptions(base: string[], extras: string[]): string[] {
  const set = new Set<string>();
  for (const v of [...base, ...extras]) {
    const t = v.trim();
    if (t) {
      set.add(t);
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));
}

export const EquipeFormDrawer = forwardRef<EquipeFormDrawerHandle, EquipeFormDrawerProps>(
  function EquipeFormDrawer(
    {
      equipeOptions,
      specialiteOptions,
      statutOptions,
      portageOptions,
      ordinateurOptions,
      modeRecrutementOptions,
      onRecordsChanged,
    },
    ref,
  ) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const titleId = useId();
    const navigate = useNavigate();

    const [mode, setMode] = useState<"create" | "edit">("create");
    const [editingId, setEditingId] = useState<number | null>(null);
    const [submitError, setSubmitError] = useState<string>();
    const [savePending, setSavePending] = useState(false);

    const { register, handleSubmit, reset, watch, formState } = useForm<EquipeCreateFormValues>({
      resolver: zodResolver(formSchema),
      defaultValues: emptyEquipeCreateForm(),
    });

    const watchedRole = watch("Role_ACL");

    const statutChoices = useMemo(
      () => mergeChoiceOptions([DEFAULT_EQUIPE_STATUT, "Inactif"], statutOptions),
      [statutOptions],
    );
    const equipeChoices = useMemo(
      () => mergeChoiceOptions([], equipeOptions),
      [equipeOptions],
    );
    const specialiteChoices = useMemo(
      () => mergeChoiceOptions([], specialiteOptions),
      [specialiteOptions],
    );
    const portageChoices = useMemo(
      () => mergeChoiceOptions([], portageOptions),
      [portageOptions],
    );
    const ordinateurChoices = useMemo(
      () => mergeChoiceOptions(["Oui", "Non"], ordinateurOptions),
      [ordinateurOptions],
    );
    const modeChoices = useMemo(
      () => mergeChoiceOptions([], modeRecrutementOptions),
      [modeRecrutementOptions],
    );
    const roleChoices = useMemo(
      () => mergeChoiceOptions([...EQUIPE_ROLE_ACL_CHOICES], [watchedRole]),
      [watchedRole],
    );

    const openCreate = useCallback(() => {
      setMode("create");
      setEditingId(null);
      setSubmitError(undefined);
      reset(emptyEquipeCreateForm());
      dialogRef.current?.showModal();
    }, [reset]);

    const openEdit = useCallback(
      (member: EquipeMember) => {
        setMode("edit");
        setEditingId(member.id);
        setSubmitError(undefined);
        reset(memberToEquipeFormValues(member));
        dialogRef.current?.showModal();
      },
      [reset],
    );

    const close = useCallback(() => {
      dialogRef.current?.close();
    }, []);

    const onDialogClose = () => {
      setSubmitError(undefined);
      setMode("create");
      setEditingId(null);
    };

    useImperativeHandle(ref, () => ({ openCreate, openEdit, close }), [
      openCreate,
      openEdit,
      close,
    ]);

    const refreshAfterWrite = async () => {
      try {
        await onRecordsChanged();
      } catch {
        // Write déjà réussi : on navigue / reste sur la fiche ; rechargera si besoin.
      }
    };

    const submitForm = async (values: EquipeCreateFormValues) => {
      setSubmitError(undefined);
      setSavePending(true);

      try {
        if (mode === "edit") {
          // Jamais de create depuis l’UI « Modifier » (évite doublon e-mail).
          if (editingId == null) {
            setSubmitError("Édition incohérente : fermez le panneau et réessayez.");
            return;
          }
          if (!values.Role_ACL.trim()) {
            setSubmitError("Le rôle est obligatoire pour enregistrer la fiche.");
            return;
          }
          await updateEquipeRecord(editingId, buildEquipeUpdateFields(values));
          await refreshAfterWrite();
          close();
          return;
        }

        const fields = buildEquipeCreateFields(values);
        const id = await createEquipeRecord(fields);
        await refreshAfterWrite();
        close();
        void navigate(`/equipe/${id}`);
      } catch (e) {
        setSubmitError(e instanceof Error ? e.message : "Erreur inconnue");
      } finally {
        setSavePending(false);
      }
    };

    const isEdit = mode === "edit";
    const title = isEdit ? "Modifier la personne" : "Nouvelle personne";
    const description = isEdit
      ? "Corrige la fiche dans l’annuaire Équipe. L’e-mail doit correspondre au compte Grist pour les droits. Laisser le TJM vide conserve la valeur actuelle."
      : "Ajoute une fiche dans l’annuaire Équipe. Ne pas oublier d’inviter l’utilisateur sur le document Grist si nécessaire. L’e-mail doit correspondre au compte Grist pour les droits.";
    const primaryLabel = isEdit
      ? savePending
        ? "Enregistrement…"
        : "Enregistrer"
      : savePending
        ? "Enregistrement…"
        : "Créer la personne";
    const tjmHint = isEdit
      ? "Optionnel. Laisser vide pour ne pas modifier le TJM actuel."
      : "Optionnel. Tarif journalier en euros.";

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
                          label="Prénom Nom *"
                          nativeInputProps={register("Prenom_Nom")}
                          state={formState.errors.Prenom_Nom ? "error" : "default"}
                          stateRelatedMessage={formState.errors.Prenom_Nom?.message}
                        />
                      </div>
                      <div className="fr-col-12">
                        <Input
                          label="E-mail *"
                          hintText="Identique au compte Grist de la personne."
                          nativeInputProps={{
                            type: "email",
                            autoComplete: "off",
                            ...register("E_mail"),
                          }}
                          state={formState.errors.E_mail ? "error" : "default"}
                          stateRelatedMessage={formState.errors.E_mail?.message}
                        />
                      </div>
                      <div className="fr-col-12 fr-col-md-6">
                        <Select label="Département" nativeSelectProps={register("Equipe")}>
                          <option value="">—</option>
                          {equipeChoices.map((v) => (
                            <option key={v} value={v}>
                              {v}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div className="fr-col-12 fr-col-md-6">
                        <Select label="Spécialité" nativeSelectProps={register("Specialite")}>
                          <option value="">—</option>
                          {specialiteChoices.map((v) => (
                            <option key={v} value={v}>
                              {v}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div className="fr-col-12 fr-col-md-6">
                        <Select label="Statut" nativeSelectProps={register("Statut")}>
                          {statutChoices.map((v) => (
                            <option key={v} value={v}>
                              {v}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div className="fr-col-12 fr-col-md-6">
                        <Select label="Portage" nativeSelectProps={register("Portage")}>
                          <option value="">—</option>
                          {portageChoices.map((v) => (
                            <option key={v} value={v}>
                              {v}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div className="fr-col-12 fr-col-md-6">
                        <Select label="Ordinateur" nativeSelectProps={register("Ordinateur2")}>
                          <option value="">—</option>
                          {ordinateurChoices.map((v) => (
                            <option key={v} value={v}>
                              {v}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div className="fr-col-12 fr-col-md-6">
                        <Select
                          label="Mode de recrutement"
                          nativeSelectProps={register("Mode_recrutement")}
                        >
                          <option value="">—</option>
                          {modeChoices.map((v) => (
                            <option key={v} value={v}>
                              {v}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div className="fr-col-12 fr-col-md-6">
                        <Select
                          label={isEdit ? "Rôle *" : "Rôle"}
                          nativeSelectProps={register("Role_ACL")}
                        >
                          <option value="">—</option>
                          {roleChoices.map((v) => (
                            <option key={v} value={v}>
                              {v}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div className="fr-col-12 fr-col-md-6">
                        <Input
                          label="TJM"
                          hintText={tjmHint}
                          nativeInputProps={{
                            inputMode: "decimal",
                            ...register("TJM"),
                          }}
                          state={formState.errors.TJM ? "error" : "default"}
                          stateRelatedMessage={formState.errors.TJM?.message}
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
