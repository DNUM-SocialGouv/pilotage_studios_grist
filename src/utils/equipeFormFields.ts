/**
 * Formulaire création fiche Équipe (Admin) — valeurs UI + mapping champs Grist.
 */

export const DEFAULT_EQUIPE_STATUT = "Actif";

/** Rôles ACL autorisés à la création (alignés prep-equipe / Access Rules). */
export const EQUIPE_ROLE_ACL_CHOICES = [
  "Admin",
  "Responsable de département",
  "Freelance",
  "Invité",
] as const;

export type EquipeRoleAclChoice = (typeof EQUIPE_ROLE_ACL_CHOICES)[number];

export type EquipeCreateFormValues = {
  Prenom_Nom: string;
  E_mail: string;
  Equipe: string;
  Specialite: string;
  Statut: string;
  Portage: string;
  Ordinateur2: string;
  Mode_recrutement: string;
  Role_ACL: string;
  /** Chaîne formulaire ; vide = omis à l’écriture. */
  TJM: string;
};

/** Champs envoyés à `Equipe.create` (create only). */
export type EquipeCreateFields = {
  Prenom_Nom: string;
  E_mail: string;
  Equipe?: string;
  Specialite?: string;
  Statut?: string;
  Portage?: string;
  Ordinateur2?: string;
  Mode_recrutement?: string;
  Role_ACL?: string;
  TJM?: number;
};

export function emptyEquipeCreateForm(): EquipeCreateFormValues {
  return {
    Prenom_Nom: "",
    E_mail: "",
    Equipe: "",
    Specialite: "",
    Statut: DEFAULT_EQUIPE_STATUT,
    Portage: "",
    Ordinateur2: "",
    Mode_recrutement: "",
    Role_ACL: "",
    TJM: "",
  };
}

/** Parse TJM formulaire : vide → null ; sinon nombre ≥ 0 ou invalid. */
export function parseOptionalTjm(raw: string): number | null | "invalid" {
  const t = raw.trim().replace(",", ".");
  if (!t) {
    return null;
  }
  const n = Number(t);
  if (!Number.isFinite(n) || n < 0) {
    return "invalid";
  }
  return n;
}

export function buildEquipeCreateFields(values: EquipeCreateFormValues): EquipeCreateFields {
  const out: EquipeCreateFields = {
    Prenom_Nom: values.Prenom_Nom.trim(),
    // Aligné User Attribute / résolution session (casse ignorée).
    E_mail: values.E_mail.trim().toLowerCase(),
  };

  const setIf = (key: keyof EquipeCreateFields, raw: string) => {
    const t = raw.trim();
    if (t) {
      (out as Record<string, unknown>)[key] = t;
    }
  };

  setIf("Equipe", values.Equipe);
  setIf("Specialite", values.Specialite);
  setIf("Statut", values.Statut || DEFAULT_EQUIPE_STATUT);
  setIf("Portage", values.Portage);
  setIf("Ordinateur2", values.Ordinateur2);
  setIf("Mode_recrutement", values.Mode_recrutement);
  setIf("Role_ACL", values.Role_ACL);

  const tjm = parseOptionalTjm(values.TJM);
  if (tjm !== null && tjm !== "invalid") {
    out.TJM = tjm;
  }

  return out;
}
