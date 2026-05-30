import Avatar from './Avatar'
import { fmt } from '../utils'

export default function HistoryTab({ members, expenses, onDelete, onSettle, isAdmin }) {
  const sorted = [...expenses].reverse()

  if (!sorted.length) return (
    <div style={card}>
      <div style={cardTitle}><i className="ti ti-list" /> All expenses</div>
      <div style={empty}>
        <i className="ti ti-receipt-off" style={{ fontSize:32, display:'block', marginBottom:8 }} />
        No expenses this month
      </div>
    </div>
  )

  return (
    <div style={card}>
      <div style={cardTitle}>
        <i className="ti ti-list" /> All expenses
        {isAdmin && (
          <span style={{ marginLeft:'auto', fontSize:11, color:'var(--text3)', fontWeight:400 }}>
            Admin: you can delete &amp; settle
          </span>
        )}
      </div>

      {sorted.map((e, idx) => (
        <div key={e.id} style={{
          padding:'10px 0',
          borderBottom: idx < sorted.length - 1 ? '0.5px solid var(--border)' : 'none',
          opacity: e.is_settled ? 0.55 : 1,
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <Avatar members={members} name={e.paidBy} />
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:500, display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                {e.is_settled && (
                  <span style={{
                    fontSize:10, padding:'1px 7px', borderRadius:99,
                    background:'var(--green)', color:'#fff', fontWeight:500,
                  }}>Settled</span>
                )}
                {e.category}
                {e.note && <span style={{ fontWeight:400, color:'var(--text2)' }}>– {e.note}</span>}
              </div>
              <div style={{ fontSize:11, color:'var(--text2)', marginTop:2 }}>
                {e.paidBy} · {e.date} · split {e.split.length} way{e.split.length !== 1 ? 's' : ''}
              </div>
            </div>
            <span style={{ fontSize:14, fontWeight:600, whiteSpace:'nowrap',
              textDecoration: e.is_settled ? 'line-through' : 'none', color: e.is_settled ? 'var(--text3)' : 'var(--text)' }}>
              {fmt(e.amount)}
            </span>

            {/* Admin-only actions */}
            {isAdmin && (
              <div style={{ display:'flex', gap:2 }}>
                {!e.is_settled && (
                  <button
                    title="Mark as settled"
                    onClick={() => window.confirm(`Mark this ₹${e.amount} expense as settled?`) && onSettle(e.id)}
                    style={iconBtn('#1D9E75')}>
                    <i className="ti ti-circle-check" />
                  </button>
                )}
                <button
                  title="Delete expense"
                  onClick={() => window.confirm('Permanently delete this expense?') && onDelete(e.id)}
                  style={iconBtn('var(--red)')}>
                  <i className="ti ti-trash" />
                </button>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Legend for non-admins */}
      {!isAdmin && (
        <div style={{ marginTop:12, padding:'8px 12px', background:'var(--surface2)', borderRadius:'var(--radius)', fontSize:11, color:'var(--text2)' }}>
          <i className="ti ti-info-circle" style={{ marginRight:4 }} />
          Only the house admin can delete or settle expenses.
        </div>
      )}
    </div>
  )
}

const iconBtn = (hoverColor) => ({
  border:'none', background:'none', cursor:'pointer',
  color:'var(--text3)', fontSize:16, padding:4,
  borderRadius:6, lineHeight:1, transition:'color 0.15s',
})

const card     = { background:'var(--surface)', border:'0.5px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'1.25rem', marginBottom:'1rem' }
const cardTitle= { fontSize:14, fontWeight:500, marginBottom:'1rem', display:'flex', alignItems:'center', gap:6 }
const empty    = { textAlign:'center', padding:'2rem 0', color:'var(--text2)', fontSize:13 }
