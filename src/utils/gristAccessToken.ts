/**
 * Jeton REST court via plugin API (droits utilisateur Grist, pas de clé dans le bundle).
 * @see https://support.getgrist.com/code/modules/grist_plugin_api/#getaccesstoken
 */

export type GristAccessToken = {
  token: string;
  baseUrl: string;
  ttlMsecs: number;
};

export async function getGristAccessToken(readOnly = true): Promise<GristAccessToken> {
  const grist = window.grist;
  const getter = grist?.docApi?.getAccessToken ?? grist?.getAccessToken;
  if (!getter) {
    throw new Error("getAccessToken indisponible (widget hors Grist ou API trop ancienne).");
  }
  const result = await getter.call(grist?.docApi ?? grist, { readOnly });
  if (
    !result ||
    typeof result.token !== "string" ||
    typeof result.baseUrl !== "string" ||
    !result.token ||
    !result.baseUrl
  ) {
    throw new Error("Réponse getAccessToken invalide.");
  }
  return {
    token: result.token,
    baseUrl: result.baseUrl.replace(/\/$/, ""),
    ttlMsecs: typeof result.ttlMsecs === "number" ? result.ttlMsecs : 0,
  };
}

/** URL authentifiée `?auth=` pour un endpoint relatif au document. */
export function gristAuthedUrl(baseUrl: string, path: string, token: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${baseUrl}${normalizedPath}`);
  url.searchParams.set("auth", token);
  return url.toString();
}
