import { useState } from "react";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import Factory from "@codegouvfr/react-dsfr/picto/Factory";
import { RoadmapGuideDrawer } from "../components/welcome/RoadmapGuideDrawer";
import {
  groupPublicRoadmapByKanban,
  PUBLIC_ROADMAP_CTA,
  PUBLIC_ROADMAP_INTRO,
  PUBLIC_ROADMAP_THEMES,
  ROADMAP_STATUS_BADGE_CLASS,
  ROADMAP_STATUS_LABEL,
  type PublicRoadmapItem,
} from "../content/publicRoadmap";

function themeLabel(themeId: PublicRoadmapItem["themeId"]): string {
  return PUBLIC_ROADMAP_THEMES.find((t) => t.id === themeId)?.label ?? themeId;
}

export function WelcomePage() {
  const kanbanGroups = groupPublicRoadmapByKanban();
  const [guideItem, setGuideItem] = useState<PublicRoadmapItem | null>(null);

  return (
    <div className="welcome-page">
      <div className="welcome-page__panel">
        <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--middle">
          <div className="fr-col-12 fr-col-sm-7">
            <h1 className="fr-h3">Pilotage studios</h1>
          </div>
          <div className="fr-col-12 fr-col-sm-5">
            <div className="welcome-artwork" aria-hidden="true">
              <Factory fontSize="7rem" color="blue-ecume" />
            </div>
          </div>
        </div>

        <section className="welcome-roadmap fr-mt-3w" aria-labelledby="welcome-roadmap-title">
          <h2 id="welcome-roadmap-title" className="fr-h5">
            Feuille de route
          </h2>
          <p className="fr-text--sm fr-mb-2w">{PUBLIC_ROADMAP_INTRO}</p>
          <p className="fr-text--sm fr-mb-2w">{PUBLIC_ROADMAP_CTA}</p>

          <div className="welcome-kanban fr-grid-row fr-grid-row--gutters">
            {kanbanGroups.map((group) => (
              <section
                key={group.column.id}
                className="welcome-kanban__column fr-col-12 fr-col-md-4"
                aria-labelledby={`welcome-kanban-${group.column.id}`}
              >
                <div className="welcome-kanban__column-head">
                  <h3
                    id={`welcome-kanban-${group.column.id}`}
                    className="fr-h6 welcome-kanban__column-title"
                  >
                    {group.column.label}
                  </h3>
                  <Badge
                    small
                    as="span"
                    aria-label={`${group.column.label} : ${group.items.length} élément${group.items.length === 1 ? "" : "s"}`}
                  >
                    {group.items.length}
                  </Badge>
                </div>
                <ul className="welcome-kanban__list fr-mb-0">
                  {group.items.map((item) => (
                    <li key={item.id} className="welcome-kanban__card">
                      <div className="welcome-roadmap__item-head">
                        <span className="welcome-roadmap__title">{item.title}</span>{" "}
                        <Badge
                          small
                          as="span"
                          className={ROADMAP_STATUS_BADGE_CLASS[item.status]}
                        >
                          {ROADMAP_STATUS_LABEL[item.status]}
                        </Badge>
                      </div>
                      <p className="fr-text--xs fr-mb-1w fr-hint-text">
                        {themeLabel(item.themeId)}
                      </p>
                      <p className="fr-text--sm fr-mb-1w">{item.summary}</p>
                      <div className="welcome-roadmap__item-actions">
                        <button
                          type="button"
                          className="fr-link fr-link--sm"
                          onClick={() => setGuideItem(item)}
                        >
                          Comment ça marche ?
                          <span className="fr-sr-only"> — {item.title}</span>
                        </button>
                        {item.issueUrl ? (
                          <a
                            className="fr-link fr-link--sm"
                            href={item.issueUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Discuter sur GitHub
                            <span className="fr-sr-only">
                              {" "}
                              (nouvelle fenêtre) — {item.title}
                            </span>
                          </a>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </section>
      </div>

      <RoadmapGuideDrawer item={guideItem} onClose={() => setGuideItem(null)} />
    </div>
  );
}
