import { AVATAR_ICONS, GRADIENTS, type Avatar as AvatarData } from "@/lib/profile";

type Props = { avatar: AvatarData; name: string; size?: number; className?: string; rounded?: string };

/** Avatar d'un utilisateur : photo, initiale ou icône sur dégradé. */
export function Avatar({ avatar, name, size = 40, className = "", rounded = "rounded-xl" }: Props) {
  const style = { width: size, height: size };

  if (avatar.type === "photo") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatar.url}
        alt=""
        width={size}
        height={size}
        className={`shrink-0 object-cover ${rounded} ${className}`}
        style={style}
      />
    );
  }

  const g = GRADIENTS[avatar.gradient];
  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center font-black text-white ${rounded} ${className}`}
      style={{ ...style, backgroundImage: `linear-gradient(135deg, ${g.from}, ${g.to})`, fontSize: size * 0.42 }}
    >
      {avatar.type === "icon" ? (
        <svg
          width={size * 0.55}
          height={size * 0.55}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="drop-shadow"
        >
          <path d={AVATAR_ICONS[avatar.icon]} />
        </svg>
      ) : (
        <span className="drop-shadow">{name.trim().slice(0, 1).toUpperCase() || "?"}</span>
      )}
    </span>
  );
}
