import { useApp } from '../context/AppContext'
import logoUrl from '/logo.png'

const SOCIALS = [
  { label: 'Twitter', symbol: '𝕏' },
  { label: 'YouTube', symbol: '▶' },
  { label: 'LinkedIn', symbol: 'in' },
  { label: 'GitHub', symbol: '⌥' },
]

export default function Footer() {
  const { t } = useApp()
  const footerCols = t('footer_cols')
  const footerLegal = t('footer_legal')

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          {/* Brand */}
          <div className="footer-brand">
            <a href="/" className="nav-logo">
              <img src={logoUrl} alt="EDA2DA" style={{ width: 32, height: 36, objectFit: 'contain', borderRadius: 6 }} />
              <span className="logo-text"><span>EDA</span>2DA</span>
            </a>
            <p className="footer-brand-desc">{t('footer_desc')}</p>
            <div className="footer-socials">
              {SOCIALS.map(({ label, symbol }) => (
                <a key={label} href="#" className="footer-social" aria-label={label}>
                  {symbol}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerCols).map(([title, links]) => (
            <div key={title}>
              <div className="footer-col-title">{title}</div>
              <ul className="footer-links">
                {links.map((link) => (
                  <li key={link}><a href="#">{link}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="footer-bottom">
          <p className="footer-copy">
            {t('footer_copy').split('EDA2DA').map((part, i, arr) =>
              i < arr.length - 1
                ? [part, <span key={i}>EDA2DA</span>]
                : part
            )}
          </p>
          <div className="footer-legal">
            {footerLegal.map((item) => (
              <a href="#" key={item}>{item}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
