import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import logoUrl from '/logo.png'

export default function Navbar() {
  const { t, theme, toggleTheme, lang, toggleLang } = useApp()
  const [scrolled,  setScrolled]  = useState(false)
  const [menuOpen,  setMenuOpen]  = useState(false)
  const navigate = useNavigate()

  const NAV_LINKS = [
    { label: t('nav_features'),  href: '/#features' },
    { label: t('nav_how'),       href: '/#how-it-works' },
    { label: t('nav_pricing'),   href: '/#pricing' },
    { label: t('nav_reviews'),   href: '/#testimonials' },
  ]

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const isDark = theme === 'dark'

  return (
    <nav className={`navbar${scrolled ? ' scrolled' : ''}`} role="navigation">
      <div className="navbar-inner">
        <Link to="/" className="nav-logo">
          <img src={logoUrl} alt="EDA2DA" className="logo-mark" style={{ borderRadius: 8, background: 'transparent', boxShadow: 'none' }} />
          <span className="logo-text"><span>EDA</span>2DA</span>
        </Link>

        <ul className="nav-links">
          {NAV_LINKS.map(({ label, href }) => (
            <li key={label}><a href={href}>{label}</a></li>
          ))}
        </ul>

        <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Language toggle */}
          <button
            onClick={toggleLang}
            title={lang === 'en' ? 'Switch to Russian' : 'Переключить на английский'}
            style={toggleBtnStyle}
          >
            {lang === 'en' ? '🇷🇺' : '🇬🇧'}
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            style={toggleBtnStyle}
          >
            {isDark ? '☀️' : '🌙'}
          </button>

          <button className="btn btn-ghost" onClick={() => navigate('/login')}>{t('nav_signin')}</button>
          <button className="btn btn-primary" onClick={() => navigate('/register')}>
            {t('nav_getstarted')} <span className="btn-arrow">→</span>
          </button>
          <button className="nav-mobile-btn" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div style={{
          background: 'var(--navbar-mobile-bg)', backdropFilter: 'blur(24px)',
          borderTop: '1px solid var(--border)', padding: '20px 24px',
          display: 'flex', flexDirection: 'column', gap: '4px',
        }}>
          {NAV_LINKS.map(({ label, href }) => (
            <a key={label} href={href} onClick={() => setMenuOpen(false)}
              style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '16px', fontWeight: '500' }}>
              {label}
            </a>
          ))}
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <button onClick={toggleLang} style={{ ...toggleBtnStyle, flex: 1, justifyContent: 'center' }}>
              {lang === 'en' ? '🇷🇺 RU' : '🇬🇧 EN'}
            </button>
            <button onClick={toggleTheme} style={{ ...toggleBtnStyle, flex: 1, justifyContent: 'center' }}>
              {isDark ? '☀️ Light' : '🌙 Dark'}
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
            <button className="btn btn-secondary" style={{ justifyContent: 'center' }} onClick={() => { navigate('/login'); setMenuOpen(false) }}>{t('nav_signin')}</button>
            <button className="btn btn-primary"   style={{ justifyContent: 'center' }} onClick={() => { navigate('/register'); setMenuOpen(false) }}>{t('nav_getstarted_free')}</button>
          </div>
        </div>
      )}
    </nav>
  )
}

const toggleBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 4,
  padding: '7px 10px',
  borderRadius: 10,
  border: '1px solid var(--border)',
  background: 'var(--bg-card)',
  color: 'var(--text-secondary)',
  fontSize: 14,
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all .2s',
  fontFamily: "'Inter', sans-serif",
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
}
