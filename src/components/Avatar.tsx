interface AvatarProps {
  member: { initials: string; color: string }
  size?: number
}

export function Avatar({ member, size = 38 }: AvatarProps) {
  return (
    <div className="ava" style={{ width: size, height: size, background: member.color, fontSize: size * 0.38 }}>
      {member.initials}
    </div>
  )
}
