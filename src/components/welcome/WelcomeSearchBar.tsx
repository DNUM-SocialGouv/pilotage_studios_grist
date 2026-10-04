import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import { SearchBar } from "@codegouvfr/react-dsfr/SearchBar";
import { useWelcomeSearchData } from "../../hooks/useWelcomeSearchData";
import {
  buildWelcomeSearchGroups,
  flattenWelcomeSearchHits,
  WELCOME_SEARCH_DEBOUNCE_MS,
  WELCOME_SEARCH_MIN_CHARS,
  welcomeSearchOptionId,
  welcomeSearchStatusMessage,
  type WelcomeSearchHit,
  type WelcomeSearchTargetFlags,
} from "../../utils/welcomeSearch";

export type WelcomeSearchBarProps = {
  targets: WelcomeSearchTargetFlags;
};

const GROUP_LABELS = {
  produits: "Produits",
  missions: "Missions",
  personnes: "Personnes",
} as const;

/**
 * Barre de recherche d’accueil (P1) : suggestions inline → fiche MemoryRouter.
 * Lazy fetch au premier focus ; combobox clavier (flèches / Entrée / Échap).
 */
export function WelcomeSearchBar({ targets }: WelcomeSearchBarProps) {
  const navigate = useNavigate();
  const reactId = useId();
  const listboxId = `${reactId}-listbox`;
  const statusId = `${reactId}-status`;
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [activated, setActivated] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const data = useWelcomeSearchData(activated, targets);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, WELCOME_SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [query]);

  const groups = buildWelcomeSearchGroups({
    query: debouncedQuery,
    targets,
    produits: data.produits,
    missions: data.missions,
    members: data.members,
  });
  const flatHits = flattenWelcomeSearchHits(groups);
  const trimmed = debouncedQuery.trim();
  const showPanel =
    open &&
    trimmed.length >= WELCOME_SEARCH_MIN_CHARS &&
    (data.status === "loading" ||
      data.status === "ok" ||
      data.status === "error");

  const statusMessage = welcomeSearchStatusMessage({
    query: debouncedQuery,
    loading: data.status === "loading",
    error: data.error,
    groups,
  });

  useEffect(() => {
    setActiveIndex(-1);
  }, [debouncedQuery, data.status]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointer = (e: globalThis.MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [open]);

  const goToHit = (hit: WelcomeSearchHit) => {
    setOpen(false);
    navigate(hit.href);
  };

  const onSelectIndex = (index: number) => {
    const hit = flatHits[index];
    if (hit) {
      goToHit(hit);
    }
  };

  const activate = () => {
    if (!activated) {
      setActivated(true);
    }
    setOpen(true);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      setActiveIndex(-1);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      activate();
      if (flatHits.length === 0) {
        return;
      }
      setOpen(true);
      setActiveIndex((i) => (i + 1) % flatHits.length);
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (flatHits.length === 0) {
        return;
      }
      setOpen(true);
      setActiveIndex((i) => (i <= 0 ? flatHits.length - 1 : i - 1));
      return;
    }

    if (e.key === "Enter") {
      if (!open || trimmed.length < WELCOME_SEARCH_MIN_CHARS) {
        return;
      }
      e.preventDefault();
      if (activeIndex >= 0) {
        onSelectIndex(activeIndex);
        return;
      }
      if (flatHits[0]) {
        goToHit(flatHits[0]);
      }
    }
  };

  const activeDescendant =
    activeIndex >= 0 && flatHits[activeIndex]
      ? welcomeSearchOptionId(flatHits[activeIndex]!)
      : undefined;

  const renderGroup = (
    key: keyof typeof GROUP_LABELS,
    hits: WelcomeSearchHit[],
    truncated: boolean,
    startIndex: number,
  ) => {
    if (hits.length === 0) {
      return null;
    }
    return (
      <div key={key} className="welcome-search__group">
        <p className="welcome-search__group-title fr-text--sm fr-mb-1v" id={`${listboxId}-${key}`}>
          {GROUP_LABELS[key]}
        </p>
        <ul
          className="welcome-search__options"
          role="group"
          aria-labelledby={`${listboxId}-${key}`}
        >
          {hits.map((hit, offset) => {
            const flatIndex = startIndex + offset;
            const selected = flatIndex === activeIndex;
            const optionId = welcomeSearchOptionId(hit);
            return (
              <li key={optionId} role="presentation">
                <button
                  type="button"
                  id={optionId}
                  role="option"
                  aria-selected={selected}
                  className={
                    selected
                      ? "welcome-search__option welcome-search__option--active"
                      : "welcome-search__option"
                  }
                  onMouseEnter={() => setActiveIndex(flatIndex)}
                  onClick={(e: MouseEvent<HTMLButtonElement>) => {
                    e.preventDefault();
                    goToHit(hit);
                  }}
                >
                  <span className="welcome-search__option-label">{hit.label}</span>
                  <span className="welcome-search__option-meta fr-text--xs fr-hint-text">
                    {hit.meta}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        {truncated ? (
          <p className="fr-text--xs fr-hint-text fr-mb-0 fr-mt-1v">…</p>
        ) : null}
      </div>
    );
  };

  const listLinks: { href: string; label: string; show: boolean }[] = [
    {
      href: "/produits",
      label: "Voir tous les produits",
      show: targets.produits && groups.produits.length > 0,
    },
    {
      href: "/missions",
      label: "Voir toutes les missions",
      show: targets.missions && groups.missions.length > 0,
    },
    {
      href: "/equipe",
      label: "Voir l’équipe",
      show: targets.equipe && groups.personnes.length > 0,
    },
  ];

  return (
    <div ref={rootRef} className="welcome-search fr-mb-3w">
      <SearchBar
        id={`${reactId}-search`}
        label="Rechercher un produit, une mission ou une personne"
        allowEmptySearch
        onButtonClick={(text) => {
          setQuery(text);
          activate();
          setOpen(true);
          if (text.trim().length >= WELCOME_SEARCH_MIN_CHARS && flatHits[0]) {
            // Après debounce les hits peuvent être obsolètes : naviguer au 1er match synchrone
            const immediate = buildWelcomeSearchGroups({
              query: text,
              targets,
              produits: data.produits,
              missions: data.missions,
              members: data.members,
            });
            const first = flattenWelcomeSearchHits(immediate)[0];
            if (first) {
              goToHit(first);
            }
          }
        }}
        renderInput={({ className, id, placeholder, type }) => (
          <input
            ref={inputRef}
            className={className}
            id={id}
            name={id}
            type={type}
            placeholder={placeholder}
            value={query}
            autoComplete="off"
            role="combobox"
            aria-expanded={showPanel}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={activeDescendant}
            aria-describedby={statusId}
            onFocus={activate}
            onChange={(e) => {
              setQuery(e.currentTarget.value);
              setOpen(true);
              activate();
            }}
            onKeyDown={onKeyDown}
          />
        )}
      />

      <p id={statusId} className="fr-sr-only" role="status" aria-live="polite">
        {statusMessage}
      </p>

      {showPanel ? (
        <div className="welcome-search__panel">
          {data.status === "loading" ? (
            <p className="fr-text--sm fr-mb-0" role="status">
              Chargement…
            </p>
          ) : null}

          {data.status === "error" && data.error ? (
            <p className="fr-text--sm fr-mb-0" role="alert">
              {data.error}
            </p>
          ) : null}

          {data.status === "ok" && groups.totalMatched === 0 ? (
            <p className="fr-text--sm fr-mb-0">
              Aucun produit, mission ou personne ne correspond
            </p>
          ) : null}

          {data.status === "ok" && groups.totalMatched > 0 ? (
            <>
              <div id={listboxId} role="listbox" aria-label="Suggestions de recherche">
                {targets.produits
                  ? renderGroup("produits", groups.produits, groups.truncated.produits, 0)
                  : null}
                {targets.missions
                  ? renderGroup(
                      "missions",
                      groups.missions,
                      groups.truncated.missions,
                      groups.produits.length,
                    )
                  : null}
                {targets.equipe
                  ? renderGroup(
                      "personnes",
                      groups.personnes,
                      groups.truncated.personnes,
                      groups.produits.length + groups.missions.length,
                    )
                  : null}
              </div>
              <ul className="welcome-search__list-links fr-mt-2w fr-mb-0">
                {listLinks
                  .filter((link) => link.show)
                  .map((link) => (
                    <li key={link.href}>
                      <a
                        className="fr-link fr-link--sm"
                        href={link.href}
                        onClick={(e) => {
                          e.preventDefault();
                          setOpen(false);
                          navigate(link.href);
                        }}
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
              </ul>
            </>
          ) : null}
        </div>
      ) : null}

      {query.trim().length > 0 &&
      query.trim().length < WELCOME_SEARCH_MIN_CHARS &&
      open ? (
        <p className="fr-text--xs fr-hint-text fr-mt-1w fr-mb-0" aria-hidden="true">
          Tapez au moins 2 lettres
        </p>
      ) : null}
    </div>
  );
}
