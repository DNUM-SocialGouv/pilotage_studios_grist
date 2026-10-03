import { CallOut } from "@codegouvfr/react-dsfr/CallOut";

type GuideAdminCalloutProps = {
  children: React.ReactNode;
  title?: string;
};

/** Encadré pédagogique réservé aux précisions Admin (pas de secrets, pas de montants). */
export function GuideAdminCallout({
  children,
  title = "Pour les Admin",
}: GuideAdminCalloutProps) {
  return (
    <CallOut
      title={title}
      titleAs="h3"
      colorVariant="purple-glycine"
      className="fr-mt-3w"
      bodyAs="div"
    >
      {children}
    </CallOut>
  );
}
