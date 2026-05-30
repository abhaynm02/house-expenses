import { palette, initials } from '../utils'

export default function Avatar({ members, name, size = 34 }) {
  const p = palette(members, name)
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: p.bg, color: p.text,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size < 30 ? 11 : 13, fontWeight: 600, flexShrink: 0,
    }}>
      {initials(name)}
    </div>
  )
}
