import CategoryChart from './CategoryChart'
import MonthlyTrendChart from './MonthlyTrendChart'
import { categoryBreakdown, monthlyTotals } from '../utils'

export default function InsightsTab({ monthExpenses, allExpenses }) {
  const total     = monthExpenses.reduce((s, e) => s + e.amount, 0)
  const breakdown = categoryBreakdown(monthExpenses)
  const trend     = monthlyTotals(allExpenses, 6)

  return (
    <>
      {breakdown.length > 0 ? (
        <CategoryChart data={breakdown} total={total} />
      ) : (
        <div style={card}>
          <div style={cardTitle}><i className="ti ti-chart-donut" /> Spending by category</div>
          <div style={empty}>No expenses this month yet</div>
        </div>
      )}
      <MonthlyTrendChart data={trend} />
    </>
  )
}

const card     = { background:'var(--surface)', border:'0.5px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'1.25rem', marginBottom:'1rem' }
const cardTitle= { fontSize:14, fontWeight:500, marginBottom:'1rem', display:'flex', alignItems:'center', gap:6 }
const empty    = { textAlign:'center', padding:'2rem 0', color:'var(--text2)', fontSize:13 }
