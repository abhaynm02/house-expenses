import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from './supabase'
import LoginScreen from './components/LoginScreen'
import AddTab      from './components/AddTab'
import HistoryTab  from './components/HistoryTab'
import SettleTab   from './components/SettleTab'
import MembersTab  from './components/MembersTab'
import Avatar      from './components/Avatar'
import { getMonths, filteredExpenses, fmt, today } from './utils'

const TABS = [
  { id:'add',     icon:'ti-plus',            label:'Add'      },
  { id:'history', icon:'ti-list',            label:'History'  },
  { id:'settle',  icon:'ti-arrows-exchange', label:'Settle up'},
  { id:'members', icon:'ti-users',           label:'Members'  },
]

const Spinner = ({ text }) => (
  <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12, color:'var(--text2)', fontSize:13 }}>
    <i className="ti ti-loader-2" style={{ fontSize:28, animation:'spin 1s linear infinite' }} />
    {text && <span>{text}</span>}
    <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
  </div>
)

export default function App() {
  const [session,  setSession]  = useState(undefined)  // undefined = still checking
  const [members,  setMembers]  = useState([])
  const [expenses, setExpenses] = useState([])
  const [tab,      setTab]      = useState('add')
  const [month,    setMonth]    = useState(today().slice(0, 7))
  const [loading,  setLoading]  = useState(false)

  // ── Auth ─────────────────────────────────────────────────────────────────
  // onAuthStateChange fires for EVERY session event including INITIAL_SESSION,
  // SIGNED_IN (after OTP verify), TOKEN_REFRESHED, SIGNED_OUT.
  // We use it as the single source of truth — no separate getSession() call needed.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event, session?.user?.email)
      setSession(session)   // null = logged out, object = logged in, undefined = still checking
    })
    return () => subscription.unsubscribe()
  }, [])

  // ── Load data whenever session becomes valid ──────────────────────────────
  const loadData = useCallback(async () => {
    if (!session) return
    setLoading(true)
    const [{ data: mData, error: mErr }, { data: eData, error: eErr }] = await Promise.all([
      supabase.from('members').select('*').order('created_at'),
      supabase.from('expenses').select('*').order('date'),
    ])
    if (mErr) console.error('members error:', mErr)
    if (eErr) console.error('expenses error:', eErr)
    if (mData) setMembers(mData)
    if (eData) setExpenses(eData.map(e => ({
      id:         e.id,
      paidBy:     e.paid_by,
      amount:     e.amount,
      category:   e.category  || '🌿 Other',
      date:       e.date      || new Date().toISOString().slice(0, 10),
      note:       e.note      || '',
      split:      e.split     || [],
      is_settled: e.is_settled || false,
      settled_at: e.settled_at,
      created_by: e.created_by,
      created_at: e.created_at,
    })))
    setLoading(false)
  }, [session])

  useEffect(() => { loadData() }, [loadData])

  // ── Real-time sync ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!session) return
    const channel = supabase.channel('realtime-all')
      .on('postgres_changes', { event:'*', schema:'public', table:'expenses' }, loadData)
      .on('postgres_changes', { event:'*', schema:'public', table:'members'  }, loadData)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [session, loadData])

  // ── Admin check ───────────────────────────────────────────────────────────
  const currentMember = useMemo(() =>
    members.find(m => m.email === session?.user?.email),
  [members, session])
  const isAdmin = currentMember?.is_admin === true

  // ── Derived data ──────────────────────────────────────────────────────────
  const months  = useMemo(() => getMonths(expenses), [expenses])
  const visible = useMemo(() => filteredExpenses(expenses, month), [expenses, month])

  useEffect(() => {
    if (months.length && !months.includes(month)) setMonth(months[0])
  }, [months])

  const memberNames = useMemo(() => members.map(m => m.name), [members])

  // ── Mutations ─────────────────────────────────────────────────────────────
  const addExpense = async (exp) => {
    const { error } = await supabase.from('expenses').insert({
      paid_by:    exp.paidBy,
      amount:     exp.amount,
      category:   exp.category,
      date:       exp.date,
      note:       exp.note,
      split:      exp.split,
      is_settled: false,
      created_by: session.user.id,
    })
    if (error) return error.message
    setMonth(exp.date.slice(0, 7))
    return null
  }

  const deleteExpense = async (id) => {
    const { error } = await supabase.from('expenses').delete().eq('id', id)
    if (error) console.error('delete error:', error)
  }

  const settleExpense = async (id) => {
    const { error } = await supabase.from('expenses').update({
      is_settled: true,
      settled_at: new Date().toISOString(),
    }).eq('id', id)
    if (error) console.error('settle error:', error)
  }

  const addMember = async ({ name, email }) => {
    const { error } = await supabase.from('members').insert({ name, email, is_admin: false })
    if (error) return error.message
    return null
  }

  const removeMember = async (i) => {
    const m = members[i]
    const { error } = await supabase.from('members').delete().eq('id', m.id)
    if (error) console.error('remove member error:', error)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  // ── Metrics ───────────────────────────────────────────────────────────────
  const total   = visible.reduce((s, e) => s + e.amount, 0)
  const perHead = members.length ? total / members.length : 0

  // ── Render states ─────────────────────────────────────────────────────────

  // Still waiting for Supabase to tell us if there's a session
  if (session === undefined) return <Spinner />

  // No session — show login
  if (!session) return <LoginScreen />

  // Session exists but data still loading
  if (loading && members.length === 0) return <Spinner text="Loading house data..." />

  // ── Main app ──────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth:520, margin:'0 auto', padding:'1.5rem 1rem 4rem' }}>

      {/* Top bar */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'1.25rem' }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:600, letterSpacing:'-0.3px' }}>House expenses</h1>
          <p style={{ fontSize:13, color:'var(--text2)', marginTop:2, display:'flex', alignItems:'center', gap:5 }}>
            {currentMember ? (
              <>
                <Avatar members={memberNames} name={currentMember.name} size={18} />
                {currentMember.name}
                {isAdmin && (
                  <span style={{ fontSize:10, padding:'1px 6px', borderRadius:99, background:'var(--surface2)', border:'0.5px solid var(--border2)', color:'var(--text2)' }}>
                    Admin
                  </span>
                )}
              </>
            ) : (
              <span style={{ color:'var(--red)', fontSize:12 }}>
                ⚠️ Your email is not in the members list
              </span>
            )}
          </p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ display:'flex', alignItems:'center', gap:5 }}>
            <span style={{ fontSize:12, color:'var(--text2)' }}>Month</span>
            <select value={month} onChange={e => setMonth(e.target.value)}
              style={{ fontSize:13, padding:'6px 10px', width:'auto' }}>
              {months.map(m => {
                const [y, mo] = m.split('-')
                const label = new Date(+y, +mo - 1).toLocaleString('default', { month:'short', year:'numeric' })
                return <option key={m} value={m}>{label}</option>
              })}
            </select>
          </div>
          <button onClick={handleSignOut} title="Sign out" style={{
            border:'0.5px solid var(--border2)', background:'var(--surface2)',
            color:'var(--text2)', borderRadius:'var(--radius)', padding:'6px 8px',
            fontSize:14, cursor:'pointer',
          }}>
            <i className="ti ti-logout" />
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:'1.25rem' }}>
        {[
          { label:'Total spent',  value: fmt(total)   },
          { label:'Per person',   value: fmt(perHead), sub: `${members.length} member${members.length !== 1 ? 's' : ''}` },
          { label:'Expenses',     value: visible.length, sub: `${visible.filter(e => e.is_settled).length} settled` },
        ].map(({ label, value, sub }) => (
          <div key={label} style={{ background:'var(--surface)', border:'0.5px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'12px 14px' }}>
            <div style={{ fontSize:11, color:'var(--text2)', marginBottom:4 }}>{label}</div>
            <div style={{ fontSize:20, fontWeight:600, letterSpacing:'-0.5px' }}>{value}</div>
            {sub && <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>{sub}</div>}
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, background:'var(--surface2)', borderRadius:'var(--radius-lg)', padding:4, marginBottom:'1.25rem' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex:1, padding:'8px 4px', borderRadius:'var(--radius)',
            fontSize:13, cursor:'pointer',
            border: tab === t.id ? '0.5px solid var(--border)' : 'none',
            background: tab === t.id ? 'var(--surface)' : 'transparent',
            color: tab === t.id ? 'var(--text)' : 'var(--text2)',
            fontWeight: tab === t.id ? 500 : 400,
            display:'flex', alignItems:'center', justifyContent:'center', gap:4,
            transition:'all 0.15s',
          }}>
            <i className={`ti ${t.icon}`} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'add'     && <AddTab     members={memberNames} onAdd={addExpense} />}
      {tab === 'history' && <HistoryTab members={memberNames} expenses={visible}
                              onDelete={deleteExpense} onSettle={settleExpense} isAdmin={isAdmin} />}
      {tab === 'settle'  && <SettleTab  members={memberNames} expenses={visible} />}
      {tab === 'members' && <MembersTab members={members} expenses={expenses}
                              isAdmin={isAdmin} onAdd={addMember} onRemove={removeMember} />}

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}