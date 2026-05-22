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

const COUNTRY_CODES = [
  { code: '+974', name: 'Qatar (+974)' }, { code: '+966', name: 'Saudi Arabia (+966)' },
  { code: '+971', name: 'UAE (+971)' },   { code: '+965', name: 'Kuwait (+965)' },
  { code: '+973', name: 'Bahrain (+973)' },{ code: '+968', name: 'Oman (+968)' },
  { code: '+962', name: 'Jordan (+962)' }, { code: '+20',  name: 'Egypt (+20)' },
  { code: '+91',  name: 'India (+91)' },   { code: '+92',  name: 'Pakistan (+92)' },
  { code: '+1',   name: 'USA/Canada (+1)' },{ code: '+44', name: 'UK (+44)' },
]

export default function SignupPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    full_name: '', email: '', mobile: '', country_code: '+974',
    password: '', confirm: ''
  })
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [showConf, setShowConf] = useState(false)

  async function handleSignup() {
    if (!form.full_name || !form.email || !form.password) {
      setError('Please fill in all required fields'); return
    }
    if (form.password !== form.confirm) { setError('Passwords do not match'); return }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true); setError('')
    const res = await fetch('/api/auth/signup', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: form.full_name, email: form.email, password: form.password,
        mobile: form.mobile ? `${form.country_code}${form.mobile.replace(/\s/g, '')}` : ''
      })
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Something went wrong'); setLoading(false); return }
    setSuccess(true); setLoading(false)
  }

  if (success) return (
    <div style={{ minHeight: '100vh', background: '#F4F7FA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ textAlign: 'center', maxWidth: 400, padding: '0 24px' }}>
        <div style={{ width: 72, height: 72, background: '#E1F1E9', borderRadius: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#22A06B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1B2A41', margin: '0 0 10px' }}>Account Created!</h2>
        <p style={{ fontSize: 14, color: '#4D5C72', margin: '0 0 28px', lineHeight: 1.6 }}>Your account is under review. We'll contact you once it's activated.</p>
        <Link href="/login" style={{ display: 'inline-block', background: '#6FA3C5', color: '#fff', borderRadius: 12, padding: '13px 36px', fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>
          Back to Sign In
        </Link>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* ── Left panel ─────────────────────────────────────────── */}
      <div style={{
        width: '38%', background: 'linear-gradient(145deg, #4A8BAD 0%, #6FA3C5 50%, #8FBDD6 100%)',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '48px 52px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.12)' }} />
        <div style={{ position: 'absolute', bottom: -100, left: -60, width: 400, height: 400, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.08)' }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
          <div style={{ width: 52, height: 52, background: 'rgba(255,255,255,0.2)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BrandMark size={30} color="#fff" />
          </div>
          <div>
            <p style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.5px' }}>AlMawid</p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', margin: 0 }}>Smart Appointments</p>
          </div>
        </div>

        {/* Copy */}
        <div style={{ position: 'relative' }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: '#fff', margin: '0 0 14px', letterSpacing: '-1px', lineHeight: 1.2 }}>
            Join AlMawid<br />today.
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', margin: 0, lineHeight: 1.7, maxWidth: 280 }}>
            Create your account and start managing your sessions, customers, and bookings efficiently.
          </p>
        </div>

        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: 0, position: 'relative' }}>
          © {new Date().getFullYear()} AlMawid. Smart Appointment Management.
        </p>
      </div>

      {/* ── Right panel ────────────────────────────────────────── */}
      <div style={{
        flex: 1, background: '#F4F7FA',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '48px 32px', overflowY: 'auto',
      }}>
        <div style={{ width: '100%', maxWidth: 480 }}>

          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1B2A41', letterSpacing: '-0.6px', margin: '0 0 6px' }}>Create your account</h1>
          <p  style={{ fontSize: 14, color: '#4D5C72', margin: '0 0 28px', fontWeight: 500 }}>Fill in your details to get started.</p>

          {error && (
            <div style={{ background: '#FBE7E7', color: '#C73838', borderRadius: 12, padding: '12px 16px', fontSize: 13, fontWeight: 500, marginBottom: 20 }}>
              {error}
            </div>
          )}

          {/* Form card */}
          <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #DDE6EE', padding: '32px' }}>

            {/* Row: Full Name */}
            <label style={labelStyle}>Full Name</label>
            <input value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})}
              placeholder="Mohammed Al-Ali" style={fieldStyle}
              onFocus={e => (e.currentTarget.style.border = '1.5px solid #6FA3C5')}
              onBlur={e  => (e.currentTarget.style.border = '1px solid #DDE6EE')} />

            {/* Row: Email */}
            <label style={{ ...labelStyle, marginTop: 18 }}>Email Address</label>
            <input value={form.email} onChange={e => setForm({...form, email: e.target.value})}
              placeholder="you@example.com" type="email" style={fieldStyle}
              onFocus={e => (e.currentTarget.style.border = '1.5px solid #6FA3C5')}
              onBlur={e  => (e.currentTarget.style.border = '1px solid #DDE6EE')} />

            {/* Row: Phone */}
            <label style={{ ...labelStyle, marginTop: 18 }}>Phone Number</label>
            <div style={{ display: 'flex', gap: 10 }}>
              <select value={form.country_code} onChange={e => setForm({...form, country_code: e.target.value})}
                style={{ height: 48, background: '#F4F7FA', border: '1px solid #DDE6EE', borderRadius: 12, padding: '0 12px', fontSize: 13, color: '#1B2A41', outline: 'none', flexShrink: 0, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {COUNTRY_CODES.map((c, i) => <option key={i} value={c.code}>{c.name}</option>)}
              </select>
              <input value={form.mobile} onChange={e => setForm({...form, mobile: e.target.value})}
                placeholder="5000 0000" type="tel"
                style={{ ...fieldStyle, flex: 1 }}
                onFocus={e => (e.currentTarget.style.border = '1.5px solid #6FA3C5')}
                onBlur={e  => (e.currentTarget.style.border = '1px solid #DDE6EE')} />
            </div>

            {/* Row: Password + Confirm — side by side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 18 }}>
              <div>
                <label style={labelStyle}>Password</label>
                <div style={{ position: 'relative', marginTop: 6 }}>
                  <input value={form.password} onChange={e => setForm({...form, password: e.target.value})}
                    placeholder="••••••••" type={showPass ? 'text' : 'password'}
                    style={{ ...fieldStyle, paddingRight: 44 }}
                    onFocus={e => (e.currentTarget.style.border = '1.5px solid #6FA3C5')}
                    onBlur={e  => (e.currentTarget.style.border = '1px solid #DDE6EE')} />
                  <button onClick={() => setShowPass(v => !v)} style={eyeBtnStyle}><EyeIcon show={showPass} /></button>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Confirm Password</label>
                <div style={{ position: 'relative', marginTop: 6 }}>
                  <input value={form.confirm} onChange={e => setForm({...form, confirm: e.target.value})}
                    placeholder="••••••••" type={showConf ? 'text' : 'password'}
                    onKeyDown={e => e.key === 'Enter' && handleSignup()}
                    style={{ ...fieldStyle, paddingRight: 44 }}
                    onFocus={e => (e.currentTarget.style.border = '1.5px solid #6FA3C5')}
                    onBlur={e  => (e.currentTarget.style.border = '1px solid #DDE6EE')} />
                  <button onClick={() => setShowConf(v => !v)} style={eyeBtnStyle}><EyeIcon show={showConf} /></button>
                </div>
              </div>
            </div>

            {/* Submit */}
            <button onClick={handleSignup} disabled={loading}
              style={{ width: '100%', height: 50, background: loading ? '#A8C8DC' : '#6FA3C5', color: '#fff', borderRadius: 14, border: 'none', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background .15s' }}
              onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = '#5A91B5' }}
              onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = '#6FA3C5' }}
            >
              {loading
                ? <svg style={{ animation: 'spin 1s linear infinite' }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                : 'Create Account'
              }
            </button>

          </div>

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: '#4D5C72' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ fontWeight: 700, color: '#6FA3C5', textDecoration: 'none' }}>Sign in</Link>
          </p>

        </div>
      </div>
    </div>
  )
}

function EyeIcon({ show }: { show: boolean }) {
  return show
    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
}

const fieldStyle: React.CSSProperties = {
  width: '100%', height: 48, background: '#F4F7FA',
  borderRadius: 12, border: '1px solid #DDE6EE',
  padding: '0 16px', fontSize: 14, color: '#1B2A41',
  outline: 'none', boxSizing: 'border-box',
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  transition: 'border .15s', display: 'block', marginTop: 6,
}
const labelStyle: React.CSSProperties = {
  fontSize: 13, fontWeight: 600, color: '#1B2A41', display: 'block', margin: 0,
}
const eyeBtnStyle: React.CSSProperties = {
  position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
  background: 'none', border: 'none', cursor: 'pointer', color: '#8FA0B5', padding: 0, display: 'flex',
}
