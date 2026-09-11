import { Fragment, type ReactNode } from "react";
import { Tag } from "@codegouvfr/react-dsfr/Tag";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import { extractGristStringTokens } from "../utils/gristReferences";
import { equipeTagDsfrModifierForLabel } from "../utils/equipeTagColors";

/** Tag équipe : teinte DSFR stable par libellé (HITL #216). */
export function tdEquipeTag(
  label: string,
  options?: { small?: boolean },
): ReactNode {
  const t = label.trim();
  if (!t || t === "—") {
    return "—";
  }
  const mod = equipeTagDsfrModifierForLabel(t);
  return (
    <Tag
      as="span"
      nativeSpanProps={{}}
      className={cx(`fr-tag--${mod}`, options?.small && "fr-tag--sm")}
    >
      {t}
    </Tag>
  );
}

function equipeTag(label: string): ReactNode {
  return tdEquipeTag(label);
}

type EquipeTagsProps = {
  value: unknown;
  empty?: string;
};

/** Tags DSFR (liste missions) — pas `EquipeBadges`. */
export function EquipeTags({ value, empty = "—" }: EquipeTagsProps) {
  const tokens = extractGristStringTokens(value);
  if (tokens.length === 0) {
    return <>{empty}</>;
  }
  if (tokens.length === 1) {
    return equipeTag(tokens[0]!);
  }
  return (
    <span className="pilotage-inline-tags">
      {tokens.map((t, i) => (
        <Fragment key={`${t}-${i}`}>{equipeTag(t)}</Fragment>
      ))}
    </span>
  );
}
