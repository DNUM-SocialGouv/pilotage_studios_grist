/**
 * Liste déroulante riche (sélection multiple + recherche + actions masse).
 * Le DSFR ne fournit pas encore ce composant en code (bêta) ; la structure suit
 * l’anatomie documentée : libellé, aide, champ de recherche facultatif,
 * boutons tout sélectionner / tout désélectionner, levier façon liste déroulante, liste d’options.
 *
 * @see https://www.systeme-de-design.gouv.fr/version-courante/fr/composants/liste-deroulante-riche
 */
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { ButtonsGroup } from "@codegouvfr/react-dsfr/ButtonsGroup";
import { Checkbox } from "@codegouvfr/react-dsfr/Checkbox";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { fr } from "@codegouvfr/react-dsfr/fr";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import styles from "./DsfrSelectRichMulti.module.css";

export type DsfrSelectRichMultiOption = {
  value: string;
  label: string;
};

export type DsfrSelectRichMultiProps = {
  id?: string;
  label: string;
  hintText?: string;
  /** Texte du levier lorsqu’aucune valeur n’est sélectionnée. */
  placeholderWhenEmpty: string;
  options: DsfrSelectRichMultiOption[];
  selectedValues: string[];
  onSelectedValuesChange: (values: string[]) => void;
  disabled?: boolean;
  /** Champ de recherche pour filtrer les options affichées. */
  searchable?: boolean;
  searchLabel?: string;
  searchPlaceholder?: string;
  /** Affiche « Tout sélectionner » / « Tout désélectionner ». */
  showBulkActions?: boolean;
  /**
   * Nombre max de valeurs sélectionnables. Au plafond, une nouvelle option
   * remplace la plus ancienne sélection. « Tout sélectionner » est masqué.
   */
  maxSelections?: number;
  className?: string;
  /** Ex. « statuts » pour « 3 statuts sélectionnés ». */
  pluralEntityLabel?: string;
  /**
   * Limite la largeur du lévier et du panneau (ex. `"26rem"` ou `"min(26rem, 100%)"`).
   * Sinon le bloc occupe 100 % du conteneur parent.
   */
  maxInlineSize?: CSSProperties["maxWidth"];
};

function summaryLabel(
  placeholderWhenEmpty: string,
  selected: string[],
  options: DsfrSelectRichMultiOption[],
  pluralEntityLabel?: string,
): string {
  if (selected.length === 0) {
    return placeholderWhenEmpty;
  }
  if (selected.length === 1) {
    const opt = options.find((o) => o.value === selected[0]);
    return opt?.label ?? selected[0]!;
  }
  const entity = pluralEntityLabel?.trim() || "options";
  return `${selected.length} ${entity} sélectionné${selected.length > 1 ? "s" : ""}`;
}

