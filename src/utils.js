export const PALETTES = [
  { bg:'#E6F1FB', text:'#0C447C' },
  { bg:'#E1F5EE', text:'#085041' },
  { bg:'#FAECE7', text:'#712B13' },
  { bg:'#FBEAF0', text:'#72243E' },
  { bg:'#FAEEDA', text:'#633806' },
  { bg:'#EEEDFE', text:'#3C3489' },
  { bg:'#EAF3DE', text:'#27500A' },
  { bg:'#F1EFE8', text:'#444441' },
]

export const CATEGORIES = [
  '🛒 Groceries','💡 Utilities','🏠 Rent','🍳 Cooking gas',
  '🧹 Cleaning','📦 Household','🍕 Eating out','🚿 Water',
  '📶 Internet','🎉 Fun','🔧 Maintenance','💊 Medicine',
  '🛁 Toiletries','🌿 Other',
]

export function palette(members, name) {
  const i = members.indexOf(name) % PALETTES.length
  return PALETTES[Math.max(0, i)]
}

export const CHART_COLORS = [
  '#0C447C', '#085041', '#712B13', '#72243E', '#633806',
  '#3C3489', '#27500A', '#444441', '#1D9E75', '#B4530A',
  '#A23B5C', '#6B4EFF', '#0E7C86', '#185FA5',
]

export function categoryColor(category) {
  const i = CATEGORIES.indexOf(category)
  return CHART_COLORS[(i < 0 ? 0 : i) % CHART_COLORS.length]
}

export function categoryBreakdown(expenses) {
  const map = {}
  expenses.forEach(e => { map[e.category] = (map[e.category] || 0) + e.amount })
  const total = expenses.reduce((s, e) => s + e.amount, 0)
  return Object.entries(map)
    .map(([category, amount]) => ({ category, amount, pct: total ? amount / total * 100 : 0 }))
    .sort((a, b) => b.amount - a.amount)
}

export function formatDateTime(iso) {
  if (!iso) return null
  const d = new Date(iso)
  const sameYear = d.getFullYear() === new Date().getFullYear()
  return d.toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: sameYear ? undefined : 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

export function initials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export function fmt(n) {
  return '₹' + Math.round(n).toLocaleString('en-IN')
}

export function today() {
  return new Date().toISOString().slice(0, 10)
}

export function getMonths(expenses) {
  const set = new Set(expenses.map(e => e.date.slice(0, 7)))
  set.add(today().slice(0, 7))
  return [...set].sort().reverse()
}

export function filteredExpenses(expenses, month) {
  return expenses.filter(e => e.date.slice(0, 7) === month)
}

export function monthlyTotals(expenses, count = 6) {
  const now = new Date()
  const months = []
  for (let i = count - 1; i >= 0; i--) {
    months.push(new Date(now.getFullYear(), now.getMonth() - i, 1))
  }
  const sums = {}
  expenses.forEach(e => {
    const m = e.date.slice(0, 7)
    sums[m] = (sums[m] || 0) + e.amount
  })
  return months.map(d => {
    const key = d.toISOString().slice(0, 7)
    return { month: key, total: sums[key] || 0, label: d.toLocaleString('default', { month:'short' }) }
  })
}

export function computeBalances(members, expenses) {
  const bal = {}
  members.forEach(m => bal[m] = 0)
  // Only unsettled expenses count toward balances
  expenses.filter(e => !e.is_settled).forEach(e => {
    const share = e.amount / e.split.length
    e.split.forEach(p => { bal[p] = (bal[p] || 0) - share })
    bal[e.paidBy] = (bal[e.paidBy] || 0) + e.amount
  })
  return bal
}

export function computeSettlements(members, expenses) {
  const bal = computeBalances(members, expenses)
  const creditors = [], debtors = []
  Object.entries(bal).forEach(([p, b]) => {
    if (b > 0.5)  creditors.push({ p, b })
    if (b < -0.5) debtors.push({ p, b: -b })
  })
  creditors.sort((a, b) => b.b - a.b)
  debtors.sort((a, b) => b.b - a.b)
  const txs = []
  let ci = 0, di = 0
  while (ci < creditors.length && di < debtors.length) {
    const amt = Math.min(creditors[ci].b, debtors[di].b)
    txs.push({ from: debtors[di].p, to: creditors[ci].p, amount: amt })
    creditors[ci].b -= amt
    debtors[di].b  -= amt
    if (creditors[ci].b < 0.5) ci++
    if (debtors[di].b  < 0.5) di++
  }
  return txs
}
