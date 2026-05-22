'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'

function BrandMark({ size = 22, color = '#6FA3C5' }: { size?: number; color?: string }) {
  const cx = size / 2, cy = size / 2, r = size * 0.42, sw = size * 0.08
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
      <circle cx={cx} cy={cy} r={r} stroke={color} strokeWidth={sw} />
      <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={size * 0.06} fill={color} />
      <circle cx={cx - r} cy={cy} r={size * 0.04} fill={color} />
      <circle cx={cx + r} cy={cy} r={size * 0.04} fill={color} />
    </svg>
  )
}

const features = [
  { icon: 'M3 4h18v18H3V4zm0 5h18M8 2v4M16 2v4', title: 'Smart Calendar', desc: 'Day, week & month views. See all sessions, attendees, and availability at a glance.' },
  { icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm14 14v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75', title: 'Customer Management', desc: 'Complete profiles — contact info, enrollment history, attendance, and invoices.' },
  { icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8', title: 'Enrollments & Packages', desc: 'Flexible packages with session counts. Enroll customers instantly, auto-generate invoices.' },
  { icon: 'M1 4h22v16H1zM1 10h22', title: 'Invoicing & Payments', desc: 'Professional invoices with logo and stamp. Track paid and pending amounts. Print as PDF.' },
  { icon: 'M18 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M12 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', title: 'Team & Roles', desc: 'Invite staff with custom roles and page permissions — full control over who sees what.' },
  { icon: 'M18 20v-10M12 20V4M6 20v-6', title: 'Reports & Analytics', desc: 'Revenue trends, attendance tracking, and AI-powered insights to grow your business.' },
]

const plans = [
  { name: 'Starter', price: '99', cycle: 'per month', featured: false, features: ['Up to 50 customers', 'Up to 3 staff members', 'Calendar & Bookings', 'Basic Invoicing', 'Mobile App Access'] },
  { name: 'Professional', price: '249', cycle: 'per month', featured: true, badge: '★ MOST POPULAR', features: ['Up to 200 customers', 'Up to 10 staff members', 'Everything in Starter', 'Advanced Reports & Analytics', 'Custom Roles & Permissions', 'Audit Logs', 'Priority Support'] },
  { name: 'Enterprise', price: 'Custom', cycle: 'contact us for pricing', featured: false, features: ['Unlimited customers', 'Unlimited staff', 'Everything in Professional', 'Dedicated account manager', 'Custom integrations', 'SLA & Onboarding'] },
]

const clients = ['🏋️ FitZone Academy', '📚 Elite Training Center', '🎨 Creative Arts Studio', '⚽ Champions Sports Club', '💻 Tech Skills Institute', '🧘 Mindful Wellness', '🎵 Harmony Music School', '🏊 AquaFlow Swim Academy']

export default function LandingPage() {
  const [submitted, setSubmitted] = useState(false)
  const [sending, setSending] = useState(false)
  const [activeSection, setActiveSection] = useState('')

  useEffect(() => {
    const onScroll = () => {
      const sections = ['features', 'how', 'pricing', 'clients', 'contact']
      for (const s of [...sections].reverse()) {
        const el = document.getElementById(s)
        if (el && window.scrollY >= el.offsetTop - 100) { setActiveSection(s); break }
      }
    }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    setTimeout(() => { setSending(false); setSubmitted(true) }, 1200)
  }

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#1B2A41', background: '#fff' }}>

      {/* ── NAV ── */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #DDE6EE', padding: '0 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
        <a href="#home" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 38, height: 38, background: '#CDE2EC', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BrandMark size={22} color="#6FA3C5" />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#1B2A41', letterSpacing: '-0.5px', lineHeight: 1.1 }}>AlMawid</div>
            <div style={{ fontSize: 11, color: '#8FA0B5', lineHeight: 1 }}>Smart Appointments</div>
          </div>
        </a>

        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          {['features', 'how', 'pricing', 'clients', 'contact'].map(s => (
            <a key={s} href={`#${s}`} style={{ fontSize: 14, fontWeight: 600, color: activeSection === s ? '#6FA3C5' : '#4D5C72', textDecoration: 'none', transition: 'color .15s', textTransform: 'capitalize' }}>
              {s === 'how' ? 'How it works' : s.charAt(0).toUpperCase() + s.slice(1)}
            </a>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/login" style={{ padding: '9px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600, color: '#1B2A41', textDecoration: 'none' }}>Sign In</Link>
          <Link href="/signup" style={{ padding: '9px 22px', borderRadius: 10, fontSize: 14, fontWeight: 700, background: '#6FA3C5', color: '#fff', textDecoration: 'none' }}>Get Started</Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section id="home" style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #F0F7FC 0%, #F4F7FA 50%, #EAF4F8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '120px 24px 80px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -200, right: -200, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(111,163,197,0.12) 0%, transparent 70%)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#CDE2EC', color: '#4A8BAD', padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 700, marginBottom: 24, letterSpacing: '0.3px' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            Trusted by leading training centers
          </div>
          <h1 style={{ fontSize: 'clamp(40px, 6vw, 72px)', fontWeight: 800, color: '#1B2A41', letterSpacing: '-2px', lineHeight: 1.1, maxWidth: 800, margin: '0 auto 24px' }}>
            Manage Every Session,<br /><span style={{ color: '#6FA3C5' }}>Appointment & Customer</span><br />in One Place.
          </h1>
          <p style={{ fontSize: 18, color: '#4D5C72', maxWidth: 540, margin: '0 auto 40px', lineHeight: 1.7, fontWeight: 500 }}>
            AlMawid is the all-in-one platform for training centers and service providers to manage bookings, enrollments, staff, and invoices — effortlessly.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
            <Link href="/signup" style={{ padding: '15px 32px', borderRadius: 14, fontSize: 16, fontWeight: 700, background: '#6FA3C5', color: '#fff', textDecoration: 'none' }}>
              Start Free Trial →
            </Link>
            <a href="#features" style={{ padding: '15px 32px', borderRadius: 14, fontSize: 16, fontWeight: 700, background: '#fff', color: '#1B2A41', textDecoration: 'none', border: '1px solid #DDE6EE' }}>
              See Features
            </a>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 48, marginTop: 72, flexWrap: 'wrap' }}>
            {[['500+', 'Sessions Managed'], ['50+', 'Organizations'], ['3K+', 'Happy Customers'], ['99%', 'Uptime']].map(([num, label]) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 36, fontWeight: 800, color: '#6FA3C5', letterSpacing: '-1px' }}>{num}</div>
                <div style={{ fontSize: 13, color: '#8FA0B5', fontWeight: 500, marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: '96px 48px', background: '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ marginBottom: 56 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#6FA3C5', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 12 }}>Features</div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, color: '#1B2A41', letterSpacing: '-1px', marginBottom: 16 }}>Everything you need to run your center</h2>
            <p style={{ fontSize: 16, color: '#4D5C72', maxWidth: 520, lineHeight: 1.7 }}>From booking to billing — AlMawid covers every aspect of your operations in a clean, easy-to-use interface.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
            {features.map(f => (
              <div key={f.title} style={{ background: '#F4F7FA', borderRadius: 20, padding: 32, border: '1px solid #DDE6EE', transition: 'transform .2s' }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-3px)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'none')}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: '#CDE2EC', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#6FA3C5" strokeWidth="1.8"><path d={f.icon}/></svg>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: '#4D5C72', lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" style={{ padding: '96px 48px', background: '#F4F7FA' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#6FA3C5', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 12 }}>How It Works</div>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, color: '#1B2A41', letterSpacing: '-1px', marginBottom: 16 }}>Up and running in minutes</h2>
          <p style={{ fontSize: 16, color: '#4D5C72', maxWidth: 520, margin: '0 auto 56px', lineHeight: 1.7 }}>No complex setup. No training required. Just sign up and start managing.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 32 }}>
            {[['1','Create your account','Sign up with your organization details. We\'ll set up your workspace right away.'],['2','Add your services','Define your packages, sessions, and pricing to match how your business works.'],['3','Enroll customers','Add customers, enroll them in packages, and AlMawid auto-creates calendar and invoices.'],['4','Grow & track','Use reports and insights to understand your revenue, attendance, and performance.']].map(([n, t, d]) => (
              <div key={n} style={{ textAlign: 'center' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#6FA3C5', color: '#fff', fontSize: 20, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>{n}</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{t}</h3>
                <p style={{ fontSize: 14, color: '#4D5C72', lineHeight: 1.7 }}>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" style={{ padding: '96px 48px', background: '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#6FA3C5', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 12 }}>Pricing</div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, color: '#1B2A41', letterSpacing: '-1px', marginBottom: 16 }}>Simple, transparent pricing</h2>
            <p style={{ fontSize: 16, color: '#4D5C72', lineHeight: 1.7 }}>Choose the plan that fits your organization. Upgrade or downgrade anytime.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, alignItems: 'start' }}>
            {plans.map(p => (
              <div key={p.name} style={{ borderRadius: 24, padding: 36, border: p.featured ? 'none' : '1px solid #DDE6EE', background: p.featured ? '#6FA3C5' : '#F4F7FA', transition: 'transform .2s' }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-4px)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'none')}>
                {p.badge && <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 99, marginBottom: 20 }}>{p.badge}</div>}
                <div style={{ fontSize: 22, fontWeight: 800, color: p.featured ? '#fff' : '#1B2A41', marginBottom: 6 }}>{p.name}</div>
                <div style={{ fontSize: 42, fontWeight: 800, letterSpacing: '-2px', lineHeight: 1, color: p.featured ? '#fff' : '#6FA3C5', marginBottom: 4 }}>
                  {p.price !== 'Custom' ? <>{p.price} <span style={{ fontSize: 18, fontWeight: 600 }}>QAR</span></> : <span style={{ fontSize: 32 }}>Custom</span>}
                </div>
                <div style={{ fontSize: 13, fontWeight: 500, color: p.featured ? 'rgba(255,255,255,0.7)' : '#8FA0B5', marginBottom: 28 }}>{p.cycle}</div>
                <ul style={{ listStyle: 'none', marginBottom: 32 }}>
                  {p.features.map(f => (
                    <li key={f} style={{ fontSize: 14, padding: '8px 0', borderBottom: `1px solid ${p.featured ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.05)'}`, display: 'flex', alignItems: 'center', gap: 10, color: p.featured ? 'rgba(255,255,255,0.9)' : '#4D5C72' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={p.featured ? 'rgba(255,255,255,0.9)' : '#22A06B'} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={p.name === 'Enterprise' ? '#contact' : '/signup'} style={{ display: 'block', textAlign: 'center', padding: 14, borderRadius: 12, fontSize: 15, fontWeight: 700, textDecoration: 'none', background: p.featured ? 'rgba(255,255,255,0.2)' : '#6FA3C5', color: '#fff', border: p.featured ? '1px solid rgba(255,255,255,0.4)' : 'none' }}>
                  {p.name === 'Enterprise' ? 'Contact Sales' : 'Get Started'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CLIENTS ── */}
      <section id="clients" style={{ padding: '96px 48px', background: '#F4F7FA', textAlign: 'center' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#6FA3C5', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 12 }}>Trusted By</div>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, color: '#1B2A41', letterSpacing: '-1px', marginBottom: 16 }}>Organizations that rely on AlMawid</h2>
          <p style={{ fontSize: 16, color: '#4D5C72', maxWidth: 520, margin: '0 auto 48px', lineHeight: 1.7 }}>From small studios to large academies — they all manage their operations with AlMawid.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            {clients.map(c => (
              <div key={c} style={{ background: '#fff', border: '1px solid #DDE6EE', borderRadius: 12, padding: '14px 24px', fontSize: 15, fontWeight: 700, color: '#4D5C72', transition: 'border-color .2s, color .2s', cursor: 'default' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#6FA3C5'; (e.currentTarget as HTMLDivElement).style.color = '#6FA3C5' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#DDE6EE'; (e.currentTarget as HTMLDivElement).style.color = '#4D5C72' }}>
                {c}
              </div>
            ))}
          </div>
          <p style={{ marginTop: 32, fontSize: 13, color: '#8FA0B5' }}>And many more across Qatar & the GCC region</p>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" style={{ padding: '96px 48px', background: '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'start' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#6FA3C5', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 12 }}>Contact Us</div>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: '#1B2A41', letterSpacing: '-1px', marginBottom: 16 }}>Let's talk about your business</h2>
            <p style={{ fontSize: 16, color: '#4D5C72', lineHeight: 1.7, marginBottom: 32 }}>Whether you're exploring or ready to start, our team is here to help you find the right plan.</p>
            {[
              { icon: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4a2 2 0 0 1 2-2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z', label: 'Phone', val: '+974 XXXX XXXX' },
              { icon: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6', label: 'Email', val: 'hello@almawid.app' },
              { icon: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM12 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', label: 'Location', val: 'Doha, Qatar' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: '#CDE2EC', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6FA3C5" strokeWidth="1.8"><path d={item.icon}/></svg>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#8FA0B5', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 2 }}>{item.label}</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#1B2A41' }}>{item.val}</div>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[['Full Name', 'text', 'Mohammed Al-Ali'], ['Organization', 'text', 'Your center name']].map(([l, t, p]) => (
                <div key={l as string}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1B2A41', marginBottom: 6 }}>{l}</label>
                  <input type={t as string} placeholder={p as string} required={l === 'Full Name'} style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = '#6FA3C5')}
                    onBlur={e => (e.currentTarget.style.borderColor = '#DDE6EE')} />
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[['Email', 'email', 'you@example.com'], ['Phone', 'tel', '+974 5000 0000']].map(([l, t, p]) => (
                <div key={l as string}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1B2A41', marginBottom: 6 }}>{l}</label>
                  <input type={t as string} placeholder={p as string} required={l === 'Email'} style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = '#6FA3C5')}
                    onBlur={e => (e.currentTarget.style.borderColor = '#DDE6EE')} />
                </div>
              ))}
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1B2A41', marginBottom: 6 }}>Interested in</label>
              <select style={{ ...inputStyle, cursor: 'pointer' }}>
                {['General inquiry', 'Starter Plan', 'Professional Plan', 'Enterprise / Custom', 'Technical support'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1B2A41', marginBottom: 6 }}>Message</label>
              <textarea placeholder="Tell us about your organization and what you're looking for..." rows={4}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
            </div>
            {submitted
              ? <div style={{ background: '#E1F1E9', color: '#22A06B', padding: '14px 20px', borderRadius: 12, fontSize: 14, fontWeight: 600, textAlign: 'center' }}>✅ Message sent! We'll get back to you within 24 hours.</div>
              : <button type="submit" disabled={sending} style={{ padding: '14px 28px', background: sending ? '#A8C8DC' : '#6FA3C5', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: sending ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                  {sending ? 'Sending...' : '✉️ Send Message'}
                </button>
            }
          </form>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#1B2A41', color: 'rgba(255,255,255,0.7)', padding: '64px 48px 32px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48, marginBottom: 48 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.1)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BrandMark size={20} color="rgba(255,255,255,0.8)" />
                </div>
                <span style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>AlMawid</span>
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.7, maxWidth: 260 }}>The smart appointment and session management platform for training centers across the GCC.</p>
            </div>
            {[
              { title: 'Product',  links: [['#features','Features'],['#pricing','Pricing'],['#how','How it works'],['/signup','Get Started']] },
              { title: 'Company',  links: [['#clients','Our Clients'],['#contact','Contact Us'],['#','Privacy Policy'],['#','Terms of Service']] },
              { title: 'Account',  links: [['/login','Sign In'],['/signup','Create Account'],['#','Help Center'],['#contact','Sales']] },
            ].map(col => (
              <div key={col.title}>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 16, letterSpacing: '0.3px' }}>{col.title}</h4>
                {col.links.map(([href, label]) => (
                  <Link key={label} href={href} style={{ display: 'block', fontSize: 14, color: 'rgba(255,255,255,0.6)', textDecoration: 'none', marginBottom: 10, transition: 'color .15s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}>
                    {label}
                  </Link>
                ))}
              </div>
            ))}
          </div>
          <div style={{ paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
            <span>© {new Date().getFullYear()} AlMawid. All rights reserved.</span>
            <span>Made with ♥ in Qatar 🇶🇦</span>
          </div>
        </div>
      </footer>

    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 16px', background: '#F4F7FA',
  border: '1px solid #DDE6EE', borderRadius: 12, fontSize: 14,
  color: '#1B2A41', fontFamily: "'Plus Jakarta Sans', sans-serif",
  outline: 'none', transition: 'border-color .15s', boxSizing: 'border-box',
}