export function DsfrSelectRichMulti(props: DsfrSelectRichMultiProps) {
  const {
    id: idProp,
    label,
    hintText,
    placeholderWhenEmpty,
    options,
    selectedValues,
    onSelectedValuesChange,
    disabled = false,
    searchable = true,
    searchLabel = "Rechercher dans la liste",
    searchPlaceholder = "Saisir un mot-clé…",
    showBulkActions = true,
    maxSelections,
    className,
    pluralEntityLabel,
    maxInlineSize,
  } = props;

  const bulkActionsVisible =
    showBulkActions && (maxSelections == null || maxSelections >= options.length);

  const reactId = useId();
  const baseId = idProp ?? `select-rich-multi-${reactId}`;
  const listboxId = `${baseId}-listbox`;
  const hintId = `${baseId}-hint`;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return options;
    }
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  const selectAllFiltered = useCallback(() => {
    const next = new Set(selectedValues);
    for (const o of filteredOptions) {
      next.add(o.value);
    }
    let values = [...next];
    if (maxSelections != null && values.length > maxSelections) {
      values = values.slice(0, maxSelections);
    }
    onSelectedValuesChange(values);
  }, [filteredOptions, maxSelections, onSelectedValuesChange, selectedValues]);

  const deselectAllFiltered = useCallback(() => {
    const filterSet = new Set(filteredOptions.map((o) => o.value));
    onSelectedValuesChange(selectedValues.filter((v) => !filterSet.has(v)));
  }, [filteredOptions, onSelectedValuesChange, selectedValues]);

  const toggleValue = useCallback(
    (value: string) => {
      if (selectedValues.includes(value)) {
        onSelectedValuesChange(selectedValues.filter((v) => v !== value));
        return;
      }
      if (maxSelections != null && selectedValues.length >= maxSelections) {
        onSelectedValuesChange([...selectedValues.slice(1), value]);
        return;
      }
      onSelectedValuesChange([...selectedValues, value]);
    },
    [maxSelections, onSelectedValuesChange, selectedValues],
  );

  const closeMenu = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  const toggleMenu = useCallback(() => {
    setOpen((v) => {
      if (v) {
        setQuery("");
      }
      return !v;
    });
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }
    const handlePointer = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    };
    document.addEventListener("mousedown", handlePointer);
    return () => document.removeEventListener("mousedown", handlePointer);
  }, [closeMenu, open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const fn = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        closeMenu();
      }
    };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [closeMenu, open]);

  const leverText = summaryLabel(placeholderWhenEmpty, selectedValues, options, pluralEntityLabel);

  const onTriggerKeyDown = useCallback((e: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      if (!disabled) {
        toggleMenu();
      }
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!disabled && !open) {
        setOpen(true);
      }
    }
  }, [disabled, open, toggleMenu]);

  const rootStyle: CSSProperties | undefined =
    maxInlineSize != null ? { width: "100%", maxWidth: maxInlineSize } : undefined;

  return (
    <div
      ref={rootRef}
      className={cx(fr.cx("fr-select-group"), styles.root, className)}
      style={rootStyle}
    >
      <label className={fr.cx("fr-label")} htmlFor={`${baseId}-trigger`}>
        {label}
        {hintText !== undefined ? (
          <span id={hintId} className={fr.cx("fr-hint-text")}>
            {hintText}
          </span>
        ) : null}
      </label>

      <button
        id={`${baseId}-trigger`}
        type="button"
        className={cx(fr.cx("fr-select"), styles.trigger)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-describedby={hintText !== undefined ? hintId : undefined}
        disabled={disabled}
        onClick={() => !disabled && toggleMenu()}
        onKeyDown={onTriggerKeyDown}
      >
        <span aria-live="polite">{leverText}</span>
      </button>

      {open ? (
        <div className={styles.panel} role="presentation">
          {bulkActionsVisible && options.length > 0 ? (
            <div className="fr-mb-1w">
              <ButtonsGroup
                className={styles.bulkActionsGroup}
                inlineLayoutWhen="always"
                alignment="left"
                buttonsSize="small"
                buttons={[
                  {
                    type: "button",
                    priority: "tertiary no outline",
                    disabled: filteredOptions.length === 0 || disabled,
                    onClick: selectAllFiltered,
                    children: "Tout sélectionner",
                  },
                  {
                    type: "button",
                    priority: "tertiary no outline",
                    disabled: filteredOptions.length === 0 || disabled,
                    onClick: deselectAllFiltered,
                    children: "Tout désélectionner",
                  },
                ]}
              />
            </div>
          ) : null}

          {searchable ? (
            <div className="fr-mb-2w">
              <Input
                label={searchLabel}
                hideLabel
                nativeInputProps={{
                  type: "search",
                  value: query,
                  placeholder: searchPlaceholder,
                  disabled,
                  autoComplete: "off",
                  "aria-label": searchLabel,
                  "aria-controls": listboxId,
                  onChange: (e) => setQuery(e.currentTarget.value),
                }}
              />
            </div>
          ) : null}

          <ul
            id={listboxId}
            role="listbox"
            aria-label={label}
            aria-multiselectable="true"
            className={styles.optionList}
          >
            {filteredOptions.length === 0 ? (
              <li className={styles.optionEmpty}>
                <span className="fr-text--sm fr-text-mention--grey">Aucun résultat.</span>
              </li>
            ) : (
              filteredOptions.map((o) => {
                const sel = selectedValues.includes(o.value);
                return (
                  <li key={o.value} className={styles.optionRow} role="option" aria-selected={sel}>
                    <Checkbox
                      small
                      disabled={disabled}
                      className={cx(
                        styles.optionCheckboxWrap,
                        sel ? styles.optionCheckboxChecked : undefined,
                      )}
                      options={[
                        {
                          label: o.label,
                          nativeInputProps: {
                            checked: sel,
                            onChange: () => {
                              toggleValue(o.value);
                            },
                          },
                        },
                      ]}
                    />
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
