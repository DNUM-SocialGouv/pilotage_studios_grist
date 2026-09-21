/**
 * URL d’avatar Glyphs (DiceBear HTTP API).
 * Seed = colonne Grist `Avatar`, sinon repli stable `equipe-{id}`.
 */
export function equipeAvatarSeed(avatar: string | undefined, memberId: number): string {
  const trimmed = avatar?.trim();
  if (trimmed) return trimmed;
  return `equipe-${memberId}`;
}

export function equipeAvatarUrl(avatar: string | undefined, memberId: number): string {
  const seed = equipeAvatarSeed(avatar, memberId);
  return `https://api.dicebear.com/10.x/glyphs/svg?seed=${encodeURIComponent(seed)}`;
}
