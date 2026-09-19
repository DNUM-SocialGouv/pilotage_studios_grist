import { useEffect, useState } from "react";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { ToggleSwitch } from "@codegouvfr/react-dsfr/ToggleSwitch";
import { TableShell } from "../components/FinanceRecap";
import { useAclProfil } from "../AclProfilContext";
import { useGristPa } from "../GristPaContext";
import { useDroitsPagesData, type DroitsPagesRow } from "../hooks/useDroitsPagesData";
import { NothingHerePage } from "../security/NothingHerePage";
import type { PageAccessFlags, PageAccessKey } from "../security/pageAccess";
import { updateDroitsPagesRecord } from "../utils/droitsPagesGristWrite";
import {
  DROITS_PAGES_ROLE_ORDER,
  DROITS_PAGES_ROLE_SHORT,
  DROITS_PAGES_THEMES,
  type DroitsPagesRoleName,
} from "../utils/droitsPagesThemes";

type DraftByRole = Record<DroitsPagesRoleName, PageAccessFlags | undefined>;

function rowsToDraft(rows: DroitsPagesRow[]): DraftByRole {
  const draft = {} as DraftByRole;
  for (const role of DROITS_PAGES_ROLE_ORDER) {
    draft[role] = undefined;
  }
  for (const row of rows) {
    draft[row.role] = { ...row.flags, Page_accueil: true };
  }
  return draft;
}

function toggleId(screenKey: PageAccessKey, role: DroitsPagesRoleName): string {
  return `droits-pages-${screenKey}-${role}`.replace(/[^a-zA-Z0-9_-]/g, "-");
}

export function DroitsPagesAdminPage() {
  const pa = useGristPa();
  const { refresh: refreshAcl } = useAclProfil();
  const enabled =
    !pa.untrustedEmbed && !pa.outsideGrist && !pa.loading && !pa.error;
  const data = useDroitsPagesData(enabled);

  const [draft, setDraft] = useState<DraftByRole>(() => rowsToDraft([]));
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveOk, setSaveOk] = useState<string | null>(null);

  useEffect(() => {
    if (data.status === "ok" && savingKey == null) {
      setDraft(rowsToDraft(data.rows));
    }
  }, [data.status, data.rows, savingKey]);

  if (pa.untrustedEmbed) {
    return <NothingHerePage />;
  }

  if (pa.outsideGrist) {
    return (
      <div className="fr-container fr-mt-2w">
        <h1 className="fr-h3">Droits des pages</h1>
        <Alert
          severity="info"
          title="Aperçu hors Grist"
          description="Cette page lit et enregistre la table Droits_pages dans le document Grist. Ouvrez le widget dans Grist pour l’utiliser."
        />
      </div>
    );
  }

  if (pa.loading) {
    return (
      <p className="fr-text--sm fr-mt-2w" role="status">
        Chargement…
      </p>
    );
  }

  if (pa.error) {
    return (
      <Alert
        className="fr-mt-2w"
        severity="error"
        title="Données indisponibles"
        description={pa.error}
      />
    );
  }

  const onToggle = async (
    role: DroitsPagesRoleName,
    key: PageAccessKey,
    value: boolean,
  ) => {
    const row = data.rows.find((r) => r.role === role);
    const current = draft[role];
    if (!row || !current) {
      return;
    }
    const previous = current;
    const next: PageAccessFlags = { ...current, [key]: value, Page_accueil: true };
    const cellKey = `${role}:${key}`;

    setDraft((prev) => ({ ...prev, [role]: next }));
    setSaveError(null);
    setSaveOk(null);
    setSavingKey(cellKey);

    try {
      const verified = await updateDroitsPagesRecord(row.id, next);
      data.patchRow(row.id, verified);
      setDraft((prev) => ({ ...prev, [role]: { ...verified, Page_accueil: true } }));
      refreshAcl();
      setSaveOk(
        `${DROITS_PAGES_ROLE_SHORT[role]} : modification enregistrée dans Grist.`,
      );
    } catch (err) {
      setDraft((prev) => ({ ...prev, [role]: previous }));
      setSaveError(err instanceof Error ? err.message : String(err));
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="fr-container fr-mt-2w fr-mb-4w">
      <h1 className="fr-h3">Droits des pages</h1>

      {data.status === "loading" || data.status === "idle" ? (
        <p className="fr-text--sm" role="status">
          Chargement de la matrice…
        </p>
      ) : null}

      {data.status === "error" ? (
        <Alert
          className="fr-mb-3w"
          severity="error"
          title="Lecture impossible"
          description={
            data.error ??
            "Impossible de lire Droits_pages. Vérifiez que vous êtes Admin (ou Owner) du document."
          }
        />
      ) : null}

      {saveError ? (
        <Alert
          className="fr-mb-3w"
          severity="error"
          title="Enregistrement impossible"
          description={saveError}
        />
      ) : null}
      {saveOk && !saveError ? (
        <Alert
          className="fr-mb-3w"
          severity="success"
          small
          title="Enregistré"
          description={saveOk}
        />
      ) : null}

      {data.status === "ok" ? (
        <>
          {DROITS_PAGES_THEMES.map((theme) => (
            <section key={theme.id} className="fr-mb-4w">
              <h2 className="fr-h5 fr-mb-1w">{theme.label}</h2>
              <TableShell className="fr-mb-0 droits-pages-matrix">
                <table>
                  <caption className="fr-sr-only">
                    Droits d’écran — {theme.label}
                  </caption>
                  <colgroup>
                    <col className="droits-pages-matrix__col-screen" />
                    {DROITS_PAGES_ROLE_ORDER.map((role) => (
                      <col key={role} className="droits-pages-matrix__col-role" />
                    ))}
                  </colgroup>
                  <thead>
                    <tr>
                      <th scope="col">Écran</th>
                      {DROITS_PAGES_ROLE_ORDER.map((role) => (
                        <th key={role} scope="col" className="droits-pages-matrix__role-head">
                          {DROITS_PAGES_ROLE_SHORT[role]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {theme.screens.map((screen) => (
                      <tr key={screen.key}>
                        <th scope="row">{screen.label}</th>
                        {DROITS_PAGES_ROLE_ORDER.map((role) => {
                          const flags = draft[role];
                          const checked = flags?.[screen.key] === true;
                          const rowId = data.rows.find((r) => r.role === role)?.id;
                          const cellKey = `${role}:${screen.key}`;
                          if (screen.readOnly) {
                            return (
                              <td key={role} className="droits-pages-matrix__cell">
                                <span className="fr-text--sm">{checked ? "Oui" : "Non"}</span>
                              </td>
                            );
                          }
                          return (
                            <td key={role} className="droits-pages-matrix__cell">
                              <ToggleSwitch
                                id={toggleId(screen.key, role)}
                                label={
                                  <span className="fr-sr-only">
                                    {screen.label} — {role}
                                  </span>
                                }
                                checked={checked}
                                showCheckedHint={false}
                                disabled={
                                  savingKey != null || flags == null || rowId == null
                                }
                                onChange={(value) => {
                                  void onToggle(role, screen.key, value);
                                }}
                              />
                              {savingKey === cellKey ? (
                                <span className="fr-sr-only" role="status">
                                  Enregistrement…
                                </span>
                              ) : null}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableShell>
            </section>
          ))}
        </>
      ) : null}
    </div>
  );
}
