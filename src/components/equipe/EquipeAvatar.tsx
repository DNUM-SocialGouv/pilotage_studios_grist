import { equipeAvatarUrl } from "../../utils/equipeAvatar";

type EquipeAvatarProps = {
  avatar?: string;
  memberId: number;
  /** Liste = petite ; fiche = plus grande. */
  size?: "sm" | "lg";
};

/**
 * Avatar Pixelbot décoratif (DiceBear) — seed Grist `Avatar` ou repli id.
 */
export function EquipeAvatar({ avatar, memberId, size = "sm" }: EquipeAvatarProps) {
  const src = equipeAvatarUrl(avatar, memberId);
  const className =
    size === "lg" ? "equipe-avatar equipe-avatar--lg" : "equipe-avatar equipe-avatar--sm";

  return (
    <img
      className={className}
      src={src}
      alt=""
      width={size === "lg" ? 64 : 32}
      height={size === "lg" ? 64 : 32}
      loading="lazy"
      decoding="async"
    />
  );
}
