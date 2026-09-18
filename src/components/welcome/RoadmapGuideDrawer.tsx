import { useEffect, useId, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import {
  ROADMAP_STATUS_BADGE_CLASS,
  ROADMAP_STATUS_LABEL,
  type PublicRoadmapItem,
} from "../../content/publicRoadmap";

export type RoadmapGuideDrawerProps = {
  item: PublicRoadmapItem | null;
  onClose: () => void;
};

export function RoadmapGuideDrawer({ item, onClose }: RoadmapGuideDrawerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const navigate = useNavigate();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || item == null) {
      return;
    }
    if (!dialog.open) {
      dialog.showModal();
    }
  }, [item]);

  const close = () => {
    dialogRef.current?.close();
  };

  const goToPage = (path: string) => {
    navigate(path);
    close();
  };

  return (
    <dialog
      ref={dialogRef}
      className="pilotage-drawer-dialog pilotage-drawer-dialog--sm"
      aria-labelledby={titleId}
      onClose={onClose}
    >
      <div className="pilotage-drawer-dialog__shell">
        <div className="pilotage-drawer-dialog__scrim" aria-hidden="true" onClick={close} />
        <div className="pilotage-drawer-dialog__panel">
          <div className="pilotage-drawer-dialog__inner">
            <header className="fr-p-3w fr-pb-2w">
              <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--middle">
                <div className="fr-col">
                  <h2 id={titleId} className="fr-h5 fr-mb-0">
                    {item?.title ?? "Comment ça marche ?"}
                  </h2>
                  {item ? (
                    <p className="fr-text--sm fr-mb-0 fr-mt-1w">
                      <Badge small as="span" className={ROADMAP_STATUS_BADGE_CLASS[item.status]}>
                        {ROADMAP_STATUS_LABEL[item.status]}
                      </Badge>
                    </p>
                  ) : null}
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

            {item ? (
              <div className="pilotage-drawer-dialog__body roadmap-guide fr-px-3w fr-pb-3w fr-pt-0">
                <p className="roadmap-guide__lead fr-mb-3w">{item.guide.lead}</p>

                <h3 className="fr-h6">En pratique</h3>
                {item.guide.stepsIntro ? (
                  <p className="fr-text--sm fr-mb-1w">{item.guide.stepsIntro}</p>
                ) : null}
                <ul className="roadmap-guide__steps fr-mb-3w">
                  {item.guide.steps.map((step) => (
                    <li key={step}>
                      <span className="roadmap-guide__step">{step}</span>
                    </li>
                  ))}
                </ul>

                {item.guide.pagePath ? (
                  <p className="fr-mb-0">
                    <Link
                      className="fr-link"
                      to={item.guide.pagePath}
                      onClick={(e) => {
                        e.preventDefault();
                        const path = item.guide.pagePath;
                        if (path) {
                          goToPage(path);
                        }
                      }}
                    >
                      {item.guide.pageLinkLabel ?? "Ouvrir la page"}
                    </Link>
                  </p>
                ) : null}

                {item.issueUrl ? (
                  <p className="fr-mt-3w fr-mb-0">
                    <a
                      className="fr-link fr-link--sm"
                      href={item.issueUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Discuter sur GitHub
                      <span className="fr-sr-only"> (nouvelle fenêtre) — {item.title}</span>
                    </a>
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </dialog>
  );
}
