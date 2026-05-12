import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useApp } from '../context/AppContext'
import logoUrl from '/logo.png'

export default function Login() {
  const navigate = useNavigate()
  const { t, thm, theme, toggleTheme, lang, toggleLang } = useApp()
  const [form, setForm]     = useState({ username: '', password: '' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res  = await api.login(form)
      const data = await res.json()
      if (!res.ok) { setError(data.detail || 'Invalid credentials'); return }
      localStorage.setItem('token',   data.access)
      localStorage.setItem('refresh', data.refresh)
      navigate('/dashboard')
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

        <h1 style={{ ...s.title, color: thm.text }}>{t('login_title')}</h1>
        <p  style={{ ...s.sub, color: thm.textSec }}>{t('login_sub')}</p>

        {error && <div style={s.errorBox}>{error}</div>}

        <form onSubmit={submit} style={s.form}>
          <label style={{ ...s.label, color: thm.textSec }}>
            {t('login_username')}
            <input
              style={{ ...s.input, background: thm.input, border: `1px solid ${thm.inputBorder}`, color: thm.inputText }}
              type="text"
              placeholder="your_username"
              value={form.username}
              onChange={set('username')}
              required autoFocus
            />
          </label>

          <label style={{ ...s.label, color: thm.textSec }}>
            {t('login_password')}
            <input
              style={{ ...s.input, background: thm.input, border: `1px solid ${thm.inputBorder}`, color: thm.inputText }}
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={set('password')}
              required
            />
          </label>

          <button type="submit" style={loading ? s.btnDisabled : s.btn} disabled={loading}>
            {loading ? t('login_loading') : t('login_btn')}
          </button>
        </form>

        <p style={{ ...s.footer, color: thm.textSec }}>
          {t('login_noaccount')}{' '}
          <Link to="/register" style={s.link}>{t('login_create')}</Link>
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
    top: -200, left: -200, filter: 'blur(60px)', pointerEvents: 'none',
  },
  blob2: {
    position: 'absolute', width: 500, height: 500, borderRadius: '50%',
    bottom: -100, right: -100, filter: 'blur(60px)', pointerEvents: 'none',
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
  logo: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, textDecoration: 'none' },
  logoImg: { width: 36, height: 40, objectFit: 'contain' },
  logoText: { fontSize: 18, fontWeight: 800, letterSpacing: '-.03em', transition: 'color .3s' },
  logoGrad: { background: 'linear-gradient(135deg,#00F0FF,#7B5EFF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  title: { fontSize: 28, fontWeight: 800, letterSpacing: '-.03em', marginBottom: 6, transition: 'color .3s' },
  sub:   { fontSize: 15, marginBottom: 28, transition: 'color .3s' },
  errorBox: {
    background: 'rgba(255,94,94,.1)', border: '1px solid rgba(255,94,94,.3)',
    borderRadius: 10, padding: '10px 14px', fontSize: 13,
    color: '#FF6B6B', marginBottom: 20,
  },
  form:  { display: 'flex', flexDirection: 'column', gap: 18 },
  label: { display: 'flex', flexDirection: 'column', gap: 7, fontSize: 13, fontWeight: 600, transition: 'color .3s' },
  input: {
    padding: '12px 16px', borderRadius: 10, fontSize: 15,
    outline: 'none', transition: 'border-color .2s, background .3s, color .3s',
    fontFamily: "'Inter', sans-serif",
  },
  btn: {
    marginTop: 8, padding: '14px', borderRadius: 12, border: 'none', cursor: 'pointer',
    background: 'linear-gradient(135deg,#00F0FF,#7B5EFF)', color: '#0A1428',
    fontSize: 15, fontWeight: 700,
    boxShadow: '0 0 40px rgba(0,240,255,.25)',
    transition: 'all .2s',
  },
  btnDisabled: {
    marginTop: 8, padding: '14px', borderRadius: 12, border: 'none', cursor: 'not-allowed',
    background: 'rgba(128,128,128,.2)', color: 'rgba(128,128,128,.6)',
    fontSize: 15, fontWeight: 700,
  },
  footer: { marginTop: 24, textAlign: 'center', fontSize: 13, transition: 'color .3s' },
  link:   { color: '#00C8D7', textDecoration: 'none', fontWeight: 600 },
}
