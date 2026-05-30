import Avatar from './Avatar'
import { computeBalances, computeSettlements, fmt, palette } from '../utils'

function SpendingBreakdown({ members, expenses }) {
  const spent = {}
  members.forEach(m => spent[m] = 0)
  expenses.forEach(e => { spent[e.paidBy] = (spent[e.paidBy] || 0) + e.amount })

  const total  = expenses.reduce((s, e) => s + e.amount, 0)
  const maxAmt = Math.max(...Object.values(spent), 1)

  const catByPerson = {}
  members.forEach(m => catByPerson[m] = {})
  expenses.forEach(e => {
    const cat = e.category.split(' ').slice(1).join(' ')
    catByPerson[e.paidBy][cat] = (catByPerson[e.paidBy][cat] || 0) + e.amount
  })

  return (
    <div style={card}>
      <div style={cardTitle}><i className="ti ti-wallet" /> Spending per person</div>
      <p style={{ fontSize:12, color:'var(--text2)', marginBottom:14 }}>
        Total cash each person physically paid out this month
      </p>
      {members.map(m => {
        const amt  = spent[m] || 0
        const pct  = total > 0 ? (amt / total * 100) : 0
        const barW = maxAmt > 0 ? (amt / maxAmt * 100) : 0
        const p    = palette(members, m)
        const cats = Object.entries(catByPerson[m] || {}).sort((a, b) => b[1] - a[1]).slice(0, 2)
        return (
          <div key={m} style={{ padding:'12px 0', borderBottom:'0.5px solid var(--border)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
              <Avatar members={members} name={m} size={30} />
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
                  <span style={{ fontSize:13, fontWeight:500 }}>{m}</span>
                  <div>
                    <span style={{ fontSize:15, fontWeight:600 }}>{fmt(amt)}</span>
                    <span style={{ fontSize:11, color:'var(--text2)', marginLeft:5 }}>{pct.toFixed(0)}%</span>
                  </div>
                </div>
                <div style={{ marginTop:6, height:6, background:'var(--surface2)', borderRadius:3 }}>
                  <div style={{ width:`${barW.toFixed(1)}%`, height:6, background:p.text, borderRadius:3, transition:'width 0.4s ease' }} />
                </div>
              </div>
            </div>
            {cats.length > 0 && (
              <div style={{ display:'flex', gap:6, paddingLeft:40, flexWrap:'wrap' }}>
                {cats.map(([cat, val]) => (
                  <span key={cat} style={{ fontSize:11, padding:'2px 8px', background:p.bg, color:p.text, borderRadius:99 }}>
                    {cat} · {fmt(val)}
                  </span>
                ))}
              </div>
            )}
          </div>
        )
      })}
      {total > 0 && (
        <div style={{ marginTop:12, padding:'10px 12px', background:'var(--surface2)', borderRadius:'var(--radius)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:12, color:'var(--text2)' }}>House total this month</span>
          <span style={{ fontSize:15, fontWeight:600 }}>{fmt(total)}</span>
        </div>
      )}
    </div>
  )
}

export default function SettleTab({ members, expenses }) {
  const bal    = computeBalances(members, expenses)
  const txs    = computeSettlements(members, expenses)
  const maxAbs = Math.max(...Object.values(bal).map(Math.abs), 1)

  const settledCount = expenses.filter(e => e.is_settled).length

  return (
    <>
      <SpendingBreakdown members={members} expenses={expenses} />

      {settledCount > 0 && (
        <div style={{ padding:'10px 14px', marginBottom:'1rem', background:'#E1F5EE', border:'0.5px solid #b2e4cf', borderRadius:'var(--radius)', fontSize:12, color:'#085041', display:'flex', alignItems:'center', gap:6 }}>
          <i className="ti ti-circle-check" />
          {settledCount} expense{settledCount > 1 ? 's' : ''} marked as settled and excluded from balances below.
        </div>
      )}

      <div style={card}>
        <div style={cardTitle}><i className="ti ti-chart-bar" /> Who's owed what</div>
        <p style={{ fontSize:12, color:'var(--text2)', marginBottom:12 }}>
          Based on unsettled expenses only · Positive = others owe them
        </p>
        {members.map(m => {
          const b     = bal[m] || 0
          const isPos = b >= 0
          const pct   = Math.abs(b) / maxAbs * 100
          const color = isPos ? 'var(--green)' : 'var(--red)'
          return (
            <div key={m} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 0', borderBottom:'0.5px solid var(--border)' }}>
              <Avatar members={members} name={m} size={28} />
              <span style={{ fontSize:13, fontWeight:500, minWidth:60 }}>{m}</span>
              <div style={{ flex:1, height:4, background:'var(--border)', borderRadius:2 }}>
                <div style={{ width:`${pct.toFixed(1)}%`, height:4, background:color, borderRadius:2, transition:'width 0.4s ease' }} />
              </div>
              <span style={{ fontSize:13, fontWeight:600, minWidth:80, textAlign:'right', color }}>
                {isPos ? '+' : ''}{fmt(b)}
              </span>
            </div>
          )
        })}
      </div>

      <div style={card}>
        <div style={cardTitle}><i className="ti ti-arrows-exchange" /> Settlement plan</div>
        <p style={{ fontSize:12, color:'var(--text2)', marginBottom:12 }}>Minimum transactions to settle all debts</p>
        {txs.length === 0 ? (
          <div style={{ textAlign:'center', padding:'1rem 0', color:'var(--text2)', fontSize:13 }}>
            <i className="ti ti-circle-check" style={{ fontSize:28, display:'block', marginBottom:6, color:'var(--green)' }} />
            All settled up!
          </div>
        ) : txs.map((t, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 0', borderBottom: i < txs.length-1 ? '0.5px solid var(--border)' : 'none' }}>
            <div style={{ display:'flex', alignItems:'center', gap:7, fontSize:13 }}>
              <Avatar members={members} name={t.from} size={28} />
              <span>{t.from}</span>
              <i className="ti ti-arrow-right" style={{ color:'var(--text2)' }} />
              <Avatar members={members} name={t.to} size={28} />
              <span>{t.to}</span>
            </div>
            <span style={{ fontSize:14, fontWeight:600, color:'var(--blue)' }}>{fmt(t.amount)}</span>
          </div>
        ))}
      </div>
    </>
  )
}

const card     = { background:'var(--surface)', border:'0.5px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'1.25rem', marginBottom:'1rem' }
const cardTitle= { fontSize:14, fontWeight:500, marginBottom:'1rem', display:'flex', alignItems:'center', gap:6 }
