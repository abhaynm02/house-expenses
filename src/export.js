import { fmt } from './utils'

const HEADERS = ['Date', 'Category', 'Paid By', 'Amount', 'Split Between', 'Note', 'Settled']

function rows(expenses) {
  return expenses.map(e => [
    e.date, e.category, e.paidBy, e.amount, e.split.join(', '), e.note || '', e.is_settled ? 'Yes' : 'No',
  ])
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function downloadCSV(expenses, filename) {
  const escape = v => `"${String(v).replace(/"/g, '""')}"`
  const csv = [HEADERS, ...rows(expenses)].map(r => r.map(escape).join(',')).join('\r\n')
  triggerDownload(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), filename)
}

export async function downloadPDF(expenses, filename, title) {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ])
  const doc = new jsPDF()
  doc.setFontSize(14)
  doc.text(title, 14, 16)

  const total = expenses.reduce((s, e) => s + e.amount, 0)
  doc.setFontSize(10)
  doc.setTextColor(107, 107, 103)
  doc.text(`${expenses.length} expense${expenses.length !== 1 ? 's' : ''} · Total ${fmt(total)}`, 14, 22)

  autoTable(doc, {
    startY: 27,
    head: [HEADERS],
    body: rows(expenses).map(r => [r[0], r[1], r[2], fmt(r[3]), r[4], r[5], r[6]]),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [134, 59, 255] },
  })

  doc.save(filename)
}
