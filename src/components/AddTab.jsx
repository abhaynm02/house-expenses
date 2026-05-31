import { useState, useCallback, memo } from 'react'
import { CATEGORIES, fmt, today, palette } from '../utils'

// Defined OUTSIDE component so it never re-creates on render
const Field = ({ err, children }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
    {children}
    {err && <span style={{ fontSize:11, color:'var(--red)' }}>{err}</span>}
  </div>
)

const AddTab = memo(({ members, onAdd }) => {
  const [paidBy,   setPaidBy]   = useState(members[0] || '')
  const [amount,   setAmount]   = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [date,     setDate]     = useState(today())
  const [note,     setNote]     = useState('')
  const [split,    setSplit]    = useState(new Set(members))
  const [msg,      setMsg]      = useState(null)
  const [saving,   setSaving]   = useState(false)
  const [errors,   setErrors]   = useState({})

  const toggleSplit = useCallback(name => {
    setSplit(prev => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }, [])

  const validate = () => {
    const errs = {}
    const amt = parseFloat(amount)
    if (!amount || isNaN(amt) || amt <= 0) errs.amount = 'Enter a valid amount greater than 0'
    if (!paidBy)                           errs.paidBy = 'Select who paid'
    if (split.size === 0)                  errs.split  = 'Select at least one person to split with'
    if (!date)                             errs.date   = 'Select a date'
    if (date && date > today())            errs.date   = 'Date cannot be in the future'
    return errs
  }

  const handleAdd = async () => {
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setSaving(true)
    const err = await onAdd({
      paidBy,
      amount: parseFloat(amount),
      category,
      date,
      note: note.trim(),
      split: [...split],
    })
    setSaving(false)

    if (err) { setMsg({ ok:false, text: err }); return }
    setAmount('')
    setNote('')
    setDate(today())
    setMsg({ ok:true, text:`✓ ${fmt(parseFloat(amount))} added!` })
    setTimeout(() => setMsg(null), 2500)
  }

  if (members.length && !members.includes(paidBy)) setPaidBy(members[0])

  return (
    <div style={card}>
      <div style={cardTitle}><i className="ti ti-receipt" /> Log an expense</div>

      <div style={row}>
        <Field err={errors.paidBy}>
          <label style={lbl}>Paid by</label>
          <select value={paidBy}
            onChange={e => { setPaidBy(e.target.value); setErrors(p => ({...p, paidBy:''})) }}
            style={{ borderColor: errors.paidBy ? 'var(--red)' : '' }}>
            {members.map(m => <option key={m}>{m}</option>)}
          </select>
        </Field>

        <Field err={errors.amount}>
          <label style={lbl}>Amount (₹)</label>
          {/* 
            type="text" + inputMode="decimal" — shows numeric keyboard on mobile
            without the re-render/keyboard-close bug that type="number" causes
          */}
          <input
            type="text"
            inputMode="decimal"
            placeholder="0"
            value={amount}
            style={{ borderColor: errors.amount ? 'var(--red)' : '' }}
            onChange={e => {
              // Only allow digits and one decimal point
              const val = e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*?)\..*/g, '$1')
              setAmount(val)
              setErrors(p => ({...p, amount:''}))
            }}
          />
        </Field>
      </div>

      <div style={row}>
        <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
          <label style={lbl}>Category</label>
          <select value={category} onChange={e => setCategory(e.target.value)}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <Field err={errors.date}>
          <label style={lbl}>Date</label>
          <input type="date" value={date} max={today()}
            style={{ borderColor: errors.date ? 'var(--red)' : '' }}
            onChange={e => { setDate(e.target.value); setErrors(p => ({...p, date:''})) }} />
        </Field>
      </div>

      <div style={{ marginBottom:12 }}>
        <label style={lbl}>Note (optional)</label>
        <input
          type="text"
          placeholder="e.g. Big Bazaar weekly shop"
          value={note}
          onChange={e => setNote(e.target.value)}
        />
      </div>

      <div style={{ marginBottom:4 }}>
        <label style={lbl}>Split between</label>
        {errors.split && <span style={{ fontSize:11, color:'var(--red)', display:'block', marginTop:2 }}>{errors.split}</span>}
        <div style={{ display:'flex', flexWrap:'wrap', gap:7, marginTop:6 }}>
          {members.map(m => {
            const checked = split.has(m)
            const p = palette(members, m)
            return (
              <button key={m}
                onClick={() => { toggleSplit(m); setErrors(pr => ({...pr, split:''})) }}
                style={{
                  padding:'5px 12px', borderRadius:99, fontSize:13, cursor:'pointer',
                  border: checked ? 'none' : '0.5px solid var(--border2)',
                  background: checked ? p.bg : 'var(--surface2)',
                  color: checked ? p.text : 'var(--text2)',
                  fontWeight: checked ? 600 : 400, transition:'all 0.15s',
                }}>
                {m}
              </button>
            )
          })}
        </div>
      </div>

      <button onClick={handleAdd} disabled={saving} style={{
        width:'100%', padding:11,
        background: saving ? 'var(--surface2)' : 'var(--text)',
        color: saving ? 'var(--text2)' : 'var(--bg)',
        border:'none', borderRadius:'var(--radius)', fontSize:14, fontWeight:500,
        cursor: saving ? 'not-allowed' : 'pointer', marginTop:10,
        display:'flex', alignItems:'center', justifyContent:'center', gap:6,
      }}>
        {saving
          ? <><i className="ti ti-loader-2" style={{ animation:'spin 1s linear infinite' }} /> Saving...</>
          : <><i className="ti ti-plus" /> Add expense</>
        }
      </button>

      {msg && (
        <div style={{ fontSize:12, textAlign:'center', marginTop:8,
          color: msg.ok ? 'var(--green)' : 'var(--red)' }}>
          {msg.text}
        </div>
      )}
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
})

export default AddTab

const card     = { background:'var(--surface)', border:'0.5px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'1.25rem', marginBottom:'1rem' }
const cardTitle= { fontSize:14, fontWeight:500, marginBottom:'1rem', display:'flex', alignItems:'center', gap:6 }
const row      = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }
const lbl      = { fontSize:12, color:'var(--text2)' }