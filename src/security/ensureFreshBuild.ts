/**
 * Si le HTML/JS en cache est plus vieux que dist/version.json, recharge l’iframe
 * avec ?b=<buildId> (URL Grist configurée reste stable).
 * No-op en DEV.
 */
export async function ensureFreshBuild(): Promise<void> {
  if (import.meta.env.DEV) {
    return;
  }

  const localId = typeof __BUILD_ID__ === "string" ? __BUILD_ID__ : "";
  if (!localId) {
    return;
  }

  let remoteId: string;
  try {
    const res = await fetch(`./version.json?t=${Date.now()}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      return;
    }
    const data = (await res.json()) as { buildId?: unknown };
    if (typeof data.buildId !== "string" || !data.buildId) {
      return;
    }
    remoteId = data.buildId;
  } catch {
    return;
  }

  if (remoteId === localId) {
    return;
  }

  const url = new URL(window.location.href);
  if (url.searchParams.get("b") === remoteId) {
    // JS encore stale alors que l’URL pointe déjà le bon b — éviter une boucle.
    console.warn(
      "[pilotage] buildId local obsolète malgré ?b= ; poursuite sans rechargement.",
    );
    return;
  }

  url.searchParams.set("b", remoteId);
  window.location.replace(url.href);
  // Ne résout jamais : la navigation annule le cycle courant.
  await new Promise<void>(() => {});
}
