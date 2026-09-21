import { useEffect, useState } from "react";
import { equipeAvatarUrl } from "../../utils/equipeAvatar";

type EquipeAvatarProps = {
  avatar?: string;
  memberId: number;
  /** Liste = petite ; fiche = plus grande. */
  size?: "sm" | "lg";
};

/**
 * Avatar Glyphs décoratif (DiceBear) — seed Grist `Avatar` ou repli id.
 * Si l’image ne charge pas (CDN indisponible), affiche un placeholder gris.
 */
export function EquipeAvatar({ avatar, memberId, size = "sm" }: EquipeAvatarProps) {
  const [failed, setFailed] = useState(false);
  const className =
    size === "lg" ? "equipe-avatar equipe-avatar--lg" : "equipe-avatar equipe-avatar--sm";
  const px = size === "lg" ? 64 : 32;

  useEffect(() => {
    setFailed(false);
  }, [avatar, memberId]);

  if (failed) {
    return <span className={`${className} equipe-avatar--placeholder`} aria-hidden="true" />;
  }

  return (
    <img
      className={className}
      src={equipeAvatarUrl(avatar, memberId)}
      alt=""
      width={px}
      height={px}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
