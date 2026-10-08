/**
 * Formulaire création / édition fiche Équipe (Admin) — valeurs UI + mapping champs Grist.
 * TJM fiche (`Equipe.TJM`) : plus édité ici — source = grille `Equipe_TJM`.
 */

import type { EquipeMember } from "../types.ts";

export const DEFAULT_EQUIPE_STATUT = "Actif";

/** Rôles ACL autorisés à la création / édition (alignés prep-equipe / Access Rules). */
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
};

/** Champs envoyés à `Equipe.create`. */
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
};

/**
 * Champs envoyés à `Equipe.update`.
 * Role_ACL omis si formulaire vide (ne pas effacer par accident).
 */
export type EquipeUpdateFields = {
  Prenom_Nom: string;
  E_mail: string;
  Equipe: string;
  Specialite: string;
  Statut: string;
  Portage: string;
  Ordinateur2: string;
  Mode_recrutement: string;
  Role_ACL?: string;
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
  };
}

/** Préremplit le formulaire d’édition depuis une fiche déjà chargée. */
export function memberToEquipeFormValues(member: EquipeMember): EquipeCreateFormValues {
  return {
    Prenom_Nom: member.Prenom_Nom?.trim() ?? "",
    E_mail: member.E_mail?.trim().toLowerCase() ?? "",
    Equipe: member.Equipe?.trim() ?? "",
    Specialite: member.Specialite?.trim() ?? "",
    Statut: member.Statut?.trim() || DEFAULT_EQUIPE_STATUT,
    Portage: member.Portage?.trim() ?? "",
    Ordinateur2: member.Ordinateur2?.trim() ?? "",
    Mode_recrutement: member.Mode_recrutement?.trim() ?? "",
    Role_ACL: member.Role_ACL?.trim() ?? "",
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

  return out;
}

/**
 * Patch update : chaînes envoyées (vide = effacer le choix pour les champs non sensibles) ;
 * Role_ACL omis si vide (ne pas effacer un rôle existant par accident).
 * Pas de `TJM` — source = `Equipe_TJM`.
 */
export function buildEquipeUpdateFields(values: EquipeCreateFormValues): EquipeUpdateFields {
  const out: EquipeUpdateFields = {
    Prenom_Nom: values.Prenom_Nom.trim(),
    E_mail: values.E_mail.trim().toLowerCase(),
    Equipe: values.Equipe.trim(),
    Specialite: values.Specialite.trim(),
    Statut: values.Statut.trim() || DEFAULT_EQUIPE_STATUT,
    Portage: values.Portage.trim(),
    Ordinateur2: values.Ordinateur2.trim(),
    Mode_recrutement: values.Mode_recrutement.trim(),
  };

  const role = values.Role_ACL.trim();
  if (role) {
    out.Role_ACL = role;
  }

  return out;
}
