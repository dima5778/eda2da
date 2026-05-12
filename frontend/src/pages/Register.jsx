import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useApp } from '../context/AppContext'
import logoUrl from '/logo.png'

export default function Register() {
  const navigate = useNavigate()
  const { t, thm, theme, toggleTheme, lang, toggleLang } = useApp()
  const [form, setForm]       = useState({ username: '', email: '', password: '' })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res  = await api.register(form)
      const data = await res.json()
      if (!res.ok) {
        const msg = Object.values(data).flat().join(' ')
        setError(msg || 'Registration failed')
        return
      }
      const loginRes  = await api.login({ username: form.username, password: form.password })
      const loginData = await loginRes.json()
      if (loginRes.ok) {
        localStorage.setItem('token',   loginData.access)
        localStorage.setItem('refresh', loginData.refresh)
        navigate('/dashboard')
      } else {
        navigate('/login')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const isDark = theme === 'dark'

  return (
    <div style={{ ...s.page, background: thm.bg }}>
      <div style={{ ...s.blob1, background: thm.blob1 }} />
      <div style={{ ...s.blob2, background: thm.blob2 }} />
      <div style={{ ...s.grid, backgroundImage: `radial-gradient(circle, ${thm.gridDot} 1px, transparent 1px)` }} />

      {/* Top-right controls */}
      <div style={s.controls}>
        <button onClick={toggleLang} style={{ ...s.ctrlBtn, border: `1px solid ${thm.border}`, background: thm.bgCard, color: thm.textSec }}>
          {lang === 'en' ? '🇷🇺' : '🇬🇧'}
        </button>
        <button onClick={toggleTheme} style={{ ...s.ctrlBtn, border: `1px solid ${thm.border}`, background: thm.bgCard, color: thm.textSec }}>
          {isDark ? '☀️' : '🌙'}
        </button>
      </div>

      <div style={{ ...s.card, background: thm.bgCard, border: `1px solid ${thm.cardBorder}`, boxShadow: thm.shadow }}>
        <Link to="/" style={s.logo}>
          <img src={logoUrl} alt="EDA2DA" style={s.logoImg} />
          <span style={{ ...s.logoText, color: thm.text }}><span style={s.logoGrad}>EDA</span>2DA</span>
        </Link>

        <div style={s.badgeWrap}>
          <span style={s.badge}>{t('register_free')}</span>
        </div>

        <h1 style={{ ...s.title, color: thm.text }}>{t('register_title')}</h1>
        <p  style={{ ...s.sub, color: thm.textSec }}>{t('register_sub')}</p>

        {error && <div style={s.errorBox}>{error}</div>}

        <form onSubmit={submit} style={s.form}>
          <label style={{ ...s.label, color: thm.textSec }}>
            {t('register_username')}
            <input style={{ ...s.input, background: thm.input, border: `1px solid ${thm.inputBorder}`, color: thm.inputText }}
              type="text" placeholder="chef_john"
              value={form.username} onChange={set('username')} required autoFocus />
          </label>

          <label style={{ ...s.label, color: thm.textSec }}>
            {t('register_email')}
            <input style={{ ...s.input, background: thm.input, border: `1px solid ${thm.inputBorder}`, color: thm.inputText }}
              type="email" placeholder="you@example.com"
              value={form.email} onChange={set('email')} required />
          </label>

          <label style={{ ...s.label, color: thm.textSec }}>
            {t('register_password')}
            <input style={{ ...s.input, background: thm.input, border: `1px solid ${thm.inputBorder}`, color: thm.inputText }}
              type="password" placeholder="Min. 8 characters"
              value={form.password} onChange={set('password')} required minLength={8} />
          </label>

          <button type="submit" style={loading ? s.btnDisabled : s.btn} disabled={loading}>
            {loading ? t('register_loading') : t('register_btn')}
          </button>
        </form>

        <p style={{ ...s.note, color: thm.textMuted }}>
          {t('register_terms')}{' '}
          <a href="#" style={s.link}>{t('register_terms_a')}</a>{' '}
          {t('register_terms_b')}{' '}
          <a href="#" style={s.link}>{t('register_terms_c')}</a>.
        </p>

        <p style={{ ...s.footer, color: thm.textSec }}>
          {t('register_hasaccount')}{' '}
          <Link to="/login" style={s.link}>{t('register_signin')}</Link>
        </p>
      </div>
    </div>
  )
}

const s = {
  page: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    position: 'relative', overflow: 'hidden', padding: '24px',
    fontFamily: "'Inter', sans-serif", transition: 'background .3s',
  },
  controls: {
    position: 'absolute', top: 20, right: 24,
    display: 'flex', gap: 8, zIndex: 10,
  },
  ctrlBtn: {
    padding: '7px 11px', borderRadius: 10, fontSize: 15,
    cursor: 'pointer', transition: 'all .2s',
    backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
  },
  blob1: {
    position: 'absolute', width: 600, height: 600, borderRadius: '50%',
    top: -200, right: -200, filter: 'blur(60px)', pointerEvents: 'none',
  },
  blob2: {
    position: 'absolute', width: 500, height: 500, borderRadius: '50%',
    bottom: -100, left: -100, filter: 'blur(60px)', pointerEvents: 'none',
  },
  grid: {
    position: 'absolute', inset: 0, pointerEvents: 'none',
    backgroundSize: '40px 40px',
    maskImage: 'radial-gradient(ellipse at 50% 50%, black 40%, transparent 80%)',
    WebkitMaskImage: 'radial-gradient(ellipse at 50% 50%, black 40%, transparent 80%)',
  },
  card: {
    position: 'relative', zIndex: 1, width: '100%', maxWidth: 420,
    backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
    borderRadius: 24, padding: '40px 36px', transition: 'background .3s, border .3s',
  },
  logo: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, textDecoration: 'none' },
  logoImg: { width: 36, height: 40, objectFit: 'contain' },
  logoText: { fontSize: 18, fontWeight: 800, letterSpacing: '-.03em', transition: 'color .3s' },
  logoGrad: { background: 'linear-gradient(135deg,#00F0FF,#7B5EFF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  badgeWrap: { marginBottom: 16 },
  badge: {
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px',
    borderRadius: 100, fontSize: 12, fontWeight: 600,
    background: 'rgba(0,240,255,.08)', border: '1px solid rgba(0,240,255,.2)', color: '#00C8D7',
  },
  title: { fontSize: 26, fontWeight: 800, letterSpacing: '-.03em', marginBottom: 6, transition: 'color .3s' },
  sub:   { fontSize: 15, marginBottom: 24, transition: 'color .3s' },
  errorBox: {
    background: 'rgba(255,94,94,.1)', border: '1px solid rgba(255,94,94,.3)',
    borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#FF6B6B', marginBottom: 20,
  },
  form:  { display: 'flex', flexDirection: 'column', gap: 16 },
  label: { display: 'flex', flexDirection: 'column', gap: 7, fontSize: 13, fontWeight: 600, transition: 'color .3s' },
  input: {
    padding: '12px 16px', borderRadius: 10, fontSize: 15, outline: 'none',
    transition: 'border-color .2s, background .3s, color .3s',
    fontFamily: "'Inter', sans-serif",
  },
  btn: {
    marginTop: 4, padding: '14px', borderRadius: 12, border: 'none', cursor: 'pointer',
    background: 'linear-gradient(135deg,#00F0FF,#7B5EFF)', color: '#0A1428',
    fontSize: 15, fontWeight: 700, boxShadow: '0 0 40px rgba(0,240,255,.25)',
  },
  btnDisabled: {
    marginTop: 4, padding: '14px', borderRadius: 12, border: 'none', cursor: 'not-allowed',
    background: 'rgba(128,128,128,.2)', color: 'rgba(128,128,128,.6)', fontSize: 15, fontWeight: 700,
  },
  note:   { marginTop: 14, textAlign: 'center', fontSize: 11, lineHeight: 1.6, transition: 'color .3s' },
  footer: { marginTop: 12, textAlign: 'center', fontSize: 13, transition: 'color .3s' },
  link:   { color: '#00C8D7', textDecoration: 'none', fontWeight: 600 },
}
