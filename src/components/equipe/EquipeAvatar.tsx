import { useEffect, useState } from "react";
import { equipeAvatarUrl } from "../../utils/equipeAvatar";

type EquipeAvatarProps = {
  avatar?: string;
  memberId: number;
  /** Liste = sm ; menu nav = md ; fiche = lg. */
  size?: "sm" | "md" | "lg";
};

const AVATAR_PX = { sm: 32, md: 40, lg: 64 } as const;

/**
 * Avatar Glyphs décoratif (DiceBear) — seed Grist `Avatar` ou repli id.
 * Si l’image ne charge pas (CDN indisponible), affiche un placeholder gris.
 */
export function EquipeAvatar({ avatar, memberId, size = "sm" }: EquipeAvatarProps) {
  const [failed, setFailed] = useState(false);
  const className = `equipe-avatar equipe-avatar--${size}`;
  const px = AVATAR_PX[size];

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
