'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

function BrandMark({ size = 32, color = '#fff' }: { size?: number; color?: string }) {
  const cx = size / 2, cy = size / 2
  const r  = size * 0.42
  const sw = size * 0.08
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
      <circle cx={cx} cy={cy} r={r} stroke={color} strokeWidth={sw} />
      <line x1={cx - r} y1={cy} x2={cx + r} y2={cy}
        stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <circle cx={cx}     cy={cy} r={size * 0.06} fill={color} />
      <circle cx={cx - r} cy={cy} r={size * 0.04} fill={color} />
      <circle cx={cx + r} cy={cy} r={size * 0.04} fill={color} />
    </svg>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [showPass, setShowPass] = useState(false)

  async function handleLogin() {
    if (!email || !password) { setError('Please fill in all fields'); return }
    setLoading(true); setError('')
    const res  = await fetch('/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    const data = await res.json()
    if (res.ok) {
      if (data.role === 'super_admin' || data.role === 'custom') router.push('/dashboard')
      else if (data.role === 'org_admin' || data.role === 'org_member') router.push(`/org/${data.organization_id}`)
      else router.push('/dashboard')
    } else {
      setError(data.error || 'Invalid email or password')
    }
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* ── Left panel ─────────────────────────────────────────── */}
      <div style={{
        width: '42%', background: 'linear-gradient(145deg, #4A8BAD 0%, #6FA3C5 50%, #8FBDD6 100%)',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '48px 52px', position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.12)' }} />
        <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)' }} />
        <div style={{ position: 'absolute', bottom: -100, left: -60, width: 400, height: 400, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.08)' }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
          <div style={{ width: 52, height: 52, background: 'rgba(255,255,255,0.2)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
            <BrandMark size={30} color="#fff" />
          </div>
          <div>
            <p style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.5px' }}>AlMawid</p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', margin: 0 }}>Smart Appointments</p>
          </div>
        </div>

        {/* Center copy */}
        <div style={{ position: 'relative' }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, color: '#fff', margin: '0 0 16px', letterSpacing: '-1px', lineHeight: 1.2 }}>
            Manage your<br />bookings smarter.
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', margin: 0, lineHeight: 1.7, maxWidth: 320 }}>
            One platform to manage sessions, enrollments, customers, and invoices — all in one place.
          </p>
        </div>

        {/* Bottom tagline */}
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: 0, position: 'relative' }}>
          © {new Date().getFullYear()} AlMawid. Smart Appointment Management.
        </p>
      </div>

      {/* ── Right panel ────────────────────────────────────────── */}
      <div style={{
        flex: 1, background: '#F4F7FA',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '48px 32px',
      }}>
        <div style={{ width: '100%', maxWidth: 420 }}>

          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1B2A41', letterSpacing: '-0.6px', margin: '0 0 6px' }}>Welcome back</h1>
          <p  style={{ fontSize: 14, color: '#4D5C72', margin: '0 0 36px', fontWeight: 500 }}>Sign in to your account to continue.</p>

          {error && (
            <div style={{ background: '#FBE7E7', color: '#C73838', borderRadius: 12, padding: '12px 16px', fontSize: 13, fontWeight: 500, marginBottom: 20 }}>
              {error}
            </div>
          )}

          {/* Form card */}
          <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #DDE6EE', padding: '32px' }}>

            <label style={labelStyle}>Email Address</label>
            <input
              value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              type="email" placeholder="you@example.com"
              style={fieldStyle}
              onFocus={e => (e.currentTarget.style.border = '1.5px solid #6FA3C5')}
              onBlur={e  => (e.currentTarget.style.border = '1px solid #DDE6EE')}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 6 }}>
              <label style={labelStyle}>Password</label>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#6FA3C5', cursor: 'pointer' }}>Forgot password?</span>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                type={showPass ? 'text' : 'password'} placeholder="••••••••••"
                style={{ ...fieldStyle, paddingRight: 48 }}
                onFocus={e => (e.currentTarget.style.border = '1.5px solid #6FA3C5')}
                onBlur={e  => (e.currentTarget.style.border = '1px solid #DDE6EE')}
              />
              <button onClick={() => setShowPass(v => !v)} style={eyeBtnStyle}>
                {showPass
                  ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>

            <button
              onClick={handleLogin} disabled={loading}
              style={{ width: '100%', height: 50, background: loading ? '#A8C8DC' : '#6FA3C5', color: '#fff', borderRadius: 14, border: 'none', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background .15s' }}
              onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = '#5A91B5' }}
              onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = '#6FA3C5' }}
            >
              {loading
                ? <svg style={{ animation: 'spin 1s linear infinite' }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                : 'Sign In'
              }
            </button>

          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
            <div style={{ flex: 1, height: 1, background: '#DDE6EE' }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: '#8FA0B5', letterSpacing: '0.3px' }}>OR CONTINUE WITH</span>
            <div style={{ flex: 1, height: 1, background: '#DDE6EE' }} />
          </div>

          {/* Social buttons */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button style={{ flex: 1, height: 46, background: '#000', borderRadius: 12, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#fff' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
              Apple
            </button>
            <button style={{ flex: 1, height: 46, background: '#fff', borderRadius: 12, border: '1px solid #DDE6EE', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#1B2A41' }}>
              <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
              Google
            </button>
          </div>

          <p style={{ textAlign: 'center', marginTop: 28, fontSize: 13, color: '#4D5C72' }}>
            New to AlMawid?{' '}
            <Link href="/signup" style={{ fontWeight: 700, color: '#6FA3C5', textDecoration: 'none' }}>Create an account</Link>
          </p>

        </div>
      </div>
    </div>
  )
}

const fieldStyle: React.CSSProperties = {
  width: '100%', height: 48, background: '#F4F7FA',
  borderRadius: 12, border: '1px solid #DDE6EE',
  padding: '0 16px', fontSize: 14, color: '#1B2A41',
  outline: 'none', boxSizing: 'border-box',
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  transition: 'border .15s',
}
const labelStyle: React.CSSProperties = {
  fontSize: 13, fontWeight: 600, color: '#1B2A41', display: 'block', margin: 0,
}
const eyeBtnStyle: React.CSSProperties = {
  position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
  background: 'none', border: 'none', cursor: 'pointer', color: '#8FA0B5', padding: 0, display: 'flex',
}
