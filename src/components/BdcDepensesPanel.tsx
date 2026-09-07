import { useMemo, useState } from "react";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Select } from "@codegouvfr/react-dsfr/Select";
import type { BdcDepensesData } from "../hooks/useBdcDepensesData";
import type { SuiviMensuel } from "../types";
import { formatMontantEur } from "../utils/formatMontant";
import {
  gristPeriodeFilterKey,
  gristPeriodeMonthKeyToTimestamp,
} from "../utils/gristPeriode";
import { libelleProduitGrist } from "../utils/pilotageProduits";
import { labelIntervenantSuivi, labelProduitSuivi } from "../utils/suiviLabels";
import { aggregateTtcByLabel, montantTtcSuiviMensuel } from "../utils/suiviMensuel";
import { BdcDepensesByPrestationTable } from "./BdcDepensesByPrestationTable";
import { CraTtcPiePanel } from "./CraTtcPiePanel";

const MOIS_SANS_PERIODE = "__sans_periode__";

function periodeMonthKey(s: SuiviMensuel): string {
  return gristPeriodeFilterKey(s.Periode, s) ?? MOIS_SANS_PERIODE;
}

function periodeMonthSortValue(s: SuiviMensuel): number {
  const key = gristPeriodeFilterKey(s.Periode, s);
  if (key) {
    return gristPeriodeMonthKeyToTimestamp(key) ?? 0;
  }
  return 0;
}

function defaultDepensesOrder(a: SuiviMensuel, b: SuiviMensuel): number {
  const da = periodeMonthSortValue(a);
  const db = periodeMonthSortValue(b);
  if (db !== da) {
    return db - da;
  }
  return String(b.Periode ?? "").localeCompare(String(a.Periode ?? ""), "fr");
}

