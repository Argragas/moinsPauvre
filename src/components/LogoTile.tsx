interface LogoTileProps {
  enseigne: { nom: string; mark: string; color: string; fg: string }
  size?: number
  radius?: number
}

export function LogoTile({ enseigne, size = 46, radius }: LogoTileProps) {
  const fs = size * (enseigne.mark.length > 1 ? 0.34 : 0.42)
  return (
    <div
      className="logo-tile"
      style={{
        width: size,
        height: size,
        background: enseigne.color,
        color: enseigne.fg,
        fontSize: fs,
        borderRadius: radius ?? size * 0.30,
      }}
    >
      {enseigne.mark}
    </div>
  )
}
