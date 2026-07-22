import { fmt, categoryColor } from '../utils'

export default function CategoryChart({ data, total }) {
  if (!data.length) return null

  let acc = 0
  const stops = data.map(d => {
    const start = acc
    acc += d.pct
    return `${categoryColor(d.category)} ${start}% ${acc}%`
  }).join(', ')

  return (
    <div style={card}>
      <div style={cardTitle}><i className="ti ti-chart-donut" /> Spending by category</div>
      <div style={{ display:'flex', alignItems:'center', gap:20, flexWrap:'wrap' }}>
        <div style={{ position:'relative', width:120, height:120, flexShrink:0 }}>
          <div style={{ width:'100%', height:'100%', borderRadius:'50%', background:`conic-gradient(${stops})` }} />
          <div style={{
            position:'absolute', inset:14, borderRadius:'50%', background:'var(--surface)',
            display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
          }}>
            <span style={{ fontSize:15, fontWeight:600, letterSpacing:'-0.3px' }}>{fmt(total)}</span>
            <span style={{ fontSize:10, color:'var(--text2)' }}>total</span>
          </div>
        </div>
        <div style={{ flex:1, minWidth:170, display:'flex', flexDirection:'column', gap:8 }}>
          {data.map(d => (
            <div key={d.category} style={{ display:'flex', alignItems:'center', gap:8, fontSize:12 }}>
              <span style={{ width:9, height:9, borderRadius:'50%', background:categoryColor(d.category), flexShrink:0 }} />
              <span style={{ flex:1, color:'var(--text2)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d.category}</span>
              <span style={{ fontWeight:600, whiteSpace:'nowrap' }}>{fmt(d.amount)}</span>
              <span style={{ color:'var(--text3)', minWidth:32, textAlign:'right' }}>{d.pct.toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const card     = { background:'var(--surface)', border:'0.5px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'1.25rem', marginBottom:'1rem' }
const cardTitle= { fontSize:14, fontWeight:500, marginBottom:'1rem', display:'flex', alignItems:'center', gap:6 }
