import { useState } from 'react'
import { supabase } from '../supabase'

export default function LoginScreen() {
  const [email,   setEmail]   = useState('')
  const [otp,     setOtp]     = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState('')
  const [verifying, setVerifying] = useState(false)

  // Step 1 — send the 6-digit OTP code to email
  const handleSend = async () => {
    const trimmed = email.trim().toLowerCase()
    if (!trimmed) { setError('Please enter your email.'); return }
    setLoading(true); setError('')
    const { error: err } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: {
        shouldCreateUser: false, // only allow existing invited users
        // NOTE: do NOT set emailRedirectTo here — that switches Supabase
        // from sending a 6-digit OTP code to sending a magic link instead
      },
    })
    setLoading(false)
    if (err) { setError(err.message); return }
    setSent(true)
  }

  // Step 2 — verify the Login code they received
  const handleVerify = async () => {
    const code = otp.trim()
    if (code.length < 6 || code.length > 8) { setError('Enter the code from your email.'); return }
    setVerifying(true); setError('')
    const { error: err } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: code,
      type: 'email',
    })
    setVerifying(false)
    if (err) { setError('Invalid or expired code. Request a new one.'); return }
    // Success — App.jsx will detect the new session automatically
  }

  const handleResend = () => {
    setSent(false)
    setOtp('')
    setError('')
  }

  return (
    <div style={{
      minHeight:'100vh', display:'flex', alignItems:'center',
      justifyContent:'center', padding:'1rem', background:'var(--bg)',
    }}>
      <div style={{
        background:'var(--surface)', border:'0.5px solid var(--border)',
        borderRadius:'var(--radius-lg)', padding:'2rem',
        width:'100%', maxWidth:380,
      }}>

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:'2rem' }}>
          <div style={{
            width:52, height:52, borderRadius:14, background:'var(--surface2)',
            display:'flex', alignItems:'center', justifyContent:'center',
            margin:'0 auto 1rem', fontSize:26, border:'0.5px solid var(--border)',
          }}>🏠</div>
          <h1 style={{ fontSize:20, fontWeight:600, letterSpacing:'-0.3px' }}>House expenses</h1>
          <p style={{ fontSize:13, color:'var(--text2)', marginTop:4 }}>
            Sign in to access your shared house account
          </p>
        </div>

        {!sent ? (
          /* ── Step 1: Enter email ── */
          <>
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:12, color:'var(--text2)', display:'block', marginBottom:5 }}>
                Your email address
              </label>
              <input type="text" placeholder="you@gmail.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                autoFocus
              />
            </div>

            {error && <p style={{ fontSize:12, color:'var(--red)', marginBottom:10 }}>{error}</p>}

            <button onClick={handleSend} disabled={loading} style={btnStyle(loading)}>
              {loading
                ? <><i className="ti ti-loader-2" style={{ animation:'spin 1s linear infinite' }} /> Sending...</>
                : <><i className="ti ti-send" /> Send login code</>
              }
            </button>

            <p style={{ fontSize:11, color:'var(--text3)', textAlign:'center', marginTop:14, lineHeight:1.6 }}>
              Only invited housemates can sign in.<br />
              We'll send a Login code to your email.
            </p>
          </>
        ) : (
          /* ── Step 2: Enter OTP code ── */
          <>
            <div style={{ textAlign:'center', marginBottom:'1.25rem' }}>
              <div style={{ fontSize:36, marginBottom:8 }}>📨</div>
              <p style={{ fontSize:14, fontWeight:500, marginBottom:4 }}>Enter your login code</p>
              <p style={{ fontSize:12, color:'var(--text2)', lineHeight:1.6 }}>
                We sent a Login code to<br /><strong>{email}</strong>
              </p>
            </div>

            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:12, color:'var(--text2)', display:'block', marginBottom:5 }}>
                Login code
              </label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="01763417"
                maxLength={8}
                value={otp}
                onChange={e => { setOtp(e.target.value.replace(/\D/g, '')); setError('') }}
                onKeyDown={e => e.key === 'Enter' && handleVerify()}
                autoFocus
                style={{ letterSpacing:'0.25em', fontSize:20, textAlign:'center' }}
              />
            </div>

            {error && <p style={{ fontSize:12, color:'var(--red)', marginBottom:10 }}>{error}</p>}

            <button onClick={handleVerify} disabled={verifying} style={btnStyle(verifying)}>
              {verifying
                ? <><i className="ti ti-loader-2" style={{ animation:'spin 1s linear infinite' }} /> Verifying...</>
                : <><i className="ti ti-login" /> Sign in</>
              }
            </button>

            <div style={{ display:'flex', justifyContent:'center', marginTop:14, gap:4 }}>
              <span style={{ fontSize:12, color:'var(--text3)' }}>Didn't get it?</span>
              <button onClick={handleResend} style={{ fontSize:12, color:'var(--text2)', background:'none', border:'none', cursor:'pointer', textDecoration:'underline', padding:0 }}>
                Send a new code
              </button>
            </div>
          </>
        )}
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

const btnStyle = (disabled) => ({
  width:'100%', padding:11,
  background: disabled ? 'var(--surface2)' : 'var(--text)',
  color: disabled ? 'var(--text2)' : 'var(--bg)',
  border:'none', borderRadius:'var(--radius)',
  fontSize:14, fontWeight:500,
  cursor: disabled ? 'not-allowed' : 'pointer',
  display:'flex', alignItems:'center', justifyContent:'center', gap:6,
  transition:'all 0.15s',
})