function periodeMonthLabel(key: string): string {
  if (key === MOIS_SANS_PERIODE) {
    return "Sans période";
  }
  const [ys, ms] = key.split("-");
  const y = Number(ys);
  const mo = Number(ms);
  if (!Number.isFinite(y) || !Number.isFinite(mo)) {
    return key;
  }
  const label = new Date(y, mo - 1, 15).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export type BdcDepensesPanelProps = {
  data: BdcDepensesData;
};

export function BdcDepensesPanel({ data }: BdcDepensesPanelProps) {
  const [moisFacturation, setMoisFacturation] = useState("");
  const [intervenantFiltre, setIntervenantFiltre] = useState("");
  const [produitFiltre, setProduitFiltre] = useState("");

  const intervenantsById = useMemo(() => {
    const m = new Map<number, string>();
    for (const i of data.intervenants) {
      m.set(i.id, i.Prenom_Nom?.trim() || `Intervenant #${i.id}`);
    }
    return m;
  }, [data.intervenants]);

  const produitsById = useMemo(() => {
    const m = new Map<number, string>();
    for (const p of data.produits) {
      m.set(p.id, libelleProduitGrist({ Produit: p.Produit }, p.id));
    }
    return m;
  }, [data.produits]);

  const depensesMensuelles = useMemo(() => {
    return data.suivi.slice().sort(defaultDepensesOrder);
  }, [data.suivi]);

  const moisFacturationOptions = useMemo(() => {
    const keys = new Set<string>();
    for (const s of depensesMensuelles) {
      keys.add(periodeMonthKey(s));
    }
    return Array.from(keys).sort((a, b) => {
      if (a === MOIS_SANS_PERIODE) return 1;
      if (b === MOIS_SANS_PERIODE) return -1;
      return b.localeCompare(a);
    });
  }, [depensesMensuelles]);

  const intervenantOptions = useMemo(() => {
    const set = new Set<string>();
    for (const s of depensesMensuelles) {
      set.add(labelIntervenantSuivi(s, intervenantsById));
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "fr"));
  }, [depensesMensuelles, intervenantsById]);

  const produitOptions = useMemo(() => {
    const set = new Set<string>();
    for (const s of depensesMensuelles) {
      set.add(labelProduitSuivi(s, produitsById));
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));
  }, [depensesMensuelles, produitsById]);

  const depensesFiltrees = useMemo(() => {
    return depensesMensuelles.filter((s) => {
      if (moisFacturation && periodeMonthKey(s) !== moisFacturation) {
        return false;
      }
      if (intervenantFiltre && labelIntervenantSuivi(s, intervenantsById) !== intervenantFiltre) {
        return false;
      }
      if (produitFiltre && labelProduitSuivi(s, produitsById) !== produitFiltre) {
        return false;
      }
      return true;
    });
  }, [
    depensesMensuelles,
    moisFacturation,
    intervenantFiltre,
    produitFiltre,
    intervenantsById,
    produitsById,
  ]);

  const filtresDepensesActifs = Boolean(moisFacturation || intervenantFiltre || produitFiltre);

  const totauxSuivi = useMemo(() => {
    let jours = 0;
    let ttc = 0;
    for (const s of depensesFiltrees) {
      jours += typeof s.Nb_jours === "number" && !Number.isNaN(s.Nb_jours) ? s.Nb_jours : 0;
      const m = montantTtcSuiviMensuel(s);
      if (m != null) {
        ttc += m;
      }
    }
    return { jours, ttc };
  }, [depensesFiltrees]);

  const tjmMoyenFiltre = useMemo(() => {
    const { jours, ttc } = totauxSuivi;
    if (jours <= 0 || !Number.isFinite(ttc)) {
      return null;
    }
    return ttc / jours;
  }, [totauxSuivi]);

  const ttcParProduitSlices = useMemo(
    () =>
      aggregateTtcByLabel(depensesMensuelles, (s) => labelProduitSuivi(s, produitsById))
        .filter((e) => e.ttc > 0)
        .map((e) => ({ label: e.label, value: e.ttc })),
    [depensesMensuelles, produitsById],
  );

  if (data.status === "idle" || data.status === "loading") {
    return (
      <Alert
        severity="info"
        small
        title="Chargement"
        description="Chargement du suivi mensuel et des prestations…"
        role="status"
      />
    );
  }

  if (data.status === "error") {
    return (
      <Alert
        severity="warning"
        small
        title="Suivi mensuel indisponible"
        description={data.error ?? "La liste des dépenses mensuelles n’a pas pu être chargée."}
      />
    );
  }

  return (
    <>
      {data.refsError ? (
        <div className="fr-mb-2w">
          <Alert
            severity="warning"
            small
            title="Référentiels partiels"
            description={data.refsError}
          />
        </div>
      ) : null}
      {depensesMensuelles.length > 0 ? (
        <div className="fr-grid-row fr-grid-row--gutters mission-equipe-recap fr-mb-3w">
          <div className="fr-col-12 fr-col-lg-7">
            <p className="fr-text--xs fr-text-mention--grey fr-mb-2w">
              <span className="fr-text--bold">
                {depensesMensuelles.length.toLocaleString("fr-FR")}
              </span>{" "}
              {depensesMensuelles.length <= 1 ? (
                <>ligne de suivi pour ce bon de commande.</>
              ) : (
                <>lignes de suivi pour ce bon de commande.</>
              )}
              {filtresDepensesActifs ? (
                <>
                  {" "}
                  <span className="fr-text--bold">
                    {depensesFiltrees.length.toLocaleString("fr-FR")}
                  </span>{" "}
                  {depensesFiltrees.length <= 1 ? <>ligne affichée.</> : <>lignes affichées.</>}
                </>
              ) : null}
            </p>
            <div className="fr-grid-row fr-grid-row--gutters bdc-depenses-filters">
              <div className="fr-col-12 fr-col-sm-6">
                <Select
                  label="Période"
                  nativeSelectProps={{
                    value: moisFacturation,
                    onChange: (e) => setMoisFacturation(e.currentTarget.value),
                  }}
                >
                  <option value="">Toutes les périodes</option>
                  {moisFacturationOptions.map((key) => (
                    <option key={key} value={key}>
                      {periodeMonthLabel(key)}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="fr-col-12 fr-col-sm-6">
                <Select
                  label="Intervenant"
                  nativeSelectProps={{
                    value: intervenantFiltre,
                    onChange: (e) => setIntervenantFiltre(e.currentTarget.value),
                  }}
                >
                  <option value="">Tous les intervenants</option>
                  {intervenantOptions.map((nom) => (
                    <option key={nom} value={nom}>
                      {nom}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="fr-col-12">
                <Select
                  label="Produit"
                  nativeSelectProps={{
                    value: produitFiltre,
                    onChange: (e) => setProduitFiltre(e.currentTarget.value),
                  }}
                >
                  <option value="">Tous les produits</option>
                  {produitOptions.map((libelle) => (
                    <option key={libelle} value={libelle}>
                      {libelle}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            {filtresDepensesActifs ? (
              <p className="fr-mt-1w fr-mb-0">
                <button
                  type="button"
                  className="fr-link"
                  onClick={() => {
                    setMoisFacturation("");
                    setIntervenantFiltre("");
                    setProduitFiltre("");
                  }}
                >
                  Réinitialiser les filtres
                </button>
              </p>
            ) : null}
          </div>
          <div className="fr-col-12 fr-col-lg-5">
            <CraTtcPiePanel slices={ttcParProduitSlices} title="TTC par produit" size="lg" />
          </div>
        </div>
      ) : null}
      {depensesMensuelles.length === 0 ? (
        <p className="fr-text--sm fr-text-mention--grey fr-mb-4w">
          Aucune ligne de suivi mensuel liée à ce BDC.
        </p>
      ) : depensesFiltrees.length === 0 ? (
        <p className="fr-text--sm fr-text-mention--grey fr-mb-4w">
          Aucune ligne ne correspond à ces filtres.
        </p>
      ) : (
        <>
          <BdcDepensesByPrestationTable
            suivi={depensesFiltrees}
            missionEnfants={data.missionEnfants}
            missions={data.missions}
            intervenantsById={intervenantsById}
            produitsById={produitsById}
          />
          <div className="fr-mt-2w fr-mb-4w">
            <p className="fr-text--xs fr-mb-1w">
              <strong>Total lignes affichées :</strong> {totauxSuivi.jours.toLocaleString("fr-FR")}{" "}
              jour(s), {formatMontantEur(totauxSuivi.ttc)} TTC (somme des lignes filtrées).
            </p>
            <p className="fr-text--xs fr-mb-0 fr-text-mention--grey">
              <strong>TJM moyen (lignes filtrées) :</strong>{" "}
              {tjmMoyenFiltre != null ? (
                <>
                  {formatMontantEur(tjmMoyenFiltre)} TTC par jour facturé (montant TTC total ÷ jours
                  facturés).
                </>
              ) : (
                <>— (aucun jour facturé sur les lignes filtrées).</>
              )}
            </p>
          </div>
        </>
      )}
    </>
  );
}
