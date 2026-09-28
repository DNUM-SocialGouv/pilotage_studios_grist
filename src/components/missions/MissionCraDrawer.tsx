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
import type { SuiviMensuel } from "../../types.ts";
import {
  buildRealiseDeclarerFields,
  parseCraDeclarerJours,
  periodeTimestampForMonthKey,
} from "../../utils/craDeclarer.ts";
import { buildRealiseRevueEquipeFields } from "../../utils/craRevueEquipe.ts";
import {
  estimateCraTtc,
  formatMarkupPercent,
  formatTvaPercent,
} from "../../utils/craTtcEstimate.ts";
import { formatMontantEur } from "../../utils/formatMontant.ts";
import {
  emptyMissionCraForm,
  findMissionCraMonthCollisionId,
  MISSION_CRA_MONTH_COLLISION_MESSAGE,
  missionCraMonthOptions,
  parseMissionCraJoursRequired,
  suiviToMissionCraFormValues,
  type MissionCraDrawerContext,
  type MissionCraFormValues,
} from "../../utils/missionCraFormFields.ts";
import {
  createRealiseRecord,
  updateRealiseRecord,
} from "../../utils/realiseGristWrite.ts";
import { montantTtcSuiviMensuel } from "../../utils/suiviMensuel.ts";
import { DsfrSelectRichMulti } from "../dsfr/DsfrSelectRichMulti.tsx";
import type { MissionCraDrawerHandle } from "./missionCraDrawerTypes.ts";

type DrawerMode = "edit" | "duplicate";

const formSchema = z.object({
  monthKey: z.string().trim().min(1, "Le mois est obligatoire"),
  nbJours: z.string(),
  taches: z.string(),
  bdcId: z.string(),
});

export type MissionCraDrawerProps = {
  /** Toutes les réalisations chargées (détection collision mois). */
  suivi: SuiviMensuel[];
  /** Options BDC (même source que la revue équipe). */
  bdcOptions: { value: string; label: string }[];
  onRecordsChanged: () => Promise<void>;
};

export const MissionCraDrawer = forwardRef<
  MissionCraDrawerHandle,
  MissionCraDrawerProps
