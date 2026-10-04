import { useAclProfil } from "../AclProfilContext";
import { WelcomeRoleHome } from "../components/welcome/WelcomeRoleHome";
import {
  buildWelcomeHome,
  welcomeAccessFromSession,
} from "../utils/welcomeHomeByRole";

export function WelcomePage() {
  const {
    status: aclStatus,
    role,
    flags,
    equipeLabel,
    displayName,
  } = useAclProfil();

  const homeLoading = aclStatus === "loading";
  const homeContent = homeLoading
    ? null
    : buildWelcomeHome({
        role,
        status: aclStatus,
        equipeLabel,
        displayName,
        access: welcomeAccessFromSession({
          role,
          status: aclStatus,
          flags,
          equipeLabel,
          includeFeuilleDeRoute: true,
        }),
      });

  return (
    <div className="welcome-page">
      <div className="welcome-page__panel welcome-page__panel--wide">
        {homeLoading || !homeContent ? (
          <WelcomeRoleHome
            content={{
              kind: "unknown",
              title: "Bonjour",
              roleLabel: null,
              lead: null,
              hint: null,
              ctas: [],
            }}
            loading
          />
        ) : (
          <WelcomeRoleHome
            content={homeContent}
            searchTargets={{
              produits: flags.Page_produits,
              missions: flags.Page_missions,
              equipe: flags.Page_equipe,
            }}
          />
        )}
      </div>
    </div>
  );
}
