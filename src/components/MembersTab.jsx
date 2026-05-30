import { useState } from 'react'
import Avatar from './Avatar'

export default function MembersTab({ members, expenses, isAdmin, onAdd, onRemove }) {
  const [name,    setName]    = useState('')
  const [email,   setEmail]   = useState('')
  const [errors,  setErrors]  = useState({})
  const [saving,  setSaving]  = useState(false)
  const [msg,     setMsg]     = useState(null)

  const validate = () => {
    const errs = {}
    if (!name.trim())  errs.name  = 'Name is required'
    if (!email.trim()) errs.email = 'Email is required'
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Enter a valid email'
    if (members.find(m => m.name.toLowerCase() === name.trim().toLowerCase())) errs.name = 'This name already exists'
    if (members.find(m => m.email?.toLowerCase() === email.trim().toLowerCase())) errs.email = 'This email already exists'
    return errs
  }

  const handleAdd = async () => {
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length) return
    setSaving(true)
    const err = await onAdd({ name: name.trim(), email: email.trim().toLowerCase() })
    setSaving(false)
    if (err) { setMsg({ ok:false, text: err }); return }
    setName(''); setEmail('')
    setMsg({ ok:true, text:`✓ ${name.trim()} added! Invite them via Supabase → Auth → Invite user.` })
    setTimeout(() => setMsg(null), 5000)
  }

  const handleRemove = async (m, i) => {
    const hasExp = expenses.some(e => e.paidBy === m.name || e.split.includes(m.name))
    if (hasExp && !window.confirm(`${m.name} has expenses recorded. Remove anyway?`)) return
    await onRemove(i)
  }

  return (
    <div style={card}>
      <div style={cardTitle}><i className="ti ti-users" /> Housemates</div>

      {members.map((m, i) => (
        <div key={m.id || m.name} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderBottom:'0.5px solid var(--border)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <Avatar members={members.map(x => x.name)} name={m.name} />
            <div>
              <div style={{ fontSize:14, fontWeight:500, display:'flex', alignItems:'center', gap:6 }}>
                {m.name}
                {m.is_admin && (
                  <span style={{ fontSize:10, padding:'1px 7px', borderRadius:99, background:'var(--surface2)', border:'0.5px solid var(--border2)', color:'var(--text2)' }}>
                    Admin
                  </span>
                )}
              </div>
              {m.email && <div style={{ fontSize:11, color:'var(--text3)', marginTop:1 }}>{m.email}</div>}
            </div>
          </div>
          {isAdmin && !m.is_admin && (
            <button onClick={() => handleRemove(m, i)} style={{ border:'none', background:'none', cursor:'pointer', color:'var(--text3)', fontSize:16, padding:4, borderRadius:6 }}>
              <i className="ti ti-x" />
            </button>
          )}
        </div>
      ))}

      {/* Add member — admin only */}
      {isAdmin ? (
        <div style={{ marginTop:16 }}>
          <div style={{ fontSize:12, fontWeight:500, color:'var(--text2)', marginBottom:10 }}>
            <i className="ti ti-user-plus" style={{ marginRight:4 }} />
            Add new housemate
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            <div>
              <input type="text" placeholder="Full name"
                value={name}
                onChange={e => { setName(e.target.value); setErrors(p => ({...p, name:''})) }}
                style={{ borderColor: errors.name ? 'var(--red)' : '' }}
              />
              {errors.name && <span style={{ fontSize:11, color:'var(--red)', display:'block', marginTop:3 }}>{errors.name}</span>}
            </div>
            <div>
              <input type="text" placeholder="Email address (e.g. priya@gmail.com)"
                value={email}
                onChange={e => { setEmail(e.target.value); setErrors(p => ({...p, email:''})) }}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                style={{ borderColor: errors.email ? 'var(--red)' : '' }}
              />
              {errors.email && <span style={{ fontSize:11, color:'var(--red)', display:'block', marginTop:3 }}>{errors.email}</span>}
            </div>
            <button onClick={handleAdd} disabled={saving} style={{
              padding:'9px 16px', border:'none', borderRadius:'var(--radius)',
              background: saving ? 'var(--surface2)' : 'var(--text)',
              color: saving ? 'var(--text2)' : 'var(--bg)',
              fontSize:13, cursor: saving ? 'not-allowed' : 'pointer',
              display:'flex', alignItems:'center', justifyContent:'center', gap:6,
            }}>
              {saving
                ? <><i className="ti ti-loader-2" style={{ animation:'spin 1s linear infinite' }} /> Adding...</>
                : <><i className="ti ti-user-plus" /> Add housemate</>
              }
            </button>
            {msg && (
              <div style={{ fontSize:12, color: msg.ok ? 'var(--green)' : 'var(--red)', lineHeight:1.5 }}>{msg.text}</div>
            )}
            <div style={{ fontSize:11, color:'var(--text3)', lineHeight:1.6, padding:'8px 10px', background:'var(--surface2)', borderRadius:'var(--radius)' }}>
              <i className="ti ti-info-circle" style={{ marginRight:4 }} />
              After adding, go to <strong>Supabase → Authentication → Users → Invite user</strong> with their email so they can sign in.
            </div>
          </div>
        </div>
      ) : (
        <div style={{ marginTop:12, padding:'8px 12px', background:'var(--surface2)', borderRadius:'var(--radius)', fontSize:11, color:'var(--text2)' }}>
          <i className="ti ti-info-circle" style={{ marginRight:4 }} />
          Only the house admin can add or remove members.
        </div>
      )}
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

const card     = { background:'var(--surface)', border:'0.5px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'1.25rem', marginBottom:'1rem' }
const cardTitle= { fontSize:14, fontWeight:500, marginBottom:'1rem', display:'flex', alignItems:'center', gap:6 }
