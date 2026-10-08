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
  type EquipeCreateFormValues,
} from "../../utils/equipeFormFields.ts";
import { createEquipeRecord, updateEquipeRecord } from "../../utils/equipeGristWrite.ts";
import { loadEquipeTjmForPersonne } from "../../hooks/useEquipeTjmData.ts";
import {
  emptyEquipeTjmDraftLine,
  rowToEquipeTjmDraft,
  validateEquipeTjmDrafts,
  type EquipeTjmDraftLine,
} from "../../utils/equipeTjm.ts";
import { persistEquipeTjmWrites } from "../../utils/equipeTjmGristWrite.ts";

const formSchema = z.object({
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

function updateDraftLine(
  lines: EquipeTjmDraftLine[],
  key: string,
  patch: Partial<EquipeTjmDraftLine>,
): EquipeTjmDraftLine[] {
  return lines.map((line) => (line.key === key ? { ...line, ...patch } : line));
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
    const tarifsHeadingId = useId();
    const navigate = useNavigate();

    const [mode, setMode] = useState<"create" | "edit">("create");
    const [editingId, setEditingId] = useState<number | null>(null);
    const [submitError, setSubmitError] = useState<string>();
    const [savePending, setSavePending] = useState(false);
    const [tjmLoading, setTjmLoading] = useState(false);
    const [tjmLines, setTjmLines] = useState<EquipeTjmDraftLine[]>([]);

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
      setTjmLines([]);
      setTjmLoading(false);
      reset(emptyEquipeCreateForm());
      dialogRef.current?.showModal();
    }, [reset]);

    const openEdit = useCallback(
      (member: EquipeMember) => {
        setMode("edit");
        setEditingId(member.id);
        setSubmitError(undefined);
        setTjmLines([]);
        reset(memberToEquipeFormValues(member));
        dialogRef.current?.showModal();
        setTjmLoading(true);
        void loadEquipeTjmForPersonne(member.id)
          .then((rows) => {
            setTjmLines(rows.map(rowToEquipeTjmDraft));
          })
          .catch((e) => {
            setSubmitError(
              e instanceof Error
                ? e.message
                : "Impossible de charger les tarifs journaliers.",
            );
          })
          .finally(() => {
            setTjmLoading(false);
          });
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
      setTjmLines([]);
      setTjmLoading(false);
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

    const addTjmLine = () => {
      setTjmLines((prev) => [...prev, emptyEquipeTjmDraftLine()]);
    };

    const removeDraftOnlyLine = (key: string) => {
      setTjmLines((prev) => prev.filter((l) => !(l.key === key && l.id == null)));
    };

    const submitForm = async (values: EquipeCreateFormValues) => {
      setSubmitError(undefined);
      setSavePending(true);

      try {
        if (mode === "edit") {
          if (editingId == null) {
            setSubmitError("Édition incohérente : fermez le panneau et réessayez.");
            return;
          }
          if (!values.Role_ACL.trim()) {
            setSubmitError("Le rôle est obligatoire pour enregistrer la fiche.");
            return;
          }
          const tjmCheck = validateEquipeTjmDrafts(editingId, tjmLines);
          if (!tjmCheck.ok) {
            setSubmitError(tjmCheck.message);
            return;
          }
          await updateEquipeRecord(editingId, buildEquipeUpdateFields(values));
          await persistEquipeTjmWrites(tjmCheck.writes);
          await refreshAfterWrite();
          close();
          return;
        }

        // Création : d’abord la personne, puis la grille (Personne = nouvel id).
        const fields = buildEquipeCreateFields(values);
        // Validation tarifs avec un id provisoire : on re-valide après create.
        const previewCheck = validateEquipeTjmDrafts(1, tjmLines);
        if (!previewCheck.ok) {
          setSubmitError(previewCheck.message);
          return;
        }
        const id = await createEquipeRecord(fields);
        const tjmCheck = validateEquipeTjmDrafts(id, tjmLines);
        if (!tjmCheck.ok) {
          setSubmitError(
            `Personne créée, mais tarifs non enregistrés : ${tjmCheck.message}`,
          );
          await refreshAfterWrite();
          void navigate(`/equipe/${id}`);
          return;
        }
        await persistEquipeTjmWrites(tjmCheck.writes);
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
      ? "Corrige la fiche et les tarifs journaliers. L’e-mail doit correspondre au compte Grist pour les droits. Indiquez vous-même la fin d’un ancien tarif — rien n’est clôturé automatiquement."
      : "Ajoute une fiche dans l’annuaire Équipe. Les tarifs se saisissent dans la grille ci-dessous (pas sur un champ unique). Ne pas oublier d’inviter l’utilisateur sur le document Grist si nécessaire.";
    const primaryLabel = isEdit
      ? savePending
        ? "Enregistrement…"
        : "Enregistrer"
      : savePending
        ? "Enregistrement…"
        : "Créer la personne";
    const formBusy = savePending || tjmLoading;

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
                  <fieldset className="fr-fieldset" disabled={formBusy}>
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
                    </div>
                  </fieldset>

                  <section
                    className="fr-mt-3w"
                    aria-labelledby={tarifsHeadingId}
                  >
                    <h3 id={tarifsHeadingId} className="fr-h6 fr-mb-1w">
                      Tarifs journaliers
                    </h3>
                    <p className="fr-text--sm fr-mb-2w">
                      Indiquez la fin de l’ancien tarif vous-même ; rien n’est clôturé
                      automatiquement. Une ligne = une spécialité × une période.
                    </p>
                    {tjmLoading ? (
                      <p className="fr-text--sm fr-text-mention--grey" role="status">
                        Chargement des tarifs…
                      </p>
                    ) : null}
                    {tjmLines.length === 0 && !tjmLoading ? (
                      <p className="fr-text--sm fr-text-mention--grey fr-mb-2w">
                        Aucun tarif pour l’instant.
                      </p>
                    ) : null}
                    <ul className="fr-mb-2w" style={{ listStyle: "none", padding: 0 }}>
                      {tjmLines.map((line, index) => (
                        <li
                          key={line.key}
                          className="fr-mb-2w fr-p-2w"
                          style={{ border: "1px solid var(--border-default-grey)" }}
                        >
                          <p className="fr-text--sm fr-text--bold fr-mb-1w">
                            Tarif {index + 1}
                            {line.id == null ? " (nouveau)" : ""}
                          </p>
                          <div className="fr-grid-row fr-grid-row--gutters">
                            <div className="fr-col-12 fr-col-md-6">
                              <Select
                                label="Spécialité *"
                                nativeSelectProps={{
                                  value: line.Specialite,
                                  disabled: formBusy,
                                  onChange: (e) => {
                                    setTjmLines((prev) =>
                                      updateDraftLine(prev, line.key, {
                                        Specialite: e.target.value,
                                      }),
                                    );
                                  },
                                  "aria-label": `Spécialité du tarif ${index + 1}`,
                                }}
                              >
                                <option value="">—</option>
                                {specialiteChoices.map((v) => (
                                  <option key={v} value={v}>
                                    {v}
                                  </option>
                                ))}
                              </Select>
                            </div>
                            <div className="fr-col-12 fr-col-md-6">
                              <Input
                                label="TJM HT (€) *"
                                nativeInputProps={{
                                  inputMode: "decimal",
                                  value: line.TJM,
                                  disabled: formBusy,
                                  onChange: (e) => {
                                    setTjmLines((prev) =>
                                      updateDraftLine(prev, line.key, {
                                        TJM: e.target.value,
                                      }),
                                    );
                                  },
                                  "aria-label": `TJM du tarif ${index + 1}`,
                                }}
                              />
                            </div>
                            <div className="fr-col-12 fr-col-md-6">
                              <Input
                                label="À partir du *"
                                nativeInputProps={{
                                  type: "date",
                                  value: line.Date_debut,
                                  disabled: formBusy,
                                  onChange: (e) => {
                                    setTjmLines((prev) =>
                                      updateDraftLine(prev, line.key, {
                                        Date_debut: e.target.value,
                                      }),
                                    );
                                  },
                                  "aria-label": `Date de début du tarif ${index + 1}`,
                                }}
                              />
                            </div>
                            <div className="fr-col-12 fr-col-md-6">
                              <Input
                                label="Fin (vide = en vigueur)"
                                nativeInputProps={{
                                  type: "date",
                                  value: line.Date_fin,
                                  disabled: formBusy,
                                  onChange: (e) => {
                                    setTjmLines((prev) =>
                                      updateDraftLine(prev, line.key, {
                                        Date_fin: e.target.value,
                                      }),
                                    );
                                  },
                                  "aria-label": `Date de fin du tarif ${index + 1}`,
                                }}
                              />
                            </div>
                            <div className="fr-col-12">
                              <Input
                                label="Commentaire"
                                hintText="Motif (baisse, avenant…)."
                                nativeInputProps={{
                                  value: line.Commentaire,
                                  disabled: formBusy,
                                  onChange: (e) => {
                                    setTjmLines((prev) =>
                                      updateDraftLine(prev, line.key, {
                                        Commentaire: e.target.value,
                                      }),
                                    );
                                  },
                                  "aria-label": `Commentaire du tarif ${index + 1}`,
                                }}
                              />
                            </div>
                          </div>
                          {line.id == null ? (
                            <button
                              type="button"
                              className="fr-btn fr-btn--tertiary-no-outline fr-btn--sm fr-mt-1w"
                              disabled={formBusy}
                              onClick={() => removeDraftOnlyLine(line.key)}
                            >
                              Retirer ce tarif (non enregistré)
                            </button>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      className="fr-btn fr-btn--secondary fr-btn--sm"
                      disabled={formBusy}
                      onClick={addTjmLine}
                    >
                      Ajouter un tarif
                    </button>
                  </section>

                  <div className="fr-mt-3w fr-grid-row fr-grid-row--gutters fr-grid-row--right">
                    <div className="fr-col-auto">
                      <button
                        type="button"
                        className="fr-btn fr-btn--secondary"
                        onClick={close}
                        disabled={formBusy}
                      >
                        Annuler
                      </button>
                    </div>
                    <div className="fr-col-auto">
                      <button
                        type="submit"
                        className="fr-btn fr-btn--primary"
                        disabled={formBusy}
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
