import { fmt } from '../utils'

export default function MonthlyTrendChart({ data }) {
  const max = Math.max(...data.map(d => d.total), 1)

  return (
    <div style={card}>
      <div style={cardTitle}><i className="ti ti-chart-bar" /> Last {data.length} months</div>
      <div style={{ display:'flex', alignItems:'stretch', gap:10, height:130 }}>
        {data.map(d => {
          const h = d.total > 0 ? Math.max((d.total / max) * 100, 4) : 2
          return (
            <div key={d.month} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-end', gap:6 }}>
              <span style={{ fontSize:10, color:'var(--text2)', whiteSpace:'nowrap' }}>
                {d.total > 0 ? fmt(d.total) : ''}
              </span>
              <div style={{
                width:'100%', maxWidth:34, height:`${h}%`,
                background: 'var(--blue)', borderRadius:'6px 6px 3px 3px',
                transition:'height 0.4s ease',
              }} />
            </div>
          )
        })}
      </div>
      <div style={{ display:'flex', gap:10, marginTop:8 }}>
        {data.map(d => (
          <span key={d.month} style={{ flex:1, textAlign:'center', fontSize:11, color:'var(--text2)' }}>{d.label}</span>
        ))}
      </div>
    </div>
  )
}

const card     = { background:'var(--surface)', border:'0.5px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'1.25rem', marginBottom:'1rem' }
const cardTitle= { fontSize:14, fontWeight:500, marginBottom:'1rem', display:'flex', alignItems:'center', gap:6 }