>(function MissionCraDrawer({ suivi, bdcOptions, onRecordsChanged }, ref) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const ctxRef = useRef<MissionCraDrawerContext | null>(null);

  const [mode, setMode] = useState<DrawerMode>("edit");
  const [context, setContext] = useState<MissionCraDrawerContext | null>(null);
  const [submitError, setSubmitError] = useState<string>();
  const [infoMessage, setInfoMessage] = useState<string>();
  const [isSuccess, setIsSuccess] = useState(false);
  const [savePending, setSavePending] = useState(false);

  const { register, handleSubmit, reset, control, formState } =
    useForm<MissionCraFormValues>({
      resolver: zodResolver(formSchema),
      defaultValues: emptyMissionCraForm(),
    });

  const nbJoursWatch = useWatch({ control, name: "nbJours" }) ?? "";

  const monthOptions = useMemo(
    () =>
      missionCraMonthOptions(
        context ? suiviToMissionCraFormValues(context.suivi).monthKey : undefined,
      ),
    [context],
  );

  const ttcEstimate = useMemo(() => {
    const jours = (() => {
      try {
        return parseCraDeclarerJours(nbJoursWatch);
      } catch {
        return null;
      }
    })();
    if (jours == null || context?.tjm == null) {
      return null;
    }
    return estimateCraTtc(jours, context.tjm);
  }, [nbJoursWatch, context?.tjm]);

  const ttcEnregistre =
    context != null ? montantTtcSuiviMensuel(context.suivi) : undefined;

  const openWith = useCallback(
    (nextMode: DrawerMode, ctx: MissionCraDrawerContext) => {
      ctxRef.current = ctx;
      setMode(nextMode);
      setContext(ctx);
      setSubmitError(undefined);
      setInfoMessage(undefined);
      setIsSuccess(false);
      reset(suiviToMissionCraFormValues(ctx.suivi));
      dialogRef.current?.showModal();
    },
    [reset],
  );

  const openEdit = useCallback(
    (ctx: MissionCraDrawerContext) => openWith("edit", ctx),
    [openWith],
  );

  const openDuplicate = useCallback(
    (ctx: MissionCraDrawerContext) => openWith("duplicate", ctx),
    [openWith],
  );

  const close = useCallback(() => {
    dialogRef.current?.close();
  }, []);

  const onDialogClose = () => {
    setIsSuccess(false);
    setSubmitError(undefined);
    setInfoMessage(undefined);
    setContext(null);
    ctxRef.current = null;
  };

  useImperativeHandle(ref, () => ({ openEdit, openDuplicate, close }), [
    openEdit,
    openDuplicate,
    close,
  ]);

  const title = mode === "edit" ? "Modifier le CRA" : "Dupliquer le CRA";
  const description =
    mode === "edit"
      ? "Met à jour le mois, les jours, la description et le bon de commande."
      : "Crée une nouvelle réalisation préremplie (changez typiquement le mois et les jours).";
  const primaryLabel =
    mode === "edit" ? "Enregistrer les modifications" : "Créer le CRA";

  const refreshAfterWrite = async (): Promise<boolean> => {
    try {
      await onRecordsChanged();
      return true;
    } catch {
      return false;
    }
  };

  const submitForm = async (values: MissionCraFormValues) => {
    setSubmitError(undefined);
    setInfoMessage(undefined);
    setIsSuccess(false);
    setSavePending(true);

    try {
      const ctx = ctxRef.current;
      if (!ctx) {
        setSubmitError("Contexte CRA introuvable.");
        return;
      }

      let nbJours: number;
      try {
        nbJours = parseMissionCraJoursRequired(values.nbJours);
      } catch (e) {
        setSubmitError(e instanceof Error ? e.message : "Jours invalides.");
        return;
      }

      const monthKey = values.monthKey.trim();
      const excludeId = mode === "edit" ? ctx.suivi.id : undefined;
      const collision = findMissionCraMonthCollisionId(
        suivi,
        ctx.intervenantId,
        ctx.enfantId,
        monthKey,
        excludeId,
      );
      if (collision != null) {
        setSubmitError(MISSION_CRA_MONTH_COLLISION_MESSAGE);
        return;
      }

      const periodeTs = periodeTimestampForMonthKey(monthKey);
      const taches = values.taches.trim();
      const bdcParsed = Number.parseInt(values.bdcId.trim(), 10);
      const bdcId =
        Number.isFinite(bdcParsed) && bdcParsed > 0 ? bdcParsed : null;

      const fields = {
        ...buildRealiseDeclarerFields({
          intervenantId: ctx.intervenantId,
          missionId: ctx.missionId,
          enfantId: ctx.enfantId,
          nbJours,
          taches,
          periodeTs,
          equipeLabel: ctx.equipeLabel,
        }),
        ...buildRealiseRevueEquipeFields({ nbJours, taches, bdcId }),
      };

      if (mode === "edit") {
        await updateRealiseRecord(ctx.suivi.id, fields);
        const refreshed = await refreshAfterWrite();
        setIsSuccess(true);
        if (!refreshed) {
          setInfoMessage(
            "Modifications enregistrées dans Grist. La liste n’a pas pu être rafraîchie — rechargez la page si besoin.",
          );
        }
        return;
      }

      await createRealiseRecord(fields);
      const refreshed = await refreshAfterWrite();
      setIsSuccess(true);
      if (!refreshed) {
        setInfoMessage(
          "CRA créé dans Grist. La liste n’a pas pu être rafraîchie — rechargez la page si besoin.",
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
                  description="Le CRA a été mis à jour dans Grist."
                  className="fr-mb-2w"
                />
              ) : null}
              {infoMessage ? (
                <Alert
                  severity="info"
                  title="Liste non rafraîchie"
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

              {context ? (
                <p className="fr-text--sm fr-mb-2w">
                  <span className="fr-text--bold">{context.prestationLibelle}</span>
                  <span className="fr-hint-text">
                    {" "}
                    · {context.intervenantLibelle || "Intervenant"}
                    {context.portage ? ` · ${context.portage}` : ""}
                  </span>
                </p>
              ) : null}

              <form
                className="fr-mt-1w"
                onSubmit={(event) => {
                  void handleSubmit(submitForm)(event);
                }}
              >
                <fieldset className="fr-fieldset" disabled={savePending}>
                  <div className="fr-grid-row fr-grid-row--gutters">
                    <div className="fr-col-12 fr-col-md-6">
                      <Select
                        label="Mois *"
                        state={formState.errors.monthKey ? "error" : "default"}
                        stateRelatedMessage={formState.errors.monthKey?.message}
                        nativeSelectProps={register("monthKey")}
                      >
                        <option value="">Choisir un mois</option>
                        {monthOptions.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="fr-col-12 fr-col-md-6">
                      <Input
                        label="Jours *"
                        nativeInputProps={{
                          ...register("nbJours"),
                          inputMode: "decimal",
                        }}
                      />
                    </div>
                    <div className="fr-col-12">
                      <Input
                        label="Description"
                        hintText="Tâches réalisées sur la période (optionnel)."
                        textArea
                        nativeTextAreaProps={register("taches")}
                      />
                    </div>
                    <div className="fr-col-12">
                      <Controller
                        name="bdcId"
                        control={control}
                        render={({ field }) => (
                          <DsfrSelectRichMulti
                            label="Bon de commande"
                            hintText="Rattache cette réalisation à un BDC (comme en revue équipe)."
                            placeholderWhenEmpty="Rechercher un bon de commande…"
                            options={bdcOptions}
                            selectedValues={field.value.trim() ? [field.value] : []}
                            onSelectedValuesChange={(values) =>
                              field.onChange(values[0] ?? "")
                            }
                            searchable
                            searchLabel="Rechercher"
                            searchPlaceholder="Nom du BDC…"
                            showBulkActions={false}
                            maxSelections={1}
                            pluralEntityLabel="bons de commande"
                            disabled={savePending}
                          />
                        )}
                      />
                    </div>
                  </div>

                  <div
                    className="fr-callout fr-callout--blue-cumulus fr-mt-3w fr-mb-3w fr-py-2w"
                    role="region"
                    aria-label="Calcul TTC indicatif"
                  >
                    <p className="fr-callout__title fr-text--sm fr-mb-1w">
                      Calcul TTC (indicatif)
                    </p>
                    {ttcEstimate ? (
                      <ul className="fr-text--sm fr-mb-0">
                        <li>
                          TJM : {formatMontantEur(ttcEstimate.tjm)}
                          {context?.portage
                            ? ` · portage ${context.portage}`
                            : ""}
                        </li>
                        <li>
                          Markup {formatMarkupPercent(ttcEstimate.markupFactor)}{" "}
                          → HT : {formatMontantEur(ttcEstimate.htAvecMarkup)}
                        </li>
                        <li>
                          TVA {formatTvaPercent(ttcEstimate.tvaFactor)} → TTC
                          estimé :{" "}
                          <strong>{formatMontantEur(ttcEstimate.ttc)}</strong>
                        </li>
                        {mode === "edit" && ttcEnregistre != null ? (
                          <li className="fr-hint-text">
                            TTC enregistré dans Grist :{" "}
                            {formatMontantEur(ttcEnregistre)} (non modifié ici —
                            réservé Owner)
                          </li>
                        ) : null}
                      </ul>
                    ) : (
                      <p className="fr-text--sm fr-mb-0">
                        {context?.tjm == null
                          ? "TJM de l’intervenant illisible — estimation indisponible."
                          : "Indiquez un nombre de jours pour voir l’estimation."}
                      </p>
                    )}
                  </div>

                  <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--right">
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
                        disabled={savePending}
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

MissionCraDrawer.displayName = "MissionCraDrawer";
